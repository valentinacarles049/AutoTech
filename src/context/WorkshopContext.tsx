import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Vehicle, WorkOrder, SparePartItem, BudgetServiceItem, Empleado, RoleName, Turno, Sucursal, DisponibilidadHorariaResult } from '../types/autotech';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getDefaultScreenForRole, isScreenAllowed } from '../utils/permissions';

export type ScreenId = 'dashboard' | 'comercial' | 'nuevo-cliente' | 'recepcion' | 'operativa' | 'supervision' | 'inventario';

// Función para sincronizar la pantalla con la URL del navegador (HU-03 Criterio 2)
const getScreenFromUrl = (): ScreenId | null => {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/^\/+/, '').toLowerCase();
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  const validScreens: ScreenId[] = ['dashboard', 'comercial', 'nuevo-cliente', 'recepcion', 'operativa', 'supervision', 'inventario'];

  if (validScreens.includes(path as ScreenId)) return path as ScreenId;
  if (validScreens.includes(hash as ScreenId)) return hash as ScreenId;
  return null;
};

export interface User {
  legajo: number;
  username: string;
  name: string;
  role: RoleName | string;
  avatar: string;
  email: string;
  ultimoAcceso?: string | null;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

export const initialEmployees: Empleado[] = [
  {
    legajo: 1001,
    username: 'valen.recepcion',
    password: 'password123',
    nombre: 'Valentina Carles',
    rol: 'Responsable de Recepción',
    activo: true,
  },
  {
    legajo: 1002,
    username: 'carlos.atencion',
    password: 'password123',
    nombre: 'Carlos Pérez',
    rol: 'Responsable de Atención al Cliente',
    activo: true,
  },
  {
    legajo: 1003,
    username: 'roberto.mecanico',
    password: 'password123',
    nombre: 'Roberto Gómez',
    rol: 'Responsable de Reparación (mecánico)',
    activo: true,
  },
  {
    legajo: 1004,
    username: 'marcelo.jefe',
    password: 'password123',
    nombre: 'Marcelo Fernández',
    rol: 'Responsable de Taller (jefe de taller)',
    activo: true,
  },
  {
    legajo: 1005,
    username: 'laura.inventario',
    password: 'password123',
    nombre: 'Laura Benítez',
    rol: 'Responsable de Inventario',
    activo: true,
  },
  {
    legajo: 1000,
    username: 'admin',
    password: 'admin123',
    nombre: 'Administrador General',
    rol: 'Administrador del sistema',
    activo: true,
  },
  {
    legajo: 1006,
    username: 'empleado.inactivo',
    password: 'password123',
    nombre: 'Empleado Inactivo Test',
    rol: 'Responsable de Recepción',
    activo: false,
  },
];

const getInitials = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0]?.substring(0, 2).toUpperCase() || 'AT';
};

interface WorkshopContextType {
  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Auth & Empleados
  isAuthenticated: boolean;
  user: User | null;
  employees: Empleado[];
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;

  // Navigation
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;

