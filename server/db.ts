import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConnected = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConnected
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Semilla local con contraseñas HASHEADAS con bcrypt (HU-01 Criterio 1)
// Sirve como fallback seguro si la base remota no está accesible o se ejecuta offline
const defaultHashedPassword = bcrypt.hashSync('password123', 8);
const adminHashedPassword = bcrypt.hashSync('admin123', 8);

export interface LocalEmployee {
  legajo: number;
  username: string;
  password: string; // Hash bcrypt
  nombre: string;
  rol: string;
  activo: boolean; // HU-01 Criterio 3
  ultimo_acceso: string | null; // HU-01 Criterio 2
}

export const localEmployeesSeed: LocalEmployee[] = [
  {
    legajo: 1001,
    username: 'valen.recepcion',
    password: defaultHashedPassword,
    nombre: 'Valentina Carles',
    rol: 'Responsable de Recepción',
    activo: true,
    ultimo_acceso: null
  },
  {
    legajo: 1002,
    username: 'carlos.atencion',
    password: defaultHashedPassword,
    nombre: 'Carlos Pérez',
    rol: 'Responsable de Atención al Cliente',
    activo: true,
    ultimo_acceso: null
  },
  {
    legajo: 1003,
    username: 'roberto.mecanico',
    password: defaultHashedPassword,
    nombre: 'Roberto Gómez',
    rol: 'Responsable de Reparación (mecánico)',
    activo: true,
    ultimo_acceso: null
  },
  {
    legajo: 1004,
    username: 'marcelo.jefe',
    password: defaultHashedPassword,
    nombre: 'Marcelo Fernández',
    rol: 'Responsable de Taller (jefe de taller)',
    activo: true,
    ultimo_acceso: null
  },
  {
    legajo: 1005,
    username: 'laura.inventario',
    password: defaultHashedPassword,
    nombre: 'Laura Benítez',
    rol: 'Responsable de Inventario',
    activo: true,
    ultimo_acceso: null
  },
  {
    legajo: 1000,
    username: 'admin',
    password: adminHashedPassword,
    nombre: 'Administrador General',
    rol: 'Administrador del sistema',
    activo: true,
    ultimo_acceso: null
  },
  {
    legajo: 1006,
    username: 'empleado.inactivo',
    password: defaultHashedPassword,
    nombre: 'Empleado Inactivo Test',
    rol: 'Responsable de Recepción',
    activo: false, // HU-01 Criterio 3: Inactivo
    ultimo_acceso: null
  }
];

// ============================================================
// Semilla Local de Clientes (HU-04: Registrar Cliente)
// ============================================================
export interface LocalClient {
  id: string;
  nro_cliente: number;
  nombre: string;
  apellido: string;
  tipo_documento: 'DNI' | 'CUIT' | 'Pasaporte';
  nro_documento: string;
  razon_social?: string | null;
  email: string;
  telefono: string;
  localidad?: string | null;
  nivel_fidelizacion: string | null;
  fecha_alta: string;
  estado: string;
}

let nextClientNumber = 1005;

export const getNextClientNumber = (): number => {
  return nextClientNumber++;
};

export const localClientsSeed: LocalClient[] = [
  {
    id: 'cli-1',
    nro_cliente: 1001,
    nombre: 'Transportes',
    apellido: 'Rápido',
    tipo_documento: 'CUIT',
    nro_documento: '30-71234567-9',
    razon_social: 'Transportes Rápido S.R.L.',
    email: 'contacto@transportesrapido.com.ar',
    telefono: '0351-4889900',
    localidad: 'Córdoba Capital',
    nivel_fidelizacion: null, // Queda sin nivel de fidelización asignado
    fecha_alta: '2026-01-10',
    estado: 'Activo'
  },
  {
    id: 'cli-2',
    nro_cliente: 1002,
    nombre: 'Agropecuaria',
    apellido: 'El Ombú',
    tipo_documento: 'CUIT',
    nro_documento: '30-68994123-4',
    razon_social: 'Agropecuaria El Ombú',
    email: 'administracion@elombu.com.ar',
    telefono: '0353-4123456',
    localidad: 'Villa María',
    nivel_fidelizacion: null,
    fecha_alta: '2026-01-15',
    estado: 'Activo'
  },
  {
    id: 'cli-3',
    nro_cliente: 1003,
    nombre: 'Esteban',
    apellido: 'Morales',
    tipo_documento: 'DNI',
    nro_documento: '20-33445566-8',
    razon_social: null,
    email: 'esteban.morales@gmail.com',
    telefono: '0351-155987654',
    localidad: 'Córdoba Capital',
    nivel_fidelizacion: null,
    fecha_alta: '2026-02-01',
    estado: 'Activo'
  },
  {
    id: 'cli-6',
    nro_cliente: 1004,
    nombre: 'Carlos',
    apellido: 'Morales',
    tipo_documento: 'DNI',
    nro_documento: '20-40111222-3',
    razon_social: null,
    email: 'carlos.morales@hotmail.com',
    telefono: '0351-4112233',
    localidad: 'Córdoba Capital',
    nivel_fidelizacion: null,
    fecha_alta: '2026-02-05',
    estado: 'Activo'
  },
  {
    id: 'cli-juan-perez',
    nro_cliente: 1005,
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    nro_documento: '30123456',
    razon_social: null,
    email: 'juan.perez@gmail.com',
    telefono: '0351-154987654',
    localidad: 'Córdoba Capital',
    nivel_fidelizacion: null,
    fecha_alta: '2026-02-10',
    estado: 'Activo'
  }
];

