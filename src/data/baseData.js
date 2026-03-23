import baseDataJson from './baseData.json'

export const BASE_DATA = baseDataJson

export const LEVEL_RANGE_KEYS = [
  { min: 1, max: 2, key: '02' },
  { min: 3, max: 5, key: '05' },
  { min: 6, max: 10, key: '10' },
  { min: 11, max: 15, key: '15' },
  { min: 16, max: 20, key: '20' },
  { min: 21, max: Number.POSITIVE_INFINITY, key: '99' },
]
