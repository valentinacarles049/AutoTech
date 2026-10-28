import React, { useState } from 'react';
import { Wrench, Clock, PackageMinus, Plus, CheckCircle, Search } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';

export const OperativaScreen: React.FC = () => {
  const { workOrders, updateOrderHours, deductPartFromPañol, inventory } = useWorkshop();

  // Part deduction inputs per order
  const [selectedParts, setSelectedParts] = useState<{ [otId: string]: string }>({});
  const [partQuantities, setPartQuantities] = useState<{ [otId: string]: number }>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDeduct = (otId: string) => {
    const sku = selectedParts[otId];
    const qty = partQuantities[otId] || 1;
    if (!sku) return;

    deductPartFromPañol(otId, sku, qty);
    setFeedback(`Se descontó ${qty} un. de [${sku}] y se imputó a la orden.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Feedback banner */}
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center space-x-2 animate-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#282832] border border-slate-200 dark:border-[#3A3A48] shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
            <span>Órdenes de Trabajo Asignadas a Mi Puesto</span>
            <span className="badge-green text-[10px]">● Mecánico: Roberto Gómez</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Carga de tiempos reales y descuento directo de repuestos del pañol central
          </p>
        </div>
        <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Bahía #3 • Elevador 4TN
        </div>
      </div>

      {/* GRILLA PRINCIPAL DE ÓRDENES ASIGNADAS */}
      <div className="space-y-4">
        {workOrders.map((ot) => (
          <div
            key={ot.id}
            className="card-surface rounded-2xl p-5 shadow-sm border-l-4 border-l-amber-500 space-y-4 transition-all"
          >
            {/* Header de la Tarjeta de OT */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#3A3A48]">
              <div className="flex items-center space-x-3">
                <span className="px-2.5 py-1 text-xs font-mono font-extrabold bg-slate-100 dark:bg-[#1E1E24] rounded-lg text-slate-900 dark:text-white border border-slate-200 dark:border-[#3A3A48]">
                  {ot.otNumber}
                </span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {ot.vehicleModel} <span className="font-mono text-red-600">[{ot.vehiclePlate}]</span>
                </h3>
                <span className={ot.status === 'Aprobado' ? 'badge-green' : 'badge-yellow'}>
                  {ot.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Cliente: <strong className="text-slate-700 dark:text-slate-300">{ot.clientName}</strong>
              </div>
            </div>

            {/* Tarea Principal */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E1E24] border border-slate-200 dark:border-[#3A3A48] text-xs">
              <span className="font-bold text-red-600">Tarea Principal:</span> {ot.mainTask}
            </div>

            {/* ============================================================ */}
            {/* CONTROLES EXIGIDOS: RECUADRO HORAS + DESCUENTO PAÑOL */}
            {/* ============================================================ */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
              
              {/* CONTROL 1: RECUADRO NUMÉRICO PARA CARGAR HORAS TRABAJADAS */}
              <div className="md:col-span-4 p-3.5 rounded-xl bg-white dark:bg-[#202028] border border-slate-200 dark:border-[#3A3A48] flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Horas Trabajadas <span className="text-red-600 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Tiempo acumulado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={ot.hoursWorked}
                    onChange={(e) => updateOrderHours(ot.id, Number(e.target.value))}
                    className="app-input w-20 px-2 py-1.5 text-center font-mono font-bold text-sm"
                  />
                  <span className="text-xs font-bold text-slate-500">hs</span>
                </div>
              </div>

              {/* CONTROL 2: BUSCADOR/INPUT RÁPIDO PARA DESCONTAR REPUESTOS DEL PAÑOL */}
              <div className="md:col-span-8 p-3.5 rounded-xl bg-white dark:bg-[#202028] border border-slate-200 dark:border-[#3A3A48] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <PackageMinus className="w-3.5 h-3.5 text-red-600" />
                    <span>Descontar Repuestos del Pañol</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Stock en tiempo real</span>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <select
                    value={selectedParts[ot.id] || ''}
                    onChange={(e) => setSelectedParts(prev => ({ ...prev, [ot.id]: e.target.value }))}
                    className="app-input flex-1 px-3 py-2 text-xs"
                  >
                    <option value="">Seleccionar repuesto del catálogo...</option>
                    {inventory.map(p => (
                      <option key={p.sku} value={p.sku}>
                        [{p.sku}] {p.description} (Disp: {p.currentStock})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={partQuantities[ot.id] || 1}
                    onChange={(e) => setPartQuantities(prev => ({ ...prev, [ot.id]: Number(e.target.value) }))}
                    className="app-input w-20 px-2.5 py-2 text-center font-mono font-bold"
                  />

                  <button
                    type="button"
                    onClick={() => handleDeduct(ot.id)}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-95 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Descontar</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Listado de Repuestos ya Descontados en esta OT */}
            {ot.partsDeducted && ot.partsDeducted.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-[#2E2E3A] space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Repuestos Imputados a la OT:
                </span>
                <div className="flex flex-wrap gap-2">
                  {ot.partsDeducted.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#1E1E24] text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-[#3A3A48]"
                    >
                      <span className="font-mono font-bold text-red-600">[{p.quantity}x]</span>
                      <span>{p.description}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
};
