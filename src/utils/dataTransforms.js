export function createDefaultSelections(matrixSections) {
  const selections = {}
  ;(matrixSections ?? []).forEach((section) => {
    ;(section.items ?? []).forEach((item) => {
      if ((item.options ?? []).length > 0) {
        selections[item.id] = item.options[0].id
      }
    })
  })
  return selections
}

export function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function getRenderableMatrixSections(matrixSections) {
  return (matrixSections ?? [])
    .filter((section) => normalizeText(section.label) !== 'rango de nivel')
    .map((section) => ({
      ...section,
      items: (section.items ?? []).filter((item) => (item.options ?? []).length > 0),
    }))
    .filter((section) => section.items.length > 0)
}

/**
 * Quita la columna Excel "RANGO DE NIVEL / CLAVE" (el rango ya lo define "Número de niveles").
 * Sirve para UI y cálculo aunque localStorage siga guardando una matriz antigua.
 */
export function withoutRangoNivelClaveSection(matrix) {
  if (!matrix) return matrix
  return {
    ...matrix,
    sections: getRenderableMatrixSections(matrix.sections ?? []),
  }
}

export function createSelectionsForSurfaceRange(matrixSections, surfaceRange) {
  const selections = {}
  const normalizedRangeLabel = normalizeText(surfaceRange?.label)

  ;(matrixSections ?? []).forEach((section) => {
    ;(section.items ?? []).forEach((item) => {
      const options = item.options ?? []
      if (!options.length) return

      const matchedByLabel = options.find(
        (option) => normalizeText(option.label) === normalizedRangeLabel,
      )
      selections[item.id] = (matchedByLabel ?? options[0]).id
    })
  })

  return selections
}
