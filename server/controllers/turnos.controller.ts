import { Request, Response } from 'express';
import { 
  supabase, 
  isSupabaseConnected, 
  localTurnosSeed, 
  LocalTurno, 
  getNextTurnoNumber, 
  resetTurnoCounter,
  localSucursalesSeed,
  localClientsSeed,
  localVehiclesSeed
} from '../db';

/**
 * Normaliza fechas entre formato DD/MM/YYYY y YYYY-MM-DD
 */
export const normalizeDate = (rawDate: string): { iso: string; ddmmyyyy: string; parsedDate: Date | null } => {
  if (!rawDate) return { iso: '', ddmmyyyy: '', parsedDate: null };
  const trimmed = rawDate.trim();

  // Si viene en formato DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    const paddedDay = day.padStart(2, '0');
    const paddedMonth = month.padStart(2, '0');
    const iso = `${year}-${paddedMonth}-${paddedDay}`;
    const ddmmyyyy = `${paddedDay}/${paddedMonth}/${year}`;
    const parsedDate = new Date(Number(year), Number(paddedMonth) - 1, Number(paddedDay), 0, 0, 0);
    return { iso, ddmmyyyy, parsedDate };
  }

  // Si viene en formato YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    const paddedDay = day.padStart(2, '0');
    const paddedMonth = month.padStart(2, '0');
    const iso = `${year}-${paddedMonth}-${paddedDay}`;
    const ddmmyyyy = `${paddedDay}/${paddedMonth}/${year}`;
    const parsedDate = new Date(Number(year), Number(paddedMonth) - 1, Number(paddedDay), 0, 0, 0);
    return { iso, ddmmyyyy, parsedDate };
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const paddedMonth = String(d.getMonth() + 1).padStart(2, '0');
    const paddedDay = String(d.getDate()).padStart(2, '0');
    return {
      iso: `${year}-${paddedMonth}-${paddedDay}`,
      ddmmyyyy: `${paddedDay}/${paddedMonth}/${year}`,
      parsedDate: new Date(year, d.getMonth(), d.getDate(), 0, 0, 0)
    };
  }

  return { iso: trimmed, ddmmyyyy: trimmed, parsedDate: null };
};

/**
 * Comprueba si una fecha es pasada respecto a la fecha actual
 */
export const isPastDate = (dateObj: Date | null): boolean => {
  if (!dateObj) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return dateObj.getTime() < today.getTime();
};

/**
 * Normaliza horario al formato HH:mm (ej: "9:00" -> "09:00")
 */
export const normalizeTime = (rawTime: string): string => {
  if (!rawTime) return '';
  const trimmed = rawTime.trim();
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return trimmed;
};

/**
 * Genera todos los slots horarios según horario de apertura y cierre de la sucursal
 */
export const getBranchTimeSlots = (apertura: string, cierre: string): string[] => {
  const slots: string[] = [];
  const startHour = parseInt(apertura.split(':')[0], 10);
  const endHour = parseInt(cierre.split(':')[0], 10);

  for (let h = startHour; h <= endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }
  return slots;
};

/**
 * HU-09: Criterio 1 - Sólo se ofrecen horarios disponibles de la sucursal elegida
 * GET /api/turnos/horarios-disponibles?sucursal=Centro&fecha=15/11/2026
 */
