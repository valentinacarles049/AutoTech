import React, { useState, useMemo } from 'react';
import { Plus, Search, Car, User, Phone, FileText, Check, X, Filter, UserX, AlertCircle, Edit2, Wrench } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { Client, Vehicle } from '../types/autotech';

export const ComercialScreen: React.FC = () => {
  const { clients, selectedClientId, setSelectedClientId, addClient, updateClient, vehicles, addVehicle, updateVehicle, setCurrentScreen } = useWorkshop();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriterion, setSearchCriterion] = useState<'todos' | 'documento' | 'apellido' | 'nro_cliente'>('todos');
  
  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // HU-06: Modificar Cliente Modal state
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editApellido, setEditApellido] = useState('');
  const [editTipoDoc, setEditTipoDoc] = useState<'DNI' | 'CUIT' | 'Pasaporte'>('DNI');
  const [editNroDoc, setEditNroDoc] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRazonSocial, setEditRazonSocial] = useState('');
  const [editLocalidad, setEditLocalidad] = useState('');
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // HU-08: Modificar Vehículo Modal state
  const [isEditVehicleModalOpen, setIsEditVehicleModalOpen] = useState(false);
  const [selectedEditVehicle, setSelectedEditVehicle] = useState<Vehicle | null>(null);
  const [editVehPlate, setEditVehPlate] = useState('');
  const [editVehMileage, setEditVehMileage] = useState<number>(0);
  const [editVehBrand, setEditVehBrand] = useState('');
  const [editVehModel, setEditVehModel] = useState('');
  const [editVehYear, setEditVehYear] = useState<number>(new Date().getFullYear());
  const [editVehicleError, setEditVehicleError] = useState<string | null>(null);
  const [editVehicleSuccessMsg, setEditVehicleSuccessMsg] = useState<string | null>(null);
  const [isSubmittingEditVehicle, setIsSubmittingEditVehicle] = useState(false);

  // New Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientApellido, setNewClientApellido] = useState('');
  const [newClientTipoDoc, setNewClientTipoDoc] = useState<'DNI' | 'CUIT' | 'Pasaporte'>('DNI');
  const [newClientCuit, setNewClientCuit] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // New Vehicle Form state (HU-06: Registrar Vehículo)
  const [newPlate, setNewPlate] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newVin, setNewVin] = useState('');
  const [newMileage, setNewMileage] = useState<number>(0);
  const [vehicleModalError, setVehicleModalError] = useState<string | null>(null);
  const [vehicleSuccessMsg, setVehicleSuccessMsg] = useState<string | null>(null);

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

  // HU-06: Abrir modal de Modificar Cliente
  const handleOpenEditModal = (client: Client) => {
    setEditNombre(client.nombre || client.name.split(' ')[0] || '');
    setEditApellido(client.apellido || client.name.split(' ').slice(1).join(' ') || '');
    setEditTipoDoc(client.tipoDocumento || (client.cuitDni?.length > 9 ? 'CUIT' : 'DNI'));
    setEditNroDoc(client.nroDocumento || client.cuitDni || '');
    setEditEmail(client.email || '');
    setEditPhone(client.phone || client.telefono || '');
    setEditRazonSocial(client.razonSocial || '');
    setEditLocalidad(client.localidad || '');
    setEditModalError(null);
    setIsEditClientModalOpen(true);
  };

  // HU-06: Guardar modificación de datos de cliente
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setEditModalError(null);
    setIsSubmittingEdit(true);

    const res = await updateClient(selectedClient.id, {
      nombre: editNombre,
      apellido: editApellido,
      tipoDocumento: editTipoDoc,
      nroDocumento: editNroDoc,
      cuitDni: editNroDoc,
      email: editEmail,
      phone: editPhone,
      telefono: editPhone,
      razonSocial: editRazonSocial || undefined,
      localidad: editLocalidad || undefined
    });

    setIsSubmittingEdit(false);

    if (!res.success) {
      setEditModalError(res.error || 'Error al modificar el cliente');
      return;
    }

    setIsEditClientModalOpen(false);
    setEditSuccessMsg('Cliente modificado correctamente');
    setTimeout(() => setEditSuccessMsg(null), 6000);
  };

  // HU-08: Abrir modal de Modificar Vehículo
  const handleOpenEditVehicleModal = (veh: Vehicle) => {
    setSelectedEditVehicle(veh);
    setEditVehPlate(veh.plate);
    setEditVehMileage(veh.mileage);
    setEditVehBrand(veh.marca || (veh.brandModel ? veh.brandModel.split(' ')[0] : ''));
    setEditVehModel(veh.modelo || (veh.brandModel ? veh.brandModel.split(' ').slice(1).join(' ') : ''));
    setEditVehYear(veh.year);
    setEditVehicleError(null);
    setIsEditVehicleModalOpen(true);
  };

  // HU-08: Guardar modificación de datos de vehículo
  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditVehicle) return;
    setEditVehicleError(null);
    setIsSubmittingEditVehicle(true);

    const res = await updateVehicle(selectedEditVehicle.plate, {
      plate: editVehPlate,
      dominio: editVehPlate,
      mileage: Number(editVehMileage),
      kilometraje: Number(editVehMileage),
      marca: editVehBrand,
      modelo: editVehModel,
      year: Number(editVehYear)
    });

    setIsSubmittingEditVehicle(false);

    if (!res.success) {
      setEditVehicleError(res.error || 'Error al modificar el vehículo');
      return;
    }

    setIsEditVehicleModalOpen(false);
    setEditVehicleSuccessMsg('Vehículo modificado correctamente');
    setTimeout(() => setEditVehicleSuccessMsg(null), 6000);
  };

  // Handler para HU-07: Registrar Vehículo de Cliente
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleModalError(null);

    if (!selectedClient) {
      setVehicleModalError('Debe seleccionar un cliente antes de registrar un vehículo');
      return;
    }

    const cleanPlate = newPlate.trim().toUpperCase();
    const cleanBrand = newBrand.trim();
    const cleanModel = newModel.trim();
    const cleanYear = Number(newYear);

    // Criterio 1: Campos obligatorios: patente, marca, modelo y año
    if (!cleanPlate || !cleanBrand || !cleanModel || !cleanYear) {
      setVehicleModalError('Los campos patente, marca, modelo y año son obligatorios');
      return;
    }

    const currentYear = new Date().getFullYear();
    if (cleanYear < 1920 || cleanYear > currentYear + 1) {
      setVehicleModalError(`El año del vehículo debe estar entre 1920 y ${currentYear + 1}`);
      return;
    }

    // Criterio 2: La patente es única en el sistema
    // Criterio 3: El vehículo queda asociado al cliente seleccionado
    const res = await addVehicle({
      plate: cleanPlate,
      marca: cleanBrand,
      modelo: cleanModel,
      year: cleanYear,
      vin: newVin.trim() || `VIN-${cleanPlate}`,
      mileage: Number(newMileage) || 0,
      clientId: selectedClient.id,
    });

    if (!res.success) {
      setVehicleModalError(res.error || 'Error al registrar el vehículo');
      return;
    }

    // Éxito: limpiar formulario y cerrar modal
    setNewPlate('');
    setNewBrand('');
    setNewModel('');
    setNewYear(new Date().getFullYear());
    setNewVin('');
    setNewMileage(0);
    setVehicleModalError(null);
    setIsVehicleModalOpen(false);

    // Notificación de éxito
    setVehicleSuccessMsg(`Vehículo ${cleanPlate} (${cleanBrand} ${cleanModel}) registrado con éxito para ${selectedClient.name}`);
    setTimeout(() => setVehicleSuccessMsg(null), 5000);
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
              <div className="flex items-center space-x-2">
                <button
                  id="btn-modificar-cliente"
                  data-testid="btn-modificar-cliente"
                  onClick={() => handleOpenEditModal(selectedClient)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm shadow-red-600/20 cursor-pointer active:scale-95"
                  title="Modificar datos del cliente (HU-06)"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modificar Cliente</span>
                </button>
                <button
                  id="btn-open-asociar-vehiculo"
                  data-testid="btn-open-asociar-vehiculo"
                  onClick={() => {
                    setVehicleModalError(null);
                    setIsVehicleModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Asociar Vehículo</span>
                </button>
              </div>
            )}
          </div>

          {/* Notificación de éxito al modificar cliente (HU-06) */}
          {editSuccessMsg && (
            <div 
              id="edit-client-success-alert" 
              data-testid="edit-client-success-alert"
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in"
            >
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{editSuccessMsg}</span>
              </div>
              <button 
                onClick={() => setEditSuccessMsg(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Notificación de éxito al modificar vehículo (HU-08) */}
          {editVehicleSuccessMsg && (
            <div 
              id="edit-vehicle-success-alert" 
              data-testid="edit-vehicle-success-alert"
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in"
            >
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{editVehicleSuccessMsg}</span>
              </div>
              <button 
                onClick={() => setEditVehicleSuccessMsg(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Notificación de éxito al asociar vehículo */}
          {vehicleSuccessMsg && (
            <div 
              id="vehicle-success-alert" 
              data-testid="vehicle-success-alert"
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in"
            >
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{vehicleSuccessMsg}</span>
              </div>
              <button 
                onClick={() => setVehicleSuccessMsg(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200" id="selected-client-doc" data-testid="selected-client-doc">{selectedClient.cuitDni}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Teléfono</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200" id="selected-client-phone" data-testid="selected-client-phone">{selectedClient.phone}</span>
                </div>
                {selectedClient.email && (
                  <div className="col-span-2 pt-2 border-t border-slate-200/50 dark:border-[#3A3A48]/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Email de Contacto</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium" id="selected-client-email" data-testid="selected-client-email">{selectedClient.email}</span>
                    </div>
                    <button
                      id="btn-edit-contact"
                      data-testid="btn-edit-contact"
                      onClick={() => handleOpenEditModal(selectedClient)}
                      className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
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
                    <span 
                      id={`veh-plate-${veh.plate}`}
                      data-testid={`veh-plate-${veh.plate}`}
                      className="px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold text-xs tracking-wider shadow-sm"
                    >
                      {veh.plate}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        id={`btn-modificar-vehiculo-${veh.plate}`}
                        data-testid={`btn-modificar-vehiculo-${veh.plate}`}
                        onClick={() => handleOpenEditVehicleModal(veh)}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-600/30 transition-all flex items-center space-x-1 cursor-pointer"
                        title="Modificar datos del vehículo (HU-08)"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Modificar</span>
                      </button>
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
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {veh.brandModel}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Año {veh.year} • <span id={`veh-mileage-${veh.plate}`} data-testid={`veh-mileage-${veh.plate}`} className="font-bold text-slate-800 dark:text-slate-200">{veh.mileage.toLocaleString()} km</span>
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

      {/* MODAL SECUNDARIO: ASOCIAR VEHÍCULO (HU-06) */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg card-surface rounded-2xl shadow-2xl border border-slate-200 dark:border-[#3A3A48] overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-[#3A3A48] flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Registrar Vehículo de Cliente
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Asociando a: <strong className="text-slate-800 dark:text-slate-200">{selectedClient?.name}</strong> (N° Cliente: #{selectedClient?.nroCliente || '---'})
                </p>
              </div>
              <button 
                type="button"
                id="btn-close-vehicle-modal"
                onClick={() => {
                  setVehicleModalError(null);
                  setIsVehicleModalOpen(false);
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-5 space-y-4">
              {vehicleModalError && (
                <div 
                  id="vehicle-modal-error" 
                  data-testid="vehicle-modal-error"
                  className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start space-x-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold">{vehicleModalError}</span>
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Los campos obligatorios están marcados con un asterisco (<span className="text-red-600 font-bold">*</span>)
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Patente / Dominio <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  id="new-vehicle-plate"
                  data-testid="new-vehicle-plate"
                  type="text"
                  required
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                  placeholder="ej: AF-999-XX o AE-123-AA"
                  className="app-input w-full px-3.5 py-2.5 font-mono uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  La patente es única en todo el sistema.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Marca <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    id="new-vehicle-brand"
                    data-testid="new-vehicle-brand"
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="ej: Toyota, Ford, Chevrolet"
                    className="app-input w-full px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    id="new-vehicle-model"
                    data-testid="new-vehicle-model"
                    type="text"
                    required
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="ej: Hilux 2.8 D-4D, Ranger XLT"
                    className="app-input w-full px-3.5 py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Año <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    id="new-vehicle-year"
                    data-testid="new-vehicle-year"
                    type="number"
                    required
                    min={1920}
                    max={new Date().getFullYear() + 1}
                    value={newYear}
                    onChange={(e) => setNewYear(Number(e.target.value))}
                    className="app-input w-full px-3.5 py-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kilometraje Actual
                  </label>
                  <input
                    id="new-vehicle-mileage"
                    data-testid="new-vehicle-mileage"
                    type="number"
                    min={0}
                    value={newMileage}
                    onChange={(e) => setNewMileage(Number(e.target.value))}
                    className="app-input w-full px-3.5 py-2.5 font-mono"
                    placeholder="ej: 45000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Número de Chasis / VIN (opcional)
                </label>
                <input
                  id="new-vehicle-vin"
                  data-testid="new-vehicle-vin"
                  type="text"
                  value={newVin}
                  onChange={(e) => setNewVin(e.target.value.toUpperCase())}
                  placeholder="ej: 8AJBA3CD4N0198273"
                  className="app-input w-full px-3.5 py-2.5 font-mono uppercase"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  id="btn-cancel-vehicle"
                  data-testid="btn-cancel-vehicle"
                  onClick={() => {
                    setVehicleModalError(null);
                    setIsVehicleModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-save-vehicle"
                  data-testid="btn-save-vehicle"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Vehículo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODIFICAR CLIENTE (HU-06) */}
      {isEditClientModalOpen && selectedClient && (
        <div 
          id="modal-modificar-cliente"
          data-testid="modal-modificar-cliente"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="card-surface w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-[#3A3A48] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-[#3A3A48] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider block">
                  HU-06 • Modificar Cliente
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Modificar Datos del Cliente</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    #{selectedClient.nroCliente || '---'}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                id="btn-close-edit-modal"
                data-testid="btn-close-edit-modal"
                onClick={() => {
                  setEditModalError(null);
                  setIsEditClientModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUpdateClient} className="p-5 space-y-4">
              {/* Alerta de Error */}
              {editModalError && (
                <div 
                  id="edit-client-error"
                  data-testid="edit-client-error"
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{editModalError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Nombre * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="edit-client-nombre"
                    data-testid="edit-client-nombre"
                    type="text"
                    required
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    placeholder="ej: Juan"
                    className="app-input w-full px-3 py-2 text-xs"
                  />
                </div>

                {/* Apellido * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Apellido <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="edit-client-apellido"
                    data-testid="edit-client-apellido"
                    type="text"
                    required
                    value={editApellido}
                    onChange={(e) => setEditApellido(e.target.value)}
                    placeholder="ej: Pérez"
                    className="app-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Tipo Documento * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo Doc <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="edit-client-tipo-doc"
                    data-testid="edit-client-tipo-doc"
                    value={editTipoDoc}
                    onChange={(e) => setEditTipoDoc(e.target.value as any)}
                    className="app-input w-full px-3 py-2 text-xs font-bold"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CUIT">CUIT</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>

                {/* Número Documento * */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Documento <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="edit-client-nro-doc"
                    data-testid="edit-client-nro-doc"
                    type="text"
                    required
                    value={editNroDoc}
                    onChange={(e) => setEditNroDoc(e.target.value)}
                    placeholder="ej: 30123456"
                    className="app-input w-full px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Email * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico (Mail) <span className="text-red-600">*</span>
                </label>
                <input
                  id="edit-client-email"
                  data-testid="edit-client-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="ej: jperez@example.com"
                  className="app-input w-full px-3 py-2 text-xs"
                />
              </div>

              {/* Teléfono * */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono de Contacto <span className="text-red-600">*</span>
                </label>
                <input
                  id="edit-client-phone"
                  data-testid="edit-client-phone"
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="ej: 3515001122"
                  className="app-input w-full px-3 py-2 text-xs"
                />
              </div>

              {/* Razón Social (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Razón Social <span className="text-slate-400 font-normal">(Opcional para empresas)</span>
                </label>
                <input
                  id="edit-client-razon-social"
                  data-testid="edit-client-razon-social"
                  type="text"
                  value={editRazonSocial}
                  onChange={(e) => setEditRazonSocial(e.target.value)}
                  placeholder="ej: Logística Pérez S.R.L."
                  className="app-input w-full px-3 py-2 text-xs"
                />
              </div>

              {/* Botones de acción: Botón 'Guardar' */}
              <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  id="btn-cancelar-edit-cliente"
                  data-testid="btn-cancelar-edit-cliente"
                  onClick={() => {
                    setEditModalError(null);
                    setIsEditClientModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-guardar-edit-cliente"
                  data-testid="btn-guardar-edit-cliente"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MODIFICAR VEHÍCULO (HU-08) */}
      {isEditVehicleModalOpen && selectedEditVehicle && (
        <div 
          id="modal-modificar-vehiculo"
          data-testid="modal-modificar-vehiculo"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div className="card-surface w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-[#3A3A48] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-[#3A3A48] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider block">
                  HU-08 • Modificar Vehículo
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>Modificar Datos del Vehículo</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                    {selectedEditVehicle.plate}
                  </span>
                </h3>
              </div>
              <button
                type="button"
                id="btn-close-edit-vehicle-modal"
                data-testid="btn-close-edit-vehicle-modal"
                onClick={() => {
                  setEditVehicleError(null);
                  setIsEditVehicleModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleUpdateVehicle} className="p-5 space-y-4">
              {/* Alerta de Error */}
              {editVehicleError && (
                <div 
                  id="edit-vehicle-error"
                  data-testid="edit-vehicle-error"
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-start space-x-2 animate-in fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{editVehicleError}</span>
                </div>
              )}

              {/* Patente y Kilometraje */}
              <div className="grid grid-cols-2 gap-3">
                {/* Patente * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Patente (Dominio) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="edit-vehicle-plate"
                    data-testid="edit-vehicle-plate"
                    type="text"
                    required
                    value={editVehPlate}
                    onChange={(e) => setEditVehPlate(e.target.value.toUpperCase())}
                    placeholder="ej: AB123CD"
                    className="app-input w-full px-3 py-2 text-xs font-mono uppercase"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    No puede repetirse con otro vehículo
                  </p>
                </div>

                {/* Kilometraje * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kilometraje Actual (km) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="edit-vehicle-mileage"
                    data-testid="edit-vehicle-mileage"
                    type="number"
                    required
                    min={0}
                    value={editVehMileage}
                    onChange={(e) => setEditVehMileage(Number(e.target.value))}
                    placeholder="ej: 52000"
                    className="app-input w-full px-3 py-2 text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Registrado: {selectedEditVehicle.mileage.toLocaleString()} km
                  </p>
                </div>
              </div>

              {/* Marca y Modelo */}
              <div className="grid grid-cols-2 gap-3">
                {/* Marca * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Marca <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="edit-vehicle-brand"
                    data-testid="edit-vehicle-brand"
                    type="text"
                    required
                    value={editVehBrand}
                    onChange={(e) => setEditVehBrand(e.target.value)}
                    placeholder="ej: Toyota"
                    className="app-input w-full px-3 py-2 text-xs"
                  />
                </div>

                {/* Modelo * */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="edit-vehicle-model"
                    data-testid="edit-vehicle-model"
                    type="text"
                    required
                    value={editVehModel}
                    onChange={(e) => setEditVehModel(e.target.value)}
                    placeholder="ej: Corolla 2.0 SEG"
                    className="app-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Año */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Año de Fabricación <span className="text-red-600">*</span>
                </label>
                <input
                  id="edit-vehicle-year"
                  data-testid="edit-vehicle-year"
                  type="number"
                  required
                  min={1920}
                  max={new Date().getFullYear() + 1}
                  value={editVehYear}
                  onChange={(e) => setEditVehYear(Number(e.target.value))}
                  className="app-input w-full px-3 py-2 text-xs font-mono"
                />
              </div>

              {/* Botones de acción: Botón 'Guardar' */}
              <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  id="btn-cancelar-edit-vehiculo"
                  data-testid="btn-cancelar-edit-vehiculo"
                  onClick={() => {
                    setEditVehicleError(null);
                    setIsEditVehicleModalOpen(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-guardar-edit-vehiculo"
                  data-testid="btn-guardar-edit-vehiculo"
                  disabled={isSubmittingEditVehicle}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all active:scale-95 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
