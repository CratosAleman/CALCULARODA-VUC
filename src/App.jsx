import { useEffect, useMemo, useState } from 'react'
import BreakdownPanel from './components/BreakdownPanel'
import CategorySelector from './components/CategorySelector'
import ScoreEditor from './components/ScoreEditor'
import StatCard from './components/StatCard'
import TabButton from './components/TabButton'
import VucEditor from './components/VucEditor'
import { BASE_DATA } from './data/baseData'
import { useLocalStorageState } from './hooks/useLocalStorageState'
import {
  buildBreakdown,
  buildClassification,
  getAvailableClassesByRange,
  getAvailableLevelRanges,
  getClassByPoints,
  getLevelRangeKey,
  getSurfaceRangeByArea,
  getVucValue,
  sanitizeNumber,
  sumSelectedScores,
} from './utils/calculations'
import {
  cloneData,
  createDefaultSelections,
  createSelectionsForSurfaceRange,
  getRenderableMatrixSections,
} from './utils/dataTransforms'
import { formatCurrency, formatNumber } from './utils/formatters'

const TABS = [
  { key: 'calculator', label: 'Calculadora' },
  { key: 'scores', label: 'Editar puntajes' },
  { key: 'vuc', label: 'Administración de VUC' },
  { key: 'lookup', label: 'Consulta VUC' },
]

