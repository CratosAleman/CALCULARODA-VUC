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

export function getRenderableMatrixSections(matrixSections) {
  return (matrixSections ?? [])
    .map((section) => ({
      ...section,
      items: (section.items ?? []).filter((item) => (item.options ?? []).length > 0),
    }))
    .filter((section) => section.items.length > 0)
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase()
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
