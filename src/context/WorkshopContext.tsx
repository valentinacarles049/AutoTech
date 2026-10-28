import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Vehicle, WorkOrder, SparePartItem, BudgetServiceItem } from '../types/autotech';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type ScreenId = 'dashboard' | 'comercial' | 'recepcion' | 'operativa' | 'supervision' | 'inventario';

interface User {
  name: string;
  role: string;
  avatar: string;
  email: string;
}

interface WorkshopContextType {
  // Theme
  isDark: boolean;
  toggleTheme: () => void;

  // Auth
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  // Navigation
  currentScreen: ScreenId;
  setCurrentScreen: (screen: ScreenId) => void;

  // Comercial (Clients & Vehicles)
  clients: Client[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'vehicleCount' | 'status'>) => void;
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'status'>) => void;

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

  // Recepción (Budget)
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
}

const initialClients: Client[] = [
  { id: 'cli-1', name: 'Transportes Rápido S.R.L.', cuitDni: '30-71234567-9', phone: '0351-4889900', vehicleCount: 8, status: 'Activo' },
  { id: 'cli-2', name: 'Agropecuaria El Ombú', cuitDni: '30-68994123-4', phone: '0353-4123456', vehicleCount: 4, status: 'Activo' },
  { id: 'cli-3', name: 'Esteban Morales', cuitDni: '20-33445566-8', phone: '0351-155987654', vehicleCount: 1, status: 'Activo' },
  { id: 'cli-4', name: 'Logística Centro S.A.', cuitDni: '30-55443322-1', phone: '0351-4771122', vehicleCount: 12, status: 'Activo' },
  { id: 'cli-5', name: 'Distribuidora Norte S.A.', cuitDni: '30-44998877-3', phone: '0351-4990033', vehicleCount: 0, status: 'Inactivo' },
];

const initialVehicles: Vehicle[] = [
  { plate: 'AF-123-ZZ', brandModel: 'Toyota Hilux 2.8 D-4D', year: 2022, vin: '8AJBA3CD4N0198273', mileage: 64200, clientId: 'cli-1', status: 'En taller' },
  { plate: 'AE-456-CC', brandModel: 'Mercedes-Benz Sprinter 516', year: 2021, vin: '8AC906653ME982314', mileage: 112500, clientId: 'cli-1', status: 'Aprobado' },
  { plate: 'AC-789-DD', brandModel: 'Volkswagen Amarok V6 3.0', year: 2020, vin: '8AWDB42H2LA091244', mileage: 89000, clientId: 'cli-1', status: 'Activo' },
  { plate: 'AD-991-LK', brandModel: 'Ford Ranger 3.2 TDCi Limited', year: 2019, vin: '8AFAR2341KA098123', mileage: 104000, clientId: 'cli-2', status: 'Activo' },
  { plate: 'AD-332-LM', brandModel: 'Ford Ranger 3.2 TDCi XLT', year: 2019, vin: '8AFAR3312KA098124', mileage: 98400, clientId: 'cli-3', status: 'En taller' },
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

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>({
    name: 'Valen C.',
    role: 'Recepción',
    avatar: 'VC',
    email: 'valen.recepcion@autotech.com.ar'
  });

  const login = (username: string) => {
    setUser({
      name: username.includes('.') ? username.split('.')[0].toUpperCase() + ' C.' : 'Valen C.',
      role: 'Recepción',
      avatar: 'VC',
      email: `${username}@autotech.com.ar`
    });
    setIsAuthenticated(true);
    setCurrentScreen('dashboard');
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Screen navigation state
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('comercial');

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
          const mappedClients: Client[] = dbClients.map(c => ({
            id: c.id,
            name: c.razon_social,
            razonSocial: c.razon_social,
            cuitDni: c.nro_documento,
            nroDocumento: c.nro_documento,
            tipoDocumento: c.tipo_documento || 'CUIT',
            phone: c.telefono,
            telefono: c.telefono,
            email: c.email || undefined,
            fechaAlta: c.fecha_alta,
            vehicleCount: (dbVehicles || []).filter(v => v.cliente_id === c.id).length,
            status: c.estado === 'Inactivo' ? 'Inactivo' : 'Activo'
          }));
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
      } catch (err) {
        console.warn('Conexión con Supabase no disponible temporalmente, usando estado local:', err);
      }
    }

    loadDataFromSupabase();
  }, []);

  const addClient = async (newCli: Omit<Client, 'id' | 'vehicleCount' | 'status'>) => {
    const tempId = `cli-${Date.now()}`;
    const client: Client = {
      ...newCli,
      id: tempId,
      vehicleCount: 0,
      status: 'Activo'
    };
    setClients(prev => [client, ...prev]);
    setSelectedClientId(tempId);

    // Persistir en Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('clientes')
          .insert([{
            tipo_documento: newCli.tipoDocumento || (newCli.cuitDni.length > 9 ? 'CUIT' : 'DNI'),
            nro_documento: newCli.cuitDni,
            razon_social: newCli.name,
            telefono: newCli.phone,
            email: newCli.email || null,
            estado: 'Activo'
          }])
          .select();

        if (data && data[0]) {
          setClients(prev => prev.map(c => c.id === tempId ? { ...c, id: data[0].id } : c));
          setSelectedClientId(data[0].id);
        }
      } catch (e) {
        console.error('Error insertando cliente en Supabase:', e);
      }
    }
  };

  const addVehicle = async (newVeh: Omit<Vehicle, 'status'>) => {
    const veh: Vehicle = {
      ...newVeh,
      status: 'Activo'
    };
    setVehicles(prev => [...prev, veh]);
    setClients(prev => prev.map(c => c.id === newVeh.clientId ? { ...c, vehicleCount: c.vehicleCount + 1 } : c));

    // Persistir en Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const parts = newVeh.brandModel.split(' ');
        const marca = parts[0] || 'Genérica';
        const modelo = parts.slice(1).join(' ') || newVeh.brandModel;

        await supabase
          .from('vehiculos')
          .insert([{
            dominio: newVeh.plate,
            cliente_id: newVeh.clientId,
            marca: marca,
            modelo: modelo,
            anio: newVeh.year,
            kilometraje_actual: newVeh.mileage,
            estado: 'Activo'
          }]);
      } catch (e) {
        console.error('Error insertando vehículo en Supabase:', e);
      }
    }
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

  return (
    <WorkshopContext.Provider value={{
      isDark,
      toggleTheme,
      isAuthenticated,
      user,
      login,
      logout,
      currentScreen,
      setCurrentScreen,
      clients,
      selectedClientId,
      setSelectedClientId,
      addClient,
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
      setMileageEntry
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
