import { sanitizeNumber } from '../utils/calculations'

export default function VucEditor({ vucTable, classRanges, onVucChange }) {
  const levelKeys = Object.keys(vucTable ?? {})

  if (!levelKeys.length) {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
        No hay tabla VUC cargada.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {levelKeys.map((levelKey) => (
        <section key={levelKey} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
            Rango de nivel {levelKey}
          </h3>

          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {classRanges.map((classRange) => (
              <label key={classRange.key} className="rounded-xl border border-slate-200 p-3">
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Clase {classRange.key}
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={sanitizeNumber(vucTable[levelKey]?.[classRange.key], 0)}
                  onChange={(event) => onVucChange(levelKey, classRange.key, event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring-2"
                />
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
