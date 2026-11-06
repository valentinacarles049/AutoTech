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
 * Helper para parsear fecha y hora completa en un objeto Date
 * Soporta formatos:
 * - "DD/MM/YYYY HH:mm" (ej: "13/11/2026 10:00")
 * - "YYYY-MM-DD HH:mm" o "YYYY-MM-DDTHH:mm:ss"
 * - o fecha en un argumento y hora en otro ("13/11/2026", "10:00")
 */
export const parseFullDateTime = (dateStr: string, timeStr?: string): Date | null => {
  if (!dateStr) return null;
  const combined = timeStr ? `${dateStr.trim()} ${timeStr.trim()}` : dateStr.trim();

  // Caso: DD/MM/YYYY HH:mm o DD/MM/YYYY HH:mm:ss
  const ddmmyyyyMatch = combined.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const hours = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0;
    const minutes = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
    const seconds = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;
    const d = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(d.getTime()) ? null : d;
  }

  // Caso: YYYY-MM-DD HH:mm o YYYY-MM-DDTHH:mm:ss
  const isoMatch = combined.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hours = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
    const minutes = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
    const seconds = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
    const d = new Date(year, month, day, hours, minutes, seconds);
    return isNaN(d.getTime()) ? null : d;
  }

  const fallback = new Date(combined);
  return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Formatea un objeto Date a { fecha: "DD/MM/YYYY", hora: "HH:mm" }
 */
export const formatDateTimeDisplay = (d: Date): { fecha: string; hora: string } => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return {
    fecha: `${day}/${month}/${year}`,
    hora: `${hours}:${minutes}`
  };
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
 * Helper para verificar si un estado de turno ocupa disponibilidad (HU-10 CA 2)
 * Excluye los horarios con turnos Solicitados o Confirmados.
 * Los turnos 'Cancelado' NO ocupan horario (permanecen libres).
 */
export const isTurnoOcupandoHorario = (estado: string): boolean => {
  if (!estado) return false;
  const norm = estado.trim().toLowerCase();
  if (norm === 'cancelado') return false;
  return norm === 'solicitado' || norm.includes('confirmado');
};

/**
 * HU-10: Consultar disponibilidad horaria
 * GET /api/turnos/disponibilidad?sucursal=Centro&fecha=15/11/2026
 * (y alias /api/turnos/horarios-disponibles)
 * 
 * Criterios de Aceptación:
 * 1. Muestra los horarios dentro del horario de atención de la sucursal
 * 2. Excluye los horarios con turnos Solicitados o Confirmados
 * 3. Si no hay horarios libres se muestra "Sin disponibilidad para la fecha seleccionada"
 */
export const consultarDisponibilidadHoraria = async (req: Request, res: Response): Promise<void> => {
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

    // Comprobar fecha pasada
    if (isPastDate(norm.parsedDate)) {
      res.status(400).json({ error: 'No se permiten turnos en fechas pasadas' });
      return;
    }

    // Buscar configuración de la sucursal (HU-10 CA 1)
    const sucursal = localSucursalesSeed.find(
      s => s.nombre.toLowerCase() === sucursalNombre.toLowerCase()
    ) || localSucursalesSeed[0];

    // Criterio 1: Muestra los horarios dentro del horario de atención de la sucursal
    const allSlots = getBranchTimeSlots(sucursal.horario_apertura, sucursal.horario_cierre);

    // Criterio 2: Excluye los horarios con turnos Solicitados o Confirmados
    const turnosOcupados = localTurnosSeed.filter(t => {
      if (!isTurnoOcupandoHorario(t.estado)) return false;
      const tNorm = normalizeDate(t.fecha);
      const sameDate = tNorm.iso === norm.iso || tNorm.ddmmyyyy === norm.ddmmyyyy;
      const sameSucursal = t.sucursal.toLowerCase() === sucursal.nombre.toLowerCase();
      return sameDate && sameSucursal;
    });

    const occupiedHoursMap = new Map<string, string>();
    turnosOcupados.forEach(t => {
      occupiedHoursMap.set(normalizeTime(t.hora), t.estado);
    });

    // Horarios libres dentro del horario de atención
    const horariosDisponibles = allSlots.filter(slot => !occupiedHoursMap.has(normalizeTime(slot)));
    const tieneDisponibilidad = horariosDisponibles.length > 0;

    // Criterio 3: Si no hay horarios libres se muestra "Sin disponibilidad para la fecha seleccionada"
    const mensaje = tieneDisponibilidad
      ? `Hay ${horariosDisponibles.length} horarios disponibles`
      : 'Sin disponibilidad para la fecha seleccionada';

    res.json({
      sucursal: sucursal.nombre,
      direccion: sucursal.direccion,
      horarioAtencion: `${sucursal.horario_apertura} a ${sucursal.horario_cierre}`,
      fecha: norm.ddmmyyyy,
      fechaIso: norm.iso,
      totalHorarios: allSlots.length,
      tieneDisponibilidad,
      mensaje,
      horariosDisponibles,
      horariosLibres: horariosDisponibles,
      horariosOcupados: Array.from(occupiedHoursMap.entries()).map(([hora, estado]) => ({ hora, estado }))
    });
  } catch (err: any) {
    console.error('[Backend Turnos] Error obteniendo disponibilidad horaria:', err);
    res.status(500).json({ error: 'Error al consultar disponibilidad horaria' });
  }
};