export const listarHorariosDisponibles = async (req: Request, res: Response): Promise<void> => {
  try {
    const sucursalNombre = String(req.query.sucursal || 'Centro').trim();
    const fechaParam = String(req.query.fecha || '').trim();

    if (!fechaParam) {
      res.status(400).json({ error: 'El parámetro fecha es obligatorio' });
      return;
    }

    const norm = normalizeDate(fechaParam);
    if (!norm.parsedDate) {
      res.status(400).json({ error: 'Formato de fecha inválido' });
      return;
    }

    // HU-09 Criterio 3: No se permiten turnos en fechas pasadas
    if (isPastDate(norm.parsedDate)) {
      res.status(400).json({ error: 'No se permiten turnos en fechas pasadas' });
      return;
    }

    // Buscar configuración de la sucursal
    const sucursal = localSucursalesSeed.find(
      s => s.nombre.toLowerCase() === sucursalNombre.toLowerCase()
    ) || localSucursalesSeed[0];

    const allSlots = getBranchTimeSlots(sucursal.horario_apertura, sucursal.horario_cierre);

    // Turnos ocupados en esa sucursal y fecha
    const turnosOcupados = localTurnosSeed.filter(t => {
      if (t.estado === 'Cancelado') return false;
      const tNorm = normalizeDate(t.fecha);
      const sameDate = tNorm.iso === norm.iso || tNorm.ddmmyyyy === norm.ddmmyyyy;
      const sameSucursal = t.sucursal.toLowerCase() === sucursal.nombre.toLowerCase();
      return sameDate && sameSucursal;
    });

    const occupiedHours = new Set(turnosOcupados.map(t => normalizeTime(t.hora)));

    // Sólo se ofrecen los disponibles
    const horariosDisponibles = allSlots.filter(slot => !occupiedHours.has(normalizeTime(slot)));

    res.json({
      sucursal: sucursal.nombre,
      horarioAtencion: `${sucursal.horario_apertura} a ${sucursal.horario_cierre}`,
      fecha: norm.ddmmyyyy,
      fechaIso: norm.iso,
      totalHorarios: allSlots.length,
      horariosDisponibles,
      horariosOcupados: Array.from(occupiedHours)
    });
  } catch (err: any) {
    console.error('[Backend Turnos] Error obteniendo horarios disponibles:', err);
    res.status(500).json({ error: 'Error al consultar disponibilidad de horarios' });
  }
};

/**
 * HU-09: Registrar Solicitud de Turno
 * POST /api/turnos
 * 
 * Criterios de Aceptación:
 * 1. Sólo se ofrecen horarios disponibles de la sucursal elegida
 * 2. El turno nace en estado "Solicitado"
 * 3. No se permiten turnos en fechas pasadas
 * 4. El horario reservado deja de estar disponible
 */
