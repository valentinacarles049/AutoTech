/**
 * AutoTech S.A. - Tipos de Dominio alineados al Modelo UML (MVP)
 */

export type StatusGreen = 'Aprobado' | 'Activo' | 'Entregado';
export type StatusYellow = 'Pendiente' | 'En taller';
export type StatusGray = 'Cancelado' | 'Inactivo';
export type WorkshopStatus = StatusGreen | StatusYellow | StatusGray;

// ==========================================
// 1. CLIENTE (UML MVP & HU-04: Registrar Cliente)
// ==========================================
export interface Client {
  id: string;
  nroCliente?: number; // Número de cliente generado por el sistema
  nombre: string; // Obligatorio
  apellido: string; // Obligatorio
  name: string; // Nombre completo o Razón Social para display
  tipoDocumento: 'DNI' | 'CUIT' | 'Pasaporte'; // Obligatorio
  nroDocumento: string; // Obligatorio
  cuitDni: string; // Compatibilidad de búsqueda
  email: string; // Obligatorio, formato válido
  phone: string; // Obligatorio
  telefono?: string;
  razonSocial?: string; // Opcional (clientes empresa)
  localidad?: string; // Localidad
  nivelFidelizacion?: string | null; // Queda sin nivel de fidelización asignado (null)
  descuentoFidelizacion?: number; // Porcentaje de descuento de fidelización (ej: 10 para 10%)
  vehicleCount: number;
  status: 'Activo' | 'Inactivo';
  fechaAlta?: string;
}

export type Cliente = Client;

// HU-06: Modificar Cliente
export interface UpdateClientPayload {
  nombre?: string;
  apellido?: string;
  tipoDocumento?: 'DNI' | 'CUIT' | 'Pasaporte';
  nroDocumento?: string;
  cuitDni?: string;
  email?: string;
  phone?: string;
  telefono?: string;
  razonSocial?: string;
  localidad?: string;
}

export interface UpdateClientResult {
  success: boolean;
  error?: string;
  message?: string;
  client?: Client;
}

// ==========================================
// 2. VEHÍCULO (UML MVP: dominio, marca, modelo, año, kilometrajeActual)
// ==========================================
export interface Vehicle {
  plate: string;
  brandModel: string;
  year: number;
  vin: string;
  mileage: number;
  clientId: string;
  status: WorkshopStatus;

  // Atributos UML Oficiales MVP
  dominio?: string;
  marca?: string;
  modelo?: string;
  año?: number;
  kilometrajeActual?: number;
  clienteId?: string;
}

export type Vehiculo = Vehicle;

// HU-08: Modificar Vehículo
export interface UpdateVehiclePayload {
  patenteOriginal?: string;
  plate?: string;
  dominio?: string;
  mileage?: number;
  kilometraje?: number;
  kilometrajeActual?: number;
  marca?: string;
  modelo?: string;
  brandModel?: string;
  year?: number;
  año?: number;
  anio?: number;
}

export interface UpdateVehicleResult {
  success: boolean;
  error?: string;
  message?: string;
  vehicle?: Vehicle;
}

// ==========================================
// 3. ESTADO TURNO (UML MVP: descripcionEstado - HU-09: 'Solicitado')
// ==========================================
export type TurnoEstadoNombre = 'Solicitado' | 'Pendiente' | 'Pendiente de Confirmación (24hs)' | 'Confirmado (24hs)' | 'Confirmado' | 'Reprogramado' | 'En Taller' | 'Cancelado' | 'Finalizado' | 'Ausente';

export interface EstadoTurno {
  id: string;
  descripcionEstado: TurnoEstadoNombre;
}

// ==========================================
// ==========================================
// 3.0 CAMBIO ESTADO TURNO (UML MODP - HU-09, HU-11, HU-12, HU-13, HU-15)
// ==========================================
export interface CambioEstadoTurno {
  id: string;
  turnoId?: string;
  turno_id?: string;
  estado: TurnoEstadoNombre | string;
  estadoTurnoId?: number;
  estado_turno_id?: number;
  fechaInicio: string; // formato "DD/MM/YYYY"
  fecha_inicio: string; // formato "DD/MM/YYYY"
  horaInicio: string; // formato "HH:mm"
  hora_inicio: string; // formato "HH:mm"
  fechaFin: string | null; // formato "DD/MM/YYYY" o null si es el estado vigente
  fecha_fin: string | null; // formato "DD/MM/YYYY" o null si es el estado vigente
  horaFin: string | null; // formato "HH:mm" o null si es el estado vigente
  hora_fin: string | null; // formato "HH:mm" o null si es el estado vigente
  observacion?: string | null;
}