  // Comercial (Clients & Vehicles)
  clients: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'vehicleCount' | 'status'>) => Promise<{ success: boolean; error?: string; message?: string; client?: Client }>;
  updateClient: (id: string, updatedData: {
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
  }) => Promise<{ success: boolean; error?: string; message?: string; client?: Client }>;
  vehicles: Vehicle[];
  addVehicle: (vehicle: {
    plate: string;
    marca?: string;
    modelo?: string;
    brandModel?: string;
    year: number;
    clientId: string;
    mileage?: number;
    vin?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string; vehicle?: Vehicle }>;

  // Operativa (Work Orders & Mechanic MVP)
  workOrders: WorkOrder[];
  updateOrderHours: (orderId: string, hours: number) => void;
  deductPartFromPañol: (orderId: string, sku: string, quantity: number) => void;
  approveOrder: (orderId: string) => void;
  rejectOrder: (orderId: string) => void;

  // Inventario
  inventory: SparePartItem[];
  purchaseRequestSuccess: boolean;
  createPurchaseRequest: (sku: string, qty: number) => void;

  // Recepción (Budget & Turnos - HU-09)
  budgetServices: BudgetServiceItem[];
  addBudgetService: (service: Omit<BudgetServiceItem, 'id' | 'subtotal'>) => void;
  removeBudgetService: (id: string) => void;
  updateBudgetService: (id: string, hours: number, rate: number) => void;
  selectedReceptionClient: string;
  setSelectedReceptionClient: (c: string) => void;
  selectedReceptionVehicle: string;
  setSelectedReceptionVehicle: (v: string) => void;
  selectVehicleForReception: (plate: string) => void;
  mileageEntry: number;
  setMileageEntry: (m: number) => void;

  // HU-09: Registrar solicitud de turno
  turnos: Turno[];
  sucursales: Sucursal[];
  getAvailableHours: (sucursalNombre: string, fecha: string) => string[];
  consultarDisponibilidad: (sucursalNombre: string, fecha: string) => Promise<DisponibilidadHorariaResult>;
  registerTurno: (data: {
    clienteDni: string;
    clienteNombre?: string;
    vehiculoDominio: string;
    motivoConsulta: string;
    sucursal: string;
    fecha: string;
    hora: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
    nroTurno?: number;
    turno?: Turno;
  }>;
}

export const defaultSucursales: Sucursal[] = [
  { id: 1, nombre: 'Centro', direccion: 'Av. Colón 750, Córdoba', horarioApertura: '08:00', horarioCierre: '17:00' },
  { id: 2, nombre: 'Norte', direccion: 'Av. Rafael Núñez 4200, Córdoba', horarioApertura: '08:00', horarioCierre: '18:00' },
  { id: 3, nombre: 'Sur', direccion: 'Av. Vélez Sársfield 3100, Córdoba', horarioApertura: '08:00', horarioCierre: '17:00' }
];

const initialClients: Client[] = [
  {
    id: 'cli-1',
    nroCliente: 1001,
    nombre: 'Transportes',
    apellido: 'Rápido',
    name: 'Transportes Rápido S.R.L.',
    razonSocial: 'Transportes Rápido S.R.L.',
    tipoDocumento: 'CUIT',
    nroDocumento: '30-71234567-9',
    cuitDni: '30-71234567-9',
    email: 'contacto@transportesrapido.com.ar',
    phone: '0351-4889900',
    localidad: 'Córdoba Capital',
    nivelFidelizacion: null, // Queda sin nivel de fidelización asignado
    vehicleCount: 8,
    status: 'Activo'
  },
  {
    id: 'cli-2',
    nroCliente: 1002,
    nombre: 'Agropecuaria',
    apellido: 'El Ombú',
    name: 'Agropecuaria El Ombú',
    razonSocial: 'Agropecuaria El Ombú',
    tipoDocumento: 'CUIT',
    nroDocumento: '30-68994123-4',
    cuitDni: '30-68994123-4',
    email: 'administracion@elombu.com.ar',
    phone: '0353-4123456',
    localidad: 'Villa María',
    nivelFidelizacion: null,
    vehicleCount: 4,
    status: 'Activo'
  },
  {
    id: 'cli-3',
    nroCliente: 1003,
    nombre: 'Esteban',
    apellido: 'Morales',
    name: 'Esteban Morales',
    tipoDocumento: 'DNI',
    nroDocumento: '20-33445566-8',
    cuitDni: '20-33445566-8',
    email: 'esteban.morales@gmail.com',
    phone: '0351-155987654',
    localidad: 'Córdoba Capital',
    nivelFidelizacion: null,
    vehicleCount: 1,
    status: 'Activo'
  },
  {
    id: 'cli-4',
    nroCliente: 1004,
    nombre: 'Logística',
    apellido: 'Centro',
    name: 'Logística Centro S.A.',
    razonSocial: 'Logística Centro S.A.',
    tipoDocumento: 'CUIT',
    nroDocumento: '30-55443322-1',
    cuitDni: '30-55443322-1',
    email: 'logistica@centro.com.ar',
    phone: '0351-4771122',
    localidad: 'Córdoba Capital',
    nivelFidelizacion: null,
    vehicleCount: 12,
    status: 'Activo'
  },
  {
    id: 'cli-5',
    nroCliente: 1005,
    nombre: 'Distribuidora',
    apellido: 'Norte',
    name: 'Distribuidora Norte S.A.',
    razonSocial: 'Distribuidora Norte S.A.',
    tipoDocumento: 'CUIT',
    nroDocumento: '30-44998877-3',
    cuitDni: '30-44998877-3',
    email: 'ventas@distribuidoranorte.com.ar',
    phone: '0351-4990033',
    localidad: 'Río Cuarto',
    nivelFidelizacion: null,
    vehicleCount: 0,
    status: 'Inactivo'
  },
  {
    id: 'cli-6',
    nroCliente: 1006,
    nombre: 'Carlos',
    apellido: 'Morales',
    name: 'Carlos Morales',
    tipoDocumento: 'DNI',
    nroDocumento: '20-40111222-3',
    cuitDni: '20-40111222-3',
    email: 'carlos.morales@hotmail.com',
    phone: '0351-4112233',
    localidad: 'Córdoba Capital',
    nivelFidelizacion: null,
    vehicleCount: 1,
    status: 'Activo'
  },
  {
    id: 'cli-juan-perez',
    nroCliente: 1007,
    nombre: 'Juan',
    apellido: 'Pérez',
    name: 'Juan Pérez',
    tipoDocumento: 'DNI',
    nroDocumento: '30123456',
    cuitDni: '30123456',
    email: 'juan.perez@gmail.com',
    phone: '0351-154987654',
    localidad: 'Córdoba Capital',
    nivelFidelizacion: null,
    vehicleCount: 1,
    status: 'Activo'
  },
  {
    id: 'cli-maria-gomez',
    nroCliente: 1008,
    nombre: 'María',
    apellido: 'Gómez',
    name: 'María Gómez',
    tipoDocumento: 'DNI',
    nroDocumento: '28999888',
    cuitDni: '28999888',
    email: 'maria.gomez@gmail.com',
    phone: '0351-156112233',
    telefono: '0351-156112233',
    localidad: 'Córdoba Capital',
    nivelFidelizacion: null,
    vehicleCount: 0,
    status: 'Activo'
  },
];

const initialVehicles: Vehicle[] = [
  { plate: 'AF-123-ZZ', brandModel: 'Toyota Hilux 2.8 D-4D', year: 2022, vin: '8AJBA3CD4N0198273', mileage: 64200, clientId: 'cli-1', status: 'En taller' },
  { plate: 'AE-456-CC', brandModel: 'Mercedes-Benz Sprinter 516', year: 2021, vin: '8AC906653ME982314', mileage: 112500, clientId: 'cli-1', status: 'Aprobado' },
  { plate: 'AC-789-DD', brandModel: 'Volkswagen Amarok V6 3.0', year: 2020, vin: '8AWDB42H2LA091244', mileage: 89000, clientId: 'cli-1', status: 'Activo' },
  { plate: 'AD-991-LK', brandModel: 'Ford Ranger 3.2 TDCi Limited', year: 2019, vin: '8AFAR2341KA098123', mileage: 104000, clientId: 'cli-2', status: 'Activo' },
  { plate: 'AD-332-LM', brandModel: 'Ford Ranger 3.2 TDCi XLT', year: 2019, vin: '8AFAR3312KA098124', mileage: 98400, clientId: 'cli-3', status: 'En taller' },
  { plate: 'AD-884-XY', brandModel: 'Chevrolet S10 2.8 CTDI', year: 2021, vin: '8AGBA3CD4N0981921', mileage: 78000, clientId: 'cli-6', status: 'Activo' },
  { 
    plate: 'AB123CD', 
    dominio: 'AB123CD', 
    brandModel: 'Toyota Corolla 2.0 SEG', 
    marca: 'Toyota', 
    modelo: 'Corolla 2.0 SEG', 
    year: 2022, 
    año: 2022, 
    vin: '8AJBA45CD3N0198274', 
    mileage: 45000, 
    kilometrajeActual: 45000, 
    clientId: 'cli-juan-perez', 
    clienteId: 'cli-juan-perez', 
    status: 'Activo' 
  },
];

const initialWorkOrders: WorkOrder[] = [
  {
    id: 'ot-1',
    otNumber: 'OT-2026-0842',
    vehiclePlate: 'AF-123-ZZ',
    vehicleModel: 'Toyota Hilux 2.8 D-4D',
    clientName: 'Transportes Rápido S.R.L.',
    technicianName: 'Roberto Gómez',
    bayNumber: 'Bahía #3 • Elevador 4TN',
    mainTask: 'Diagnóstico y reemplazo de Kit de Distribución + Bomba de Agua + Correa Poli-V.',
    hoursWorked: 3.5,
    partsDeducted: [
      { partSku: 'KIT-DIST-HILUX-28', description: 'Kit de Distribución Completo Hilux 2.8', quantity: 1 },
      { partSku: 'BOMB-AG-HIL', description: 'Bomba de Agua GMB Reforzada', quantity: 1 }
    ],
    status: 'En taller',
    qualityChecklist: {
      totalItems: 8,
      passedItems: 8,
      obdClean: true,
      roadTestRequired: true
    }
  },
  {
    id: 'ot-2',
    otNumber: 'OT-2026-0843',
    vehiclePlate: 'AD-332-LM',
    vehicleModel: 'Ford Ranger 3.2 TDCi',
    clientName: 'Esteban Morales',
    technicianName: 'Martín Cabrera',
    bayNumber: 'Bahía #1 • Elevador Tijera',
    mainTask: 'Cambio de disco de embrague y bombín hidráulico de accionamiento.',
    hoursWorked: 1.0,
    partsDeducted: [],
    status: 'Pendiente',
    qualityChecklist: {
      totalItems: 8,
      passedItems: 5,
      obdClean: false,
      roadTestRequired: true
    }
  },
  {
    id: 'ot-3',
    otNumber: 'OT-2026-0839',
    vehiclePlate: 'AE-456-CC',
    vehicleModel: 'Mercedes-Benz Sprinter 516',
    clientName: 'Transportes Rápido S.R.L.',
    technicianName: 'Facundo Quiroga',
    bayNumber: 'Bahía #5 • Fosa Pesados',
    mainTask: 'Service Completo 100.000km, pastillas de freno y alineación computarizada.',
    hoursWorked: 5.0,
    partsDeducted: [
      { partSku: 'PAST-FR-MBS', description: 'Pastillas Freno Brembo Delanteras Sprinter', quantity: 1 },
      { partSku: 'ACEITE-5W30-SYN', description: 'Aceite Sintético 5W-30 Shell Rimula (10L)', quantity: 1 }
    ],
    status: 'Pendiente', // Pendiente de supervisión
    qualityChecklist: {
      totalItems: 10,
      passedItems: 10,
      obdClean: true,
      roadTestRequired: true
    }
  }
];

const initialInventory: SparePartItem[] = [
  { sku: 'FIL-ACE-TH28', description: 'Filtro de Aceite Blindado Toyota Hilux 2.8 (1GD-FTV)', category: 'Filtros & Aceites', currentStock: 24, minStock: 8, location: 'Estante A-12', unitPrice: 18500, status: 'Activo' },
  { sku: 'PAST-DEL-AMKV6', description: 'Pastillas de Freno Delanteras Cerámicas VW Amarok V6', category: 'Frenos & Discos', currentStock: 5, minStock: 6, location: 'Estante B-04', unitPrice: 64200, status: 'Pendiente' },
  { sku: 'KIT-DIST-FR32', description: 'Kit Tensor y Correa de Distribución Ford Ranger 3.2 Puma', category: 'Distribución & Motor', currentStock: 3, minStock: 4, location: 'Estante C-01', unitPrice: 142000, status: 'Pendiente' },
  { sku: 'ACE-5W30-SYNT-205L', description: 'Tambor 205L Aceite Sintético Low-SAPS 5W-30 Valvoline', category: 'Filtros & Aceites', currentStock: 2, minStock: 1, location: 'Área Tanques', unitPrice: 1890000, status: 'Activo' },
  { sku: 'AMOR-DEL-SPR', description: 'Amortiguador Delantero Reforzado Sprinter 516 (Descontinuado)', category: 'Suspensión & Dirección', currentStock: 0, minStock: 2, location: 'P-05 / Obsoletos', unitPrice: 98000, status: 'Inactivo' },
];

const initialBudgetServices: BudgetServiceItem[] = [
  { id: 'srv-1', description: 'Service Programado 60.000 km (Aceite sintético + 4 filtros)', estimatedHours: 2.5, hourlyRate: 28000, subtotal: 70000 },
  { id: 'srv-2', description: 'Reemplazo de Pastillas de Freno Delanteras + Rectificado de Discos', estimatedHours: 1.5, hourlyRate: 28000, subtotal: 42000 },
];

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined);

