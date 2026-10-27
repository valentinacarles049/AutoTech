import React from 'react';

export interface HeaderProps {
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLogout?: () => void;
  title?: string;
  moduleName?: string;
  user?: {
    name: string;
    role: string;
    avatarUrl?: string;
    initials?: string;
  };
}

/**
 * Topbar Corporativo de AutoTech S.A.
 * Ubicado en el área principal de trabajo, respetando el menú lateral izquierdo (sidebar).
 * Elementos a la derecha alineados horizontalmente:
 * 1. Toggle de Tema (Sol/Luna)
 * 2. Perfil de Usuario (Avatar circular + "Valen C. - Recepción")
 * 3. Botón "Cerrar Sesión" con ícono de log out
 */
export const Header: React.FC<HeaderProps> = ({
  darkMode = false,
  onToggleDarkMode,
  onLogout,
  title = 'AutoTech S.A.',
  moduleName = 'Recepción y Servicios',
  user = {
    name: 'Valen C.',
    role: 'Recepción',
    initials: 'VC',
  },
}) => {
  return (
    <header className="h-14 bg-white dark:bg-[#262630] border-b border-slate-200 dark:border-slate-700/80 px-5 flex items-center justify-between select-none transition-colors flex-shrink-0">
      {/* Extremo Izquierdo: Breadcrumb / Título de Navegación */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="text-red-600 font-extrabold tracking-tight">{title}</span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-800 dark:text-slate-200 font-bold">{moduleName}</span>
        </div>
        <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          ● Sucursal Central
        </span>
      </div>

      {/* Extremo Derecho: Toggle de Tema + Perfil ("Valen C. - Recepción") + Cerrar Sesión */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        
        {/* 1. Toggle de Tema (Sol / Luna) */}
        <button
          onClick={onToggleDarkMode}
          type="button"
          title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E1E24] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          {darkMode ? (
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* Separador vertical sutil */}
        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />

        {/* 2. Perfil de Usuario (Avatar Circular + "Valen C. - Recepción") */}
        <div className="flex items-center space-x-2.5 py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer">
          <div className="relative w-8 h-8 rounded-full ring-2 ring-red-600/80 overflow-hidden flex-shrink-0 bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user.initials || 'VC'}</span>
            )}
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
          </div>
          <div className="text-left leading-tight hidden xs:block sm:block">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {user.name} <span className="text-slate-400 dark:text-slate-500 font-normal">-</span>{' '}
              <span className="text-slate-600 dark:text-slate-400 font-medium">{user.role}</span>
            </p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" />
              En línea
            </p>
          </div>
        </div>

        {/* Separador vertical sutil */}
        <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700" />

        {/* 3. Cerrar Sesión (Ícono + texto en rojo/neutro) */}
        <button
          onClick={onLogout}
          type="button"
          title="Cerrar Sesión de AutoTech"
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/40 focus:outline-none"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Cerrar Sesión</span>
        </button>

      </div>
    </header>
  );
};