// ==========================================
// 3.1 SUCURSAL (HU-09: Registrar solicitud de turno)
// ==========================================
export interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  horarioApertura: string;
  horarioCierre: string;
}

// ==========================================
// 3.2 DISPONIBILIDAD HORARIA (HU-10: Consultar disponibilidad horaria)
// ==========================================
export interface HorarioOcupado {
  hora: string;
  estado: string;
}

export interface DisponibilidadHorariaResult {
  sucursal: string;
  direccion?: string;
  horarioAtencion: string;
  fecha: string;
  fechaIso?: string;
  totalHorarios: number;
  tieneDisponibilidad: boolean;
  mensaje: string;
  horariosDisponibles: string[];
  horariosLibres: string[];
  horariosOcupados: HorarioOcupado[];
}

// ==========================================
// 4. TURNO (UML MVP: fechaHoraPropuesta, motivoConsulta, esEmergencia - HU-09 & HU-11)
// ==========================================
export interface Turno {
  id: string;
  nroTurno: number; // Número de turno correlativo generado por el sistema
  vehiculoDominio: string; // Relación 1..* con Vehículo (patente)
  patente?: string; // Alias para listado HU-12
  clienteId?: string;
  clienteNombre?: string;
  cliente?: string; // Alias para listado HU-12
  clienteDocumento?: string;
  sucursal: string; // ej: "Centro"
  fecha: string; // ej: "15/11/2026"
  hora: string; // ej: "09:00"
  fechaHoraPropuesta: string;
  motivoConsulta: string;
  motivo?: string; // Alias para listado HU-12
  esEmergencia: boolean;
  estado: TurnoEstadoNombre;
  estadoTurnoId?: string; // Relación 1..1 con EstadoTurno
  presupuestoId?: string; // Relación 0..1 con Presupuesto
  // HU-11: Confirmar turno
  fechaConfirmacion?: string | null;
  horaConfirmacion?: string | null;
  medioConfirmacion?: 'Mail' | 'Mensaje' | string | null;
  notificacionEnviada?: boolean;
  notificacionCliente?: {
    enviada: boolean;
    fechaTurno?: string;
    horaTurno?: string;
    fecha_turno?: string;
    hora_turno?: string;
    medio: string;
    destinatario?: string;
    mensaje: string;
  } | null;
  // HU-12: Cancelar turno
  motivoCancelacion?: string | null;
  fechaCancelacion?: string | null;
  horaCancelacion?: string | null;
  canceladoPor?: string | null;
  // HU-13: Modificar turno
  historialEstados?: string[];
  historial_estados?: string[];
  cambiosEstado?: CambioEstadoTurno[];
  cambios_estado?: CambioEstadoTurno[];
  fechaModificacion?: string | null;
  horaModificacion?: string | null;
  // HU-15: Finalizar turno (registrar presentación del vehículo)
  presupuestoHabilitado?: boolean;
  vehiculoPresentado?: boolean;
  fechaFinalizacion?: string | null;
}

// HU-12: Consultar turnos por estado y fecha
export interface FiltroTurnosParams {
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  sucursal?: string;
  ordenarPorFechaHora?: boolean;
  ordenDireccion?: 'asc' | 'desc';
}

export interface ConsultarTurnosResult {
  turnos: Turno[];
  total: number;
  mensaje: string;
}

export interface ConfirmarTurnoPayload {
  turnoId?: string;
  nroTurno?: number;
  vehiculoDominio?: string;
  clienteDni?: string;
  medio: 'Mail' | 'Mensaje' | string;
  fechaHoraActual?: string;
}

