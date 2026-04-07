import { sanitizeNumber } from './calculations'

/** Lista única de usos ordenada por clave */
export function getUsosList(rows) {
  const map = new Map()
  for (const r of rows ?? []) {
    if (!r?.usoClave) continue
    if (!map.has(r.usoClave)) {
      map.set(r.usoClave, {
        usoClave: r.usoClave,
        usoNombre: r.usoNombre ?? r.usoClave,
        grupo: r.grupo ?? '',
      })
    }
  }
  return [...map.values()].sort((a, b) => a.usoClave.localeCompare(b.usoClave))
}

export function getRangosForUso(rows, usoClave) {
  const seen = new Map()
  for (const r of rows ?? []) {
    if (r.usoClave !== usoClave || !r.rangoClave) continue
    if (!seen.has(r.rangoClave)) {
      seen.set(r.rangoClave, r.rangoNombre ?? r.rangoClave)
    }
  }
  return [...seen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rangoClave, rangoNombre]) => ({ rangoClave, rangoNombre }))
}

export function getClasesForUsoRango(rows, usoClave, rangoClave) {
  const set = new Set()
  for (const r of rows ?? []) {
    if (r.usoClave !== usoClave || r.rangoClave !== rangoClave) continue
    if (r.clase !== null && r.clase !== undefined) set.add(r.clase)
  }
  return [...set].sort((a, b) => a - b)
}

function normalizeClase(clase) {
  if (clase === null || clase === undefined || clase === '') return NaN
  const n = typeof clase === 'number' ? clase : Number(clase)
  return Number.isFinite(n) ? Math.round(n) : NaN
}

export function findRow(rows, usoClave, rangoClave, clase) {
  const c = normalizeClase(clase)
  if (!usoClave || !rangoClave || !Number.isFinite(c)) return undefined
  return (rows ?? []).find(
    (r) => r.usoClave === usoClave && r.rangoClave === rangoClave && r.clase === c,
  )
}

export function getValorM2(rows, usoClave, rangoClave, clase) {
  const row = findRow(rows, usoClave, rangoClave, clase)
  return row ? sanitizeNumber(row.valorM2, 0) : 0
}

/**
 * Misma regla que el import: usoClave + rango (2 dígitos) + clase (string)
 * Ej. H + 02 + 3 → H023
 */
export function buildClassification(usoClave, rangoClave, clase) {
  const rc = String(rangoClave ?? '').padStart(2, '0').slice(-2)
  const c = clase === null || clase === undefined || clase === '' ? '' : String(clase)
  if (!usoClave || !rc || c === '') return 'Sin clasificación'
  return `${usoClave}${rc}${c}`
}