export const WorkshopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('autotech_theme') === 'dark';
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('autotech_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('autotech_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Auth state & Empleados
  const [employees, setEmployees] = useState<Empleado[]>(initialEmployees);
  const [user, setUser] = useState<User | null>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('autotech_session') : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('autotech_session') !== null;
  });

  const login = async (username: string, password: string): Promise<LoginResult> => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Intentar autenticar contra el Backend API de Node.js / Express (HU-01 y HU-02)
    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Para recibir y guardar la cookie de autenticación
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });

      const result = await response.json();

      if (!response.ok) {
        // Errores del backend: 401 (credenciales inválidas), 403 (inactivo), etc.
        return { 
          success: false, 
          error: result.error || 'Error al iniciar sesión en el servidor' 
        };
      }

      if (result.success && result.user) {
        const authUser: User = {
          legajo: result.user.legajo,
          username: result.user.username,
          name: result.user.nombre,
          role: result.user.rol,
          avatar: getInitials(result.user.nombre),
          email: `${result.user.username}@autotech.com.ar`,
          ultimoAcceso: result.user.ultimoAcceso
        };

        setUser(authUser);
        setIsAuthenticated(true);
        localStorage.setItem('autotech_session', JSON.stringify(authUser));
        // HU-03: Redirigir a la pantalla inicial habilitada para su rol
        const defaultScreen = getDefaultScreenForRole(authUser.role);
        setCurrentScreen(defaultScreen);
        return { success: true, user: authUser };
      }
    } catch {
      console.warn('[Frontend Auth] Servidor backend Node/Express no disponible en puerto 4000, intentando fallback directo.');
    }

    // 2. Intentar validar mediante Backend RPC en Supabase / PostgreSQL (HU-01)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('iniciar_sesion', {
          p_username: cleanUser,
          p_password: cleanPass
        });

        if (rpcError) {
          // Si el RPC retornó excepción (usuario inactivo o credenciales inválidas)
          return { success: false, error: rpcError.message };
        }

        if (rpcData && rpcData.length > 0) {
          const emp = rpcData[0];
          const authUser: User = {
            legajo: emp.legajo,
            username: emp.username,
            name: emp.nombre,
            role: emp.rol,
            avatar: getInitials(emp.nombre),
            email: `${emp.username}@autotech.com.ar`,
            ultimoAcceso: emp.ultimo_acceso
          };

          setUser(authUser);
          setIsAuthenticated(true);
          localStorage.setItem('autotech_session', JSON.stringify(authUser));
          const defaultScreen = getDefaultScreenForRole(authUser.role);
          setCurrentScreen(defaultScreen);
          return { success: true, user: authUser };
        }
      } catch (err) {
        console.warn('RPC iniciar_sesion no disponible o error de red:', err);
      }

      // Fallback a consulta directa sobre la tabla empleados si el RPC no fue migrado aún
      try {
        const { data, error } = await supabase
          .from('empleados')
          .select('legajo, username, password, nombre, activo, ultimo_acceso, roles ( nombre_rol )')
          .ilike('username', cleanUser)
          .maybeSingle();

        if (!error && data) {
          // Criterio 3: Un usuario inactivo no puede ingresar
          if (!data.activo) {
            return { success: false, error: 'Usuario inactivo. No tiene permisos de acceso al sistema' };
          }

          if (data.password === cleanPass) {
            const roleName = (data.roles as any)?.nombre_rol || 'Responsable de Recepción';
            const nowISO = new Date().toISOString();

            // Criterio 2: Registrar fecha y hora del último acceso
            await supabase
              .from('empleados')
              .update({ ultimo_acceso: nowISO })
              .eq('legajo', data.legajo);

            const authUser: User = {
              legajo: data.legajo,
              username: data.username,
              name: data.nombre,
              role: roleName,
              avatar: getInitials(data.nombre),
              email: `${data.username}@autotech.com.ar`,
              ultimoAcceso: nowISO
            };

            setUser(authUser);
            setIsAuthenticated(true);
            localStorage.setItem('autotech_session', JSON.stringify(authUser));
            const defaultScreen = getDefaultScreenForRole(roleName);
            setCurrentScreen(defaultScreen);
            return { success: true, user: authUser };
          } else {
            return { success: false, error: 'Usuario o contraseña incorrectos' };
          }
        }
      } catch (err) {
        console.warn('Fallback a verificación local:', err);
      }
    }

    // 2. Verificación contra lista de empleados inicial (fallback local / offline)
    const localEmp = employees.find(
      e => e.username.toLowerCase() === cleanUser
    );

    if (!localEmp) {
      return { success: false, error: 'Usuario o contraseña incorrectos' };
    }

    // Criterio 3: Un usuario inactivo no puede ingresar
    if (localEmp.activo === false) {
      return { success: false, error: 'Usuario inactivo. No tiene permisos de acceso al sistema' };
    }

    // Criterio 1: Verificación de contraseña
    if (localEmp.password !== cleanPass) {
      return { success: false, error: 'Usuario o contraseña incorrectos' };
    }

    // Criterio 2: Se registra la fecha y hora del último acceso
    const nowISO = new Date().toISOString();
    localEmp.ultimoAcceso = nowISO;

    const authUser: User = {
      legajo: localEmp.legajo,
      username: localEmp.username,
      name: localEmp.nombre,
      role: localEmp.rol,
      avatar: getInitials(localEmp.nombre),
      email: `${localEmp.username}@autotech.com.ar`,
      ultimoAcceso: nowISO
    };

    setUser(authUser);
    setIsAuthenticated(true);
    localStorage.setItem('autotech_session', JSON.stringify(authUser));
    // HU-03: Redirigir a la pantalla inicial habilitada para su rol
    const defaultScreen = getDefaultScreenForRole(authUser.role);
    setCurrentScreen(defaultScreen);

    return { success: true, user: authUser };
  };

  const logout = async () => {
    // HU-02 Criterio 1: Al cerrar sesión se elimina la cookie de autenticación en el servidor
    try {
      await fetch('http://localhost:4000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
    } catch (err) {
      console.warn('[Frontend Auth] Error contactando endpoint de logout en backend:', err);
    }

    // Limpieza de cookies en el cliente
    document.cookie = 'auth_token=; Max-Age=0; path=/;';
    document.cookie = 'session_active=; Max-Age=0; path=/;';

    // HU-02 Criterio 2: Después de cerrar sesión, acceder a cualquier pantalla redirige al login
    localStorage.removeItem('autotech_session');
    setUser(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/');
    }
    setCurrentScreenState('dashboard');
  };

  // HU-02: Verificación de sesión mediante cookie al cargar la aplicación
  useEffect(() => {
    async function verifyCookieSession() {
      try {
        const response = await fetch('http://localhost:4000/api/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            const authUser: User = {
              legajo: data.user.legajo,
              username: data.user.username,
              name: data.user.nombre,
              role: data.user.rol,
              avatar: getInitials(data.user.nombre),
              email: `${data.user.username}@autotech.com.ar`,
              ultimoAcceso: data.user.ultimoAcceso
            };
            setUser(authUser);
            setIsAuthenticated(true);
            localStorage.setItem('autotech_session', JSON.stringify(authUser));
            const fromUrl = getScreenFromUrl();
            if (!fromUrl || !isScreenAllowed(fromUrl, authUser.role)) {
              setCurrentScreen(getDefaultScreenForRole(authUser.role));
            }
            return;
          }
        } else if (response.status === 401) {
          // Si el servidor indica que no hay cookie, asegurar que redirija a Login
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem('autotech_session');
        }
      } catch {
        // Servidor no disponible en desarrollo offline
      }
    }

    verifyCookieSession();
  }, []);

  // Screen navigation state con sincronización de URL (HU-03 Criterio 2)
  const [currentScreen, setCurrentScreenState] = useState<ScreenId>(() => {
    const fromUrl = getScreenFromUrl();
    if (fromUrl) return fromUrl;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('autotech_session');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.role) {
            return getDefaultScreenForRole(parsed.role);
          }
        } catch {
          // ignore
        }
      }
    }
    return 'dashboard';
  });

  const setCurrentScreen = (screen: ScreenId) => {
    setCurrentScreenState(screen);
    if (typeof window !== 'undefined') {
      const targetPath = `/${screen}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUrlChange = () => {
      const fromUrl = getScreenFromUrl();
      if (fromUrl) {
        setCurrentScreenState(fromUrl);
      }
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Clients state
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClientId, setSelectedClientId] = useState<string>('cli-1');
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);

  // Carga inicial reactiva desde Supabase (si está configurado)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    async function loadDataFromSupabase() {
      try {
        const { data: dbClients } = await supabase!
          .from('clientes')
          .select('*')
          .order('fecha_alta', { ascending: false });

        const { data: dbVehicles } = await supabase!
          .from('vehiculos')
          .select('*');

        if (dbClients && dbClients.length > 0) {
          const mappedClients: Client[] = dbClients.map(c => {
            const fallbackNombre = c.nombre || (c.razon_social ? c.razon_social.split(' ')[0] : 'Cliente');
            const fallbackApellido = c.apellido || (c.razon_social ? c.razon_social.split(' ').slice(1).join(' ') || 'AutoTech' : 'AutoTech');
            return {
              id: c.id,
              nroCliente: c.nro_cliente,
              nombre: fallbackNombre,
              apellido: fallbackApellido,
              name: c.razon_social || `${fallbackNombre} ${fallbackApellido}`,
              razonSocial: c.razon_social || undefined,
              cuitDni: c.nro_documento,
              nroDocumento: c.nro_documento,
              tipoDocumento: c.tipo_documento || 'CUIT',
              phone: c.telefono || 'Sin teléfono',
              telefono: c.telefono || 'Sin teléfono',
              email: c.email || 'contacto@autotech.com.ar',
              localidad: c.localidad || undefined,
              nivelFidelizacion: c.nivel_fidelizacion || null,
              fechaAlta: c.fecha_alta,
              vehicleCount: (dbVehicles || []).filter(v => v.cliente_id === c.id).length,
              status: c.estado === 'Inactivo' ? 'Inactivo' : 'Activo'
            };
          });
          setClients(mappedClients);
          if (mappedClients[0]) {
            setSelectedClientId(mappedClients[0].id);
          }
        }

        if (dbVehicles && dbVehicles.length > 0) {
          const mappedVehicles: Vehicle[] = dbVehicles.map(v => ({
            plate: v.dominio,
            dominio: v.dominio,
            brandModel: `${v.marca} ${v.modelo}`.trim(),
            marca: v.marca,
            modelo: v.modelo,
            year: v.anio,
            año: v.anio,
            vin: `VIN-${v.dominio}`,
            mileage: v.kilometraje_actual,
            kilometrajeActual: v.kilometraje_actual,
            clientId: v.cliente_id,
            clienteId: v.cliente_id,
            status: 'Activo'
          }));
          setVehicles(mappedVehicles);
          if (mappedVehicles[0]) {
            selectVehicleForReception(mappedVehicles[0].plate);
          }
        }

        // Cargar empleados desde Supabase si la tabla existe
        const { data: dbEmployees } = await supabase!
          .from('empleados')
          .select('legajo, username, password, nombre, activo, roles ( nombre_rol )');

        if (dbEmployees && dbEmployees.length > 0) {
          const mappedEmployees: Empleado[] = dbEmployees.map(e => ({
            legajo: e.legajo,
            username: e.username,
            password: e.password,
            nombre: e.nombre,
            rol: (e.roles as any)?.nombre_rol || 'Responsable de Recepción',
            activo: e.activo
          }));
          setEmployees(mappedEmployees);
        }
      } catch (err) {
        console.warn('Conexión con Supabase no disponible temporalmente, usando estado local:', err);
      }
    }

    loadDataFromSupabase();
  }, []);

  const addClient = async (newCli: Omit<Client, 'id' | 'vehicleCount' | 'status'>): Promise<{ success: boolean; error?: string; message?: string; client?: Client }> => {
    const valNombre = (newCli.nombre || '').trim();
    const valApellido = (newCli.apellido || '').trim();
    const valTipoDoc = (newCli.tipoDocumento || (newCli.cuitDni?.length > 9 ? 'CUIT' : 'DNI')).trim().toUpperCase() as 'DNI' | 'CUIT' | 'Pasaporte';
    const valNroDoc = (newCli.nroDocumento || newCli.cuitDni || '').trim();
    const valEmail = (newCli.email || '').trim().toLowerCase();
    const valPhone = (newCli.phone || newCli.telefono || '').trim();
    const valRazonSocial = (newCli.razonSocial || '').trim();
    const valLocalidad = (newCli.localidad || '').trim();

    // 1. Campos obligatorios
    if (!valNombre || !valApellido || !valTipoDoc || !valNroDoc || !valEmail || !valPhone) {
      return {
        success: false,
        error: 'Los campos nombre, apellido, tipo y número de documento, mail y teléfono son obligatorios'
      };
    }

    // 2. Validación de formato de mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(valEmail)) {
      return {
        success: false,
        error: 'El mail debe tener formato válido'
      };
    }

    // 3. Criterio de Aceptación: No se permite duplicar tipo y número de documento
    const alreadyExists = clients.some(c => {
      const cTipo = (c.tipoDocumento || (c.cuitDni?.length > 9 ? 'CUIT' : 'DNI')).trim().toUpperCase();
      const cNro = (c.nroDocumento || c.cuitDni || '').trim();
      return cTipo === valTipoDoc && cNro === valNroDoc;
    });

    if (alreadyExists) {
      return {
        success: false,
        error: 'Ya existe un cliente con ese tipo y número de documento'
      };
    }

    // 4. Intentar registrar a través de la API Backend
    let assignedNroCliente = Math.max(...clients.map(c => c.nroCliente || 1000), 1005) + 1;
    let createdId = `cli-${Date.now()}`;

    try {
      const response = await fetch('http://localhost:4000/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: valNombre,
          apellido: valApellido,
          tipo_documento: valTipoDoc,
          numero_documento: valNroDoc,
          mail: valEmail,
          telefono: valPhone,
          razon_social: valRazonSocial || null,
          localidad: valLocalidad || null
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        if (response.status === 409 || resData.error?.includes('Ya existe')) {
          return {
            success: false,
            error: 'Ya existe un cliente con ese tipo y número de documento'
          };
        }
        if (resData.error?.includes('mail')) {
          return {
            success: false,
            error: 'El mail debe tener formato válido'
          };
        }
      } else if (resData.cliente) {
        createdId = resData.cliente.id || createdId;
        assignedNroCliente = resData.cliente.nro_cliente || assignedNroCliente;
      }
    } catch {
      // Offline / fallback local
    }

    const client: Client = {
      ...newCli,
      id: createdId,
      nroCliente: assignedNroCliente,
      nombre: valNombre,
      apellido: valApellido,
      name: valRazonSocial ? `${valNombre} ${valApellido} (${valRazonSocial})` : `${valNombre} ${valApellido}`,
      tipoDocumento: valTipoDoc,
      nroDocumento: valNroDoc,
      cuitDni: valNroDoc,
      email: valEmail,
      phone: valPhone,
      telefono: valPhone,
      razonSocial: valRazonSocial || undefined,
      localidad: valLocalidad || undefined,
      nivelFidelizacion: null, // Queda sin nivel de fidelización asignado
      vehicleCount: 0,
      status: 'Activo',
      fechaAlta: new Date().toISOString().split('T')[0]
    };

    setClients(prev => [client, ...prev]);
    setSelectedClientId(createdId);

    // Persistir en Supabase si está disponible
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('clientes')
          .insert([{
            nombre: valNombre,
            apellido: valApellido,
            tipo_documento: valTipoDoc,
            nro_documento: valNroDoc,
            razon_social: valRazonSocial || null,
            telefono: valPhone,
            email: valEmail,
            localidad: valLocalidad || null,
            nivel_fidelizacion: null,
            estado: 'Activo'
          }])
          .select();

        if (data && data[0]) {
          setClients(prev => prev.map(c => c.id === createdId ? { ...c, id: data[0].id, nroCliente: data[0].nro_cliente || assignedNroCliente } : c));
          setSelectedClientId(data[0].id);
        }
      } catch (e) {
        console.error('Error insertando cliente en Supabase:', e);
      }
    }

    return {
      success: true,
      message: 'Cliente registrado correctamente',
      client
    };
  };

  // HU-06: Modificar Cliente
  const updateClient = async (
    id: string,
    updatedData: {
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
  ): Promise<{ success: boolean; error?: string; message?: string; client?: Client }> => {
    // 1. Encontrar cliente existente
    const current = clients.find(c => c.id === id || c.nroDocumento === id || c.cuitDni === id);
    if (!current) {
      return {
        success: false,
        error: 'Cliente no encontrado'
      };
    }

    const valNombre = (updatedData.nombre !== undefined ? updatedData.nombre : current.nombre).trim();
    const valApellido = (updatedData.apellido !== undefined ? updatedData.apellido : current.apellido).trim();
    const valTipoDoc = (updatedData.tipoDocumento || current.tipoDocumento || 'DNI').trim().toUpperCase() as 'DNI' | 'CUIT' | 'Pasaporte';
    const valNroDoc = (updatedData.nroDocumento || updatedData.cuitDni || current.nroDocumento || current.cuitDni || '').trim();
    const valEmail = (updatedData.email || current.email || '').trim().toLowerCase();
    const valPhone = (updatedData.phone || updatedData.telefono || current.phone || current.telefono || '').trim();
    const valRazonSocial = (updatedData.razonSocial !== undefined ? updatedData.razonSocial : current.razonSocial || '').trim();
    const valLocalidad = (updatedData.localidad !== undefined ? updatedData.localidad : current.localidad || '').trim();

    // Criterio 2: Se validan los mismos campos obligatorios que en el alta
    if (!valNombre || !valApellido || !valTipoDoc || !valNroDoc || !valEmail || !valPhone) {
      return {
        success: false,
        error: 'Los campos nombre, apellido, tipo y número de documento, mail y teléfono son obligatorios'
      };
    }

    // Criterio 2: El mail debe tener formato válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(valEmail)) {
      return {
        success: false,
        error: 'El mail debe tener formato válido'
      };
    }

    // Criterio 1: No se puede modificar el tipo y número de documento a uno ya existente
    const duplicate = clients.find(c => 
      c.id !== current.id &&
      (c.tipoDocumento || 'DNI').toUpperCase() === valTipoDoc &&
      (c.nroDocumento === valNroDoc || c.cuitDni === valNroDoc)
    );

    if (duplicate) {
      return {
        success: false,
        error: 'Ya existe un cliente con ese tipo y número de documento'
      };
    }

    // Actualizar en backend Node/Express
    try {
      const response = await fetch(`http://localhost:4000/api/clientes/${encodeURIComponent(current.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: current.id,
          nombre: valNombre,
          apellido: valApellido,
          tipo_documento: valTipoDoc,
          numero_documento: valNroDoc,
          nro_documento: valNroDoc,
          mail: valEmail,
          email: valEmail,
          telefono: valPhone,
          phone: valPhone,
          razon_social: valRazonSocial || null,
          localidad: valLocalidad || null
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: resData.error || 'Error al modificar el cliente'
        };
      }
    } catch {
      // Fallback offline / memoria local
    }

    // Actualizar estado en memoria reactivo
    const updatedClient: Client = {
      ...current,
      nombre: valNombre,
      apellido: valApellido,
      name: valRazonSocial ? `${valNombre} ${valApellido} (${valRazonSocial})` : `${valNombre} ${valApellido}`,
      tipoDocumento: valTipoDoc,
      nroDocumento: valNroDoc,
      cuitDni: valNroDoc,
      email: valEmail,
      phone: valPhone,
      telefono: valPhone,
      razonSocial: valRazonSocial || undefined,
      localidad: valLocalidad || undefined
    };

    setClients(prev => prev.map(c => c.id === current.id ? updatedClient : c));

    // Si Supabase está configurado, actualizar
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('clientes')
          .update({
            nombre: valNombre,
            apellido: valApellido,
            tipo_documento: valTipoDoc,
            nro_documento: valNroDoc,
            razon_social: valRazonSocial || null,
            email: valEmail,
            telefono: valPhone,
            localidad: valLocalidad || null
          })
          .eq('id', current.id);
      } catch (e) {
        console.error('Error actualizando cliente en Supabase:', e);
      }
    }

    return {
      success: true,
      message: 'Cliente modificado correctamente',
      client: updatedClient
    };
  };

  // HU-06: Registrar Vehículo de Cliente
  const addVehicle = async (newVeh: {
    plate: string;
    marca?: string;
    modelo?: string;
    brandModel?: string;
    year: number;
    clientId: string;
    mileage?: number;
    vin?: string;
  }): Promise<{ success: boolean; error?: string; message?: string; vehicle?: Vehicle }> => {
    const valPlate = (newVeh.plate || '').trim().toUpperCase();
    const valMarca = (newVeh.marca || (newVeh.brandModel ? newVeh.brandModel.split(' ')[0] : '')).trim();
    const valModelo = (newVeh.modelo || (newVeh.brandModel ? newVeh.brandModel.split(' ').slice(1).join(' ') : '')).trim();
    const valYear = Number(newVeh.year);
    const valClientId = (newVeh.clientId || '').trim();

    // 1. Criterio 1: Campos obligatorios: patente, marca, modelo y año
    if (!valPlate || !valMarca || !valModelo || !valYear) {
      return {
        success: false,
        error: 'Los campos patente, marca, modelo y año son obligatorios'
      };
    }

    const currentYear = new Date().getFullYear();
    if (isNaN(valYear) || valYear < 1920 || valYear > currentYear + 1) {
      return {
        success: false,
        error: `El año del vehículo debe estar entre 1920 y ${currentYear + 1}`
      };
    }

    // Validación de asociación obligatoria al cliente seleccionado (Criterio 3)
    if (!valClientId) {
      return {
        success: false,
        error: 'Debe seleccionarse un cliente para asociar el vehículo'
      };
    }

    // 2. Criterio 2: La patente es única en el sistema
    const alreadyExists = vehicles.some(
      v => (v.plate || v.dominio || '').trim().toUpperCase() === valPlate
    );

    if (alreadyExists) {
      return {
        success: false,
        error: 'Ya existe un vehículo con esa patente en el sistema'
      };
    }

    // 3. Persistir en Backend Express API
    try {
      const response = await fetch('http://localhost:4000/api/vehiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patente: valPlate,
          marca: valMarca,
          modelo: valModelo,
          año: valYear,
          cliente_id: valClientId,
          kilometraje_actual: newVeh.mileage || 0
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        if (response.status === 409 || resData.error?.includes('Ya existe')) {
          return {
            success: false,
            error: 'Ya existe un vehículo con esa patente en el sistema'
          };
        }
        if (resData.error?.includes('obligatorios')) {
          return {
            success: false,
            error: 'Los campos patente, marca, modelo y año son obligatorios'
          };
        }
      }
    } catch {
      // Fallback local en modo offline / tests
    }

    // 4. Criterio 3: El vehículo queda asociado al cliente seleccionado
    const veh: Vehicle = {
      plate: valPlate,
      dominio: valPlate,
      brandModel: `${valMarca} ${valModelo}`.trim(),
      marca: valMarca,
      modelo: valModelo,
      year: valYear,
      año: valYear,
      vin: newVeh.vin || `VIN-${valPlate}`,
      mileage: Number(newVeh.mileage || 0),
      kilometrajeActual: Number(newVeh.mileage || 0),
      clientId: valClientId,
      clienteId: valClientId,
      status: 'Activo'
    };

    setVehicles(prev => [veh, ...prev]);
    setClients(prev => prev.map(c => c.id === valClientId ? { ...c, vehicleCount: c.vehicleCount + 1 } : c));

    // Persistir en Supabase si está disponible
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('vehiculos')
          .insert([{
            dominio: valPlate,
            cliente_id: valClientId,
            marca: valMarca,
            modelo: valModelo,
            anio: valYear,
            kilometraje_actual: veh.mileage,
            estado: 'Activo'
          }]);
      } catch (e) {
        console.error('Error insertando vehículo en Supabase:', e);
      }
    }

    return {
      success: true,
      message: 'Vehículo registrado correctamente',
      vehicle: veh
    };
  };

  // Work Orders state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);

  const updateOrderHours = (orderId: string, hours: number) => {
    setWorkOrders(prev => prev.map(ot => ot.id === orderId ? { ...ot, hoursWorked: hours } : ot));
  };

  const deductPartFromPañol = (orderId: string, sku: string, quantity: number) => {
    const part = inventory.find(p => p.sku.toLowerCase() === sku.toLowerCase() || p.description.toLowerCase().includes(sku.toLowerCase()));
    if (!part) return;

    setWorkOrders(prev => prev.map(ot => {
      if (ot.id === orderId) {
        return {
          ...ot,
          partsDeducted: [
            ...ot.partsDeducted,
            { partSku: part.sku, description: part.description, quantity }
          ]
        };
      }
      return ot;
    }));

    // Deduct from inventory stock
    setInventory(prev => prev.map(p => {
      if (p.sku === part.sku) {
        const newStock = Math.max(0, p.currentStock - quantity);
        return {
          ...p,
          currentStock: newStock,
          status: newStock <= p.minStock ? 'Pendiente' : 'Activo'
        };
      }
      return p;
    }));
  };

  const approveOrder = (orderId: string) => {
    setWorkOrders(prev => prev.map(ot => ot.id === orderId ? { ...ot, status: 'Aprobado' } : ot));
  };

  const rejectOrder = (orderId: string) => {
    setWorkOrders(prev => prev.map(ot => ot.id === orderId ? { ...ot, status: 'Pendiente' } : ot));
  };

  // Inventory state
  const [inventory, setInventory] = useState<SparePartItem[]>(initialInventory);
  const [purchaseRequestSuccess, setPurchaseRequestSuccess] = useState<boolean>(false);

  const createPurchaseRequest = (sku: string, qty: number) => {
    setInventory(prev => prev.map(p => {
      if (p.sku === sku) {
        return { ...p, currentStock: p.currentStock + qty, status: 'Activo' };
      }
      return p;
    }));
    setPurchaseRequestSuccess(true);
    setTimeout(() => setPurchaseRequestSuccess(false), 3000);
  };

  // Reception state
  const [budgetServices, setBudgetServices] = useState<BudgetServiceItem[]>(initialBudgetServices);
  const [selectedReceptionVehicle, setSelectedReceptionVehicle] = useState<string>('AF-123-ZZ');
  const [selectedReceptionClient, setSelectedReceptionClient] = useState<string>('Transportes Rápido S.R.L. (30-71234567-9)');
  const [mileageEntry, setMileageEntry] = useState<number>(64200);

  const selectVehicleForReception = (plateOrString: string) => {
    setSelectedReceptionVehicle(plateOrString);
    const plate = plateOrString.split(' ')[0].trim();
    const veh = vehicles.find(v => v.plate === plate || v.plate === plateOrString);
    if (veh) {
      const cli = clients.find(c => c.id === veh.clientId);
      if (cli) {
        setSelectedReceptionClient(`${cli.name} (${cli.cuitDni})`);
      }
      if (veh.mileage) {
        setMileageEntry(veh.mileage);
      }
    }
  };

  const addBudgetService = (srv: Omit<BudgetServiceItem, 'id' | 'subtotal'>) => {
    const newService: BudgetServiceItem = {
      ...srv,
      id: `srv-${Date.now()}`,
      subtotal: srv.estimatedHours * srv.hourlyRate
    };
    setBudgetServices(prev => [...prev, newService]);
  };

  const removeBudgetService = (id: string) => {
    setBudgetServices(prev => prev.filter(s => s.id !== id));
  };

  const updateBudgetService = (id: string, hours: number, rate: number) => {
    setBudgetServices(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          estimatedHours: hours,
          hourlyRate: rate,
          subtotal: hours * rate
        };
      }
      return s;
    }));
  };

  // ============================================================
  // HU-09: Turnos y Disponibilidad de Horarios
  // ============================================================
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [sucursales] = useState<Sucursal[]>(defaultSucursales);
  const [nextTurnoNumber, setNextTurnoNumber] = useState<number>(1001);

  const normalizeContextDate = (dateStr: string): { iso: string; ddmmyyyy: string; parsedDate: Date | null } => {
    if (!dateStr) return { iso: '', ddmmyyyy: '', parsedDate: null };
    const trimmed = dateStr.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      const padD = d.padStart(2, '0');
      const padM = m.padStart(2, '0');
      return {
        iso: `${y}-${padM}-${padD}`,
        ddmmyyyy: `${padD}/${padM}/${y}`,
        parsedDate: new Date(Number(y), Number(padM) - 1, Number(d), 0, 0, 0)
      };
    }
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      const padD = d.padStart(2, '0');
      const padM = m.padStart(2, '0');
      return {
        iso: `${y}-${padM}-${padD}`,
        ddmmyyyy: `${padD}/${padM}/${y}`,
        parsedDate: new Date(Number(y), Number(padM) - 1, Number(d), 0, 0, 0)
      };
    }
    const dt = new Date(trimmed);
    if (!isNaN(dt.getTime())) {
      const y = dt.getFullYear();
      const padM = String(dt.getMonth() + 1).padStart(2, '0');
      const padD = String(dt.getDate()).padStart(2, '0');
      return {
        iso: `${y}-${padM}-${padD}`,
        ddmmyyyy: `${padD}/${padM}/${y}`,
        parsedDate: new Date(y, dt.getMonth(), dt.getDate(), 0, 0, 0)
      };
    }
    return { iso: trimmed, ddmmyyyy: trimmed, parsedDate: null };
  };

  const isContextPastDate = (dateObj: Date | null): boolean => {
    if (!dateObj) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    return dateObj.getTime() < today.getTime();
  };

  const normalizeContextTime = (timeStr: string): string => {
    if (!timeStr) return '';
    const parts = timeStr.trim().split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return timeStr.trim();
  };

  // Helper para comprobar si un estado ocupa turno (HU-10 CA 2)
  const isEstadoOcupado = (estado: string): boolean => {
    if (!estado) return false;
    const norm = estado.trim().toLowerCase();
    if (norm === 'cancelado') return false;
    return norm === 'solicitado' || norm.includes('confirmado');
  };

  // HU-09 CA 1 & HU-10 CA 1 & CA 2: Muestra horarios dentro del horario de atención de la sucursal
  // y excluye horarios con turnos Solicitados o Confirmados
  const getAvailableHours = (sucursalNombre: string, fecha: string): string[] => {
    if (!fecha) return [];
    const norm = normalizeContextDate(fecha);
    if (!norm.parsedDate || isContextPastDate(norm.parsedDate)) {
      return [];
    }

    const suc = sucursales.find(s => s.nombre.toLowerCase() === sucursalNombre.toLowerCase()) || sucursales[0];
    const startHour = parseInt(suc.horarioApertura.split(':')[0], 10);
    const endHour = parseInt(suc.horarioCierre.split(':')[0], 10);

    const allSlots: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      allSlots.push(`${String(h).padStart(2, '0')}:00`);
    }

    // Filtrar horarios ya reservados en turnos Solicitados o Confirmados
    const occupied = new Set(
      turnos
        .filter(t => {
          if (!isEstadoOcupado(t.estado)) return false;
          const tNorm = normalizeContextDate(t.fecha);
          const sameDate = tNorm.iso === norm.iso || tNorm.ddmmyyyy === norm.ddmmyyyy;
          const sameSucursal = t.sucursal.toLowerCase() === suc.nombre.toLowerCase();
          return sameDate && sameSucursal;
        })
        .map(t => normalizeContextTime(t.hora))
    );

    return allSlots.filter(slot => !occupied.has(normalizeContextTime(slot)));
  };

  // HU-10: Consultar disponibilidad horaria de una sucursal para una fecha
  const consultarDisponibilidad = async (sucursalNombre: string, fecha: string): Promise<DisponibilidadHorariaResult> => {
    const norm = normalizeContextDate(fecha);
    const suc = sucursales.find(s => s.nombre.toLowerCase() === sucursalNombre.toLowerCase()) || sucursales[0];
    const startHour = parseInt(suc.horarioApertura.split(':')[0], 10);
    const endHour = parseInt(suc.horarioCierre.split(':')[0], 10);

    const allSlots: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      allSlots.push(`${String(h).padStart(2, '0')}:00`);
    }

    // Intentar consultar al backend Express
    try {
      const resp = await fetch(`http://localhost:4000/api/turnos/disponibilidad?sucursal=${encodeURIComponent(suc.nombre)}&fecha=${encodeURIComponent(norm.ddmmyyyy)}`);
      if (resp.ok) {
        const data = await resp.json();
        return data;
      }
    } catch {
      // Fallback local
    }

    // Cálculo reactivo local
    const turnosOcupados = turnos.filter(t => {
      if (!isEstadoOcupado(t.estado)) return false;
      const tNorm = normalizeContextDate(t.fecha);
      const sameDate = tNorm.iso === norm.iso || tNorm.ddmmyyyy === norm.ddmmyyyy;
      const sameSucursal = t.sucursal.toLowerCase() === suc.nombre.toLowerCase();
      return sameDate && sameSucursal;
    });

    const occupiedHoursMap = new Map<string, string>();
    turnosOcupados.forEach(t => {
      occupiedHoursMap.set(normalizeContextTime(t.hora), t.estado);
    });

    const horariosDisponibles = allSlots.filter(slot => !occupiedHoursMap.has(normalizeContextTime(slot)));
    const tieneDisponibilidad = horariosDisponibles.length > 0;

    // HU-10 CA 3: Si no hay horarios libres se muestra "Sin disponibilidad para la fecha seleccionada"
    const mensaje = tieneDisponibilidad
      ? `Hay ${horariosDisponibles.length} horarios disponibles`
      : 'Sin disponibilidad para la fecha seleccionada';

    return {
      sucursal: suc.nombre,
      direccion: suc.direccion,
      horarioAtencion: `${suc.horarioApertura} a ${suc.horarioCierre}`,
      fecha: norm.ddmmyyyy,
      fechaIso: norm.iso,
      totalHorarios: allSlots.length,
      tieneDisponibilidad,
      mensaje,
      horariosDisponibles,
      horariosLibres: horariosDisponibles,
      horariosOcupados: Array.from(occupiedHoursMap.entries()).map(([hora, estado]) => ({ hora, estado }))
    };
  };

  // HU-09: Registrar Solicitud de Turno
  const registerTurno = async (data: {
    clienteDni: string;
    clienteNombre?: string;
    vehiculoDominio: string;
    motivoConsulta: string;
    sucursal: string;
    fecha: string;
    hora: string;
  }): Promise<{
    success: boolean;
    error?: string;
    message?: string;
    nroTurno?: number;
    turno?: Turno;
  }> => {
    const valDni = String(data.clienteDni || '').trim();
    const valPatente = String(data.vehiculoDominio || '').trim().toUpperCase();
    const valMotivo = String(data.motivoConsulta || '').trim();
    const valSucursal = String(data.sucursal || 'Centro').trim();
    const valFecha = String(data.fecha || '').trim();
    const valHora = normalizeContextTime(String(data.hora || ''));

    if (!valDni || !valPatente || !valMotivo || !valSucursal || !valFecha || !valHora) {
      return {
        success: false,
        error: 'Todos los campos son obligatorios: DNI del cliente, vehículo, motivo, sucursal, fecha y horario'
      };
    }

    // Criterio 3: No se permiten turnos en fechas pasadas
    const norm = normalizeContextDate(valFecha);
    if (!norm.parsedDate || isContextPastDate(norm.parsedDate)) {
      return {
        success: false,
        error: 'No se permiten turnos en fechas pasadas'
      };
    }

    // Criterio 4: Comprobar si el horario ya está ocupado (Solicitado o Confirmado)
    const alreadyOccupied = turnos.some(t => {
      if (!isEstadoOcupado(t.estado)) return false;
      const tNorm = normalizeContextDate(t.fecha);
      const sameDate = tNorm.iso === norm.iso || tNorm.ddmmyyyy === norm.ddmmyyyy;
      const sameSuc = t.sucursal.toLowerCase() === valSucursal.toLowerCase();
      const sameH = normalizeContextTime(t.hora) === valHora;
      return sameDate && sameSuc && sameH;
    });

    if (alreadyOccupied) {
      // Mensaje exacto HU-09
      return {
        success: false,
        error: 'El horario seleccionado no está disponible. Seleccione otro horario'
      };
    }

    // Persistir en backend Express si está disponible
    let assignedNroTurno = nextTurnoNumber;
    try {
      const response = await fetch('http://localhost:4000/api/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cliente_dni: valDni,
          cliente_nombre: data.clienteNombre,
          vehiculo_dominio: valPatente,
          motivo_consulta: valMotivo,
          sucursal: valSucursal,
          fecha: norm.ddmmyyyy,
          hora: valHora
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        if (response.status === 409 || resData.error?.includes('no está disponible')) {
          return {
            success: false,
            error: 'El horario seleccionado no está disponible. Seleccione otro horario'
          };
        }
        if (resData.error?.includes('fechas pasadas')) {
          return {
            success: false,
            error: 'No se permiten turnos en fechas pasadas'
          };
        }
      } else if (resData.nro_turno || resData.numeroTurno) {
        assignedNroTurno = resData.nro_turno || resData.numeroTurno;
      }
    } catch {
      // Fallback local en modo offline / tests
    }

    setNextTurnoNumber(prev => Math.max(prev + 1, assignedNroTurno + 1));

    const cli = clients.find(c => c.nroDocumento.replace(/[\s-]/g, '') === valDni.replace(/[\s-]/g, ''));
    const cliNombre = cli ? cli.name : (data.clienteNombre || 'Cliente');

    const nuevoTurno: Turno = {
      id: `turno-${Date.now()}`,
      nroTurno: assignedNroTurno,
      vehiculoDominio: valPatente,
      clienteId: cli?.id,
      clienteNombre: cliNombre,
      clienteDocumento: valDni,
      sucursal: valSucursal,
      fecha: norm.ddmmyyyy,
      hora: valHora,
      fechaHoraPropuesta: `${norm.iso}T${valHora}:00`,
      motivoConsulta: valMotivo,
      esEmergencia: false,
      estado: 'Solicitado' // Criterio 2: El turno nace en estado "Solicitado"
    };

    // Criterio 4: El horario reservado deja de estar disponible
    setTurnos(prev => [nuevoTurno, ...prev]);

    return {
      success: true,
      message: 'Turno registrado exitosamente',
      nroTurno: assignedNroTurno,
      turno: nuevoTurno
    };
  };

  return (
    <WorkshopContext.Provider value={{
      isDark,
      toggleTheme,
      isAuthenticated,
      user,
      employees,
      login,
      logout,
      currentScreen,
      setCurrentScreen,
      clients,
      selectedClientId,
      setSelectedClientId,
      addClient,
      updateClient,
      vehicles,
      addVehicle,
      workOrders,
      updateOrderHours,
      deductPartFromPañol,
      approveOrder,
      rejectOrder,
      inventory,
      purchaseRequestSuccess,
      createPurchaseRequest,
      budgetServices,
      addBudgetService,
      removeBudgetService,
      updateBudgetService,
      selectedReceptionClient,
      setSelectedReceptionClient,
      selectedReceptionVehicle,
      setSelectedReceptionVehicle,
      selectVehicleForReception,
      mileageEntry,
      setMileageEntry,
      turnos,
      sucursales,
      getAvailableHours,
      consultarDisponibilidad,
      registerTurno
    }}>
      {children}
    </WorkshopContext.Provider>
  );
};

export const useWorkshop = (): WorkshopContextType => {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error('useWorkshop must be used within a WorkshopProvider');
  }
  return context;
};
