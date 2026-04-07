import { sanitizeNumber } from './calculations'

export function resolverMatrizPorUso(usos, usoClave, matrizPreferida) {
  const uso = (usos ?? []).find((u) => u.usoClave === usoClave)
  if (!uso) return { uso: null, matrizId: null, opciones: [] }
  const opciones = uso.matricesPermitidas ?? []
  if (!opciones.length) return { uso, matrizId: null, opciones }
  if (opciones.length === 1) return { uso, matrizId: opciones[0], opciones }
  if (matrizPreferida && opciones.includes(matrizPreferida)) {
    return { uso, matrizId: matrizPreferida, opciones }
  }
  return { uso, matrizId: uso.matrizDefault ?? opciones[0], opciones }
}

export function obtenerMatriz(matrices, matrizId) {
  return (matrices ?? []).find((m) => m.matrizId === matrizId) ?? null
}

export function crearSeleccionesDefault(matriz) {
  const selections = {}
  for (const section of matriz?.sections ?? []) {
    for (const item of section.items ?? []) {
      if ((item.options ?? []).length > 0) {
        selections[item.id] = item.options[0].id
      }
    }
  }
  return selections
}

export function calcularPuntajeTotal(matriz, selections) {
  let total = 0
  for (const section of matriz?.sections ?? []) {
    for (const item of section.items ?? []) {
      const selectedOptionId = selections?.[item.id]
      const opt = (item.options ?? []).find((o) => o.id === selectedOptionId)
      total += sanitizeNumber(opt?.score, 0)
    }
  }
  return total
}

export function resolverClase(matriz, totalPuntos) {
  const safe = sanitizeNumber(totalPuntos, 0)
  return (matriz?.classRanges ?? []).find((range) => {
    const min = sanitizeNumber(range.min, Number.NEGATIVE_INFINITY)
    const max = sanitizeNumber(range.max, Number.POSITIVE_INFINITY)
    return safe >= min && safe <= max
  })
}

export function buscarVuc(catalogo, matrizId, usoClave, rangoClave, clase) {
  const c = Number(clase)
  if (!matrizId || !usoClave || !rangoClave || !Number.isFinite(c)) return null
  return (
    (catalogo ?? []).find(
      (r) =>
        r.matrizId === matrizId &&
        r.usoClave === usoClave &&
        r.rangoClave === String(rangoClave).padStart(2, '0').slice(-2) &&
        Number(r.clase) === Math.round(c),
    ) ?? null
  )
}

export function buildClasificacion(usoClave, rangoClave, clase) {
  const rc = String(rangoClave ?? '').padStart(2, '0').slice(-2)
  const c = clase === null || clase === undefined || clase === '' ? '' : String(clase)
  if (!usoClave || !rc || c === '') return 'Sin clasificación'
  return `${usoClave}${rc}${c}`
}

export function getRangosDisponibles(catalogo, matrizId, usoClave) {
  const map = new Map()
  for (const row of catalogo ?? []) {
    if (row.matrizId !== matrizId || row.usoClave !== usoClave) continue
    if (!map.has(row.rangoClave)) map.set(row.rangoClave, row.rangoNombre ?? row.rangoClave)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rangoClave, rangoNombre]) => ({ rangoClave, rangoNombre }))
}

export function getClasesDisponibles(catalogo, matrizId, usoClave, rangoClave) {
  const set = new Set()
  for (const row of catalogo ?? []) {
    if (row.matrizId !== matrizId || row.usoClave !== usoClave || row.rangoClave !== rangoClave) continue
    set.add(Number(row.clase))
  }
  return [...set].filter(Number.isFinite).sort((a, b) => a - b)
}
