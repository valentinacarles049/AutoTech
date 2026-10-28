/**
 * AutoTech S.A. - Tipos de Dominio alineados al Modelo UML (MVP)
 */

export type StatusGreen = 'Aprobado' | 'Activo' | 'Entregado';
export type StatusYellow = 'Pendiente' | 'En taller';
export type StatusGray = 'Cancelado' | 'Inactivo';
export type WorkshopStatus = StatusGreen | StatusYellow | StatusGray;

// ==========================================
// 1. CLIENTE (UML MVP: nroDoc, tipoDoc, razonSocial, email, telefono, fechaAlta)
// ==========================================
export interface Client {
  id: string;
  name: string;
  cuitDni: string;
  phone: string;
  email?: string;
  vehicleCount: number;
  status: 'Activo' | 'Inactivo';

  // Atributos UML Oficiales MVP
  razonSocial?: string;
  tipoDocumento?: 'DNI' | 'CUIT' | 'Pasaporte';
  nroDocumento?: string;
  telefono?: string;
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
// 3. ESTADO TURNO (UML MVP: descripcionEstado)
// ==========================================
export interface EstadoTurno {
  id: string;
  descripcionEstado: 'Pendiente' | 'Confirmado (24hs)' | 'En Taller' | 'Cancelado';
}

// ==========================================
// 4. TURNO (UML MVP: fechaHoraPropuesta, motivoConsulta, esEmergencia)
// ==========================================
export interface Turno {
  id: string;
  vehiculoDominio: string; // Relación 1..* con Vehículo
  fechaHoraPropuesta: string;
  motivoConsulta: string;
  esEmergencia: boolean;
  estadoTurnoId: string; // Relación 1..1 con EstadoTurno
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
