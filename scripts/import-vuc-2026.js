/**
 * Importa Excel VUC 2026 y genera:
 * - src/data/usos.json
 * - src/data/matrices_puntos.json
 * - src/data/vuc_catalogo.json
 * - src/data/vuc_2026.json (compatibilidad)
 */
import fs from 'node:fs'
import path from 'node:path'
import xlsx from 'xlsx'

const ROOT = process.cwd()
const EXCEL_PATH = path.join(ROOT, 'data_fuente', 'VUC_2026_analisis_tablas_conpuntos_JMG.xlsx')
const OUT_DIR = path.join(ROOT, 'src', 'data')
const OUTPUT_USOS = path.join(OUT_DIR, 'usos.json')
const OUTPUT_MATRICES = path.join(OUT_DIR, 'matrices_puntos.json')
const OUTPUT_CATALOGO = path.join(OUT_DIR, 'vuc_catalogo.json')
const OUTPUT_COMPAT = path.join(OUT_DIR, 'vuc_2026.json')

const ANEXO_SHEET_MAP = {
  ANEXO1_HABITACIONAL: 'ANEXO1_MATRIZHABITACIONAL',
  ANEXO2_ADAPTADA: 'ANEXO2_MATRIZ_NOHABITACIONAL',
  ANEXO3_NO_HABITACIONAL: 'ANEXO3_MATRIZ_NOHABITACIONAL',
  ANEXO4_INDUSTRIA_ABASTO_CULTURA: 'ANEXO4_MATRIZ_NOHABITACIONAL',
  ANEXO5_DEPORTES: 'ANEXO5_MATRIZ_NOHABITACIONAL',
}

const USO_TO_MATRICES = {
  H: ['ANEXO1_HABITACIONAL'],
  O: ['ANEXO2_ADAPTADA', 'ANEXO3_NO_HABITACIONAL'],
  L: ['ANEXO2_ADAPTADA', 'ANEXO3_NO_HABITACIONAL'],
  C: ['ANEXO2_ADAPTADA', 'ANEXO3_NO_HABITACIONAL'],
  S: ['ANEXO2_ADAPTADA', 'ANEXO3_NO_HABITACIONAL'],
  E: ['ANEXO2_ADAPTADA', 'ANEXO3_NO_HABITACIONAL'],
  K: ['ANEXO2_ADAPTADA', 'ANEXO3_NO_HABITACIONAL'],
  I: ['ANEXO4_INDUSTRIA_ABASTO_CULTURA'],
  A: ['ANEXO4_INDUSTRIA_ABASTO_CULTURA'],
  Q: ['ANEXO4_INDUSTRIA_ABASTO_CULTURA'],
  D: ['ANEXO5_DEPORTES'],
}

