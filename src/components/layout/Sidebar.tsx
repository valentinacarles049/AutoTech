import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  Wrench, 
  ShieldCheck, 
  Boxes 
} from 'lucide-react';
import { useWorkshop, ScreenId } from '../../context/WorkshopContext';
import { getAllowedScreens, getDefaultScreenForRole } from '../../utils/permissions';
import logoImg from '../../assets/logo.png';

export const Sidebar: React.FC = () => {
  const { currentScreen, setCurrentScreen, user } = useWorkshop();

  const navigationItems: { id: ScreenId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard General',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'comercial',
      label: '1. Comercial',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'recepcion',
      label: '2. Recepción & Turnos',
      icon: <CalendarClock className="w-4 h-4" />,
    },
    {
      id: 'operativa',
      label: '3. Operativa Taller',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'supervision',
      label: '4. Supervisión & Calidad',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'inventario',
      label: '5. Inventario y Red',
      icon: <Boxes className="w-4 h-4" />,
    },
  ];

  // HU-03 Criterio 3: El menú muestra sólo las opciones habilitadas para el rol
  const allowedScreens = getAllowedScreens(user?.role);
  const visibleItems = navigationItems.filter(item => allowedScreens.includes(item.id));
  const defaultScreen = getDefaultScreenForRole(user?.role);

  return (
    <aside className="w-60 flex-shrink-0 bg-white dark:bg-[#1E1E24] border-r border-slate-200 dark:border-[#3A3A48] flex flex-col justify-between py-4 px-3 select-none transition-colors">
      <div className="space-y-6">
        {/* LOGO CORPORATIVO OFICIAL EN TARJETA */}
        <div 
          onClick={() => setCurrentScreen(defaultScreen)}
          className="flex items-center space-x-2.5 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-[#282832] transition-colors"
          title={`Ir a ${defaultScreen}`}
        >
          <div className="h-10 w-10 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-sm border border-slate-200 flex-shrink-0">
            <img src={logoImg} alt="AutoTech S.A." className="h-full w-auto object-contain" />
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
              AutoTech <span className="text-red-600">S.A.</span>
            </span>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">
              Taller Central ERP
            </p>
          </div>
        </div>

        {/* MÓDULOS DE NAVEGACIÓN SEGÚN ROL */}
        <nav className="space-y-1">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Módulos Habilitados
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#282832] text-slate-500 dark:text-slate-400">
              {visibleItems.length}
            </span>
          </div>
          {visibleItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-red-600/10 text-red-600 dark:text-red-400 border border-red-600/20 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282832]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ESTADO DE RED INFERIOR */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#282832] border border-slate-200 dark:border-[#3A3A48] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Estado Red</span>
          <span className="badge-green text-[10px] px-2 py-0.2">● Operativo</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-[94%]" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
          <span>Fosas Activas: 6/6</span>
          <span className="font-mono">v2.4</span>
        </div>
      </div>
    </aside>
  );
};
