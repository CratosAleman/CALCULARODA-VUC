/**
 * Motor de consulta VUS (Valor Unitario de Suelo).
 * Desacoplado de vucEngine.js. Usa índices en memoria para reg-man y avalor.
 */

/** Solo dígitos, pad a 3 (ej. 37 → "037"). Vacío si no es válido. */
export function normalizarRegion(reg) {
  const raw = String(reg ?? '').trim().replace(/\s+/g, '')
  if (!/^\d+$/.test(raw)) return ''
  return raw.padStart(3, '0').slice(-3)
}

/** Solo dígitos, pad a 3 (ej. 2 → "002"). */
export function normalizarManzana(man) {
  const raw = String(man ?? '').trim().replace(/\s+/g, '')
  if (!/^\d+$/.test(raw)) return ''
  return raw.padStart(3, '0').slice(-3)
}

/** Pad a 2 dígitos (ej. 1 → "01"). */
export function normalizarAlcaldia(alcaldia) {
  const raw = String(alcaldia ?? '').trim().replace(/\s+/g, '')
  if (!/^\d+$/.test(raw)) return ''
  return raw.padStart(2, '0').slice(-2)
}

/** AVALOR en mayúsculas, sin espacios. */
export function normalizarAvalor(avalor) {
  return String(avalor ?? '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
}

/** @param {unknown} v */
function normalizarValorNumerico(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const s = String(v ?? '').trim().replace(/,/g, '')
  const n = Number.parseFloat(s)
  return Number.isFinite(n) ? n : NaN
}

/**
 * Clave única región-manzana para índice.
 * @param {string} regNorm
 * @param {string} manNorm
 */
export function claveRegMan(regNorm, manNorm) {
  return `${regNorm}-${manNorm}`
}

/**
 * Construye índices a partir de catálogos ya normalizados (arrays de objetos).
 * @param {Array<{ reg: string, man: string, avalor: string, anio?: unknown, action?: string }>} catalogoMnz
 * @param {Array<{ avalor: string, alcaldia: string, valor: number, anio?: unknown, add?: string }>} catalogoVus
 */
export function crearIndicesVUS(catalogoMnz, catalogoVus) {
  /** @type {Map<string, object[]>} */
  const byRegMan = new Map()
  /** @type {Map<string, object>} */
  const byAvalorVus = new Map()
  /** @type {Map<string, object[]>} */
  const byAvalorMnz = new Map()

  for (const row of catalogoMnz ?? []) {
    const keyRm = claveRegMan(row.reg, row.man)
    if (!byRegMan.has(keyRm)) byRegMan.set(keyRm, [])
    byRegMan.get(keyRm).push(row)

    const av = row.avalor
    if (!byAvalorMnz.has(av)) byAvalorMnz.set(av, [])
    byAvalorMnz.get(av).push(row)
  }

  for (const row of catalogoVus ?? []) {
    // Si hay duplicado por avalor, conservamos el último (datos anómalos)
    byAvalorVus.set(row.avalor, row)
  }

  return { byRegMan, byAvalorVus, byAvalorMnz }
}

/**
 * @param {string} reg
 * @param {string} man
 * @param {Array} catalogoMnz
 * @param {Array} catalogoVus
 * @param {ReturnType<typeof crearIndicesVUS>} [indicesPrecalculados]
 */
export function buscarPorRegionManzana(reg, man, catalogoMnz, catalogoVus, indicesPrecalculado = null) {
  const regN = normalizarRegion(reg)
  const manN = normalizarManzana(man)
  if (!regN || !manN) {
    return { ok: false, codigo: 'FORMATO_INVALIDO', mensaje: 'Región y manzana deben ser valores numéricos válidos.' }
  }

  const idx = indicesPrecalculado ?? crearIndicesVUS(catalogoMnz, catalogoVus)
  const key = claveRegMan(regN, manN)
  const manzanas = idx.byRegMan.get(key) ?? []

  /** @type {Array<{ avalor: string, alcaldia: string, valorUnitarioSuelo: number, reg: string, man: string }>} */
  const items = []
  const vistos = new Set()

  for (const m of manzanas) {
    const vus = idx.byAvalorVus.get(m.avalor)
    if (!vus) continue
    const dedupe = `${m.avalor}|${vus.alcaldia}|${vus.valor}`
    if (vistos.has(dedupe)) continue
    vistos.add(dedupe)
    items.push({
      avalor: m.avalor,
      alcaldia: vus.alcaldia,
      valorUnitarioSuelo: vus.valor,
      reg: m.reg,
      man: m.man,
    })
  }

  return {
    ok: true,
    regionConsultada: regN,
    manzanaConsultada: manN,
    coincidencias: items.length,
    items,
    sinVusParaAlgunAvalor: manzanas.length > 0 && items.length === 0,
  }
}

/**
 * @param {string} avalor
 * @param {Array} catalogoMnz
 * @param {Array} catalogoVus
 * @param {ReturnType<typeof crearIndicesVUS>} [indicesPrecalculado]
 */
export function buscarPorAvalor(avalor, catalogoMnz, catalogoVus, indicesPrecalculado = null) {
  const av = normalizarAvalor(avalor)
  if (!av) {
    return { ok: false, codigo: 'FORMATO_INVALIDO', mensaje: 'El AVALOR no puede estar vacío.' }
  }

  const idx = indicesPrecalculado ?? crearIndicesVUS(catalogoMnz, catalogoVus)
  const vus = idx.byAvalorVus.get(av)
  if (!vus) {
    return {
      ok: true,
      encontradoVus: false,
      avalor: av,
      alcaldia: '',
      valorUnitarioSuelo: null,
      regionesManzanas: idx.byAvalorMnz.get(av) ?? [],
    }
  }

  const regionesManzanas = (idx.byAvalorMnz.get(av) ?? []).map((m) => ({
    reg: m.reg,
    man: m.man,
    anio: m.anio,
    action: m.action,
  }))

  return {
    ok: true,
    encontradoVus: true,
    avalor: av,
    alcaldia: vus.alcaldia,
    valorUnitarioSuelo: vus.valor,
    regionesManzanas,
  }
}

/**
 * API unificada de consulta.
 * @param {{
 *   tipoBusqueda: 'region-manzana' | 'avalor',
 *   reg?: string,
 *   man?: string,
 *   avalor?: string,
 *   catalogoMnz: Array,
 *   catalogoVus: Array,
 * }} params
 */
export function consultarVUS(params) {
  const { tipoBusqueda, reg, man, avalor, catalogoMnz, catalogoVus } = params

  if (!Array.isArray(catalogoMnz) || !Array.isArray(catalogoVus)) {
    return { ok: false, codigo: 'DATOS', mensaje: 'Los catálogos no están disponibles o tienen formato inválido.' }
  }

  if (catalogoMnz.length === 0 && catalogoVus.length === 0) {
    return { ok: false, codigo: 'SIN_DATOS', mensaje: 'No hay datos VUS cargados. Ejecuta los scripts de conversión y coloca los JSON en src/data/.' }
  }

  const indices = crearIndicesVUS(catalogoMnz, catalogoVus)

  if (tipoBusqueda === 'region-manzana') {
    const r = buscarPorRegionManzana(reg, man, catalogoMnz, catalogoVus, indices)
    if (!r.ok) return { ok: false, codigo: r.codigo, mensaje: r.mensaje, tipo: 'region-manzana' }
    // Hay manzanas pero ningún cruce en catálogo VUS (antes que coincidencias === 0 genérico)
    if (r.sinVusParaAlgunAvalor) {
      return {
        ok: true,
        tipo: 'region-manzana',
        advertencia: true,
        mensaje: 'Se encontraron manzanas pero ningún AVALOR tiene registro en el catálogo VUS.',
        regionConsultada: r.regionConsultada,
        manzanaConsultada: r.manzanaConsultada,
        coincidencias: 0,
        items: [],
      }
    }
    if (r.coincidencias === 0) {
      return {
        ok: true,
        tipo: 'region-manzana',
        vacio: true,
        mensaje: 'No se encontraron manzanas para la región y manzana indicadas.',
        regionConsultada: r.regionConsultada,
        manzanaConsultada: r.manzanaConsultada,
        coincidencias: 0,
        items: [],
      }
    }
    return {
      ok: true,
      tipo: 'region-manzana',
      regionConsultada: r.regionConsultada,
      manzanaConsultada: r.manzanaConsultada,
      coincidencias: r.coincidencias,
      items: r.items,
      multiple: r.coincidencias > 1,
    }
  }

  if (tipoBusqueda === 'avalor') {
    const r = buscarPorAvalor(avalor, catalogoMnz, catalogoVus, indices)
    if (!r.ok) return { ok: false, codigo: r.codigo, mensaje: r.mensaje, tipo: 'avalor' }
    if (!r.encontradoVus) {
      return {
        ok: true,
        tipo: 'avalor',
        vacio: true,
        mensaje: 'No existe registro en el catálogo VUS para ese AVALOR.',
        avalor: r.avalor,
        alcaldia: '',
        valorUnitarioSuelo: null,
        regionesManzanas: r.regionesManzanas,
      }
    }
    return {
      ok: true,
      tipo: 'avalor',
      avalor: r.avalor,
      alcaldia: r.alcaldia,
      valorUnitarioSuelo: r.valorUnitarioSuelo,
      regionesManzanas: r.regionesManzanas,
      sinManzanas: r.regionesManzanas.length === 0,
    }
  }

  return { ok: false, codigo: 'TIPO', mensaje: 'Tipo de búsqueda no reconocido.' }
}

/**
 * Normaliza un registro crudo de manzana (p. ej. desde JSON generado por script).
 * @param {Record<string, unknown>} row
 */
export function normalizarFilaManzana(row) {
  const reg = normalizarRegion(row.reg ?? row.REG)
  const man = normalizarManzana(row.man ?? row.MAN)
  const avalor = normalizarAvalor(row.avalor ?? row.AVALOR)
  const anio = row.anio ?? row.ANIO
  const action = row.action != null ? String(row.action) : row.ACTION != null ? String(row.ACTION) : ''
  return {
    anio: anio != null && String(anio).trim() !== '' ? Number(anio) || String(anio) : null,
    avalor,
    reg,
    man,
    action,
  }
}

/**
 * @param {Record<string, unknown>} row
 */
export function normalizarFilaVus(row) {
  const avalor = normalizarAvalor(row.avalor ?? row.AVALOR)
  const alcaldia = normalizarAlcaldia(row.alcaldia ?? row.ALCALDIA)
  const valor = normalizarValorNumerico(row.valor ?? row.VALOR)
  const anio = row.anio ?? row.ANIO
  const add = row.add != null ? String(row.add) : row.ADD != null ? String(row.ADD) : ''
  return {
    anio: anio != null && String(anio).trim() !== '' ? Number(anio) || String(anio) : null,
    avalor,
    alcaldia,
    valor: Number.isFinite(valor) ? valor : NaN,
    add,
  }
}
