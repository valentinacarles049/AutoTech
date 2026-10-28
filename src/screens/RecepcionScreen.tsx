import React, { useState } from 'react';
import { AlertTriangle, Plus, Trash2, CheckCircle2, FileCheck, Car, UserCheck, Gauge } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';

export const RecepcionScreen: React.FC = () => {
  const { 
    clients, 
    vehicles, 
    budgetServices, 
    addBudgetService, 
    removeBudgetService, 
    updateBudgetService,
    selectedReceptionClient,
    selectedReceptionVehicle,
    selectVehicleForReception,
    mileageEntry,
    setMileageEntry
  } = useWorkshop();

  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceHours, setNewServiceHours] = useState(1.5);
  const [newServiceRate, setNewServiceRate] = useState(28000);
  const [isAddingService, setIsAddingService] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Resolve currently active vehicle and its automatically associated client
  const activeVehicle = vehicles.find(v => v.plate === selectedReceptionVehicle || selectedReceptionVehicle.includes(v.plate)) || vehicles[0];
  const associatedClient = clients.find(c => c.id === activeVehicle?.clientId) || clients[0];

  // Totals calculation
  const totalLabor = budgetServices.reduce((acc, curr) => acc + curr.subtotal, 0);
  const estimatedParts = 154500; // Sample estimated parts
  const iva = Math.round((totalLabor + estimatedParts) * 0.21);
  const grandTotal = totalLabor + estimatedParts + iva;

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    addBudgetService({
      description: newServiceName,
      estimatedHours: Number(newServiceHours),
      hourlyRate: Number(newServiceRate),
    });
    setNewServiceName('');
    setIsAddingService(false);
  };

  const handleEmitBudget = () => {
    setToastMessage('¡Presupuesto emitido y orden de turno generada exitosamente!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast de confirmación */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center space-x-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* ALERT BOX AMARILLO DESTACADO (REQUERIDO) */}
      {/* ============================================================ */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-400 bg-amber-500/15 text-amber-900 dark:text-amber-200 flex items-start space-x-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-black tracking-tight flex items-center space-x-2">
            <span>Alerta: El turno requiere confirmación 24hs previas</span>
            <span className="badge-yellow text-[10px] py-0.2">Regla Operativa</span>
          </h3>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            La orden no ingresará a línea de taller hasta la confirmación telefónica o digital del cliente y la reserva de los repuestos en pañol.
          </p>
        </div>
      </div>

      {/* FORMULARIO ESTRUCTURADO EN TARJETAS: DATOS GENERALES */}
      <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            <span>Datos del Cliente y Vehículo Ingresante</span>
          </h2>
          <span className="text-xs text-slate-400">
            Paso 1 de 2: Ficha Técnica
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {/* 1. SELECTOR PRINCIPAL: VEHÍCULO */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Car className="w-3.5 h-3.5 text-red-600" />
                <span>Vehículo <span className="text-red-600 font-bold">*</span></span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Paso principal</span>
            </label>
            <select
              value={activeVehicle.plate}
              onChange={(e) => selectVehicleForReception(e.target.value)}
              className="app-input w-full px-3 py-2.5 font-medium cursor-pointer"
            >
              {vehicles.map(v => (
                <option key={v.plate} value={v.plate}>
                  {v.plate} - {v.brandModel} ({v.year})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Seleccioná la unidad para autocompletar su titular y kilometraje
            </p>
          </div>

          {/* 2. CLIENTE ASOCIADO (SELECCIONADO POR SÍ SOLO DE FORMA AUTOMÁTICA) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cliente Asociado</span>
              </span>
              <span className="badge-green text-[9px] py-0 px-2 font-bold">
                ✓ Autoseleccionado
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={`${associatedClient.name} (${associatedClient.cuitDni})`}
                className="app-input w-full px-3 py-2.5 font-semibold bg-slate-100/80 dark:bg-[#1A1A22] text-slate-800 dark:text-slate-100 border-slate-300 dark:border-[#3A3A48] cursor-default select-all"
              />
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center">
              <span>● Titular vinculado por registro de dominio</span>
            </p>
          </div>

          {/* 3. KILOMETRAJE DE ENTRADA */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-500" />
                <span>Kilometraje de Entrada <span className="text-red-600 font-bold">*</span></span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Último: {activeVehicle.mileage.toLocaleString()} km</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                value={mileageEntry}
                onChange={(e) => setMileageEntry(Number(e.target.value))}
                className="app-input w-full px-3 py-2.5 font-mono text-xs font-bold"
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                km
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Lectura del odómetro en la recepción
            </p>
          </div>
        </div>
      </div>

      {/* FORMULARIO ESTRUCTURADO EN TARJETAS: TABLA EDITABLE DE SERVICIOS */}
      <div className="card-surface rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            <span>Servicios y Mano de Obra a Presupuestar</span>
          </h2>
          <button
            onClick={() => setIsAddingService(true)}
            className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-600/20 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Agregar Servicio</span>
          </button>
        </div>

        {/* Formulario rápido para agregar servicio */}
        {isAddingService && (
          <form onSubmit={handleAddService} className="p-4 rounded-xl bg-slate-50 dark:bg-[#1E1E24] border border-red-500/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end animate-in fade-in">
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold mb-1">Descripción del Servicio *</label>
              <input
                type="text"
                required
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="ej: Cambio de líquido refrigerante y termostato"
                className="app-input w-full px-3 py-2 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">Horas Est.</label>
              <input
                type="number"
                step="0.5"
                value={newServiceHours}
                onChange={(e) => setNewServiceHours(Number(e.target.value))}
                className="app-input w-full px-3 py-2 text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold mb-1">Precio Hora ($)</label>
              <input
                type="number"
                value={newServiceRate}
                onChange={(e) => setNewServiceRate(Number(e.target.value))}
                className="app-input w-full px-3 py-2 text-xs font-mono"
              />
            </div>
            <div className="sm:col-span-2 flex space-x-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setIsAddingService(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </form>
        )}

        {/* Tabla Editable */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1A1A22] text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-[#3A3A48]">
              <tr>
                <th className="px-4 py-3">Item / Servicio</th>
                <th className="px-4 py-3 w-32">Horas Est.</th>
                <th className="px-4 py-3 w-36">Precio Hora</th>
                <th className="px-4 py-3 w-36 text-right">Subtotal</th>
                <th className="px-4 py-3 w-20 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#3A3A48]">
              {budgetServices.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-50 dark:hover:bg-[#202028]">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {srv.description}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.5"
                      value={srv.estimatedHours}
                      onChange={(e) => updateBudgetService(srv.id, Number(e.target.value), srv.hourlyRate)}
                      className="app-input w-24 px-2 py-1 text-center font-mono"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    $ {srv.hourlyRate.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white text-right">
                    $ {srv.subtotal.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => removeBudgetService(srv.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de Totales e Impuestos */}
        <div className="pt-4 border-t border-slate-200 dark:border-[#3A3A48] flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
          <div className="text-xs text-slate-500 space-y-1">
            <p>• Los valores incluyen repuestos oficiales con garantía AutoTech 12 meses.</p>
            <p>• Presupuesto con validez de 7 días corridos desde su emisión.</p>
          </div>

          <div className="w-full sm:w-72 space-y-1.5 text-xs text-right bg-slate-50 dark:bg-[#1E1E24] p-4 rounded-xl border border-slate-200 dark:border-[#3A3A48]">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Mano de Obra:</span>
              <span className="font-mono">$ {totalLabor.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Repuestos Est.:</span>
              <span className="font-mono">$ {estimatedParts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>IVA (21%):</span>
              <span className="font-mono">$ {iva.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-[#3A3A48] pt-2">
              <span>Total:</span>
              <span className="text-red-600 font-mono font-black">$ {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción Final */}
        <div className="pt-4 flex justify-end space-x-3">
          <button
            onClick={() => setToastMessage('Borrador guardado localmente.')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#3A3A48] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
          >
            Guardar Borrador
          </button>
          <button
            onClick={handleEmitBudget}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all flex items-center space-x-2"
          >
            <FileCheck className="w-4 h-4" />
            <span>Emitir Presupuesto</span>
          </button>
        </div>

      </div>

    </div>
  );
};
