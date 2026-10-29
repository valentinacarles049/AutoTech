import { RoleName } from '../types/autotech';
import { ScreenId } from '../context/WorkshopContext';

/**
 * HU-03: Restringir funciones según el rol del usuario
 * 
 * Roles (Actores oficiales del Diagrama de Casos de Uso):
 * 1. Responsable de Atención al Cliente -> Módulo Comercial (Clientes y Flotas)
 * 2. Responsable de Recepción -> Módulo de Recepción (Turnos y Presupuestos)
 * 3. Responsable de Reparación (mecánico) -> Operativa Taller (Mecánico y Bahías)
 * 4. Responsable de Taller (jefe de taller) -> Supervisión & Calidad y Dashboard General
 * 5. Responsable de Inventario -> Inventario y Red (Repuestos y Pañol)
 * 6. Administrador del sistema -> Acceso total a todas las funciones
 */
export const ROLE_PERMISSIONS: Record<RoleName, ScreenId[]> = {
  'Administrador del sistema': [
    'dashboard',
    'comercial',
    'recepcion',
    'operativa',
    'supervision',
    'inventario'
  ],
  'Responsable de Atención al Cliente': [
    'comercial'
  ],
  'Responsable de Recepción': [
    'recepcion'
  ],
  'Responsable de Reparación (mecánico)': [
    'operativa'
  ],
  'Responsable de Taller (jefe de taller)': [
    'dashboard',
    'supervision'
  ],
  'Responsable de Inventario': [
    'inventario'
  ]
};

/**
 * Retorna la lista de ScreenIds habilitadas para un determinado rol
 */
export const getAllowedScreens = (role?: string | null): ScreenId[] => {
  if (!role) return [];
  const normalized = role.trim().toLowerCase();

  // 1. Administrador del sistema (acceso total a todas las pantallas)
  if (normalized.includes('administrador') || normalized.includes('admin')) {
    return [
      'dashboard',
      'comercial',
      'recepcion',
      'operativa',
      'supervision',
      'inventario'
    ];
  }

  // 2. Responsable de Atención al Cliente
  if (normalized.includes('atención') || normalized.includes('atencion')) {
    return ['comercial'];
  }

  // 3. Responsable de Recepción
  if (normalized.includes('recepción') || normalized.includes('recepcion')) {
    return ['recepcion'];
  }

  // 4. Responsable de Reparación (mecánico)
  if (
    normalized.includes('reparación') || 
    normalized.includes('reparacion') || 
    normalized.includes('mecánico') || 
    normalized.includes('mecanico')
  ) {
    return ['operativa'];
  }

  // 5. Responsable de Taller (jefe de taller)
  if (normalized.includes('taller') || normalized.includes('jefe')) {
    return ['dashboard', 'supervision'];
  }

  // 6. Responsable de Inventario
  if (normalized.includes('inventario')) {
    return ['inventario'];
  }

  return [];
};

/**
 * Comprueba si una pantalla solicitada está permitida para el rol del usuario
 */
export const isScreenAllowed = (screen: ScreenId, role?: string | null): boolean => {
  const allowed = getAllowedScreens(role);
  return allowed.includes(screen);
};

/**
 * Obtiene la pantalla principal por defecto asignada para el rol del usuario
 */
export const getDefaultScreenForRole = (role?: string | null): ScreenId => {
  const allowed = getAllowedScreens(role);
  return allowed[0] || 'dashboard';
};
