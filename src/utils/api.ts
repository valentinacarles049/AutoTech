/**
 * Resolución dinámica de la URL base de la API Backend.
 * - Si VITE_API_URL está configurada, la utiliza explícitamente.
 * - En servidores Vite dev/preview (puertos 3000, 4173, 5173), apunta dinámicamente
 *   al puerto 4000 usando el mismo protocolo y hostname actual (soporta localhost, 127.0.0.1 y red LAN).
 * - Cuando Express sirve el build compilado (`dist/`) o detrás de un reverse proxy,
 *   usa rutas relativas same-origin (`""`) para evitar problemas de CORS y cookies.
 */
export const getApiBaseUrl = (): string => {
  const configured = (import.meta as any).env?.VITE_API_URL;
  if (configured && String(configured).trim()) {
    return String(configured).trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location;
    if (port === '3000' || port === '5173' || port === '4173') {
      return `${protocol}//${hostname}:4000`;
    }
    if (protocol.startsWith('http')) {
      return '';
    }
  }

  return 'http://localhost:4000';
};

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
