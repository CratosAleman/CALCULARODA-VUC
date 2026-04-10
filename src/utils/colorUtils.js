/** @param {string} hex
 *  @param {number} alpha 0..1 */
export function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') return undefined
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (h.length !== 6) return undefined
  const n = Number.parseInt(h, 16)
  if (Number.isNaN(n)) return undefined
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}
