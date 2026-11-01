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

let nextClientNumber = 1004;

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
  }
];

