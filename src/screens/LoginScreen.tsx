import React, { useState } from 'react';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import logoImg from '../assets/logo.png';
import carImg from '../assets/car.png';

export const LoginScreen: React.FC = () => {
  const { login, isDark } = useWorkshop();
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await login(usuario, contrasena);
      if (!res.success) {
        setErrorMsg(res.error || 'Credenciales inválidas');
      }
    } catch {
      setErrorMsg('Ocurrió un error al intentar iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors ${
      isDark ? 'bg-[#15151A]' : 'bg-[#F4F5F7]'
    }`}>
      <div className={`relative w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border transition-all ${
        isDark ? 'bg-[#1E1E24] border-[#2E2E3A]' : 'bg-white border-slate-200'
      }`}>
        
        {/* COLUMNA IZQUIERDA: ROJO BORGOÑA + LOGO OFICIAL + PROPUESTA DE VALOR + AUTO DIFUMINADO */}
        <div className="md:col-span-6 bg-gradient-to-b from-[#8B1419] via-[#750E13] to-[#45070A] p-7 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden select-none">
          
          <div className="relative z-20 space-y-6">
            {/* Tarjeta Flotante Blanca con Logo Oficial */}
            <div className="bg-white rounded-2xl p-4 shadow-xl inline-flex items-center justify-center w-52 border border-white/40">
              <img src={logoImg} alt="AutoTech S.A." className="w-full h-auto object-contain" />
            </div>

            {/* Título y Bajada */}
            <div className="space-y-1.5 pt-1">
              <h2 className="text-white font-extrabold text-xl sm:text-2xl leading-snug tracking-tight">
                Sistema de Gestión de Turnos
              </h2>
              <p className="text-white/85 text-xs sm:text-sm font-normal leading-relaxed max-w-sm">
                Reparación y mantenimiento integral de vehículos en Córdoba Capital.
              </p>
            </div>

            {/* Micro-Badges de Servicios */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center space-x-3 text-white/95 text-xs sm:text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                  ✓
                </span>
                <span>Solicitud y confirmación de turnos</span>
              </div>
              <div className="flex items-center space-x-3 text-white/95 text-xs sm:text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                  ✓
                </span>
                <span>Clientes y flotas de vehículos</span>
              </div>
              <div className="flex items-center space-x-3 text-white/95 text-xs sm:text-sm font-medium">
                <span className="w-5 h-5 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                  ✓
                </span>
                <span>Presupuestos de reparación y pañol</span>
              </div>
            </div>
          </div>

          {/* Imagen del Auto Difuminada hacia el Fondo */}
          <div className="relative z-10 mt-6 -mb-7 -mx-7 sm:-mb-10 sm:-mx-10 overflow-hidden pointer-events-none">
            {/* Gradientes de difuminado superior y laterales */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#750E13] via-[#750E13]/70 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#750E13] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#750E13] to-transparent z-10 pointer-events-none" />
            
            <img 
              src={carImg} 
              alt="AutoTech Vehículos" 
              className="w-full h-auto object-cover filter contrast-[1.05] brightness-95 transform scale-[1.03]"
              style={{
                WebkitMaskImage: 'radial-gradient(ellipse 95% 85% at 50% 70%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
                maskImage: 'radial-gradient(ellipse 95% 85% at 50% 70%, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
              }}
            />
          </div>

          {/* Iluminación ambiental */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-400/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* COLUMNA DERECHA: FORMULARIO FLOTANTE ESTILIZADO */}
        <div className={`md:col-span-6 p-6 sm:p-10 flex flex-col justify-center items-center relative overflow-hidden ${
          isDark ? 'bg-[#191922]' : 'bg-[#FAF7F7]'
        }`}>
          
          {/* Tarjeta Flotante Central */}
          <div className={`w-full max-w-sm rounded-3xl p-8 sm:p-9 shadow-xl border my-auto transition-all ${
            isDark ? 'bg-[#22222C] border-[#313142]' : 'bg-white border-slate-200/80'
          }`}>
            <div className="mb-5">
              <h1 className={`text-2xl sm:text-[26px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Iniciar sesión
              </h1>
              <p className={`text-xs mt-1 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ingresá con tu usuario de empleado y rol asignado
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center space-x-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{errorMsg}</span>
              </div>
            )}

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Usuario <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="ej: valen.recepcion"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all ${
                      isDark 
                        ? 'bg-[#1A1A22] border-[#313142] text-white placeholder-slate-500' 
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                  Contraseña <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    placeholder="Ingresá tu contraseña"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border font-medium focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all ${
                      isDark 
                        ? 'bg-[#1A1A22] border-[#313142] text-white placeholder-slate-500' 
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors ${
                      isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all flex items-center justify-center space-x-2 active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verificando credenciales...</span>
                    </span>
                  ) : (
                    <>
                      <span>Ingresar al sistema</span>
                      <LogIn className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className={`text-[11px] font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  AutoTech S.A.
                </span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  v2.4 Enterprise
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