function normCell(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeText(value) {
  return normCell(value).toUpperCase()
}

function parseMoney(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const s = String(value).replace(/\$/g, '').replace(/\s/g, '').replace(/,/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function parseIncrement(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    if (value > 1 && value <= 100) return value / 100
    return value
  }
  const s = String(value).trim().replace(/%/g, '').replace(/,/g, '')
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  if (n > 1 && n <= 100) return n / 100
  return n
}

function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const txt = normCell(value)
  if (!txt) return null
  const parsed = Number(txt.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

function parseUsoCell(text) {
  const raw = normCell(text)
  if (!raw) return { usoClave: '', usoNombre: '' }
  const collapsed = raw.replace(/\s+/g, ' ').trim()
  const spaceIdx = collapsed.indexOf(' ')
  if (spaceIdx === -1) {
    return { usoClave: collapsed.slice(0, 3) || collapsed, usoNombre: collapsed }
  }
  return {
    usoClave: collapsed.slice(0, spaceIdx).trim(),
    usoNombre: collapsed.slice(spaceIdx + 1).trim(),
  }
}

function normalizeRangoClave(v) {
  const s = normCell(v)
  if (!s) return ''
  return s.padStart(2, '0').slice(-2)
}

function buildClasificacion(usoClave, rangoClave, clase) {
  const rc = normalizeRangoClave(rangoClave)
  const c = clase === null || clase === undefined ? '' : String(clase)
  if (!usoClave || !rc || c === '') return ''
  return `${usoClave}${rc}${c}`
}

function isHeaderRow(row) {
  const a = normalizeText(row?.[0])
  const b = normalizeText(row?.[1])
  if (a === 'GRUPO' || b === 'CLAVE') return true
  if (normalizeText(row?.[3]).includes('NÚMERO') && normalizeText(row?.[4]) === 'CLASE') return true
  return false
}

function isDataRow(row) {
  const clase = row?.[4]
  const valor = row?.[5]
  const hasClase = clase !== null && clase !== undefined && clase !== '' && Number.isFinite(Number(clase))
  const hasValor = parseMoney(valor) !== null
  return hasClase && hasValor
}

function processVucRows(rows) {
  const out = []
  let lastGrupo = ''
  let lastUsoText = ''
  let lastRangoClave = ''
  let lastRangoNombre = ''

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] ?? []
    if (isHeaderRow(row)) continue

    const g0 = normCell(row[0])
    const g1 = normCell(row[1])
    const g2 = normCell(row[2])
    const g3 = normCell(row[3])

    if (g0) lastGrupo = g0
    if (g1) lastUsoText = row[1]
    if (g2) lastRangoClave = g2
    if (g3) lastRangoNombre = g3

    if (!isDataRow(row)) continue

    const grupo = lastGrupo
    const { usoClave, usoNombre } = parseUsoCell(lastUsoText)
    const rangoClave = normalizeRangoClave(lastRangoClave)
    const rangoNombre = lastRangoNombre ? normCell(lastRangoNombre) : ''
    const clase = Math.round(Number(row[4]))
    const valorM2 = parseMoney(row[5])
    if (!grupo || !usoClave || !rangoClave || valorM2 === null) continue

    const incrementoEntreClases = parseIncrement(row[6])
    const incForm = parseIncrement(row[7])
    const incVal = parseIncrement(row[8])

    out.push({
      grupo,
      usoClave,
      usoNombre,
      rangoClave,
      rangoNombre,
      clase,
      valorM2,
      incrementoEntreClases: incrementoEntreClases !== null ? incrementoEntreClases : null,
      incrementoMismaClaseFormula: incForm !== null ? incForm : null,
      incrementoMismaClaseValores: incVal !== null ? incVal : null,
      clasificacion: buildClasificacion(usoClave, rangoClave, clase),
    })
  }

  return out
}

function isUsefulHeaderText(txt) {
  if (!txt) return false
  const u = normalizeText(txt)
  if (!u) return false
  if (u.includes('CLASE') || u.includes('INFERIOR') || u.includes('SUPERIOR')) return false
  if (u.includes('TABLA DE PUNTOS') || u.includes('RANGO DE NIVEL')) return false
  return /[A-ZÁÉÍÓÚÑ]/.test(u)
}

function detectHeaderRow(rows) {
  let bestIdx = 0
  let bestScore = -1
  for (let i = 0; i < Math.min(rows.length, 30); i += 1) {
    const row = rows[i] ?? []
    const score = row.reduce((acc, cell) => acc + (isUsefulHeaderText(normCell(cell)) ? 1 : 0), 0)
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return bestIdx
}

function inferSectionLabels(sectionRow, fieldColumns) {
  const labels = {}
  let last = 'GENERAL'
  for (const col of fieldColumns) {
    const current = normCell(sectionRow[col])
    if (current) {
      last = current
    }
    labels[col] = last
  }
  return labels
}

function extractClassRanges(rows) {
  const map = new Map()
  for (const row of rows) {
    for (let c = 0; c < row.length - 2; c += 1) {
      const classKey = toNumber(row[c])
      const min = toNumber(row[c + 1])
      const max = toNumber(row[c + 2])
      if (!classKey || classKey < 1 || classKey > 7) continue
      if (min === null) continue
      if (max === null && classKey !== 7) continue
      const key = String(Math.round(classKey))
      if (!map.has(key)) {
        map.set(key, { key, min, max: max ?? 999999 })
      }
    }
  }
  return [...map.values()].sort((a, b) => a.min - b.min)
}

function extractMatrixFromSheet(rows, matrizId, sheetName) {
  const headerIdx = detectHeaderRow(rows)
  const headerRow = rows[headerIdx] ?? []
  const sectionRow = rows[headerIdx - 1] ?? []

  const fieldColumns = []
  for (let c = 0; c < headerRow.length; c += 1) {
    const txt = normCell(headerRow[c])
    if (isUsefulHeaderText(txt)) fieldColumns.push(c)
  }

  const sectionByCol = inferSectionLabels(sectionRow, fieldColumns)
  const sectionMap = new Map()
  const itemByCol = new Map()
  const usedKeys = new Set()

  function makeKey(prefix, index) {
    return `${prefix}${String(index).padStart(2, '0')}`
  }

  fieldColumns.forEach((col, idx) => {
    const sectionLabel = sectionByCol[col] || 'GENERAL'
    if (!sectionMap.has(sectionLabel)) {
      sectionMap.set(sectionLabel, {
        key: makeKey('SEC', sectionMap.size + 1),
        label: sectionLabel,
        items: [],
      })
    }
    const itemName = normCell(headerRow[col])
    const itemKeySeed = itemName.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toUpperCase()
    let itemId = itemKeySeed ? itemKeySeed.slice(0, 24) : makeKey('ITEM', idx + 1)
    if (usedKeys.has(itemId)) itemId = `${itemId}_${idx + 1}`
    usedKeys.add(itemId)

    const item = { id: itemId, name: itemName, options: [] }
    sectionMap.get(sectionLabel).items.push(item)
    itemByCol.set(col, item)
  })

  const optionDedup = new Set()
  let lastTextRow = null
  for (let i = headerIdx + 1; i < rows.length; i += 1) {
    const row = rows[i] ?? []
    const rowText = row.map((v) => normalizeText(v)).join(' | ')
    if (rowText.includes('ESCENARIO') || rowText.includes('PUNTOS TOTALES')) break

    const numericCols = fieldColumns.filter((col) => toNumber(row[col]) !== null)
    if (numericCols.length >= 2) {
      for (const col of numericCols) {
        const item = itemByCol.get(col)
        if (!item) continue
        const score = toNumber(row[col])
        if (score === null) continue
        const label = normCell(lastTextRow?.[col]) || `Opción ${item.options.length + 1}`
        const dedupKey = `${item.id}::${label}::${score}`
        if (optionDedup.has(dedupKey)) continue
        optionDedup.add(dedupKey)
        item.options.push({
          id: makeKey('OP', item.options.length + 1),
          label,
          score,
        })
      }
      continue
    }

    const textCols = fieldColumns.filter((col) => {
      const txt = normCell(row[col])
      return txt && toNumber(txt) === null
    })
    if (textCols.length >= 2) lastTextRow = row
  }

  const sections = [...sectionMap.values()]
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.options.length > 0),
    }))
    .filter((section) => section.items.length > 0)

  const classRanges = extractClassRanges(rows)

  return {
    matrizId,
    anexo: matrizId.replace('ANEXO', 'ANEXO '),
    titulo: matrizId,
    sheetName,
    sections,
    classRanges,
  }
}

