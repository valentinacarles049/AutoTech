/**
 * Normaliza una patente/dominio eliminando guiones, espacios y separadores y pasándola a mayúsculas
 * para realizar comparaciones estrictas de unicidad y búsqueda.
 *
 * Ejemplo:
 * - "AF-123-ZZ" -> "AF123ZZ"
 * - "af 123 zz" -> "AF123ZZ"
 * - "AF123ZZ"   -> "AF123ZZ"
 */
export const normalizePatente = (patente: string): string => {
  return String(patente || '')
    .trim()
    .toUpperCase()
    .replace(/[\s\-_.\u2013\u2014]+/g, '');
};
