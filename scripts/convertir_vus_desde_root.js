/**
 * Lee los TXT oficiales en la raíz del proyecto (process.cwd) y genera
 * src/data/vus_manzanas_2026.json y src/data/vus_catalogo_2026.json
 *
 * Uso: npm run generar:vus
 * (Ejecutar desde la raíz del repositorio.)
 */
import fs from 'node:fs'
import path from 'node:path'
import { normalizarFilaManzana, normalizarFilaVus } from '../src/utils/vusEngine.js'

const ROOT = process.cwd()

const ENTRADA_MNZ = 'AV_MNZ_2026_391_591_connombres.txt'
const ENTRADA_VUS = 'AV_VUS_2026_391_591_connombre.txt'
const OUT_MNZ = path.resolve(ROOT, 'src', 'data', 'vus_manzanas_2026.json')
const OUT_VUS = path.resolve(ROOT, 'src', 'data', 'vus_catalogo_2026.json')

/**
 * Ruta de entrada: siempre la raíz del cwd (debe coincidir con donde se colocan los TXT oficiales).
 * @param {string} name
 */
function rutaEnRaiz(name) {
  return path.resolve(ROOT, name)
}

function requireFile(p) {
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) {
    console.error('ERROR: No se encontró el archivo esperado:')
    console.error('  ', p)
    console.error('Coloca en la raíz del proyecto (mismo directorio que package.json) el archivo con ese nombre exacto.')
    process.exit(1)
  }
}

function splitPipe(line) {
  return line.split('|').map((c) => c.trim())
}

/**
 * @param {string[]} headersLower
 * @param {string[]} cells
 */
function rowToObject(headersLower, cells) {
  const o = {}
  headersLower.forEach((h, i) => {
    o[h] = cells[i] ?? ''
  })
  return o
}

/**
 * @param {string} text
 * @param {'mnz' | 'vus'} kind
 */
function parseFile(text, kind) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
  if (lines.length < 2) {
    console.error('ERROR: el archivo no tiene encabezado y al menos una fila de datos.')
    process.exit(1)
  }

  const headCells = splitPipe(lines[0])
  const headers = headCells.map((h) => h.toLowerCase())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const cells = splitPipe(lines[i])
    if (cells.every((c) => c === '')) continue
    const raw = rowToObject(headers, cells)
    if (kind === 'mnz') {
      const norm = normalizarFilaManzana(raw)
      if (!norm.avalor || !norm.reg || !norm.man) continue
      rows.push(norm)
    } else {
      const norm = normalizarFilaVus(raw)
      if (!norm.avalor || !Number.isFinite(norm.valor)) continue
      rows.push(norm)
    }
  }

  return rows
}

function main() {
  const inMnz = rutaEnRaiz(ENTRADA_MNZ)
  const inVus = rutaEnRaiz(ENTRADA_VUS)
  requireFile(inMnz)
  requireFile(inVus)

  const textMnz = fs.readFileSync(inMnz, 'utf8')
  const textVus = fs.readFileSync(inVus, 'utf8')

  const manzanas = parseFile(textMnz, 'mnz')
  const catalogo = parseFile(textVus, 'vus')

  fs.mkdirSync(path.dirname(OUT_MNZ), { recursive: true })
  fs.writeFileSync(OUT_MNZ, JSON.stringify(manzanas, null, 2), 'utf8')
  fs.writeFileSync(OUT_VUS, JSON.stringify(catalogo, null, 2), 'utf8')

  console.log('Generado:', OUT_MNZ, `(${manzanas.length} registros)`)
  console.log('Generado:', OUT_VUS, `(${catalogo.length} registros)`)
}

main()