function App() {
  const [activeTab, setActiveTab] = useState('calculator')
  const [surfaceArea, setSurfaceArea] = useLocalStorageState('vuc.surfaceArea', '')
  const [levels, setLevels] = useLocalStorageState('vuc.levels', 1)
  const [autoSurfaceRange, setAutoSurfaceRange] = useLocalStorageState('vuc.autoRange', true)
  const [matrixSections, setMatrixSections] = useLocalStorageState(
    'vuc.matrixSections',
    cloneData(BASE_DATA.matrixSections),
  )
  const [classRanges, setClassRanges] = useLocalStorageState(
    'vuc.classRanges',
    cloneData(BASE_DATA.classRanges),
  )
  const [surfaceRanges, setSurfaceRanges] = useLocalStorageState(
    'vuc.surfaceRanges',
    cloneData(BASE_DATA.surfaceRanges),
  )
  const [vucTable, setVucTable] = useLocalStorageState('vuc.vucTable', cloneData(BASE_DATA.vucTable))
  const [selections, setSelections] = useLocalStorageState(
    'vuc.selections',
    createDefaultSelections(BASE_DATA.matrixSections),
  )
  const [consultLevelRange, setConsultLevelRange] = useLocalStorageState('vuc.lookup.range', '02')
  const [consultClass, setConsultClass] = useLocalStorageState('vuc.lookup.class', '')

  const safeSurfaceArea = sanitizeNumber(surfaceArea, 0)
  const safeLevels = Math.max(1, Math.floor(sanitizeNumber(levels, 1)))
  const renderableMatrixSections = useMemo(
    () => getRenderableMatrixSections(matrixSections),
    [matrixSections],
  )

  const totalPoints = useMemo(
    () => sumSelectedScores(renderableMatrixSections, selections),
    [renderableMatrixSections, selections],
  )

  const matchedSurfaceRange = useMemo(
    () => getSurfaceRangeByArea(surfaceRanges, safeSurfaceArea),
    [surfaceRanges, safeSurfaceArea],
  )

  const classResult = useMemo(
    () => getClassByPoints(classRanges, totalPoints),
    [classRanges, totalPoints],
  )

  const levelRangeKey = useMemo(() => getLevelRangeKey(safeLevels), [safeLevels])
  const classification = useMemo(
    () => buildClassification(levelRangeKey, classResult?.key),
    [levelRangeKey, classResult],
  )
  const vucValue = useMemo(
    () => getVucValue(vucTable, levelRangeKey, classResult?.key),
    [vucTable, levelRangeKey, classResult],
  )
  const estimatedValue = useMemo(() => safeSurfaceArea * vucValue, [safeSurfaceArea, vucValue])

  const breakdownRows = useMemo(
    () => buildBreakdown(renderableMatrixSections, selections),
    [renderableMatrixSections, selections],
  )
  const availableLookupRanges = useMemo(() => getAvailableLevelRanges(vucTable), [vucTable])
  const availableLookupClasses = useMemo(
    () => getAvailableClassesByRange(vucTable, consultLevelRange),
    [vucTable, consultLevelRange],
  )
  const consultedVuc = useMemo(
    () => getVucValue(vucTable, consultLevelRange, consultClass),
    [vucTable, consultLevelRange, consultClass],
  )
  const lookupClassification = useMemo(
    () => buildClassification(consultLevelRange, consultClass),
    [consultLevelRange, consultClass],
  )
  const hasLookupVuc = useMemo(
    () => vucTable?.[consultLevelRange]?.[consultClass] !== undefined,
    [vucTable, consultLevelRange, consultClass],
  )

  useEffect(() => {
    if (!availableLookupRanges.length) return
    if (!availableLookupRanges.includes(consultLevelRange)) {
      setConsultLevelRange(availableLookupRanges[0])
    }
  }, [availableLookupRanges, consultLevelRange, setConsultLevelRange])

  useEffect(() => {
    if (!availableLookupClasses.length) {
      setConsultClass('')
      return
    }
    if (!availableLookupClasses.includes(String(consultClass))) {
      setConsultClass(availableLookupClasses[0])
    }
  }, [availableLookupClasses, consultClass, setConsultClass])

  const handleSelectionChange = (itemId, optionId) => {
    setSelections((prev) => ({ ...prev, [itemId]: optionId }))
  }

  const handleScoreChange = (sectionKey, itemId, optionId, rawValue) => {
    const nextScore = sanitizeNumber(rawValue, 0)
    setMatrixSections((prev) =>
      prev.map((section) => {
        if (section.key !== sectionKey) return section
        return {
          ...section,
          items: (section.items ?? []).map((item) => {
            if (item.id !== itemId) return item
            return {
              ...item,
              options: (item.options ?? []).map((option) =>
                option.id === optionId ? { ...option, score: nextScore } : option,
              ),
            }
          }),
        }
      }),
    )
  }

  const handleVucChange = (levelKey, classKey, rawValue) => {
    const nextValue = sanitizeNumber(rawValue, 0)
    setVucTable((prev) => ({
      ...prev,
      [levelKey]: {
        ...(prev[levelKey] ?? {}),
        [classKey]: nextValue,
      },
    }))
  }

  const autocompleteByRange = () => {
    if (!matchedSurfaceRange) return
    const suggested = sanitizeNumber(matchedSurfaceRange.defaultSurface, safeSurfaceArea || 0)
    setSurfaceArea(suggested)
  }

  const resetAll = () => {
    setSurfaceArea('')
    setLevels(1)
    setAutoSurfaceRange(true)
    setMatrixSections(cloneData(BASE_DATA.matrixSections))
    setClassRanges(cloneData(BASE_DATA.classRanges))
    setSurfaceRanges(cloneData(BASE_DATA.surfaceRanges))
    setVucTable(cloneData(BASE_DATA.vucTable))
    setSelections(createDefaultSelections(BASE_DATA.matrixSections))
  }

  const resetOnlySelections = () => {
    const nextSelections = createSelectionsForSurfaceRange(
      renderableMatrixSections,
      matchedSurfaceRange,
    )
    setSelections(nextSelections)

    if (autoSurfaceRange && matchedSurfaceRange) {
      const suggested = sanitizeNumber(matchedSurfaceRange.defaultSurface, safeSurfaceArea || 0)
      setSurfaceArea(suggested)
    }
  }

  const baseDataReady =
    renderableMatrixSections.some((section) => (section.items ?? []).length > 0) &&
    classRanges.length > 0 &&
    Object.keys(vucTable ?? {}).length > 0

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-300 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Secretaría de Administración y Finanzas
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[#0f3557] md:text-3xl">{BASE_DATA.meta.title}</h1>
        <p className="mt-2 text-sm text-slate-700">
          Herramienta interna para cálculo de Valor Unitario de Construcción.
        </p>
        <p className="mt-1 text-xs text-slate-500">Subtesorería de Catastro y Padrón Territorial</p>
      </header>

      {!baseDataReady ? (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No se localizaron datos operativos en `src/data/baseData.json`.
        </div>
      ) : null}

      <nav className="mt-6 flex flex-wrap justify-center gap-2 rounded-2xl bg-white/95 p-3 shadow-sm ring-1 ring-slate-200">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            label={tab.label}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </nav>

      {activeTab === 'calculator' ? (
        <section className="mx-auto mt-6 max-w-5xl space-y-5">
          <article className="rounded-2xl border border-[#d4c3a3] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Resultado principal
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div className="h-full min-h-[130px] rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">VUC</p>
                <p className="mt-2 text-3xl font-bold text-[#7a1f3d]">{formatCurrency(vucValue)}</p>
              </div>
              <div className="h-full min-h-[130px] rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Clasificación final
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0f3557]">{classification}</p>
              </div>
              <div className="h-full min-h-[130px] rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Valor estimado
                </p>
                <p className="mt-2 text-2xl font-bold text-[#0f3557]">{formatCurrency(estimatedValue)}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                Clase: {classResult?.key ?? 'Sin clase'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">
                Clave rango nivel: {levelRangeKey}
              </span>
            </div>
          </article>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <h2 className="mb-4 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200">
              Datos de entrada
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Superficie exacta (m²)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={surfaceArea}
                  onChange={(event) => setSurfaceArea(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Número de niveles</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={safeLevels}
                  onChange={(event) => setLevels(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
                />
              </label>

              <label className="flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(autoSurfaceRange)}
                  onChange={(event) => setAutoSurfaceRange(event.target.checked)}
                />
                <span className="text-sm text-slate-700">Rango automático de superficie</span>
              </label>
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-3 md:gap-3">
              <button
                type="button"
                onClick={autocompleteByRange}
                disabled={!autoSurfaceRange}
                className="min-h-[42px] rounded-xl bg-[#0f3557] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c2b46] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Autocompletar por rango
              </button>
              <button
                type="button"
                onClick={resetOnlySelections}
                className="min-h-[42px] rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Reset solo selecciones
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="min-h-[42px] rounded-xl bg-[#7a1f3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#651a33]"
              >
                Restablecer datos base
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Clase" value={classResult?.key ?? 'Sin clase'} />
            <StatCard label="Clave rango nivel" value={levelRangeKey} />
            <StatCard label="Puntos totales" value={formatNumber(totalPoints)} />
          </div>

          <BreakdownPanel rows={breakdownRows} />

          <div className="space-y-4">
            {renderableMatrixSections.map((section) => (
              <CategorySelector
                key={section.key}
                section={section}
                selections={selections}
                onSelectionChange={handleSelectionChange}
              />
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'scores' ? (
        <section className="mx-auto mt-6 max-w-5xl">
          <ScoreEditor sections={matrixSections} onScoreChange={handleScoreChange} />
        </section>
      ) : null}

      {activeTab === 'vuc' ? (
        <section className="mx-auto mt-6 max-w-5xl">
          <VucEditor vucTable={vucTable} classRanges={classRanges} onVucChange={handleVucChange} />
        </section>
      ) : null}

      {activeTab === 'lookup' ? (
        <section className="mx-auto mt-6 max-w-5xl">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Rango de nivel</span>
                <select
                  value={consultLevelRange}
                  onChange={(event) => setConsultLevelRange(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
                >
                  {availableLookupRanges.map((rangeCode) => (
                    <option key={rangeCode} value={rangeCode}>
                      {rangeCode}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Clase</span>
                <select
                  value={consultClass}
                  onChange={(event) => setConsultClass(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
                >
                  {availableLookupClasses.map((classKey) => (
                    <option key={classKey} value={classKey}>
                      {classKey}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Rango seleccionado" value={consultLevelRange || 'Sin rango'} />
            <StatCard label="Clase seleccionada" value={consultClass || 'Sin clase'} />
            <StatCard label="Clasificación" value={lookupClassification} />
            <StatCard
              label="VUC encontrado"
              value={hasLookupVuc ? formatCurrency(consultedVuc) : 'No existe VUC para esa combinación'}
            />
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
