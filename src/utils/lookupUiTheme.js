import palette from '../data/lookupUiColors.json'

function normRangoKey(rangoClave) {
  return String(rangoClave ?? '').padStart(2, '0').slice(-2)
}

/** Color del “pin” para la tarjeta de uso (clave de uso, ej. H, C). */
export function lookupUsoPinColor(usoClave) {
  const k = String(usoClave ?? '').trim()
  return palette.uso[k] ?? palette.usoDefault
}

/** Color según la clave de rango del catálogo (ej. 02, 99). */
export function lookupRangoPinColor(rangoClave) {
  const k = normRangoKey(rangoClave)
  return palette.rango[k] ?? palette.rangoDefault
}

/** Tarjeta VUC: éxito vs sin resultado. */
export function lookupVucPinColor(encontrado) {
  return encontrado ? palette.vuc : palette.vucEmpty
}
