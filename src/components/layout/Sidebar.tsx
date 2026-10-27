import React from 'react';

export type ModuleKey = 'comercial' | 'recepcion' | 'operativa' | 'supervision' | 'inventario' | 'dashboard';

interface SidebarProps {
  activeModule: ModuleKey;
  onSelectModule: (module: ModuleKey) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  className = '',
}) => {
  const modules = [
    {
      id: 'dashboard' as ModuleKey,
      label: 'Dashboard General',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'comercial' as ModuleKey,
      label: '1. Comercial',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'recepcion' as ModuleKey,
      label: '2. Recepción',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'operativa' as ModuleKey,
      label: '3. Operativa Taller',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      id: 'supervision' as ModuleKey,
      label: '4. Supervisión',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 'inventario' as ModuleKey,
      label: '5. Inventario y Red',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={`w-56 flex-shrink-0 bg-white dark:bg-[#1E1E24] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between py-4 px-3 select-none transition-colors ${className}`}
    >
      <div className="space-y-6">
        {/* Brand Logo Header */}
        <div className="flex items-center space-x-2.5 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-red-700 flex items-center justify-center text-white font-black text-base shadow-md shadow-red-600/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              AutoTech <span className="text-red-600">S.A.</span>
            </span>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Taller Central</p>
          </div>
        </div>

        {/* The 5 Required Modules */}
        <nav className="space-y-1">
          {modules.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onSelectModule(m.id)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                  isActive
                    ? 'bg-red-600/10 text-red-600 dark:text-red-400 border border-red-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}>
                  {m.icon}
                </span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Network & Infrastructure Status */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#282832] border border-slate-200 dark:border-slate-700/80">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Estado Red</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">● Online</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full w-[96%]" />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">v2.4.0 ERP • Fosas: 6/6</p>
      </div>
    </aside>
  );
};
