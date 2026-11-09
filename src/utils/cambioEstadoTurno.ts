import { CambioEstadoTurno, TurnoEstadoNombre } from '../types/autotech';

/**
 * Mapeo oficial de EstadoTurno (tabla `estado_turnos` en autotech_db_schema.sql)
 */
export const ESTADO_TURNO_IDS: Record<string, number> = {
  'Solicitado': 1,
  'Pendiente de Confirmación (24hs)': 2,
  'Confirmado (24hs)': 2,
  'Confirmado': 3,
  'En Taller': 4,
  'Cancelado': 5,
  'Finalizado': 6,
  'Ausente': 7,
  'Reprogramado': 8,
  'Pendiente': 1
};

export const getEstadoTurnoId = (estado: string): number => {
  if (!estado) return 1;
  if (ESTADO_TURNO_IDS[estado]) return ESTADO_TURNO_IDS[estado];
  const lower = estado.trim().toLowerCase();
  if (lower.includes('reprogramado')) return 8;
  if (lower.includes('ausente')) return 7;
  if (lower.includes('finalizado')) return 6;
  if (lower.includes('cancelado')) return 5;
  if (lower.includes('taller')) return 4;
  if (lower.includes('pendiente') || lower.includes('24hs')) return 2;
  if (lower.includes('confirmado')) return 3;
  return 1;
};

let cambioSeqCounter = 1;

