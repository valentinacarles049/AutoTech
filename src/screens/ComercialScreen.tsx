import React, { useState, useMemo } from 'react';
import { Plus, Search, Car, User, Phone, FileText, Check, X, Filter, UserX } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';

export const ComercialScreen: React.FC = () => {
  const { clients, selectedClientId, setSelectedClientId, addClient, vehicles, addVehicle, setCurrentScreen } = useWorkshop();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriterion, setSearchCriterion] = useState<'todos' | 'documento' | 'apellido' | 'nro_cliente'>('todos');
  
  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // New Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientApellido, setNewClientApellido] = useState('');
  const [newClientTipoDoc, setNewClientTipoDoc] = useState<'DNI' | 'CUIT' | 'Pasaporte'>('DNI');
  const [newClientCuit, setNewClientCuit] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // New Vehicle Form state
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState(2023);
  const [newVin, setNewVin] = useState('');
  const [newMileage, setNewMileage] = useState(45000);

  // Filtrado de clientes según criterios de aceptación de HU-05:
  // Criterio 1: La búsqueda por documento devuelve un único cliente
  // Criterio 2: La búsqueda por apellido lista las coincidencias
  // Criterio 3: Si no hay resultados se muestra "No se encontraron clientes"
  const filteredClients = useMemo(() => {
    const term = searchTerm.trim();
    if (!term) return clients;

    const lowerTerm = term.toLowerCase();
    const cleanDigits = lowerTerm.replace(/[\s-]/g, '');

    // 1. Criterio específico: Documento -> Devuelve un único cliente (DNI/CUIT único)
    if (searchCriterion === 'documento') {
      const match = clients.find(c => {
        const cDoc = (c.nroDocumento || c.cuitDni || '').toLowerCase().replace(/[\s-]/g, '');
        const cRaw = (c.nroDocumento || c.cuitDni || '').toLowerCase();
        return cDoc === cleanDigits || cRaw === lowerTerm || (cleanDigits.length >= 6 && cDoc.includes(cleanDigits));
      });
      return match ? [match] : [];
    }

    // 2. Criterio específico: Apellido -> Lista las coincidencias
    if (searchCriterion === 'apellido') {
      return clients.filter(c => 
        (c.apellido && c.apellido.toLowerCase().includes(lowerTerm)) ||
        (c.name && c.name.toLowerCase().includes(lowerTerm))
      );
    }

    // 3. Criterio específico: Número de cliente
    if (searchCriterion === 'nro_cliente') {
      const nro = cleanDigits.replace('#', '');
      return clients.filter(c => c.nroCliente?.toString() === nro || c.nroCliente?.toString().includes(nro));
    }

    // 4. Criterio 'todos' (Búsqueda unificada inteligente)
    // A) Si coincide exactamente con el documento o parece número de DNI/CUIT (6+ dígitos o guiones):
    const docMatch = clients.find(c => {
      const cDoc = (c.nroDocumento || c.cuitDni || '').toLowerCase().replace(/[\s-]/g, '');
      const cRaw = (c.nroDocumento || c.cuitDni || '').toLowerCase();
      return (cleanDigits.length >= 6 && cDoc === cleanDigits) || cRaw === lowerTerm;
    });

    if (docMatch && (cleanDigits.length >= 6 || term.includes('-'))) {
      // Criterio 1: búsqueda por documento devuelve un único cliente
      return [docMatch];
    }

    // B) Coincidencia de apellido -> Criterio 2: lista las coincidencias
    const apellidoMatches = clients.filter(c => 
      c.apellido && c.apellido.toLowerCase().includes(lowerTerm)
    );
    if (apellidoMatches.length > 0 && isNaN(Number(term))) {
      return apellidoMatches;
    }

    // C) Coincidencia de número de cliente exacto
    const nroMatches = clients.filter(c => c.nroCliente?.toString() === term.replace('#', ''));
    if (nroMatches.length > 0) {
      return nroMatches;
    }

    // D) Búsqueda amplia general
    return clients.filter(c => 
      c.name.toLowerCase().includes(lowerTerm) || 
      (c.nombre && c.nombre.toLowerCase().includes(lowerTerm)) ||
      (c.apellido && c.apellido.toLowerCase().includes(lowerTerm)) ||
      (c.cuitDni && c.cuitDni.toLowerCase().includes(lowerTerm)) ||
      (c.nroCliente && c.nroCliente.toString().includes(lowerTerm))
    );
  }, [clients, searchTerm, searchCriterion]);

  // Cliente activo para el panel de detalle:
  // Si hay resultados de búsqueda, debe ser un cliente que pertenezca a los resultados filtrados.
  // Si no hay resultados de búsqueda, es null (mostrando "No se encontraron clientes").
  const selectedClient = filteredClients.find(c => c.id === selectedClientId) || (filteredClients.length > 0 ? filteredClients[0] : null);
  const associatedVehicles = selectedClient ? vehicles.filter(v => v.clientId === selectedClient.id) : [];

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newClientName || !newClientCuit || !newClientPhone || !newClientEmail) {
      setModalError('Los campos nombre, apellido, tipo y número de documento, mail y teléfono son obligatorios');
      return;
    }

    const res = await addClient({
      nombre: newClientName,
      apellido: newClientApellido || newClientName,
      name: newClientName,
      tipoDocumento: newClientTipoDoc,
      nroDocumento: newClientCuit,
      cuitDni: newClientCuit,
      phone: newClientPhone,
      email: newClientEmail,
      nivelFidelizacion: null,
    });

    if (!res.success) {
      setModalError(res.error || 'Error al guardar cliente');
      return;
    }

    setNewClientName('');
    setNewClientApellido('');
    setNewClientCuit('');
    setNewClientPhone('');
    setNewClientEmail('');
    setIsClientModalOpen(false);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate || !newModel || !selectedClient) return;

    addVehicle({
      plate: newPlate.toUpperCase(),
      brandModel: newModel,
      year: Number(newYear),
      vin: newVin || 'VIN-GENERATED-001',
      mileage: Number(newMileage),
      clientId: selectedClient.id,
    });

    setNewPlate('');
    setNewModel('');
    setNewVin('');
    setIsVehicleModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* VISTA MAESTRO-DETALLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA (MAESTRO): TABLA DE CLIENTES (7 COLS) */}
        <div className="lg:col-span-7 card-surface rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#3A3A48] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Maestro de Clientes</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  {clients.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seleccioná una fila para visualizar la flota asociada
              </p>
            </div>

            {/* BOTÓN REQUERIDO: + NUEVO CLIENTE (Redirige a la pantalla "Nuevo cliente" HU-04) */}
            <button
              id="btn-nuevo-cliente"
              data-testid="btn-nuevo-cliente"
              onClick={() => setCurrentScreen('nuevo-cliente')}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Cliente</span>
            </button>
          </div>

          {/* Buscador de Clientes (HU-05) */}
          <div className="p-3 bg-slate-50/50 dark:bg-[#1E1E24]/50 border-b border-slate-200 dark:border-[#3A3A48] space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                id="search-client-input"
                data-testid="search-client-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  searchCriterion === 'documento'
                    ? "Buscar por Documento (DNI o CUIT, ej: 20-33445566-8)..."
                    : searchCriterion === 'apellido'
                    ? "Buscar por Apellido (ej: Morales)..."
                    : searchCriterion === 'nro_cliente'
                    ? "Buscar por N° de Cliente (ej: 1003)..."
                    : "Buscar por documento, apellido o número de cliente..."
                }
                className="app-input w-full pl-9 pr-8 py-2 text-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  id="btn-clear-search"
                  data-testid="btn-clear-search"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Criterios de búsqueda rápidos */}
            <div className="flex items-center justify-between text-[11px] gap-2 flex-wrap">
              <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center space-x-1">
                  <Filter className="w-3 h-3" />
                  <span>Filtro:</span>
                </span>
                <button
                  type="button"
                  id="filter-todos"
                  data-testid="filter-todos"
                  onClick={() => setSearchCriterion('todos')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    searchCriterion === 'todos'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  id="filter-documento"
                  data-testid="filter-documento"
                  onClick={() => setSearchCriterion('documento')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    searchCriterion === 'documento'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Documento
                </button>
                <button
                  type="button"
                  id="filter-apellido"
                  data-testid="filter-apellido"
                  onClick={() => setSearchCriterion('apellido')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    searchCriterion === 'apellido'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Apellido
                </button>
                <button
                  type="button"
                  id="filter-nro-cliente"
                  data-testid="filter-nro-cliente"
                  onClick={() => setSearchCriterion('nro_cliente')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    searchCriterion === 'nro_cliente'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  N° Cliente
                </button>
              </div>

              {searchTerm && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {filteredClients.length} {filteredClients.length === 1 ? 'coincidencia' : 'coincidencias'}
                </span>
              )}
            </div>
          </div>

          {/* Tabla de Clientes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#3A3A48]">
                <tr>
                  <th className="px-3 py-3">N° Cliente</th>
                  <th className="px-4 py-3">Cliente / Razón Social</th>
                  <th className="px-4 py-3">DNI / CUIT</th>
                  <th className="px-3 py-3">Fidelización</th>
                  <th className="px-3 py-3 text-center">Vehículos</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center" id="no-clientes-msg" data-testid="no-clientes-msg">
                      <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 dark:text-slate-500">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <UserX className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron clientes</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                          {searchTerm 
                            ? `No hay coincidencias para "${searchTerm}". Probá con otro documento, apellido o número de cliente.` 
                            : 'No hay clientes registrados en el sistema.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const isSelected = selectedClient?.id === client.id;
                    return (
                      <tr
                        key={client.id}
                        id={`client-row-${client.id}`}
                        data-testid={`client-row-${client.id}`}
                        onClick={() => setSelectedClientId(client.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-red-500/10 border-l-4 border-l-red-600 text-slate-900 dark:text-white font-semibold' 
                            : 'hover:bg-slate-50 dark:hover:bg-[#202028]'
                        }`}
                      >
                        <td className="px-3 py-3.5 font-mono font-bold text-slate-500 dark:text-slate-400">
                          #{client.nroCliente || '---'}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}>
                              {client.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{client.name}</p>
                              {client.email && <p className="text-[10px] text-slate-400">{client.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                          <span className="text-[10px] text-slate-400 block font-normal">{client.tipoDocumento || 'DOC'}</span>
                          {client.cuitDni}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            {client.nivelFidelizacion || 'Sin nivel asignado'}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center font-mono font-bold">
                          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                            {client.vehicleCount}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className={client.status === 'Activo' ? 'badge-green' : 'badge-gray'}>
                            {client.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA (DETALLE): VEHÍCULOS ASOCIADOS (5 COLS) */}
        <div className="lg:col-span-5 card-surface rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block">
                Detalle de Flota
              </span>
              <h2 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[220px]">
                {selectedClient ? selectedClient.name : 'Sin cliente seleccionado'}
              </h2>
            </div>

            {selectedClient && (
              <button
                onClick={() => setIsVehicleModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Asociar Vehículo</span>
              </button>
            )}
          </div>

          {!selectedClient ? (
            <div 
              id="no-clientes-detail-msg" 
              data-testid="no-clientes-detail-msg"
              className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-[#3A3A48] rounded-xl space-y-3"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <UserX className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No se encontraron clientes</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Seleccioná o buscá un cliente válido para visualizar sus datos personales, fiscales y sus vehículos registrados.
              </p>
            </div>
          ) : (
            <>
              {/* Info resumida del cliente */}
              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E1E24] border border-slate-200 dark:border-[#3A3A48]">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">N° Cliente</span>
                  <span className="font-mono font-bold text-red-600 dark:text-red-400">#{selectedClient.nroCliente || '---'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Fidelización</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {selectedClient.nivelFidelizacion || 'Sin nivel asignado'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    {selectedClient.tipoDocumento || 'CUIT / DNI'}
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedClient.cuitDni}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Teléfono</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedClient.phone}</span>
                </div>
                {selectedClient.email && (
                  <div className="col-span-2 pt-1 border-t border-slate-200/50 dark:border-[#3A3A48]/50">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Email de Contacto</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedClient.email}</span>
                  </div>
                )}
              </div>

              {/* Lista de Vehículos Asociados */}
              <div className="space-y-3 pt-1">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Vehículos Registrados ({associatedVehicles.length})
                </h3>

            {associatedVehicles.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-[#3A3A48] rounded-xl space-y-2">
                <Car className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-medium text-slate-500">Este cliente aún no tiene vehículos asociados.</p>
                <button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  + Asociar primer vehículo
                </button>
              </div>
            ) : (
              associatedVehicles.map((veh) => (
                <div
                  key={veh.plate}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-white dark:bg-[#202028] hover:border-red-600/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold text-xs tracking-wider shadow-sm">
                      {veh.plate}
                    </span>
                    <span className={
                      veh.status === 'Aprobado' || veh.status === 'Activo' 
                        ? 'badge-green' 
                        : veh.status === 'En taller' 
                        ? 'badge-yellow' 
                        : 'badge-gray'
                    }>
                      {veh.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {veh.brandModel}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Año {veh.year} • {veh.mileage.toLocaleString()} km
                    </p>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono truncate pt-1 border-t border-slate-100 dark:border-[#2E2E3A]">
                    VIN: {veh.vin}
                  </div>
                </div>
              ))
            )}
          </div>
            </>
          )}
        </div>

      </div>

      {/* ============================================================ */}
      {/* MODAL REQUERIDO: "REGISTRAR NUEVO CLIENTE" CON FONDO OSCURO TRANSLÚCIDO */}
      {/* ============================================================ */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg card-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-[#3A3A48] overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-[#3A3A48] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Registrar Nuevo Cliente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Los campos obligatorios están marcados con un asterisco (<span className="text-red-600 font-bold">*</span>)
                </p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveClient} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre y Apellido / Razón Social <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="ej: Transportes Patagónicos S.A. o Juan Pérez"
                  className="app-input w-full px-3.5 py-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    DNI / CUIT <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientCuit}
                    onChange={(e) => setNewClientCuit(e.target.value)}
                    placeholder="ej: 30-71999888-2"
                    className="app-input w-full px-3.5 py-2.5 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="ej: 0351-4556677"
                    className="app-input w-full px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico (opcional)
                </label>
                <input
                  type="email"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  placeholder="ej: administracion@empresa.com.ar"
                  className="app-input w-full px-3.5 py-2.5"
                />
              </div>

              {/* Botones Requeridos: "Cancelar" (gris) y "Guardar Cliente" (rojo) */}
              <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all active:scale-95 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cliente</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL SECUNDARIO: ASOCIAR VEHÍCULO */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md card-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-[#3A3A48] overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-[#3A3A48] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Asociar Vehículo
                </h3>
                <p className="text-xs text-slate-500">
                  Para el cliente: <strong>{selectedClient?.name}</strong>
                </p>
              </div>
              <button onClick={() => setIsVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Patente / Dominio <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder="ej: AF-999-XX"
                  className="app-input w-full px-3.5 py-2.5 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Marca y Modelo <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder="ej: Toyota Hilux 2.8 D-4D"
                  className="app-input w-full px-3.5 py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Año</label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="app-input w-full px-3.5 py-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Kilometraje</label>
                  <input
                    type="number"
                    value={newMileage}
                    onChange={(e) => setNewMileage(Number(e.target.value))}
                    className="app-input w-full px-3.5 py-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-[#3A3A48] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm"
                >
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