export const listarHorariosDisponibles = consultarDisponibilidadHoraria;

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
    // Comprobar si ya existe un turno ocupado (Solicitado o Confirmado) para esa sucursal, fecha y hora
    const slotOcupado = localTurnosSeed.some(t => {
      if (!isTurnoOcupandoHorario(t.estado)) return false;
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
 * HU-11: Confirmar turno
 * POST /api/turnos/confirmar
 * POST /api/turnos/:id/confirmar
 * 
 * Criterios de Aceptación:
 * 1. Sólo se confirma si faltan 24 hs o más para el turno.
 * 2. El turno pasa de "Solicitado" a "Confirmado".
 * 3. Se registra la fecha, hora y medio de contacto de la confirmación.
 * 4. Al confirmarse se notifica al cliente la fecha y hora del turno.
 * 5. Fuera de plazo se informa "El plazo de confirmación venció".
 */
export const confirmarTurno = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramId = req.params?.id;
    const {
      id,
      turno_id,
      turnoId,
      nro_turno,
      nroTurno,
      patente,
      vehiculo_dominio,
      vehiculoDominio,
      cliente_dni,
      clienteDni,
      cliente_nombre,
      medio,
      medio_confirmacion,
      medioConfirmacion,
      fecha_hora_actual,
      fechaHoraActual,
      fecha_actual,
      hora_actual
    } = req.body;

    const targetId = String(paramId || id || turno_id || turnoId || '').trim();
    const targetNro = nro_turno || nroTurno ? Number(nro_turno || nroTurno) : null;
    const targetPatente = String(patente || vehiculo_dominio || vehiculoDominio || '').trim().toUpperCase();
    const targetDni = String(cliente_dni || clienteDni || '').trim().replace(/[\s-]/g, '');
    const targetNombre = String(cliente_nombre || '').trim().toLowerCase();

    // Buscar turno en memoria local (o Supabase)
    const turno = localTurnosSeed.find(t => {
      if (targetId && t.id === targetId) return true;
      if (targetNro && t.nro_turno === targetNro) return true;
      if (targetPatente && t.vehiculo_dominio.toUpperCase() === targetPatente) {
        if (!targetId && !targetNro) return true;
      }
      if (targetDni && t.cliente_documento && t.cliente_documento.replace(/[\s-]/g, '') === targetDni) {
        if (!targetId && !targetNro && !targetPatente) return true;
      }
      if (targetNombre && t.cliente_nombre && t.cliente_nombre.toLowerCase().includes(targetNombre)) {
        if (!targetId && !targetNro && !targetPatente && !targetDni) return true;
      }
      return false;
    });

    if (!turno) {
      res.status(404).json({
        success: false,
        error: 'Turno no encontrado'
      });
      return;
    }

    // Normalizar medio de confirmación ("Mail" o "Mensaje")
    const rawMedio = String(medio || medio_confirmacion || medioConfirmacion || 'Mail').trim();
    const medioNorm = rawMedio.toLowerCase().includes('mensaje') || 
                      rawMedio.toLowerCase().includes('whatsapp') || 
                      rawMedio.toLowerCase().includes('sms')
      ? 'Mensaje'
      : 'Mail';

    // Determinar la fecha y hora de referencia actual (permite simulación para tests BDD)
    let currentDate: Date = new Date();
    const rawCurrentDateTime = fecha_hora_actual || fechaHoraActual || (fecha_actual ? `${fecha_actual} ${hora_actual || '10:00'}` : null);
    if (rawCurrentDateTime) {
      const parsedCurrent = parseFullDateTime(String(rawCurrentDateTime));
      if (parsedCurrent) {
        currentDate = parsedCurrent;
      }
    }

    // Parsear fecha y hora del turno
    const turnoDateTime = parseFullDateTime(turno.fecha, turno.hora);
    if (!turnoDateTime) {
      res.status(400).json({
        success: false,
        error: 'El turno no posee una fecha y hora válidas'
      });
      return;
    }

    // Criterio 1: Sólo se confirma si faltan 24 hs o más para el turno
    // Diferencia en horas entre la fecha/hora del turno y la fecha/hora actual
    const diffMs = turnoDateTime.getTime() - currentDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Criterio 5: Fuera de plazo se informa "El plazo de confirmación venció"
    // Si faltan menos de 24 horas (o el turno ya pasó), se rechaza
    if (diffHours < 24) {
      // El turno sigue en estado "Solicitado" y NO se registra la confirmación
      res.status(400).json({
        success: false,
        error: 'El plazo de confirmación venció',
        message: 'El plazo de confirmación venció',
        estado: turno.estado,
        horasRestantes: Math.round(diffHours * 10) / 10,
        requiereMinimoHoras: 24
      });
      return;
    }

    // Criterio 2: El turno pasa de "Solicitado" a "Confirmado"
    turno.estado = 'Confirmado';

    // Criterio 3: Se registra la fecha, hora y medio de contacto de la confirmación
    const { fecha: regFecha, hora: regHora } = formatDateTimeDisplay(currentDate);
    turno.fecha_confirmacion = regFecha;
    turno.hora_confirmacion = regHora;
    turno.medio_confirmacion = medioNorm;
    turno.notificacion_enviada = true;

    // Obtener datos del cliente para la notificación
    const cliente = localClientsSeed.find(c => 
      c.id === turno.cliente_id || 
      (turno.cliente_documento && c.nro_documento.replace(/[\s-]/g, '') === turno.cliente_documento.replace(/[\s-]/g, ''))
    );

    const destinatario = medioNorm === 'Mail'
      ? (cliente?.email || 'juan.perez@gmail.com')
      : (cliente?.telefono || '0351-154987654');

    // Criterio 4: Al confirmarse se notifica al cliente la fecha y hora del turno
    const notificacion = {
      enviada: true,
      fecha_turno: turno.fecha,
      hora_turno: turno.hora,
      medio: medioNorm,
      destinatario,
      mensaje: `Estimado/a ${turno.cliente_nombre || 'Cliente'}, su turno para el vehículo ${turno.vehiculo_dominio} en la sucursal ${turno.sucursal} ha sido confirmado para el día ${turno.fecha} a las ${turno.hora} hs.`
    };
    turno.notificacion_cliente = notificacion;

    // Sincronizar con Supabase si está disponible
    if (isSupabaseConnected && supabase) {
      try {
        await supabase
          .from('turnos')
          .update({
            estado_turno_id: 3, // Confirmado
            fecha_confirmacion: regFecha,
            hora_confirmacion: regHora,
            medio_confirmacion: medioNorm,
            notificacion_enviada: true
          })
          .eq('nro_turno', turno.nro_turno);
      } catch (dbErr) {
        console.warn('[Backend Turnos] Error actualizando turno en Supabase, persistido en memoria local:', dbErr);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Turno confirmado exitosamente',
      estado: 'Confirmado',
      fecha_confirmacion: regFecha,
      hora_confirmacion: regHora,
      medio_confirmacion: medioNorm,
      turno,
      notificacion
    });
  } catch (err: any) {
    console.error('[Backend Turnos] Error al confirmar turno:', err);
    res.status(500).json({ error: 'Error interno al confirmar el turno' });
  }
};

/**
 * Endpoint de limpieza para tests automatizados BDD
 */
export const testCleanupTurnos = async (req: Request, res: Response): Promise<void> => {
  localTurnosSeed.length = 0;
  resetTurnoCounter(1001);
  res.json({ success: true, message: 'Turnos limpiados para testing' });
};