export const formatCambioFechaHora = (d: Date): { fecha: string; hora: string } => {
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

export interface BuildCambioEstadoInput {
  id?: string;
  turnoId?: string;
  estado: TurnoEstadoNombre | string;
  estadoTurnoId?: number;
  fechaInicio: string;
  horaInicio: string;
  fechaFin?: string | null;
  horaFin?: string | null;
  observacion?: string | null;
}

export const buildCambioEstado = (input: BuildCambioEstadoInput): CambioEstadoTurno => {
  const estadoTurnoId = input.estadoTurnoId ?? getEstadoTurnoId(input.estado);
  const fechaFin = input.fechaFin ?? null;
  const horaFin = input.horaFin ?? null;
  const observacion = input.observacion ?? null;
  const id = input.id || `cet-${input.turnoId || 'turno'}-${cambioSeqCounter++}`;

  return {
    id,
    turnoId: input.turnoId,
    turno_id: input.turnoId,
    estado: input.estado,
    estadoTurnoId,
    estado_turno_id: estadoTurnoId,
    fechaInicio: input.fechaInicio,
    fecha_inicio: input.fechaInicio,
    horaInicio: input.horaInicio,
    hora_inicio: input.horaInicio,
    fechaFin,
    fecha_fin: fechaFin,
    horaFin,
    hora_fin: horaFin,
    observacion
  };
};

export const normalizeCambioEstado = (raw: Partial<CambioEstadoTurno>, turnoId?: string): CambioEstadoTurno => {
  const estado = raw.estado || 'Solicitado';
  const fechaInicio = raw.fechaInicio ?? raw.fecha_inicio ?? formatCambioFechaHora(new Date()).fecha;
  const horaInicio = raw.horaInicio ?? raw.hora_inicio ?? '00:00';
  const fechaFin = raw.fechaFin !== undefined ? raw.fechaFin : (raw.fecha_fin !== undefined ? raw.fecha_fin : null);
  const horaFin = raw.horaFin !== undefined ? raw.horaFin : (raw.hora_fin !== undefined ? raw.hora_fin : null);
  const resolvedTurnoId = raw.turnoId ?? raw.turno_id ?? turnoId;

  return buildCambioEstado({
    id: raw.id,
    turnoId: resolvedTurnoId,
    estado,
    estadoTurnoId: raw.estadoTurnoId ?? raw.estado_turno_id ?? getEstadoTurnoId(estado),
    fechaInicio,
    horaInicio,
    fechaFin,
    horaFin,
    observacion: raw.observacion ?? null
  });
};

const resolveFallbackInicio = (
  createdAt?: string,
  fallbackFecha?: string,
  fallbackHora?: string
): { fecha: string; hora: string } => {
  if (createdAt) {
    const parsed = new Date(createdAt);
    if (!isNaN(parsed.getTime())) {
      return formatCambioFechaHora(parsed);
    }
  }
  if (fallbackFecha && fallbackHora) {
    return { fecha: fallbackFecha, hora: fallbackHora };
  }
  return formatCambioFechaHora(new Date());
};

/**
 * Inicializa un turno recién creado (HU-09) con su CambioEstadoTurno 'Solicitado' abierto
 * y su historial de estados no nulo.
 */
export const inicializarCambioEstadoTurno = (params: {
  turnoId: string;
  estado?: TurnoEstadoNombre | string;
  fechaInicio: string;
  horaInicio: string;
  observacion?: string | null;
}): {
  cambiosEstado: CambioEstadoTurno[];
  historialEstados: string[];
} => {
  const estadoInicial = params.estado || 'Solicitado';
  const cambioInicial = buildCambioEstado({
    turnoId: params.turnoId,
    estado: estadoInicial,
    fechaInicio: params.fechaInicio,
    horaInicio: params.horaInicio,
    fechaFin: null,
    horaFin: null,
    observacion: params.observacion ?? 'Solicitud de turno registrada'
  });

  return {
    cambiosEstado: [cambioInicial],
    historialEstados: [String(estadoInicial)]
  };
};

/**
 * Garantiza que un turno disponga siempre de `cambiosEstado` e `historialEstados` consistentes
 * (útil tanto en seeds/consultas como para compatibilidad con objetos creados en tests).
 */
export const ensureCambiosEstadoAndHistorial = (params: {
  turnoId: string;
  estadoActual: TurnoEstadoNombre | string;
  fechaFallback?: string;
  horaFallback?: string;
  cambiosExistentes?: Partial<CambioEstadoTurno>[] | null;
  historialExistente?: string[] | null;
  createdAt?: string;
}): {
  cambiosEstado: CambioEstadoTurno[];
  historialEstados: string[];
} => {
  const existingCambios = Array.isArray(params.cambiosExistentes) ? params.cambiosExistentes : [];
  if (existingCambios.length > 0) {
    const normalizedCambios = existingCambios.map(c => normalizeCambioEstado(c, params.turnoId));
    const hist = Array.isArray(params.historialExistente) && params.historialExistente.length > 0
      ? [...params.historialExistente]
      : normalizedCambios.map(c => String(c.estado));
    return {
      cambiosEstado: normalizedCambios,
      historialEstados: hist
    };
  }

  const fallbackStart = resolveFallbackInicio(params.createdAt, params.fechaFallback, params.horaFallback);
  const histSource = Array.isArray(params.historialExistente) && params.historialExistente.length > 0
    ? [...params.historialExistente]
    : [String(params.estadoActual || 'Solicitado')];

  const cambiosReconstruidos = histSource.map((est, idx) => {
    const isLast = idx === histSource.length - 1;
    return buildCambioEstado({
      turnoId: params.turnoId,
      estado: est,
      fechaInicio: fallbackStart.fecha,
      horaInicio: fallbackStart.hora,
      fechaFin: isLast ? null : fallbackStart.fecha,
      horaFin: isLast ? null : fallbackStart.hora,
      observacion: idx === 0 ? 'Estado inicial registrado' : null
    });
  });

  return {
    cambiosEstado: cambiosReconstruidos,
    historialEstados: histSource
  };
};

export interface TransicionEstadoInput {
  turnoId: string;
  estadoActual: TurnoEstadoNombre | string;
  nuevoEstado: TurnoEstadoNombre | string;
  fechaCambio: string;
  horaCambio: string;
  observacionNuevo?: string | null;
  cambiosExistentes?: Partial<CambioEstadoTurno>[] | null;
  historialExistente?: string[] | null;
  createdAt?: string;
}

export interface TransicionEstadoResult {
  cambiosEstado: CambioEstadoTurno[];
  historialEstados: string[];
  cambioCerrado: CambioEstadoTurno;
  cambioNuevo: CambioEstadoTurno;
  estado: TurnoEstadoNombre | string;
  estadoTurnoId: number;
}

/**
 * Cierra el CambioEstadoTurno vigente (asignando fechaFin y horaFin) y crea el nuevo
 * CambioEstadoTurno para el estado destino (fechaInicio, horaInicio, fechaFin: null, horaFin: null).
 * Además mantiene sincronizado `historialEstados` (nunca null).
 */
export const aplicarCambioEstadoTurno = (input: TransicionEstadoInput): TransicionEstadoResult => {
  const { cambiosEstado: baseCambios, historialEstados: baseHist } = ensureCambiosEstadoAndHistorial({
    turnoId: input.turnoId,
    estadoActual: input.estadoActual,
    fechaFallback: input.fechaCambio,
    horaFallback: input.horaCambio,
    cambiosExistentes: input.cambiosExistentes,
    historialExistente: input.historialExistente,
    createdAt: input.createdAt
  });

  const cambios = baseCambios.map(c => ({ ...c }));
  const historial = [...baseHist];

  // Buscar el último CambioEstadoTurno abierto (fecha_fin === null && hora_fin === null)
  let openIndex = -1;
  for (let i = cambios.length - 1; i >= 0; i--) {
    if (cambios[i].fecha_fin === null && cambios[i].hora_fin === null) {
      openIndex = i;
      break;
    }
  }

  let cambioCerrado: CambioEstadoTurno;

  if (openIndex >= 0) {
    const openEntry = cambios[openIndex];
    const closedEntry = buildCambioEstado({
      ...openEntry,
      turnoId: input.turnoId,
      fechaInicio: openEntry.fecha_inicio,
      horaInicio: openEntry.hora_inicio,
      fechaFin: input.fechaCambio,
      horaFin: input.horaCambio,
      observacion: openEntry.observacion ?? null
    });
    cambios[openIndex] = closedEntry;

    if (String(openEntry.estado).trim().toLowerCase() === String(input.estadoActual).trim().toLowerCase()) {
      cambioCerrado = closedEntry;
    } else {
      // Compatibilidad con tests legados que mutan turno.estado directamente entre sub-escenarios
      const syncedActualClosed = buildCambioEstado({
        turnoId: input.turnoId,
        estado: input.estadoActual,
        fechaInicio: input.fechaCambio,
        horaInicio: input.horaCambio,
        fechaFin: input.fechaCambio,
        horaFin: input.horaCambio,
        observacion: 'Estado previo sincronizado'
      });
      cambios.push(syncedActualClosed);
      if (historial[historial.length - 1] !== String(input.estadoActual)) {
        historial.push(String(input.estadoActual));
      }
      cambioCerrado = syncedActualClosed;
    }
  } else {
    // No había entrada abierta: abrir y cerrar estadoActual para conservar trazabilidad completa
    const createdAndClosed = buildCambioEstado({
      turnoId: input.turnoId,
      estado: input.estadoActual,
      fechaInicio: input.fechaCambio,
      horaInicio: input.horaCambio,
      fechaFin: input.fechaCambio,
      horaFin: input.horaCambio,
      observacion: 'Estado previo cerrado'
    });
    cambios.push(createdAndClosed);
    if (historial[historial.length - 1] !== String(input.estadoActual)) {
      historial.push(String(input.estadoActual));
    }
    cambioCerrado = createdAndClosed;
  }

  const cambioNuevo = buildCambioEstado({
    turnoId: input.turnoId,
    estado: input.nuevoEstado,
    fechaInicio: input.fechaCambio,
    horaInicio: input.horaCambio,
    fechaFin: null,
    horaFin: null,
    observacion: input.observacionNuevo ?? null
  });
  cambios.push(cambioNuevo);

  if (historial.length === 0) {
    historial.push(String(input.estadoActual));
  }
  historial.push(String(input.nuevoEstado));

  return {
    cambiosEstado: cambios,
    historialEstados: historial,
    cambioCerrado,
    cambioNuevo,
    estado: input.nuevoEstado,
    estadoTurnoId: getEstadoTurnoId(String(input.nuevoEstado))
  };
};

export interface ReprogramacionTurnoInput {
  turnoId: string;
  estadoPrevio: TurnoEstadoNombre | string;
  estadoFinal: TurnoEstadoNombre | string;
  fechaCambio: string;
  horaCambio: string;
  observacionReprogramado?: string | null;
  observacionFinal?: string | null;
  cambiosExistentes?: Partial<CambioEstadoTurno>[] | null;
  historialExistente?: string[] | null;
  createdAt?: string;
}

/**
 * Transición específica de HU-13 (Modificar turno):
 * Cierra el estado previo vigente, registra e inmediatamente cierra el CambioEstadoTurno 'Reprogramado',
 * y crea el nuevo CambioEstadoTurno vigente ('Confirmado' o 'Solicitado').
 */
export const aplicarReprogramacionTurno = (input: ReprogramacionTurnoInput): TransicionEstadoResult => {
  const paso1 = aplicarCambioEstadoTurno({
    turnoId: input.turnoId,
    estadoActual: input.estadoPrevio,
    nuevoEstado: 'Reprogramado',
    fechaCambio: input.fechaCambio,
    horaCambio: input.horaCambio,
    observacionNuevo: input.observacionReprogramado ?? 'Reprogramación de turno en curso',
    cambiosExistentes: input.cambiosExistentes,
    historialExistente: input.historialExistente,
    createdAt: input.createdAt
  });

  const paso2 = aplicarCambioEstadoTurno({
    turnoId: input.turnoId,
    estadoActual: 'Reprogramado',
    nuevoEstado: input.estadoFinal,
    fechaCambio: input.fechaCambio,
    horaCambio: input.horaCambio,
    observacionNuevo: input.observacionFinal ?? null,
    cambiosExistentes: paso1.cambiosEstado,
    historialExistente: paso1.historialEstados,
    createdAt: input.createdAt
  });

  return {
    ...paso2,
    cambioCerrado: paso1.cambioCerrado
  };
};
