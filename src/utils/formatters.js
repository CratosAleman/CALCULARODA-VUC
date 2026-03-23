const mxNumber = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 2,
})

const mxCurrency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
})

export function formatNumber(value) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0
  return mxNumber.format(safe)
}

export function formatCurrency(value) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0
  return mxCurrency.format(safe)
}
