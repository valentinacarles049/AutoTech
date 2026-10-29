import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Lock } from 'lucide-react';
import { useWorkshop, ScreenId } from '../context/WorkshopContext';
import { getAllowedScreens } from '../utils/permissions';

interface AccessDeniedScreenProps {
  requestedScreen: ScreenId;
}

const screenDisplayNames: Record<ScreenId, string> = {
  dashboard: 'Dashboard General (Métricas Gerenciales)',
  comercial: 'Módulo Comercial (Clientes y Flotas)',
  recepcion: 'Módulo de Recepción (Turnos y Presupuestos)',
  operativa: 'Operativa Taller (Terminal de Mecánica)',
  supervision: 'Supervisión & Calidad (Jefe de Taller)',
  inventario: 'Inventario y Red (Repuestos y Pañol)'
};

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({ requestedScreen }) => {
  const { user, setCurrentScreen, logout, isDark } = useWorkshop();

  const allowedScreens = getAllowedScreens(user?.role);
  const primaryScreen = allowedScreens[0] || 'dashboard';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 select-none">
      <div className={`w-full max-w-lg rounded-3xl p-8 sm:p-10 shadow-2xl border text-center transition-all ${
        isDark ? 'bg-[#1E1E24] border-[#3A3A48]' : 'bg-white border-slate-200'
      }`}>
        {/* ICONO DE ACCESO DENEGADO */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 mb-6 shadow-inner animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        {/* BADGE 403 */}
        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-600/10 text-red-600 dark:text-red-400 border border-red-600/20 mb-3">
          <Lock className="w-3.5 h-3.5 mr-1" />
          <span>Error 403 • Restricción de Seguridad</span>
        </div>

        {/* TÍTULO PRINCIPAL (HU-03: "Acceso denegado") */}
        <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          Acceso denegado
        </h1>

        <p className={`text-xs sm:text-sm leading-relaxed mb-6 ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          No dispones de los permisos necesarios para acceder a esta URL o función protegida. Tu rol asignado no cuenta con privilegios habilitados para este módulo.
        </p>

        {/* FICHA TÉCNICA DEL ROL Y SOLICITUD */}
        <div className={`p-4 rounded-2xl border text-left text-xs space-y-2.5 mb-6 ${
          isDark ? 'bg-[#282832] border-[#3E3E4E]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Función solicitada:</span>
            <span className="font-bold text-red-600 dark:text-red-400">
              {screenDisplayNames[requestedScreen] || requestedScreen}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
            <span className="text-slate-400 font-medium">Tu usuario:</span>
            <span className={`font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {user?.username} (Leg. #{user?.legajo})
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2">
            <span className="text-slate-400 font-medium">Tu rol en el sistema:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {user?.role || 'Sin Rol'}
            </span>
          </div>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => setCurrentScreen(primaryScreen)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ir a mi módulo habilitado</span>
          </button>

          <button
            onClick={logout}
            className={`w-full sm:w-auto py-3 px-4 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-2 ${
              isDark 
                ? 'border-[#3A3A48] text-slate-300 hover:bg-[#282832]' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
