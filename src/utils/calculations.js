import { LEVEL_RANGE_KEYS } from '../data/baseData'

export function sanitizeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getLevelRangeKey(levels) {
  const normalized = Math.max(1, Math.floor(sanitizeNumber(levels, 1)))
  const match = LEVEL_RANGE_KEYS.find(
    (range) => normalized >= range.min && normalized <= range.max,
  )
  return match?.key ?? '99'
}

export function getSurfaceRangeByArea(surfaceRanges, area) {
  const safeArea = sanitizeNumber(area, 0)
  const orderedRanges = [...(surfaceRanges ?? [])].sort(
    (a, b) => sanitizeNumber(a.min, 0) - sanitizeNumber(b.min, 0),
  )

  return orderedRanges.find((range, index) => {
    const min = sanitizeNumber(range.min, Number.NEGATIVE_INFINITY)
    const max = sanitizeNumber(range.max, Number.POSITIVE_INFINITY)
    const isFirst = index === 0
    const lowerBoundPass = isFirst ? safeArea >= min : safeArea > min
    return lowerBoundPass && safeArea <= max
  })
}

export function getClassByPoints(classRanges, totalPoints) {
  const safePoints = sanitizeNumber(totalPoints, 0)
  return classRanges.find((range) => {
    const min = sanitizeNumber(range.min, Number.NEGATIVE_INFINITY)
    const max = sanitizeNumber(range.max, Number.POSITIVE_INFINITY)
    return safePoints >= min && safePoints <= max
  })
}

export function sumSelectedScores(sections, selections) {
  return sections.reduce((sectionAcc, section) => {
    const sectionScore = (section.items ?? []).reduce((itemAcc, item) => {
      const selectedOptionId = selections[item.id]
      const selectedOption = (item.options ?? []).find(
        (option) => option.id === selectedOptionId,
      )
      return itemAcc + sanitizeNumber(selectedOption?.score, 0)
    }, 0)
    return sectionAcc + sectionScore
  }, 0)
}

export function buildBreakdown(sections, selections) {
  const rows = []
  ;(sections ?? []).forEach((section) => {
    ;(section.items ?? []).forEach((item) => {
      const selectedOptionId = selections[item.id]
      const selectedOption = (item.options ?? []).find(
        (option) => option.id === selectedOptionId,
      )
      rows.push({
        section: section.label,
        itemName: item.name,
        optionName: selectedOption?.label ?? 'Sin selección',
        score: sanitizeNumber(selectedOption?.score, 0),
      })
    })
  })
  return rows
}

export function buildClassification(levelRangeKey, classKey) {
  if (!levelRangeKey || !classKey) return 'Sin clasificación'
  return `H${levelRangeKey}${classKey}`
}

export function getVucValue(vucTable, levelRangeKey, classKey) {
  if (!levelRangeKey || !classKey) return 0
  return sanitizeNumber(vucTable?.[levelRangeKey]?.[classKey], 0)
}

export function getAvailableClassesByRange(vucTable, levelRangeKey) {
  const classKeys = Object.keys(vucTable?.[levelRangeKey] ?? {})
  return classKeys.sort((a, b) => sanitizeNumber(a, 0) - sanitizeNumber(b, 0))
}

export function getAvailableLevelRanges(vucTable) {
  return Object.keys(vucTable ?? {}).sort(
    (a, b) => sanitizeNumber(a, 0) - sanitizeNumber(b, 0),
  )
}
