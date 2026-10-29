import React, { useEffect } from 'react';
import { useWorkshop } from './context/WorkshopContext';
import { LoginScreen } from './screens/LoginScreen';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardScreen } from './screens/DashboardScreen';
import { ComercialScreen } from './screens/ComercialScreen';
import { RecepcionScreen } from './screens/RecepcionScreen';
import { OperativaScreen } from './screens/OperativaScreen';
import { SupervisionScreen } from './screens/SupervisionScreen';
import { InventarioScreen } from './screens/InventarioScreen';
import { AccessDeniedScreen } from './screens/AccessDeniedScreen';
import { isScreenAllowed, getDefaultScreenForRole } from './utils/permissions';

export const AppContent: React.FC = () => {
  const { isAuthenticated, currentScreen, setCurrentScreen, user } = useWorkshop();

  // Redirigir automáticamente a la pantalla inicial del rol si el usuario no tiene acceso a la pantalla actual
  // (por ejemplo, al iniciar sesión o al ingresar a la raíz "/")
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      if (!isScreenAllowed(currentScreen, user.role)) {
        const fromUrl = typeof window !== 'undefined' ? window.location.pathname.replace(/^\/+/, '').toLowerCase() : '';
        if (!fromUrl || fromUrl === 'dashboard') {
          const defaultScreen = getDefaultScreenForRole(user.role);
          setCurrentScreen(defaultScreen);
        }
      }
    }
  }, [isAuthenticated, user?.role, currentScreen, setCurrentScreen]);

  // If not authenticated, show the Login screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const fromUrl = typeof window !== 'undefined' ? window.location.pathname.replace(/^\/+/, '').toLowerCase() : '';
  const isUnauthorizedDefault = (!fromUrl || fromUrl === 'dashboard') && !isScreenAllowed(currentScreen, user?.role);

  // Un usuario sin permiso que accede explícitamente a una URL protegida ve "Acceso denegado"
  if (!isScreenAllowed(currentScreen, user?.role) && !isUnauthorizedDefault) {
    return (
      <MainLayout
        title="Acceso Denegado"
        subtitle="Módulo no habilitado para tu perfil"
        badge={
          <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            ● 403 Restringido
          </span>
        }
      >
        <AccessDeniedScreen requestedScreen={currentScreen} />
      </MainLayout>
    );
  }

  // Active Screen Metadata
  const activeScreen = isUnauthorizedDefault ? getDefaultScreenForRole(user?.role) : currentScreen;

  const getScreenMeta = () => {
    switch (activeScreen) {
      case 'dashboard':
        return {
          title: 'Resumen Gerencial del Taller',
          subtitle: 'Métricas y Bahías en Tiempo Real',
          badge: (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ● Sucursal Central
            </span>
          ),
          component: <DashboardScreen />,
        };
      case 'comercial':
        return {
          title: 'Módulo Comercial',
          subtitle: 'Gestión de Clientes y Flotas',
          badge: (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Maestro-Detalle
            </span>
          ),
          component: <ComercialScreen />,
        };
      case 'recepcion':
        return {
          title: 'Módulo de Recepción',
          subtitle: 'Turnos y Presupuestos',
          badge: (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Requiere confirmación 24hs
            </span>
          ),
          component: <RecepcionScreen />,
        };
      case 'operativa':
        return {
          title: 'Operativa de Taller',
          subtitle: 'Terminal de Mecánica',
          badge: (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Bahía #3 • Activa
            </span>
          ),
          component: <OperativaScreen />,
        };
      case 'supervision':
        return {
          title: 'Supervisión & Calidad',
          subtitle: 'Control de Salida del Jefe de Taller',
          badge: (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
              Norma ISO 9001
            </span>
          ),
          component: <SupervisionScreen />,
        };
      case 'inventario':
        return {
          title: 'Inventario & Catálogo',
          subtitle: 'Data Grid de Repuestos y Pañol',
          badge: (
            <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Stock Central
            </span>
          ),
          component: <InventarioScreen />,
        };
      default:
        return {
          title: 'AutoTech S.A.',
          component: <DashboardScreen />,
        };
    }
  };

  const meta = getScreenMeta();

  return (
    <MainLayout
      title={meta.title}
      subtitle={meta.subtitle}
      badge={meta.badge}
    >
      {meta.component}
    </MainLayout>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
