/**
 * AutoTech S.A. - Design Tokens & Theme Configuration
 * Enterprise Workshop ERP UI Kit
 */

export const tokens = {
  colors: {
    brand: {
      primary: '#DC2626', // Rojo corporativo vibrante
      primaryHover: '#B91C1C',
      primaryActive: '#991B1B',
      primaryLight: '#FEE2E2',
      primaryDark: '#7F1D1D',
    },
    light: {
      background: '#F8F9FA', // Fondo base claro
      surface: '#FFFFFF',    // Tarjetas y modales
      sidebar: '#FFFFFF',
      header: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#64748B',
      border: '#E2E8F0',
      borderFocus: '#DC2626',
      inputBackground: '#F8F9FA',
      tableHeader: '#F1F5F9',
      tableRowHover: '#F8FAFC',
    },
    dark: {
      background: '#1E1E24', // Fondo pizarra / carbón oscuro
      surface: '#282832',    // Tarjetas y modales
      sidebar: '#1E1E24',
      header: '#262630',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      border: '#3A3A48',
      borderFocus: '#EF4444',
      inputBackground: '#1E1E24',
      tableHeader: '#1A1A20',
      tableRowHover: '#2E2E3A',
    },
    badges: {
      // Regla de Negocio: Verde ("Aprobado", "Activo", "Entregado")
      success: {
        light: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dark: 'bg-emerald-950/70 text-emerald-300 border-emerald-700',
      },
      // Regla de Negocio: Amarillo ("Pendiente", "En taller")
      warning: {
        light: 'bg-amber-100 text-amber-800 border-amber-300',
        dark: 'bg-amber-950/70 text-amber-300 border-amber-700',
      },
      // Regla de Negocio: Gris ("Cancelado", "Inactivo")
      neutral: {
        light: 'bg-slate-100 text-slate-700 border-slate-300',
        dark: 'bg-slate-800 text-slate-300 border-slate-700',
      },
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: {
      xs: '0.75rem',    // 12px (mínimo admitido para ERP alta densidad)
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
    },
  },
  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    full: '9999px', // badges redondas
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    modal: '0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)',
    primaryGlow: '0 4px 14px 0 rgba(220, 38, 38, 0.35)',
  },
} as const;

export type ThemeMode = 'light' | 'dark' | 'dual';
