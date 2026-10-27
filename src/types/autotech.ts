/**
 * AutoTech S.A. - Tipos de Datos del Dominio del Taller
 */

export type StatusGreen = 'Aprobado' | 'Activo' | 'Entregado';
export type StatusYellow = 'Pendiente' | 'En taller';
export type StatusGray = 'Cancelado' | 'Inactivo';

export type WorkshopStatus = StatusGreen | StatusYellow | StatusGray;

export interface Client {
  id: string;
  name: string;
  cuitDni: string;
  phone: string;
  email?: string;
  vehicleCount: number;
  status: 'Activo' | 'Inactivo';
}

export interface Vehicle {
  plate: string;
  brandModel: string;
  year: number;
  vin: string;
  mileage: number;
  clientId: string;
  status: WorkshopStatus;
}

export interface SparePartUsed {
  partSku: string;
  description: string;
  quantity: number;
}

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
  partsDeducted: SparePartUsed[];
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

export interface BudgetServiceItem {
  id: string;
  description: string;
  estimatedHours: number;
  hourlyRate: number;
  subtotal: number;
}
