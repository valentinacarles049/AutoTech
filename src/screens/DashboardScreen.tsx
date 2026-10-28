import React from 'react';
import { 
  Calendar, 
  Wrench, 
  CheckCircle, 
  Activity, 
  ArrowUpRight, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';

export const DashboardScreen: React.FC = () => {
  const { setCurrentScreen, workOrders } = useWorkshop();

  return (
    <div className="space-y-6">
      {/* TARJETAS DE MÉTRICAS / KPIS GERENCIALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Turnos de hoy */}
        <div className="card-surface rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Turnos de hoy</span>
            <span className="badge-green">● Activo</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              18
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +12% vs ayer
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[78%]" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">14 confirmados • 4 pendientes</p>
        </div>

        {/* KPI 2: Órdenes en proceso */}
        <div className="card-surface rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Órdenes en proceso</span>
            <span className="badge-yellow">● En taller</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              08
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Bahías 1 a 6</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-[65%]" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">6 mecánica ligera • 2 pesada</p>
        </div>

        {/* KPI 3: Listas para entrega */}
        <div className="card-surface rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Listas para entrega</span>
            <span className="badge-green">● Aprobado</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              05
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Control Calidad OK</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full w-[100%]" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Checklist ISO 9001 firmado</p>
        </div>

        {/* KPI 4: Ocupación del taller */}
        <div className="card-surface rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ocupación de taller</span>
            <span className="badge-yellow">● 92% Cap.</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-red-600 font-mono tracking-tight">
              92%
            </span>
            <span className="text-xs text-red-600 dark:text-red-400 font-bold">Alta demanda</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full w-[92%]" />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Próximo slot disponible: 16:30 hs</p>
        </div>
      </div>

      {/* SECCIÓN DOBLE: BAHÍAS EN TIEMPO REAL & ACTIVIDAD RECIENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL DE BAHÍAS ACTIVAS (8 COLS) */}
        <div className="lg:col-span-8 card-surface rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Bahías y Fosas en Tiempo Real
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoreo visual del piso de trabajo en Taller Central
              </p>
            </div>
            <button
              onClick={() => setCurrentScreen('operativa')}
              className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center space-x-1"
            >
              <span>Ver todas las órdenes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {workOrders.map((ot, idx) => (
              <div 
                key={ot.id}
                onClick={() => setCurrentScreen('operativa')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-[#3A3A48] bg-slate-50/80 dark:bg-[#1E1E24] hover:border-red-500/50 cursor-pointer transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold font-mono text-slate-500 dark:text-slate-400">
                    Bahía #{idx + 1}
                  </span>
                  <span className={ot.status === 'Aprobado' ? 'badge-green' : 'badge-yellow'}>
                    {ot.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {ot.vehicleModel}
                  </h3>
                  <p className="text-[11px] font-mono font-bold text-red-600">
                    {ot.vehiclePlate}
                  </p>
                </div>
                <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="truncate">{ot.technicianName}</span>
                  <span className="font-mono font-bold">{ot.hoursWorked}h</span>
                </div>
              </div>
            ))}

            <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-[#3A3A48] flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-xs font-bold text-slate-400">Bahía #4 (Elevador 2TN)</span>
              <span className="badge-gray">Disponible</span>
              <button 
                onClick={() => setCurrentScreen('recepcion')}
                className="text-[11px] font-bold text-red-600 hover:underline mt-1"
              >
                + Asignar Turno
              </button>
            </div>
          </div>
        </div>

        {/* ACCESOS RÁPIDOS Y ALERTAS (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-surface rounded-2xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Acciones Frecuentes
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentScreen('recepcion')}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3A48] hover:bg-slate-50 dark:hover:bg-[#1E1E24] text-left flex items-center space-x-3 transition-colors"
              >
                <div className="p-2 rounded-lg bg-red-600/10 text-red-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Nuevo Presupuesto & Turno</p>
                  <p className="text-[10px] text-slate-500">Cargar orden con cliente y repuestos</p>
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen('comercial')}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3A48] hover:bg-slate-50 dark:hover:bg-[#1E1E24] text-left flex items-center space-x-3 transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Registrar Cliente / Flota</p>
                  <p className="text-[10px] text-slate-500">Alta comercial y vehículos asociados</p>
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen('supervision')}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-[#3A3A48] hover:bg-slate-50 dark:hover:bg-[#1E1E24] text-left flex items-center space-x-3 transition-colors"
              >
                <div className="p-2 rounded-lg bg-amber-600/10 text-amber-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Control de Calidad ISO</p>
                  <p className="text-[10px] text-slate-500">Aprobar o rechazar salidas del taller</p>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