function buildUsos(vucBaseRows) {
  const map = new Map()
  for (const row of vucBaseRows) {
    if (!row.usoClave) continue
    if (!map.has(row.usoClave)) {
      const matricesPermitidas = USO_TO_MATRICES[row.usoClave] ?? []
      map.set(row.usoClave, {
        usoClave: row.usoClave,
        usoNombre: row.usoNombre,
        grupo: row.grupo,
        matricesPermitidas,
        matrizDefault: matricesPermitidas[0] ?? null,
      })
    }
  }
  return [...map.values()].sort((a, b) => a.usoClave.localeCompare(b.usoClave))
}

function buildCatalogo(vucBaseRows) {
  const out = []
  for (const row of vucBaseRows) {
    const allowed = USO_TO_MATRICES[row.usoClave] ?? []
    for (const matrizId of allowed) {
      out.push({
        matrizId,
        ...row,
      })
    }
  }
  return out
}

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error('No se encontró:', EXCEL_PATH)
    process.exit(1)
  }

  const workbook = xlsx.readFile(EXCEL_PATH, { cellDates: false })
  const vucSheet = workbook.Sheets['VUC 2026 (391)']
  if (!vucSheet) {
    console.error('No se encontró la hoja VUC 2026 (391).')
    process.exit(1)
  }
  const vucRowsRaw = xlsx.utils.sheet_to_json(vucSheet, { header: 1, defval: null, raw: true })
  const vucBaseRows = processVucRows(vucRowsRaw)
  const usos = buildUsos(vucBaseRows)
  const vucCatalogo = buildCatalogo(vucBaseRows)

  const matrices = []
  for (const [matrizId, sheetName] of Object.entries(ANEXO_SHEET_MAP)) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
    matrices.push(extractMatrixFromSheet(rows, matrizId, sheetName))
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUTPUT_USOS, `${JSON.stringify(usos, null, 2)}\n`, 'utf8')
  fs.writeFileSync(OUTPUT_MATRICES, `${JSON.stringify(matrices, null, 2)}\n`, 'utf8')
  fs.writeFileSync(OUTPUT_CATALOGO, `${JSON.stringify(vucCatalogo, null, 2)}\n`, 'utf8')
  fs.writeFileSync(OUTPUT_COMPAT, `${JSON.stringify(vucBaseRows, null, 2)}\n`, 'utf8')

  console.log(`Escrito: ${OUTPUT_USOS} (${usos.length} usos)`)
  console.log(`Escrito: ${OUTPUT_MATRICES} (${matrices.length} matrices)`)
  console.log(`Escrito: ${OUTPUT_CATALOGO} (${vucCatalogo.length} filas)`)
  console.log(`Escrito: ${OUTPUT_COMPAT} (${vucBaseRows.length} filas)`)
}

main()