export interface ConfirmarTurnoResult {
  success: boolean;
  message: string;
  error?: string;
  estado?: string;
  turno?: Turno;
  horasRestantes?: number;
  fechaConfirmacion?: string | null;
  horaConfirmacion?: string | null;
  medioConfirmacion?: string | null;
  cambiosEstado?: CambioEstadoTurno[];
  cambios_estado?: CambioEstadoTurno[];
  cambioEstadoCerrado?: CambioEstadoTurno;
  cambio_estado_cerrado?: CambioEstadoTurno;
  cambioEstadoActual?: CambioEstadoTurno;
  cambio_estado_actual?: CambioEstadoTurno;
  historialEstados?: string[];
  historial_estados?: string[];
  notificacion?: {
    enviada: boolean;
    fechaTurno?: string;
    horaTurno?: string;
    fecha_turno?: string;
    hora_turno?: string;
    medio: string;
    destinatario?: string;
    mensaje: string;
  };
}

// HU-12: Cancelar turno
export interface CancelarTurnoPayload {
  turnoId?: string;
  nroTurno?: number;
  patente?: string;
  vehiculoDominio?: string;
  clienteNombre?: string;
  fecha?: string;
  hora?: string;
  motivo: string;
  canceladoPor?: string;
  fechaHoraActual?: string;
}

export interface CancelarTurnoResult {
  success: boolean;
  message: string;
  error?: string;
  estado?: string;
  motivoCancelacion?: string;
  cambiosEstado?: CambioEstadoTurno[];
  cambios_estado?: CambioEstadoTurno[];
  historialEstados?: string[];
  historial_estados?: string[];
  turno?: Turno;
  horarioLiberado?: {
    sucursal: string;
    fecha: string;
    hora: string;
    disponible: boolean;
  };
}

// HU-13: Modificar turno
export interface ModificarTurnoPayload {
  turnoId?: string;
  nroTurno?: number;
  patente?: string;
  vehiculoDominio?: string;
  clienteNombre?: string;
  fechaActual?: string;
  horaActual?: string;
  nuevaFecha: string;
  nuevoHorario: string;
  nuevaSucursal?: string;
  fechaHoraActual?: string;
}

export interface ModificarTurnoResult {
  success: boolean;
  message: string;
  error?: string;
  turno?: Turno;
  fecha?: string;
  hora?: string;
  estado?: string;
  historialEstados?: string[];
  historial_estados?: string[];
  cambiosEstado?: CambioEstadoTurno[];
  cambios_estado?: CambioEstadoTurno[];
  horarioAnteriorLiberado?: {
    sucursal: string;
    fecha: string;
    hora: string;
    disponible: boolean;
  };
}

// HU-15: Finalizar turno (registrar presentación del vehículo)
export interface FinalizarTurnoPayload {
  turnoId?: string;
  nroTurno?: number;
  vehiculoDominio?: string;
  patente?: string;
  fechaActual?: string;
  horaActual?: string;
  vehiculoPresentado?: boolean;
}

export interface FinalizarTurnoResult {
  success: boolean;
  message: string;
  error?: string;
  estado?: TurnoEstadoNombre;
  presupuestoHabilitado?: boolean;
  presupuesto_habilitado?: boolean;
  cambiosEstado?: CambioEstadoTurno[];
  cambios_estado?: CambioEstadoTurno[];
  historialEstados?: string[];
  historial_estados?: string[];
  turno?: Turno;
}

// ==========================================
// 5. PRESUPUESTO Y DETALLE PRESUPUESTO (UML MODP & HU-19: Registrar presupuesto de reparación)
// ==========================================
export type PresupuestoEstadoNombre = 'Emitido' | 'Vencido' | 'Aprobado' | 'Rechazado';

// Clase DetallePresupuesto del MODP (descripción, cantidad, precio unitario y subtotal)
export interface DetallePresupuesto {
  id?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  precio_unitario?: number;
  subtotal: number;
}