export const registrarTurno = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      cliente_dni,
      clienteDni,
      cliente_documento,
      cliente_id,
      clienteId,
      cliente_nombre,
      patente,
      vehiculo_dominio,
      vehiculoDominio,
      motivo_consulta,
      motivoConsulta,
      sucursal,
      fecha,
      horario,
      hora
    } = req.body;

    const valDni = String(cliente_dni || clienteDni || cliente_documento || '').trim();
    const valPatente = String(patente || vehiculo_dominio || vehiculoDominio || '').trim().toUpperCase();
    const valMotivo = String(motivo_consulta || motivoConsulta || '').trim();
    const valSucursal = String(sucursal || 'Centro').trim();
    const valFecha = String(fecha || '').trim();
    const valHora = normalizeTime(String(horario || hora || '').trim());

    // Validación de campos obligatorios
    if (!valDni || !valPatente || !valMotivo || !valSucursal || !valFecha || !valHora) {
      res.status(400).json({
        error: 'Todos los campos son obligatorios: DNI del cliente, vehículo, motivo de consulta, sucursal, fecha y horario'
      });
      return;
    }

    // Criterio 3: No se permiten turnos en fechas pasadas
    const norm = normalizeDate(valFecha);
    if (!norm.parsedDate) {
      res.status(400).json({ error: 'La fecha ingresada no tiene un formato válido' });
      return;
    }

    if (isPastDate(norm.parsedDate)) {
      res.status(400).json({
        error: 'No se permiten turnos en fechas pasadas'
      });
      return;
    }

    // Validar sucursal y rango horario
    const sucursalConfig = localSucursalesSeed.find(
      s => s.nombre.toLowerCase() === valSucursal.toLowerCase()
    );

    if (!sucursalConfig) {
      res.status(400).json({
        error: `La sucursal '${valSucursal}' no se encuentra registrada`
      });
      return;
    }

    const availableSlots = getBranchTimeSlots(sucursalConfig.horario_apertura, sucursalConfig.horario_cierre);
    if (!availableSlots.includes(valHora)) {
      res.status(400).json({
        error: `El horario ${valHora} se encuentra fuera del rango de atención de la sucursal (${sucursalConfig.horario_apertura} a ${sucursalConfig.horario_cierre})`
      });
      return;
    }

    // Criterio 4: El horario reservado deja de estar disponible / Validación de colisión
    // Comprobar si ya existe un turno ocupado para esa sucursal, fecha y hora
    const slotOcupado = localTurnosSeed.some(t => {
      if (t.estado === 'Cancelado') return false;
      const tNorm = normalizeDate(t.fecha);
      const sameDate = tNorm.iso === norm.iso || tNorm.ddmmyyyy === norm.ddmmyyyy;
      const sameSucursal = t.sucursal.toLowerCase() === sucursalConfig.nombre.toLowerCase();
      const sameHour = normalizeTime(t.hora) === valHora;
      return sameDate && sameSucursal && sameHour;
    });

    if (slotOcupado) {
      // Mensaje exacto especificado en el criterio de aceptación y escenario BDD:
      res.status(409).json({
        error: 'El horario seleccionado no está disponible. Seleccione otro horario'
      });
      return;
    }

    // Buscar datos adicionales del cliente y vehículo
    const client = localClientsSeed.find(c => 
      c.nro_documento.replace(/[\s-]/g, '') === valDni.replace(/[\s-]/g, '')
    );
    const clientName = client ? `${client.nombre} ${client.apellido}` : (cliente_nombre || 'Cliente');

    // Criterio 2: El turno nace en estado "Solicitado"
    // Y el sistema registra el turno con un número de turno
    const nroTurno = getNextTurnoNumber();
    const nuevoTurno: LocalTurno = {
      id: `turno-${Date.now()}`,
      nro_turno: nroTurno,
      vehiculo_dominio: valPatente,
      cliente_id: client?.id || cliente_id || clienteId,
      cliente_nombre: clientName,
      cliente_documento: valDni,
      sucursal: sucursalConfig.nombre,
      fecha: norm.ddmmyyyy,
      hora: valHora,
      motivo_consulta: valMotivo,
      estado: 'Solicitado',
      es_emergencia: false,
      created_at: new Date().toISOString()
    };

    localTurnosSeed.push(nuevoTurno);

    // Guardar en Supabase si está disponible
    if (isSupabaseConnected && supabase) {
      try {
        await supabase.from('turnos').insert({
          nro_turno: nroTurno,
          vehiculo_dominio: valPatente,
          cliente_id: nuevoTurno.cliente_id,
          sucursal: nuevoTurno.sucursal,
          fecha: norm.iso,
          hora: valHora,
          estado_turno_id: 1, // 'Solicitado'
          motivo_consulta: valMotivo,
          fecha_hora_propuesta: `${norm.iso}T${valHora}:00`
        });
      } catch (dbErr) {
        console.warn('[Backend Turnos] Error guardando en Supabase, persistido en memoria local:', dbErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Turno registrado exitosamente',
      numeroTurno: nroTurno,
      nro_turno: nroTurno,
      estado: 'Solicitado',
      turno: nuevoTurno
    });
  } catch (err: any) {
    console.error('[Backend Turnos] Error al registrar turno:', err);
    res.status(500).json({ error: 'Error interno al registrar el turno' });
  }
};

/**
 * Listar turnos registrados
 * GET /api/turnos
 */
export const listarTurnos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sucursal, fecha, estado, patente } = req.query;

    let resultado = [...localTurnosSeed];

    if (sucursal) {
      resultado = resultado.filter(t => t.sucursal.toLowerCase() === String(sucursal).toLowerCase());
    }

    if (fecha) {
      const norm = normalizeDate(String(fecha));
      resultado = resultado.filter(t => {
        const tNorm = normalizeDate(t.fecha);
        return tNorm.iso === norm.iso || tNorm.ddmmyyyy === norm.ddmmyyyy;
      });
    }

    if (estado) {
      resultado = resultado.filter(t => t.estado.toLowerCase() === String(estado).toLowerCase());
    }

    if (patente) {
      resultado = resultado.filter(t => t.vehiculo_dominio.toUpperCase() === String(patente).toUpperCase());
    }

    res.json({
      total: resultado.length,
      turnos: resultado
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al listar turnos' });
  }
};

/**
 * Listar catálogo de sucursales
 * GET /api/turnos/sucursales
 */
export const listarSucursales = async (req: Request, res: Response): Promise<void> => {
  res.json({
    sucursales: localSucursalesSeed
  });
};

/**
 * Endpoint de limpieza para tests automatizados BDD
 */
export const testCleanupTurnos = async (req: Request, res: Response): Promise<void> => {
  localTurnosSeed.length = 0;
  resetTurnoCounter(1001);
  res.json({ success: true, message: 'Turnos limpiados para testing' });
};
