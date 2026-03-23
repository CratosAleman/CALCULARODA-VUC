import path from 'node:path'
import xlsx from 'xlsx'

const ROOT = process.cwd()
const EXCEL_PATH = path.join(ROOT, 'data_fuente', 'VUC_2026_analisis_tablas_conpuntos_JMG.xlsx')

const workbook = xlsx.readFile(EXCEL_PATH, { cellDates: false })

console.log('Hojas:', workbook.SheetNames.join(' | '))

for (const name of ['ANEXO1_MATRIZHABITACIONAL', 'VUC 2026 (391)']) {
  const sheet = workbook.Sheets[name]
  if (!sheet) {
    console.log(`No existe hoja: ${name}`)
    continue
  }
  const range = sheet['!ref']
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: true })
  console.log(`\n===== ${name} =====`)
  console.log('Rango:', range)
  for (let i = 0; i < Math.min(50, rows.length); i += 1) {
    const row = rows[i] ?? []
    const printable = row.map((c) => (c === null ? '' : String(c))).join(' | ')
    if (printable.trim()) {
      console.log(`${i + 1}: ${printable}`)
    }
  }
}