// ============================================================
// Semilla Local de Vehículos (HU-06: Registrar Vehículo)
// ============================================================
export interface LocalVehicle {
  dominio: string; // Patente única (ej: AF-123-ZZ)
  cliente_id: string; // ID del cliente asociado
  marca: string;
  modelo: string;
  anio: number;
  kilometraje_actual: number;
  estado: string;
}

export const localVehiclesSeed: LocalVehicle[] = [
  { dominio: 'AF-123-ZZ', cliente_id: 'cli-1', marca: 'Toyota', modelo: 'Hilux 2.8 D-4D', anio: 2022, kilometraje_actual: 64200, estado: 'En taller' },
  { dominio: 'AE-456-CC', cliente_id: 'cli-1', marca: 'Mercedes-Benz', modelo: 'Sprinter 516', anio: 2021, kilometraje_actual: 112500, estado: 'Aprobado' },
  { dominio: 'AC-789-DD', cliente_id: 'cli-1', marca: 'Volkswagen', modelo: 'Amarok V6 3.0', anio: 2020, kilometraje_actual: 89000, estado: 'Activo' },
  { dominio: 'AD-991-LK', cliente_id: 'cli-2', marca: 'Ford', modelo: 'Ranger 3.2 TDCi Limited', anio: 2019, kilometraje_actual: 104000, estado: 'Activo' },
  { dominio: 'AD-332-LM', cliente_id: 'cli-3', marca: 'Ford', modelo: 'Ranger 3.2 TDCi XLT', anio: 2019, kilometraje_actual: 98400, estado: 'En taller' },
  { dominio: 'AD-884-XY', cliente_id: 'cli-6', marca: 'Chevrolet', modelo: 'S10 2.8 CTDI', anio: 2021, kilometraje_actual: 78000, estado: 'Activo' },
  { dominio: 'AB123CD', cliente_id: 'cli-juan-perez', marca: 'Toyota', modelo: 'Corolla 2.0 SEG', anio: 2022, kilometraje_actual: 45000, estado: 'Activo' }
];

// ============================================================
// Sucursales y Turnos (HU-09: Registrar Solicitud de Turno)
// ============================================================
export interface LocalSucursal {
  id: number;
  nombre: string;
  direccion: string;
  horario_apertura: string; // ej: "08:00"
  horario_cierre: string;   // ej: "17:00"
}

export const localSucursalesSeed: LocalSucursal[] = [
  { id: 1, nombre: 'Centro', direccion: 'Av. Colón 750, Córdoba', horario_apertura: '08:00', horario_cierre: '17:00' },
  { id: 2, nombre: 'Norte', direccion: 'Av. Rafael Núñez 4200, Córdoba', horario_apertura: '08:00', horario_cierre: '18:00' },
  { id: 3, nombre: 'Sur', direccion: 'Av. Vélez Sársfield 3100, Córdoba', horario_apertura: '08:00', horario_cierre: '17:00' }
];

export interface LocalTurno {
  id: string;
  nro_turno: number;
  vehiculo_dominio: string;
  cliente_id?: string;
  cliente_nombre?: string;
  cliente_documento?: string;
  sucursal: string;
  fecha: string; // formato "YYYY-MM-DD" o normalizado
  hora: string;  // formato "HH:mm"
  motivo_consulta: string;
  estado: 'Solicitado' | 'Pendiente de Confirmación (24hs)' | 'Confirmado' | 'En Taller' | 'Cancelado';
  es_emergencia?: boolean;
  created_at?: string;
}

let nextTurnoNumber = 1001;

export const getNextTurnoNumber = (): number => {
  return nextTurnoNumber++;
};

export const resetTurnoCounter = (val: number = 1001): void => {
  nextTurnoNumber = val;
};

export const localTurnosSeed: LocalTurno[] = [];


