import React, { useState } from 'react';
import { Plus, Search, Car, User, Phone, FileText, Check, X } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';

export const ComercialScreen: React.FC = () => {
  const { clients, selectedClientId, setSelectedClientId, addClient, vehicles, addVehicle } = useWorkshop();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // New Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientCuit, setNewClientCuit] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // New Vehicle Form state
  const [newPlate, setNewPlate] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState(2023);
  const [newVin, setNewVin] = useState('');
  const [newMileage, setNewMileage] = useState(45000);

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const associatedVehicles = vehicles.filter(v => v.clientId === selectedClient?.id);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cuitDni.includes(searchTerm)
  );

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientCuit || !newClientPhone) return;

    addClient({
      name: newClientName,
      cuitDni: newClientCuit,
      phone: newClientPhone,
      email: newClientEmail || undefined,
    });

    setNewClientName('');
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

            {/* BOTÓN REQUERIDO: + NUEVO CLIENTE */}
            <button
              onClick={() => setIsClientModalOpen(true)}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 flex items-center space-x-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Cliente</span>
            </button>
          </div>

          {/* Buscador de Clientes */}
          <div className="p-3 bg-slate-50/50 dark:bg-[#1E1E24]/50 border-b border-slate-200 dark:border-[#3A3A48]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Nombre, Razón Social o CUIT / DNI..."
                className="app-input w-full pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Tabla de Clientes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#3A3A48]">
                <tr>
                  <th className="px-4 py-3">Cliente / Razón Social</th>
                  <th className="px-4 py-3">DNI / CUIT</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3 text-center">Vehículos</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
                {filteredClients.map((client) => {
                  const isSelected = selectedClient?.id === client.id;
                  return (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-red-500/10 border-l-4 border-l-red-600 text-slate-900 dark:text-white font-semibold' 
                          : 'hover:bg-slate-50 dark:hover:bg-[#202028]'
                      }`}
                    >
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
                        {client.cuitDni}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        {client.phone}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px]">
                          {client.vehicleCount}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={client.status === 'Activo' ? 'badge-green' : 'badge-gray'}>
                          {client.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
                {selectedClient?.name}
              </h2>
            </div>

            {/* BOTÓN REQUERIDO: + ASOCIAR VEHÍCULO */}
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Asociar Vehículo</span>
            </button>
          </div>

          {/* Info resumida del cliente */}
          <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E1E24] border border-slate-200 dark:border-[#3A3A48]">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">CUIT / DNI</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedClient?.cuitDni}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Teléfono</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedClient?.phone}</span>
            </div>
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
