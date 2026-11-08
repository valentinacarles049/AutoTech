import { Request, Response } from 'express';
import {
  supabase,
  isSupabaseConnected,
  localTurnosSeed,
  localClientsSeed,
  localVehiclesSeed,
  localPresupuestosSeed,
  LocalPresupuesto,
  LocalDetallePresupuesto,
  getNextPresupuestoNumber,
  resetPresupuestoCounter
} from '../db';
import { normalizeDate } from './turnos.controller';

/**
 * Extrae el porcentaje de descuento de fidelización de un cliente
 * Si no tiene descuento asignado, retorna 0 (Criterio 2: "si no tiene, no se descuenta nada")
 */
export const obtenerPorcentajeDescuentoCliente = (
  clienteId?: string,
  clienteDocumento?: string,
  clienteNombre?: string,
  descuentoExplicito?: number | string | null
): number => {
  if (descuentoExplicito !== undefined && descuentoExplicito !== null && String(descuentoExplicito).trim() !== '') {
    const parsed = Number(String(descuentoExplicito).replace('%', '').trim());
    if (!isNaN(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  const client = localClientsSeed.find(c => {
    if (clienteId && c.id === clienteId) return true;
    if (clienteDocumento && c.nro_documento.replace(/[\s-]/g, '') === clienteDocumento.replace(/[\s-]/g, '')) return true;
    if (clienteNombre && `${c.nombre} ${c.apellido}`.trim().toLowerCase() === clienteNombre.trim().toLowerCase()) return true;
    return false;
  });

  if (!client) return 0;

  if (typeof client.descuento_fidelizacion === 'number' && client.descuento_fidelizacion >= 0) {
    return client.descuento_fidelizacion;
  }

  if (client.nivel_fidelizacion) {
    const match = String(client.nivel_fidelizacion).match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return Number(match[1]);
    }
  }

  return 0;
};

/**
 * Calcula los días corridos transcurridos entre dos fechas (fechaEmision -> fechaActual)
 */
export const calcularDiasTranscurridos = (fechaEmisionStr: string, fechaActualStr: string): number => {
  const normEmision = normalizeDate(fechaEmisionStr);
  const normActual = normalizeDate(fechaActualStr);

  if (!normEmision.parsedDate || !normActual.parsedDate) {
    return 0;
  }

  const utcEmision = Date.UTC(
    normEmision.parsedDate.getFullYear(),
    normEmision.parsedDate.getMonth(),
    normEmision.parsedDate.getDate()
  );
  const utcActual = Date.UTC(
    normActual.parsedDate.getFullYear(),
    normActual.parsedDate.getMonth(),
    normActual.parsedDate.getDate()
  );

  const diffMs = utcActual - utcEmision;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Procesa y valida los ítems de detalle (DetallePresupuesto del MODP)
 * Criterio 1: cada ítem tiene descripción, cantidad, precio unitario y subtotal (cantidad * precio unitario)
 */
export const procesarItemsDetalle = (rawItems: any[]): {
  valid: boolean;
  error?: string;
  items: LocalDetallePresupuesto[];
  subtotalGeneral: number;
} => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return {
      valid: false,
      error: 'El presupuesto debe tener uno o más ítems de detalle (DetallePresupuesto)',
      items: [],
      subtotalGeneral: 0
    };
  }

  const items: LocalDetallePresupuesto[] = [];
  let subtotalGeneral = 0;

  for (let i = 0; i < rawItems.length; i++) {
    const raw = rawItems[i];
    const descripcion = String(
      raw.descripcion ?? raw['descripción'] ?? raw.description ?? ''
    ).trim();

    const cantidad = Number(raw.cantidad ?? raw.quantity ?? raw.cant ?? 0);
    const precioUnitario = Number(
      raw.precio_unitario ?? raw.precioUnitario ?? raw['precio unitario'] ?? raw.unitPrice ?? raw.precio ?? NaN
    );

    if (!descripcion) {
      return {
        valid: false,
        error: `El ítem #${i + 1} debe tener una descripción`,
        items: [],
        subtotalGeneral: 0
      };
    }

    if (isNaN(cantidad) || cantidad <= 0) {
      return {
        valid: false,
        error: `La cantidad del ítem "${descripcion}" debe ser mayor a 0`,
        items: [],
        subtotalGeneral: 0
      };
    }

    if (isNaN(precioUnitario) || precioUnitario < 0) {
      return {
        valid: false,
        error: `El precio unitario del ítem "${descripcion}" debe ser un valor válido`,
        items: [],
        subtotalGeneral: 0
      };
    }

    const subtotal = Math.round(cantidad * precioUnitario * 100) / 100;
    subtotalGeneral = Math.round((subtotalGeneral + subtotal) * 100) / 100;

    items.push({
      id: raw.id || `det-${i + 1}`,
      descripcion,
      cantidad,
      precio_unitario: precioUnitario,
      subtotal
    });
  }

  return {
    valid: true,
    items,
    subtotalGeneral
  };
};

/**
 * Formatea un LocalPresupuesto con aliases camelCase y snake_case para compatibilidad total
 */
const formatPresupuestoResponse = (p: LocalPresupuesto) => ({
  ...p,
  nroPresupuesto: p.nro_presupuesto,
  turnoId: p.turno_id,
  vehiculoDominio: p.vehiculo_dominio,
  clienteId: p.cliente_id,
  clienteNombre: p.cliente_nombre,
  fechaEmision: p.fecha_emision,
  validezDias: p.validez_dias,
  montoEstimado: p.total,
  descuentoPorcentaje: p.descuento_porcentaje,
  descuentoMonto: p.descuento_monto,
  respuestaCliente: p.respuesta_cliente ?? null,
  puedeModificarse: p.estado === 'Emitido',
  puede_modificarse: p.estado === 'Emitido',
  items: p.items.map(it => ({
    ...it,
    precioUnitario: it.precio_unitario
  }))
});

/**
 * HU-19: Registrar presupuesto de reparación
 * POST /api/presupuestos
 * POST /api/presupuestos/registrar
 * POST /api/turnos/presupuesto
 * POST /api/turnos/:id/presupuesto
 */
export const registrarPresupuesto = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramTurnoId = req.params?.id;
    const {
      turno_id,
      turnoId,
      nro_turno,
      nroTurno,
      vehiculo_dominio,
      vehiculoDominio,
      patente,
      cliente_nombre,
      clienteNombre,
      items: rawItemsBody,
      detalles,
      detalle_presupuesto,
      validez_dias,
      validezDias,
      validez,
      descuento_fidelizacion,
      descuentoFidelizacionPorcentaje,
      descuento_porcentaje,
      descuentoPorcentaje,
      fecha_emision,
      fechaEmision
    } = req.body;

    const targetTurnoId = String(paramTurnoId || turno_id || turnoId || '').trim();
    const targetNroTurno = nro_turno || nroTurno ? Number(nro_turno || nroTurno) : null;
    const targetPatente = String(vehiculo_dominio || vehiculoDominio || patente || '').trim().toUpperCase();
    const targetCliente = String(cliente_nombre || clienteNombre || '').trim();

    // 1. Buscar el turno correspondiente (priorizando turnos en estado "Finalizado")
    let turno = localTurnosSeed.find(t => {
      if (targetTurnoId && t.id === targetTurnoId) return true;
      if (targetNroTurno && t.nro_turno === targetNroTurno) return true;
      if (targetPatente && t.vehiculo_dominio.toUpperCase() === targetPatente && t.estado === 'Finalizado') return true;
      return false;
    });

    if (!turno) {
      turno = localTurnosSeed.find(t => {
        if (targetTurnoId && t.id === targetTurnoId) return true;
        if (targetNroTurno && t.nro_turno === targetNroTurno) return true;
        if (targetPatente && t.vehiculo_dominio.toUpperCase() === targetPatente) return true;
        if (targetCliente && (t.cliente_nombre || '').toLowerCase() === targetCliente.toLowerCase()) return true;
        return false;
      });
    }

    if (!turno) {
      res.status(404).json({
        success: false,
        error: 'No se encontró el turno indicado para registrar el presupuesto'
      });
      return;
    }

    // Validar que el turno esté en estado "Finalizado" (Historia de Usuario HU-19 y HU-15)
    if (turno.estado !== 'Finalizado') {
      res.status(400).json({
        success: false,
        error: 'Sólo se puede registrar el presupuesto de un turno finalizado',
        message: 'Sólo se puede registrar el presupuesto de un turno finalizado',
        estadoTurno: turno.estado
      });
      return;
    }

    // Verificar si ya existe un presupuesto para este turno y si puede modificarse (Criterios 4 y 5)
    const existingPresupuesto = localPresupuestosSeed.find(p => p.turno_id === turno!.id);
    if (existingPresupuesto && existingPresupuesto.estado !== 'Emitido') {
      res.status(400).json({
        success: false,
        error: `El presupuesto se encuentra en estado "${existingPresupuesto.estado}" y ya no se puede modificar`,
        message: `El presupuesto se encuentra en estado "${existingPresupuesto.estado}" y ya no se puede modificar`,
        estado: existingPresupuesto.estado,
        puede_modificarse: false,
        puedeModificarse: false
      });
      return;
    }

    // 2. Validar ítems de detalle (DetallePresupuesto - Criterio 1)
    const rawItems = rawItemsBody || detalles || detalle_presupuesto || [];
    const itemsResult = procesarItemsDetalle(rawItems);
    if (!itemsResult.valid) {
      res.status(400).json({
        success: false,
        error: itemsResult.error,
        message: itemsResult.error
      });
      return;
    }

    // 3. Validar días de validez (Criterio 3)
    const rawValidez = validez_dias ?? validezDias ?? validez ?? 15;
    const parsedValidez = Number(rawValidez);
    if (isNaN(parsedValidez) || parsedValidez <= 0) {
      res.status(400).json({
        success: false,
        error: 'Debe indicar una cantidad de días de validez mayor a 0',
        message: 'Debe indicar una cantidad de días de validez mayor a 0'
      });
      return;
    }

    // 4. Calcular subtotal, descuento de fidelización del cliente y total (Criterio 2)
    const explicitDesc =
      descuento_fidelizacion ??
      descuentoFidelizacionPorcentaje ??
      descuento_porcentaje ??
      descuentoPorcentaje;

    const descuentoPct = obtenerPorcentajeDescuentoCliente(
      turno.cliente_id,
      turno.cliente_documento,
      turno.cliente_nombre || targetCliente,
      explicitDesc
    );

    const subtotal = itemsResult.subtotalGeneral;
    const descuentoMonto = Math.round(subtotal * (descuentoPct / 100) * 100) / 100;
    const total = Math.round((subtotal - descuentoMonto) * 100) / 100;

    // 5. Determinar fecha de emisión
    const rawFechaEmision = String(fecha_emision || fechaEmision || turno.fecha || '15/11/2026').trim();
    const normEmision = normalizeDate(rawFechaEmision);
    const fechaEmisionFormatted = normEmision.ddmmyyyy || rawFechaEmision;

    let savedPresupuesto: LocalPresupuesto;

    if (existingPresupuesto) {
      existingPresupuesto.fecha_emision = fechaEmisionFormatted;
      existingPresupuesto.validez_dias = parsedValidez;
      existingPresupuesto.items = itemsResult.items;
      existingPresupuesto.subtotal = subtotal;
      existingPresupuesto.descuento_porcentaje = descuentoPct;
      existingPresupuesto.descuento = descuentoMonto;
      existingPresupuesto.descuento_monto = descuentoMonto;
      existingPresupuesto.total = total;
      existingPresupuesto.estado = 'Emitido';
      existingPresupuesto.puede_modificarse = true;
      existingPresupuesto.updated_at = new Date().toISOString();
      savedPresupuesto = existingPresupuesto;
    } else {
      const nroPresupuesto = getNextPresupuestoNumber();
      savedPresupuesto = {
        id: `pres-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        nro_presupuesto: nroPresupuesto,
        turno_id: turno.id,
        vehiculo_dominio: turno.vehiculo_dominio,
        cliente_id: turno.cliente_id,
        cliente_nombre: turno.cliente_nombre || targetCliente || 'Cliente',
        fecha_emision: fechaEmisionFormatted,
        validez_dias: parsedValidez,
        items: itemsResult.items,
        subtotal,
        descuento_porcentaje: descuentoPct,
        descuento: descuentoMonto,
        descuento_monto: descuentoMonto,
        total,
        estado: 'Emitido',
        respuesta_cliente: null,
        puede_modificarse: true,
        created_at: new Date().toISOString()
      };
      localPresupuestosSeed.push(savedPresupuesto);
    }

    // Intentar sincronizar con Supabase si está conectado
    if (isSupabaseConnected && supabase) {
      try {
        await supabase.from('presupuestos').upsert({
          nro_presupuesto: savedPresupuesto.nro_presupuesto,
          turno_id: savedPresupuesto.turno_id,
          fecha_emision: normEmision.iso || new Date().toISOString().split('T')[0],
          monto_estimado: savedPresupuesto.total,
          subtotal: savedPresupuesto.subtotal,
          descuento_porcentaje: savedPresupuesto.descuento_porcentaje,
          descuento_monto: savedPresupuesto.descuento_monto,
          total: savedPresupuesto.total,
          validez_dias: savedPresupuesto.validez_dias,
          estado: savedPresupuesto.estado
        });
      } catch (dbErr) {
        console.warn('[Backend Presupuestos] Fallback local activo:', dbErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Presupuesto registrado exitosamente',
      estado: savedPresupuesto.estado,
      subtotal: savedPresupuesto.subtotal,
      descuento_porcentaje: savedPresupuesto.descuento_porcentaje,
      descuento: savedPresupuesto.descuento,
      descuento_monto: savedPresupuesto.descuento_monto,
      total: savedPresupuesto.total,
      validez_dias: savedPresupuesto.validez_dias,
      puede_modificarse: true,
      puedeModificarse: true,
      presupuesto: formatPresupuestoResponse(savedPresupuesto)
    });
  } catch (err: any) {
    console.error('[Backend Presupuestos] Error al registrar presupuesto:', err);
    res.status(500).json({ error: 'Error interno al registrar el presupuesto' });
  }
};

/**
 * HU-19 Criterios 4 y 5: Modificar presupuesto (sólo permitido mientras esté en estado "Emitido")
 * PUT /api/presupuestos/:id
 * PUT /api/presupuestos
 * POST /api/presupuestos/modificar
 * POST /api/presupuestos/:id/modificar
 */
export const modificarPresupuesto = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramId = req.params?.id;
    const {
      id,
      presupuesto_id,
      presupuestoId,
      nro_presupuesto,
      nroPresupuesto,
      turno_id,
      turnoId,
      patente,
      vehiculo_dominio,
      vehiculoDominio,
      items: rawItemsBody,
      detalles,
      validez_dias,
      validezDias,
      validez,
      descuento_fidelizacion,
      descuentoFidelizacionPorcentaje,
      descuento_porcentaje,
      fecha_actual,
      fechaActual
    } = req.body;

    const targetId = String(paramId || id || presupuesto_id || presupuestoId || '').trim();
    const targetNro = String(nro_presupuesto || nroPresupuesto || '').trim();
    const targetTurnoId = String(turno_id || turnoId || '').trim();
    const targetPatente = String(patente || vehiculo_dominio || vehiculoDominio || '').trim().toUpperCase();

    const presupuesto = localPresupuestosSeed.find(p => {
      if (targetId && (p.id === targetId || p.turno_id === targetId)) return true;
      if (targetNro && p.nro_presupuesto === targetNro) return true;
      if (targetTurnoId && p.turno_id === targetTurnoId) return true;
      if (targetPatente && p.vehiculo_dominio.toUpperCase() === targetPatente) return true;
      return false;
    });

    if (!presupuesto) {
      res.status(404).json({
        success: false,
        error: 'Presupuesto no encontrado'
      });
      return;
    }

    // Si se provee fecha_actual, verificar primero si ya superó los días de validez sin respuesta (Criterio 5)
    const rawFechaActual = String(fecha_actual || fechaActual || '').trim();
    if (rawFechaActual && presupuesto.estado === 'Emitido' && !presupuesto.respuesta_cliente) {
      const dias = calcularDiasTranscurridos(presupuesto.fecha_emision, rawFechaActual);
      if (dias > presupuesto.validez_dias) {
        presupuesto.estado = 'Vencido';
        presupuesto.puede_modificarse = false;
      }
    }

    // Criterio 4 y 5: Sólo se puede modificar mientras siga en estado "Emitido". Si está "Vencido", rechazar.
    if (presupuesto.estado !== 'Emitido') {
      res.status(400).json({
        success: false,
        error: `No se puede modificar el presupuesto porque se encuentra en estado "${presupuesto.estado}"`,
        message: `No se puede modificar el presupuesto porque se encuentra en estado "${presupuesto.estado}"`,
        estado: presupuesto.estado,
        puede_modificarse: false,
        puedeModificarse: false,
        presupuesto: formatPresupuestoResponse(presupuesto)
      });
      return;
    }

    // Si se enviaron nuevos ítems de detalle, validarlos y recalcular
    const rawItems = rawItemsBody || detalles;
    if (rawItems !== undefined) {
      const itemsResult = procesarItemsDetalle(rawItems);
      if (!itemsResult.valid) {
        res.status(400).json({
          success: false,
          error: itemsResult.error,
          message: itemsResult.error
        });
        return;
      }
      presupuesto.items = itemsResult.items;
      presupuesto.subtotal = itemsResult.subtotalGeneral;
    }

    if (validez_dias !== undefined || validezDias !== undefined || validez !== undefined) {
      const nuevaValidez = Number(validez_dias ?? validezDias ?? validez);
      if (isNaN(nuevaValidez) || nuevaValidez <= 0) {
        res.status(400).json({
          success: false,
          error: 'Los días de validez deben ser mayores a 0'
        });
        return;
      }
      presupuesto.validez_dias = nuevaValidez;
    }

    if (
      descuento_fidelizacion !== undefined ||
      descuentoFidelizacionPorcentaje !== undefined ||
      descuento_porcentaje !== undefined
    ) {
      const nuevoDesc = Number(descuento_fidelizacion ?? descuentoFidelizacionPorcentaje ?? descuento_porcentaje);
      if (!isNaN(nuevoDesc) && nuevoDesc >= 0) {
        presupuesto.descuento_porcentaje = nuevoDesc;
      }
    }

    presupuesto.descuento = Math.round(presupuesto.subtotal * (presupuesto.descuento_porcentaje / 100) * 100) / 100;
    presupuesto.descuento_monto = presupuesto.descuento;
    presupuesto.total = Math.round((presupuesto.subtotal - presupuesto.descuento) * 100) / 100;
    presupuesto.updated_at = new Date().toISOString();

    res.status(200).json({
      success: true,
      message: 'Presupuesto modificado exitosamente',
      estado: presupuesto.estado,
      subtotal: presupuesto.subtotal,
      descuento_porcentaje: presupuesto.descuento_porcentaje,
      descuento: presupuesto.descuento,
      total: presupuesto.total,
      puede_modificarse: true,
      puedeModificarse: true,
      presupuesto: formatPresupuestoResponse(presupuesto)
    });
  } catch (err: any) {
    console.error('[Backend Presupuestos] Error al modificar presupuesto:', err);
    res.status(500).json({ error: 'Error interno al modificar el presupuesto' });
  }
};

/**
 * HU-19 Criterio 5: Si se superan los días de validez sin respuesta del cliente, pasa a "Vencido" y ya no se puede modificar
 * POST /api/presupuestos/verificar-vencimiento
 * POST /api/presupuestos/:id/verificar-vencimiento
 * POST /api/presupuestos/vencimiento
 */
export const verificarVencimientoPresupuesto = async (req: Request, res: Response): Promise<void> => {
  try {
    const paramId = req.params?.id;
    const {
      id,
      presupuesto_id,
      presupuestoId,
      nro_presupuesto,
      turno_id,
      turnoId,
      patente,
      vehiculo_dominio,
      fecha_actual,
      fechaActual,
      hoy,
      fecha,
      respuesta_cliente,
      respuestaCliente
    } = req.body;

    const targetId = String(paramId || id || presupuesto_id || presupuestoId || '').trim();
    const targetNro = String(nro_presupuesto || '').trim();
    const targetTurnoId = String(turno_id || turnoId || '').trim();
    const targetPatente = String(patente || vehiculo_dominio || '').trim().toUpperCase();
    const rawFechaActual = String(fecha_actual || fechaActual || hoy || fecha || '').trim();

    if (!rawFechaActual) {
      res.status(400).json({
        success: false,
        error: 'Debe indicar la fecha actual para verificar el vencimiento del presupuesto'
      });
      return;
    }

    const candidatos = localPresupuestosSeed.filter(p => {
      if (targetId && (p.id === targetId || p.turno_id === targetId)) return true;
      if (targetNro && p.nro_presupuesto === targetNro) return true;
      if (targetTurnoId && p.turno_id === targetTurnoId) return true;
      if (targetPatente && p.vehiculo_dominio.toUpperCase() === targetPatente) return true;
      if (!targetId && !targetNro && !targetTurnoId && !targetPatente) return true;
      return false;
    });

    if (candidatos.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Presupuesto no encontrado'
      });
      return;
    }

    const vencidos: LocalPresupuesto[] = [];

    candidatos.forEach(p => {
      if (respuesta_cliente !== undefined || respuestaCliente !== undefined) {
        p.respuesta_cliente = respuesta_cliente ?? respuestaCliente ?? null;
      }

      const diasTranscurridos = calcularDiasTranscurridos(p.fecha_emision, rawFechaActual);
      const sinRespuesta = !p.respuesta_cliente || String(p.respuesta_cliente).trim() === '';

      if (p.estado === 'Emitido' && sinRespuesta && diasTranscurridos > p.validez_dias) {
        p.estado = 'Vencido';
        p.puede_modificarse = false;
        p.updated_at = new Date().toISOString();
        vencidos.push(p);
      }
    });

    const principal = vencidos[0] || candidatos[0];
    const dias = calcularDiasTranscurridos(principal.fecha_emision, rawFechaActual);

    res.status(200).json({
      success: true,
      message: principal.estado === 'Vencido'
        ? 'El presupuesto superó los días de validez sin respuesta del cliente y pasó al estado "Vencido"'
        : 'El presupuesto aún se encuentra dentro del plazo de validez',
      estado: principal.estado,
      dias_transcurridos: dias,
      validez_dias: principal.validez_dias,
      puede_modificarse: principal.estado === 'Emitido',
      puedeModificarse: principal.estado === 'Emitido',
      presupuesto: formatPresupuestoResponse(principal)
    });
  } catch (err: any) {
    console.error('[Backend Presupuestos] Error al verificar vencimiento:', err);
    res.status(500).json({ error: 'Error interno al verificar vencimiento del presupuesto' });
  }
};

/**
 * Listar presupuestos registrados
 * GET /api/presupuestos
 */
export const listarPresupuestos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { turno_id, turnoId, patente, estado } = req.query;
    let lista = [...localPresupuestosSeed];

    if (turno_id || turnoId) {
      const target = String(turno_id || turnoId).trim();
      lista = lista.filter(p => p.turno_id === target);
    }
    if (patente) {
      const targetPat = String(patente).trim().toUpperCase();
      lista = lista.filter(p => p.vehiculo_dominio.toUpperCase() === targetPat);
    }
    if (estado) {
      const targetEst = String(estado).trim().toLowerCase();
      lista = lista.filter(p => p.estado.toLowerCase() === targetEst);
    }

    res.status(200).json({
      presupuestos: lista.map(formatPresupuestoResponse),
      total: lista.length
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al listar presupuestos' });
  }
};

/**
 * Configurar descuento de fidelización de un cliente (para Antecedentes BDD HU-19)
 * POST /api/presupuestos/fidelizacion-cliente
 */
export const configurarFidelizacionCliente = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cliente_id, clienteId, nombre, cliente_nombre, nro_documento, descuento_fidelizacion, descuento } = req.body;
    const targetNombre = String(nombre || cliente_nombre || '').trim().toLowerCase();
    const targetId = String(cliente_id || clienteId || '').trim();
    const targetDoc = String(nro_documento || '').trim();
    const pct = Number(String(descuento_fidelizacion ?? descuento ?? 0).replace('%', '').trim());

    const client = localClientsSeed.find(c => {
      if (targetId && c.id === targetId) return true;
      if (targetDoc && c.nro_documento === targetDoc) return true;
      if (targetNombre && `${c.nombre} ${c.apellido}`.trim().toLowerCase() === targetNombre) return true;
      return false;
    });

    if (!client) {
      res.status(404).json({ success: false, error: 'Cliente no encontrado' });
      return;
    }

    client.descuento_fidelizacion = isNaN(pct) ? 0 : pct;

    res.status(200).json({
      success: true,
      message: `Descuento de fidelización del ${client.descuento_fidelizacion}% asignado a ${client.nombre} ${client.apellido}`,
      cliente: client
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al configurar fidelización del cliente' });
  }
};

/**
 * Limpieza para tests automatizados BDD
 */
export const testCleanupPresupuestos = async (req: Request, res: Response): Promise<void> => {
  localPresupuestosSeed.length = 0;
  resetPresupuestoCounter(1);
  // Restaurar descuento_fidelizacion en clientes semilla
  localClientsSeed.forEach(c => {
    delete c.descuento_fidelizacion;
  });
  res.json({ success: true, message: 'Presupuestos limpiados para testing' });
};

