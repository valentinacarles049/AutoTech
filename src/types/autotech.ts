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
  vehicleCount: number;
  status: 'Activo' | 'Inactivo';
  fechaAlta?: string;
}

export type Cliente = Client;

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

// ==========================================
// 3. ESTADO TURNO (UML MVP: descripcionEstado - HU-09: 'Solicitado')
// ==========================================
export type TurnoEstadoNombre = 'Solicitado' | 'Pendiente' | 'Confirmado (24hs)' | 'Confirmado' | 'En Taller' | 'Cancelado';

export interface EstadoTurno {
  id: string;
  descripcionEstado: TurnoEstadoNombre;
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
// 4. TURNO (UML MVP: fechaHoraPropuesta, motivoConsulta, esEmergencia - HU-09)
// ==========================================
export interface Turno {
  id: string;
  nroTurno: number; // Número de turno correlativo generado por el sistema
  vehiculoDominio: string; // Relación 1..* con Vehículo (patente)
  clienteId?: string;
  clienteNombre?: string;
  clienteDocumento?: string;
  sucursal: string; // ej: "Centro"
  fecha: string; // ej: "15/11/2026"
  hora: string; // ej: "09:00"
  fechaHoraPropuesta: string;
  motivoConsulta: string;
  esEmergencia: boolean;
  estado: TurnoEstadoNombre;
  estadoTurnoId?: string; // Relación 1..1 con EstadoTurno
  presupuestoId?: string; // Relación 0..1 con Presupuesto
}

// ==========================================
// 5. PRESUPUESTO (UML MVP: nroPresupuesto, fechaEmision, montoEstimado, validezDias)
// ==========================================
export interface Presupuesto {
  id: string;
  nroPresupuesto: string;
  turnoId: string; // Relación 1..1 con Turno
  fechaEmision: string;
  montoEstimado: number;
  validezDias: number; // Ej: 7 días, 15 días
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
