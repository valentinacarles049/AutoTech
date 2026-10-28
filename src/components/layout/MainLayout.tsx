import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] dark:bg-[#1E1E24] text-slate-800 dark:text-slate-100 transition-colors">
      {/* SIDEBAR SIEMPRE VISIBLE */}
      <Sidebar />

      {/* ÁREA PRINCIPAL DE TRABAJO */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* HEADER TOPBAR CON PERFIL Y TOGGLE DE TEMA */}
        <Header
          title={title}
          subtitle={subtitle}
          badge={badge}
          actions={actions}
        />

        {/* CONTENIDO PRINCIPAL CON SCROLL INDEPENDIENTE */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
