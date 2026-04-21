/**
 * Convierte AV_VUS_*_connombre.txt (delimitado por |) a src/data/vus_catalogo_2026.json
 * Uso: node scripts/convertir_vus_txt_a_json.js [ruta/al/archivo.txt]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizarFilaVus } from '../src/utils/vusEngine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const defaultInput = path.join(__dirname, 'vus-fuentes', 'AV_VUS_2026_391_591_connombre.txt')
const outPath = path.join(__dirname, '..', 'src', 'data', 'vus_catalogo_2026.json')

function splitPipe(line) {
  return line.split('|').map((c) => c.trim())
}

function isHeaderVus(cells) {
  const low = cells.map((c) => c.toLowerCase()).join('|')
  return low.includes('avalor') && (low.includes('alcaldia') || low.includes('valor'))
}

function rowToObject(headers, cells) {
  const o = {}
  headers.forEach((h, i) => {
    o[h] = cells[i] ?? ''
  })
  return o
}

function main() {
  const inputPath = path.resolve(process.argv[2] || defaultInput)
  if (!fs.existsSync(inputPath)) {
    console.error('No se encontró el archivo:', inputPath)
    console.error('Coloca el TXT en scripts/vus-fuentes/ o pasa la ruta como argumento.')
    process.exit(1)
  }

  const text = fs.readFileSync(inputPath, 'utf8')
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) {
    console.error('Archivo vacío.')
    process.exit(1)
  }

  let headers = ['anio', 'avalor', 'alcaldia', 'valor', 'add']
  let start = 0
  if (isHeaderVus(splitPipe(lines[0]))) {
    headers = splitPipe(lines[0]).map((h) => h.toLowerCase())
    start = 1
  }

  const rows = []
  for (let i = start; i < lines.length; i++) {
    const cells = splitPipe(lines[i])
    const raw = rowToObject(headers, cells)
    const norm = normalizarFilaVus(raw)
    if (!norm.avalor || !Number.isFinite(norm.valor)) continue
    rows.push(norm)
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8')
  console.log('Escrito:', outPath, `(${rows.length} registros)`)
}

main()
