import React from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useWorkshop } from '../../context/WorkshopContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  badge,
  actions
}) => {
  const { isDark, toggleTheme, user, logout } = useWorkshop();

  return (
    <header className="h-14 bg-white dark:bg-[#1E1E24] border-b border-slate-200 dark:border-[#3A3A48] px-4 sm:px-6 flex items-center justify-between select-none flex-shrink-0 transition-colors">
      {/* EXTREMO IZQUIERDO: BREADCRUMBS & CONTEXTO */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="text-red-600 font-extrabold tracking-tight">AutoTech S.A.</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 dark:text-white font-bold">{title || 'Sistema de Gestión'}</span>
        </div>
        {subtitle && (
          <span className="hidden md:inline-block text-xs text-slate-500 dark:text-slate-400">
            • {subtitle}
          </span>
        )}
        {badge}
      </div>

      {/* EXTREMO DERECHO: ACCIONES + TOPBAR DE USUARIO */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {actions && (
          <div className="hidden lg:flex items-center space-x-2 mr-2">
            {actions}
          </div>
        )}

        {/* TOGGLE TEMA (SOL / LUNA) */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          className="p-2 rounded-lg border border-slate-200 dark:border-[#3A3A48] bg-slate-50 dark:bg-[#282832] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#32323e] transition-colors"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-[#3A3A48] hidden sm:block" />

        {/* PERFIL DE USUARIO */}
        <div className="flex items-center space-x-2.5 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#282832] transition-colors cursor-pointer">
          <div className="relative w-8 h-8 rounded-full ring-2 ring-red-600 overflow-hidden flex-shrink-0 bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <span>{user?.avatar || 'VC'}</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-[#1E1E24]" />
          </div>
          <div className="text-left leading-tight hidden xs:block sm:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>{user?.name || 'Valen C.'}</span>
              {user?.legajo && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-normal">
                  Leg. #{user.legajo}
                </span>
              )}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[210px]" title={user?.role}>
              {user?.role || 'Recepción'}
            </p>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-200 dark:bg-[#3A3A48]" />

        {/* CERRAR SESIÓN */}
        <button
          onClick={logout}
          title="Cerrar Sesión"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
};