export interface Presupuesto {
  id: string;
  nroPresupuesto: string;
  nro_presupuesto?: string;
  turnoId: string; // Relación 1..1 con Turno
  turno_id?: string;
  vehiculoDominio?: string;
  clienteId?: string;
  clienteNombre?: string;
  fechaEmision: string; // ej: "15/11/2026"
  fecha_emision?: string;
  montoEstimado: number;
  validezDias: number; // Ej: 15 días (HU-19 Criterio 3)
  validez_dias?: number;
  items: DetallePresupuesto[];
  subtotal: number; // Suma de los subtotales de cada ítem
  descuentoPorcentaje: number; // Descuento de fidelización del cliente (ej: 10 para 10%)
  descuento: number; // Monto descontado (ej: 5900)
  descuentoMonto?: number;
  total: number; // subtotal - descuento (ej: 53100)
  estado: PresupuestoEstadoNombre; // 'Emitido' | 'Vencido' | 'Aprobado' | 'Rechazado'
  respuestaCliente?: string | null;
  puedeModificarse: boolean;
  puede_modificarse?: boolean;
}

export interface RegistrarPresupuestoItemInput {
  descripcion: string;
  cantidad: number;
  precioUnitario?: number;
  precio_unitario?: number;
}

export interface RegistrarPresupuestoPayload {
  turnoId?: string;
  turno_id?: string;
  vehiculoDominio?: string;
  patente?: string;
  clienteNombre?: string;
  descuentoFidelizacionPorcentaje?: number;
  descuento_fidelizacion?: number;
  validezDias: number;
  validez_dias?: number;
  fechaEmision?: string;
  fecha_emision?: string;
  items: RegistrarPresupuestoItemInput[];
}

export interface ModificarPresupuestoPayload {
  presupuestoId?: string;
  presupuesto_id?: string;
  turnoId?: string;
  turno_id?: string;
  validezDias?: number;
  validez_dias?: number;
  descuentoFidelizacionPorcentaje?: number;
  fechaActual?: string;
  items: RegistrarPresupuestoItemInput[];
}

export interface VerificarVencimientoPresupuestoPayload {
  presupuestoId?: string;
  presupuesto_id?: string;
  turnoId?: string;
  turno_id?: string;
  fechaActual: string; // ej: "01/12/2026"
  respuestaCliente?: string | null;
}

export interface RegistrarPresupuestoResult {
  success: boolean;
  message: string;
  error?: string;
  presupuesto?: Presupuesto;
  estado?: PresupuestoEstadoNombre;
  subtotal?: number;
  descuento?: number;
  total?: number;
  puedeModificarse?: boolean;
  puede_modificarse?: boolean;
}

// ==========================================
// 6. ROL (UML: Rol / Actores del Diagrama de Casos de Uso)
// ==========================================
export type RoleName = 
  | 'Responsable de Atención al Cliente'
  | 'Responsable de Recepción'
  | 'Responsable de Reparación (mecánico)'
  | 'Responsable de Taller (jefe de taller)'
  | 'Responsable de Inventario'
  | 'Administrador del sistema';

export interface Rol {
  id: number;
  nombreRol: RoleName | string;
  descripcion?: string;
}

// ==========================================
// 7. EMPLEADO (UML: Empleado - legajo, username, password, nombre, rol)
// ==========================================
export interface Empleado {
  legajo: number;
  username: string;
  password?: string;
  nombre: string;
  rol: RoleName | string;
  rolId?: number;
  activo?: boolean;
  ultimoAcceso?: string | null;
}

export interface BudgetServiceItem {
  id: string;
  description: string;
  estimatedHours: number;
  hourlyRate: number;
  subtotal: number;
}

// ==========================================
// Entidades de Fases Posteriores (Post-MVP)
// ==========================================
export interface WorkOrder {
  id: string;
  otNumber: string;
  vehiclePlate: string;
  vehicleModel: string;
  clientName: string;
  technicianName: string;
  bayNumber: string;
  mainTask: string;
  hoursWorked: number;
  partsDeducted: { partSku: string; description: string; quantity: number }[];
  status: WorkshopStatus;
  qualityChecklist?: {
    totalItems: number;
    passedItems: number;
    obdClean: boolean;
    roadTestRequired: boolean;
  };
}

export interface SparePartItem {
  sku: string;
  description: string;
  category: 'Filtros & Aceites' | 'Frenos & Discos' | 'Distribución & Motor' | 'Suspensión & Dirección' | 'Fluidos';
  currentStock: number;
  minStock: number;
  location: string;
  unitPrice: number;
  status: WorkshopStatus;
}
