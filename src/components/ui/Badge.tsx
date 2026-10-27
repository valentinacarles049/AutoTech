import React from 'react';
import { WorkshopStatus } from '../../types/autotech';

interface BadgeProps {
  status: WorkshopStatus;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Badge corporativo con esquinas redondeadas según reglas de negocio de AutoTech S.A.
 * - Verde: "Aprobado", "Activo", "Entregado"
 * - Amarillo: "Pendiente", "En taller"
 * - Gris: "Cancelado", "Inactivo"
 */
export const Badge: React.FC<BadgeProps> = ({ status, children, className = '' }) => {
  const getBadgeStyle = (statusVal: WorkshopStatus) => {
    switch (statusVal) {
      case 'Aprobado':
      case 'Activo':
      case 'Entregado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700';
      case 'Pendiente':
      case 'En taller':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700';
      case 'Cancelado':
      case 'Inactivo':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors ${getBadgeStyle(
        status
      )} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {children || status}
    </span>
  );
};
