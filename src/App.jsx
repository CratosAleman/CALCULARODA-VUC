import { useEffect, useMemo, useState } from 'react'
import BreakdownPanel from './components/BreakdownPanel'
import CategorySelector from './components/CategorySelector'
import ScoreEditor from './components/ScoreEditor'
import StatCard from './components/StatCard'
import TabButton from './components/TabButton'
import VucEditor from './components/VucEditor'
import { BASE_DATA } from './data/baseData'
import usosDefault from './data/usos.json'
import matricesDefault from './data/matrices_puntos.json'
import vucCatalogoDefault from './data/vuc_catalogo.json'
import { useLocalStorageState } from './hooks/useLocalStorageState'
import { buildBreakdown, getLevelRangeKey, getSurfaceRangeByArea, sanitizeNumber } from './utils/calculations'
import { cloneData, withoutRangoNivelClaveSection } from './utils/dataTransforms'
import { formatCurrency, formatNumber } from './utils/formatters'
import {
  buscarVuc,
  buildClasificacion,
  calcularPuntajeTotal,
  crearSeleccionesDefault,
  getClasesDisponibles,
  getRangosDisponibles,
  obtenerMatriz,
  resolverClase,
  resolverMatrizPorUso,
} from './utils/vucEngine'

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

  const [surfaceRanges, setSurfaceRanges] = useLocalStorageState(
    'vuc.surfaceRanges',
    cloneData(BASE_DATA.surfaceRanges),
  )
  const [usos, setUsos] = useLocalStorageState('vuc.usos', cloneData(usosDefault))
  const [matrices, setMatrices] = useLocalStorageState('vuc.matrices', cloneData(matricesDefault))
  const [vucCatalogo, setVucCatalogo] = useLocalStorageState('vuc.catalogo', cloneData(vucCatalogoDefault))

  const [calculatorUso, setCalculatorUso] = useLocalStorageState('vuc.calc.uso', 'H')
  const [calculatorMatriz, setCalculatorMatriz] = useLocalStorageState('vuc.calc.matriz', '')
  const [lookupUso, setLookupUso] = useLocalStorageState('vuc.lookup.uso', 'H')
  const [lookupMatriz, setLookupMatriz] = useLocalStorageState('vuc.lookup.matriz', '')
  const [lookupRango, setLookupRango] = useLocalStorageState('vuc.lookup.rango', '02')
  const [lookupClase, setLookupClase] = useLocalStorageState('vuc.lookup.clase', '3')
  const [selectionsByMatriz, setSelectionsByMatriz] = useLocalStorageState('vuc.selectionsByMatriz', {})

  const safeSurfaceArea = sanitizeNumber(surfaceArea, 0)
  const safeLevels = Math.max(1, Math.floor(sanitizeNumber(levels, 1)))
  const levelRangeKey = useMemo(() => getLevelRangeKey(safeLevels), [safeLevels])

  const calcResolution = useMemo(
    () => resolverMatrizPorUso(usos, calculatorUso, calculatorMatriz),
    [usos, calculatorUso, calculatorMatriz],
  )
  const currentMatrix = useMemo(
    () => obtenerMatriz(matrices, calcResolution.matrizId),
    [matrices, calcResolution.matrizId],
  )
  const matrixForUi = useMemo(
    () => withoutRangoNivelClaveSection(currentMatrix),
    [currentMatrix],
  )
  const renderableMatrixSections = useMemo(() => matrixForUi?.sections ?? [], [matrixForUi])

  const currentSelections = useMemo(
    () => selectionsByMatriz[calcResolution.matrizId] ?? {},
    [selectionsByMatriz, calcResolution.matrizId],
  )

  useEffect(() => {
    if (!calcResolution.matrizId) return
    if ((calcResolution.opciones ?? []).length === 1 && calculatorMatriz !== calcResolution.matrizId) {
      setCalculatorMatriz(calcResolution.matrizId)
    }
  }, [calcResolution, calculatorMatriz, setCalculatorMatriz])

  useEffect(() => {
    if (!calcResolution.matrizId || !matrixForUi) return
    const hasCurrent = Boolean(selectionsByMatriz[calcResolution.matrizId])
    if (hasCurrent) return
    setSelectionsByMatriz((prev) => ({
      ...prev,
      [calcResolution.matrizId]: crearSeleccionesDefault(matrixForUi),
    }))
  }, [calcResolution.matrizId, matrixForUi, selectionsByMatriz, setSelectionsByMatriz])

  const totalPoints = useMemo(
    () => calcularPuntajeTotal(matrixForUi, currentSelections),
    [matrixForUi, currentSelections],
  )
  const classResult = useMemo(
    () => resolverClase(matrixForUi, totalPoints),
    [matrixForUi, totalPoints],
  )
  const effectiveClase = classResult?.key ?? ''

  const calcVucRow = useMemo(
    () =>
      buscarVuc(vucCatalogo, calcResolution.matrizId, calculatorUso, levelRangeKey, effectiveClase),
    [vucCatalogo, calcResolution.matrizId, calculatorUso, levelRangeKey, effectiveClase],
  )
  const vucValue = sanitizeNumber(calcVucRow?.valorM2, 0)
  const estimatedValue = safeSurfaceArea * vucValue
  const classification = buildClasificacion(calculatorUso, levelRangeKey, effectiveClase)
  const breakdownRows = useMemo(
    () => buildBreakdown(renderableMatrixSections, currentSelections),
    [renderableMatrixSections, currentSelections],
  )

  const lookupResolution = useMemo(
    () => resolverMatrizPorUso(usos, lookupUso, lookupMatriz),
    [usos, lookupUso, lookupMatriz],
  )
  useEffect(() => {
    if (!lookupResolution.matrizId) return
    if ((lookupResolution.opciones ?? []).length === 1 && lookupMatriz !== lookupResolution.matrizId) {
      setLookupMatriz(lookupResolution.matrizId)
    }
  }, [lookupResolution, lookupMatriz, setLookupMatriz])

  const lookupRangos = useMemo(
    () => getRangosDisponibles(vucCatalogo, lookupResolution.matrizId, lookupUso),
    [vucCatalogo, lookupResolution.matrizId, lookupUso],
  )
  const lookupClases = useMemo(
    () => getClasesDisponibles(vucCatalogo, lookupResolution.matrizId, lookupUso, lookupRango),
    [vucCatalogo, lookupResolution.matrizId, lookupUso, lookupRango],
  )

  useEffect(() => {
    if (!lookupRangos.length) return
    if (!lookupRangos.some((x) => x.rangoClave === lookupRango)) {
      setLookupRango(lookupRangos[0].rangoClave)
    }
  }, [lookupRangos, lookupRango, setLookupRango])

  useEffect(() => {
    if (!lookupClases.length) return
    if (!lookupClases.some((c) => String(c) === String(lookupClase))) {
      setLookupClase(String(lookupClases[0]))
    }
  }, [lookupClases, lookupClase, setLookupClase])

  const lookupRow = useMemo(
    () => buscarVuc(vucCatalogo, lookupResolution.matrizId, lookupUso, lookupRango, lookupClase),
    [vucCatalogo, lookupResolution.matrizId, lookupUso, lookupRango, lookupClase],
  )

  const matchedSurfaceRange = useMemo(
    () => getSurfaceRangeByArea(surfaceRanges, safeSurfaceArea),
    [surfaceRanges, safeSurfaceArea],
  )

  const handleSelectionChange = (itemId, optionId) => {
    if (!calcResolution.matrizId) return
    setSelectionsByMatriz((prev) => ({
      ...prev,
      [calcResolution.matrizId]: {
        ...(prev[calcResolution.matrizId] ?? {}),
        [itemId]: optionId,
      },
    }))
  }

  const handleScoreChange = (sectionKey, itemId, optionId, rawValue) => {
    if (!calcResolution.matrizId) return
    const nextScore = sanitizeNumber(rawValue, 0)
    setMatrices((prev) =>
      (prev ?? []).map((matrix) => {
        if (matrix.matrizId !== calcResolution.matrizId) return matrix
        return {
          ...matrix,
          sections: (matrix.sections ?? []).map((section) => {
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
        }
      }),
    )
  }

  const handleVucRowChange = (matrizId, usoClave, rangoClave, clase, rawValue) => {
    const nextValue = sanitizeNumber(rawValue, 0)
    setVucCatalogo((prev) =>
      (prev ?? []).map((row) =>
        row.matrizId === matrizId &&
        row.usoClave === usoClave &&
        row.rangoClave === rangoClave &&
        Number(row.clase) === Number(clase)
          ? { ...row, valorM2: nextValue }
          : row,
      ),
    )
  }

  const autocompleteByRange = () => {
    if (!matchedSurfaceRange) return
    setSurfaceArea(sanitizeNumber(matchedSurfaceRange.defaultSurface, safeSurfaceArea || 0))
  }

  const resetAll = () => {
    setSurfaceArea('')
    setLevels(1)
    setAutoSurfaceRange(true)
    setSurfaceRanges(cloneData(BASE_DATA.surfaceRanges))
    setUsos(cloneData(usosDefault))
    setMatrices(cloneData(matricesDefault))
    setVucCatalogo(cloneData(vucCatalogoDefault))
    setSelectionsByMatriz({})
    setCalculatorUso('H')
    setCalculatorMatriz('')
    setLookupUso('H')
    setLookupMatriz('')
    setLookupRango('02')
    setLookupClase('3')
  }

  const baseDataReady = (usos?.length ?? 0) > 0 && (matrices?.length ?? 0) > 0 && (vucCatalogo?.length ?? 0) > 0
  const usoNombreCalc = calcResolution.uso?.usoNombre ?? calculatorUso
  const usoNombreLookup = lookupResolution.uso?.usoNombre ?? lookupUso

  const lookupRangoDisplay = useMemo(() => {
    const r = lookupRangos.find((x) => x.rangoClave === lookupRango)
    if (!r) return lookupRango || '—'
    return `${r.rangoClave} — ${r.rangoNombre}`
  }, [lookupRangos, lookupRango])

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-300 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Secretaría de Administración y Finanzas</p>
        <h1 className="mt-2 text-2xl font-bold text-[#0f3557] md:text-3xl">{BASE_DATA.meta.title}</h1>
      </header>

      {!baseDataReady ? (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No se localizaron datos de usos, matrices o catálogo VUC.
        </div>
      ) : null}

      <nav className="mt-6 flex flex-wrap justify-center gap-2 rounded-2xl bg-white/95 p-3 shadow-sm ring-1 ring-slate-200">
        {TABS.map((tab) => (
          <TabButton key={tab.key} label={tab.label} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} />
        ))}
      </nav>

      {activeTab === 'calculator' ? (
        <section className="mx-auto mt-6 max-w-5xl space-y-5">
          <article className="rounded-2xl border border-[#d4c3a3] bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div className="h-full min-h-[130px] rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">VUC</p>
                <p className="mt-2 text-3xl font-bold text-[#7a1f3d]">{calcVucRow ? formatCurrency(vucValue) : '—'}</p>
              </div>
              <div className="h-full min-h-[130px] rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Clasificación final</p>
                <p className="mt-2 text-2xl font-bold text-[#0f3557]">{classification}</p>
              </div>
              <div className="h-full min-h-[130px] rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Valor estimado</p>
                <p className="mt-2 text-2xl font-bold text-[#0f3557]">{calcVucRow ? formatCurrency(estimatedValue) : '—'}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">Uso: {usoNombreCalc}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">Matriz: {calcResolution.matrizId || 'Sin matriz'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">Rango: {levelRangeKey}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 ring-1 ring-slate-200">Clase: {effectiveClase || 'Sin clase'}</span>
            </div>
          </article>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
            <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Uso</span>
                <select value={calculatorUso} onChange={(event) => setCalculatorUso(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2">
                  {(usos ?? []).map((u) => (
                    <option key={u.usoClave} value={u.usoClave}>{u.usoClave} — {u.usoNombre}</option>
                  ))}
                </select>
              </label>

              {(calcResolution.opciones ?? []).length > 1 ? (
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Tipo aplicable (Matriz)</span>
                  <select value={calcResolution.matrizId ?? ''} onChange={(event) => setCalculatorMatriz(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2">
                    {(calcResolution.opciones ?? []).map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Número de niveles</span>
                <input type="number" min="1" step="1" value={safeLevels} onChange={(event) => setLevels(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Superficie exacta (m²)</span>
                <input type="number" min="0" step="0.01" value={surfaceArea} onChange={(event) => setSurfaceArea(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2" />
              </label>
              <label className="flex min-h-[42px] items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                <input type="checkbox" checked={Boolean(autoSurfaceRange)} onChange={(event) => setAutoSurfaceRange(event.target.checked)} />
                <span className="text-sm text-slate-700">Rango automático de superficie</span>
              </label>
            </div>

            <div className="mt-5 grid gap-2 md:grid-cols-3 md:gap-3">
              <button type="button" onClick={autocompleteByRange} disabled={!autoSurfaceRange} className="min-h-[42px] rounded-xl bg-[#0f3557] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c2b46] disabled:cursor-not-allowed disabled:opacity-40">Autocompletar por rango</button>
              <button type="button" onClick={resetAll} className="min-h-[42px] rounded-xl bg-[#7a1f3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#651a33]">Restablecer datos base</button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Clase" value={effectiveClase || 'Sin clase'} />
            <StatCard label="Clave rango nivel" value={levelRangeKey} />
            <StatCard label="Puntos totales" value={formatNumber(totalPoints)} />
          </div>

          <BreakdownPanel rows={breakdownRows} />

          <div className="space-y-4">
            {renderableMatrixSections.map((section) => (
              <CategorySelector key={section.key} section={section} selections={currentSelections} onSelectionChange={handleSelectionChange} />
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'scores' ? (
        <section className="mx-auto mt-6 max-w-5xl">
          <div className="mb-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">Editando puntajes de: {calcResolution.matrizId || 'Sin matriz'}</div>
          <ScoreEditor sections={matrixForUi?.sections ?? []} onScoreChange={handleScoreChange} />
        </section>
      ) : null}

      {activeTab === 'vuc' ? (
        <section className="mx-auto mt-6 max-w-5xl">
          <VucEditor vucRows={vucCatalogo} onVucChange={handleVucRowChange} />
        </section>
      ) : null}

      {activeTab === 'lookup' ? (
        <section className="mx-auto mt-6 max-w-5xl">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Uso</span>
                <select value={lookupUso} onChange={(event) => setLookupUso(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2">
                  {(usos ?? []).map((u) => (
                    <option key={u.usoClave} value={u.usoClave}>{u.usoClave} — {u.usoNombre}</option>
                  ))}
                </select>
              </label>

              {(lookupResolution.opciones ?? []).length > 1 ? (
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Matriz</span>
                  <select value={lookupResolution.matrizId ?? ''} onChange={(event) => setLookupMatriz(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2">
                    {(lookupResolution.opciones ?? []).map((id) => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Rango</span>
                <select value={lookupRango} onChange={(event) => setLookupRango(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2">
                  {lookupRangos.map((r) => (
                    <option key={r.rangoClave} value={r.rangoClave}>{r.rangoClave} — {r.rangoNombre}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Clase</span>
                <select value={String(lookupClase)} onChange={(event) => setLookupClase(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2">
                  {lookupClases.map((c) => (
                    <option key={c} value={String(c)}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <StatCard label="Uso seleccionado" value={usoNombreLookup} />
            <StatCard label="Rango" value={lookupRangoDisplay} />
            <StatCard
              label="VUC encontrado"
              value={lookupRow ? formatCurrency(sanitizeNumber(lookupRow.valorM2, 0)) : 'No existe VUC para esa combinación'}
            />
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default App
