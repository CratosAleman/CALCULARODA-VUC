import { useMemo } from 'react'
import { crearIndicesVUS } from '../utils/vusEngine'

/**
 * Memoiza índices VUS para no reconstruirlos en cada render.
 * @param {unknown[]} catalogoMnz
 * @param {unknown[]} catalogoVus
 */
export function useVUSRegistry(catalogoMnz, catalogoVus) {
  return useMemo(() => {
    const mnz = Array.isArray(catalogoMnz) ? catalogoMnz : []
    const vus = Array.isArray(catalogoVus) ? catalogoVus : []
    const indices = crearIndicesVUS(mnz, vus)
    return {
      indices,
      totalMnz: mnz.length,
      totalVus: vus.length,
      datosCargados: mnz.length > 0 || vus.length > 0,
    }
  }, [catalogoMnz, catalogoVus])
}
