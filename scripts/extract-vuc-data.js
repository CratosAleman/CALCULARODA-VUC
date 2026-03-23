import fs from 'node:fs'
import path from 'node:path'
import xlsx from 'xlsx'

const ROOT = process.cwd()
const EXCEL_PATH = path.join(ROOT, 'data_fuente', 'VUC_2026_analisis_tablas_conpuntos_JMG.xlsx')
const OUTPUT_PATH = path.join(ROOT, 'src', 'data', 'baseData.json')

function norm(value) {
  return String(value ?? '').trim()
}

function toNumber(value) {
  if (typeof value === 'number') return value
  const txt = norm(value)
  if (!txt) return null
  const cleaned = txt.replace(/[$,\s]/g, '').replace(',', '.')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function slugify(text) {
  return norm(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function readSheetRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    throw new Error(`No se encontró la hoja requerida: ${sheetName}`)
  }
  return xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
}

function parseSurfaceLabel(label) {
  const txt = norm(label)
  const between = txt.match(/de\s+(\d+(?:\.\d+)?)\s+hasta\s+(\d+(?:\.\d+)?)/i)
  if (between) {
    const min = Number(between[1])
    const max = Number(between[2])
    return { min, max, defaultSurface: (min + max) / 2 }
  }
  const greater = txt.match(/mayor\s+de\s+(\d+(?:\.\d+)?)/i)
  if (greater) {
    const min = Number(greater[1]) + 0.01
    return { min, max: 999999, defaultSurface: Number(greater[1]) + 25 }
  }
  return null
}

function extractMatrixData(rows) {
  const headers = (rows[5] ?? []).map(norm)
  const matrixColumns = headers.slice(0, 12)
  const colSectionMap = [
    'ESPACIOS',
    'ESPACIOS',
    'ESTRUCTURA',
    'ESTRUCTURA',
    'ESTRUCTURA',
    'ESTRUCTURA',
    'ACABADOS',
    'ACABADOS',
    'ACABADOS',
    'ACABADOS',
    'ACABADOS',
    'SERVICIOS',
  ]

  const sectionOrder = ['ESPACIOS', 'ESTRUCTURA', 'ACABADOS', 'SERVICIOS']
  const matrixSections = sectionOrder.map((section) => ({
    key: section,
    label: section,
    items: [],
  }))

  const byHeaderKey = new Map()
  matrixColumns.forEach((header, colIdx) => {
    const section = colSectionMap[colIdx]
    const sectionObj = matrixSections.find((s) => s.key === section)
    const id = `R${String(colIdx + 1).padStart(3, '0')}`
    const item = { id, name: header || `Rubro ${colIdx + 1}`, options: [] }
    sectionObj.items.push(item)
    byHeaderKey.set(colIdx, item)
  })

  const classByKey = new Map()
  for (let i = 6; i < 40; i += 1) {
    const row = rows[i] ?? []
    const classKey = toNumber(row[13])
    const min = toNumber(row[14])
    const max = toNumber(row[15])
    if (
      classKey !== null &&
      min !== null &&
      classKey >= 1 &&
      classKey <= 7 &&
      min >= 0 &&
      min <= 500 &&
      !classByKey.has(String(classKey))
    ) {
      classByKey.set(String(classKey), {
        key: String(classKey),
        min,
        max: max ?? 999999,
      })
    }
  }
  const classRanges = Array.from(classByKey.values()).sort((a, b) => a.min - b.min)

  const optionStartRows = [6, 9, 12, 15, 18, 21, 24]
  optionStartRows.forEach((start) => {
    const descRow = rows[start] ?? []
    const scoreRow = rows[start + 1] ?? []
    matrixColumns.forEach((_, colIdx) => {
      const item = byHeaderKey.get(colIdx)
      if (!item) return
      const label = norm(descRow[colIdx])
      const score = toNumber(scoreRow[colIdx])
      if (!label || score === null) return
      const optionId = `O${String(item.options.length + 1).padStart(2, '0')}`
      item.options.push({ id: optionId, label, score })
    })
  })

  const surfaceRanges = []
  for (let i = 6; i < rows.length; i += 1) {
    const label = norm((rows[i] ?? [])[1])
    if (!label) continue
    if (!/de|mayor/i.test(label) || !/m2/i.test(label)) continue
    const parsed = parseSurfaceLabel(label)
    if (!parsed) continue
    const key = `S${String(surfaceRanges.length + 1).padStart(2, '0')}`
    surfaceRanges.push({ key, label, ...parsed })
  }

  const scenariosBySurfaceRange = {}
  let scenarioIdCounter = 1
  for (let i = 30; i < rows.length; i += 1) {
    const rangeLabel = norm((rows[i] ?? [])[2])
    if (!rangeLabel || !/de|mayor/i.test(rangeLabel) || !/m2/i.test(rangeLabel)) continue
    const range = surfaceRanges.find((r) => r.label === rangeLabel)
    if (!range) continue
    const scoresRow = rows[i + 1] ?? []
    const scenarios = []
    for (let c = 3; c <= 9; c += 1) {
      const description = norm((rows[i] ?? [])[c])
      const score = toNumber(scoresRow[c])
      if (!description || score === null) continue
      scenarios.push({
        id: `SC${String(scenarioIdCounter).padStart(3, '0')}`,
        description,
        score,
      })
      scenarioIdCounter += 1
    }
    scenariosBySurfaceRange[range.key] = scenarios
  }

  return { matrixSections, classRanges, surfaceRanges, scenariosBySurfaceRange }
}

function extractVucTable(rows) {
  const levelKeys = ['02', '05', '10', '15', '20', '99']
  const vucTable = Object.fromEntries(levelKeys.map((k) => [k, {}]))

  rows.forEach((row) => {
    const uso = norm(row[1])
    const rango = norm(row[2])
    const clase = toNumber(row[4])
    const valor = toNumber(row[5])
    if (!uso.includes('H') || !uso.toUpperCase().includes('HABITACIONAL')) return
    if (!levelKeys.includes(rango)) return
    if (clase === null || valor === null) return
    vucTable[rango][String(clase)] = valor
  })

  return vucTable
}

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`No existe el Excel fuente en: ${EXCEL_PATH}`)
  }

  const workbook = xlsx.readFile(EXCEL_PATH, { cellDates: false })
  const matrixRows = readSheetRows(workbook, 'ANEXO1_MATRIZHABITACIONAL')
  const vucRows = readSheetRows(workbook, 'VUC 2026 (391)')

  const { matrixSections, classRanges, surfaceRanges, scenariosBySurfaceRange } =
    extractMatrixData(matrixRows)
  const vucTable = extractVucTable(vucRows)

  const baseData = {
    meta: {
      title: 'Calculadora VUC 2026',
      description:
        'Recalcula el valor unitario habitacional con matriz editable y tabla VUC configurable.',
    },
    surfaceRanges,
    classRanges: classRanges.sort((a, b) => a.min - b.min),
    matrixSections,
    vucTable,
    scenariosBySurfaceRange,
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(baseData, null, 2)}\n`, 'utf8')

  const ambiguities = []
  if (!surfaceRanges.length) ambiguities.push('No se detectaron rangos de superficie.')
  if (!classRanges.length) ambiguities.push('No se detectaron rangos de clase por puntaje.')
  if (!matrixSections.some((s) => s.items.some((i) => i.options.length > 0))) {
    ambiguities.push('No se detectaron rubros con opciones/puntajes.')
  }
  if (!Object.values(vucTable).some((row) => Object.keys(row).length > 0)) {
    ambiguities.push('No se detectaron valores VUC.')
  }

  const duplicateItems = matrixSections.flatMap((s) => s.items).filter((item) => {
    const unique = new Set(item.options.map((o) => `${slugify(o.label)}:${o.score}`))
    return unique.size !== item.options.length
  })
  if (duplicateItems.length) {
    ambiguities.push(
      `Se detectaron opciones repetidas en ${duplicateItems.length} rubros (se conservaron tal como vienen en el Excel).`,
    )
  }

  if (ambiguities.length) {
    console.log('AMBIGUEDADES DETECTADAS:')
    ambiguities.forEach((a) => console.log(`- ${a}`))
  } else {
    console.log('Extracción completada sin ambigüedades detectadas.')
  }
}

main()
