import { useMemo } from 'react'
import { sanitizeNumber } from '../utils/calculations'

export default function VucEditor({ vucRows, onVucChange }) {
  const grouped = useMemo(() => {
    const matrizMap = new Map()
    for (const row of vucRows ?? []) {
      if (!matrizMap.has(row.matrizId)) matrizMap.set(row.matrizId, [])
      matrizMap.get(row.matrizId).push(row)
    }

    return [...matrizMap.entries()].map(([matrizId, rows]) => {
      const usoMap = new Map()
      for (const row of rows) {
        if (!usoMap.has(row.usoClave)) {
          usoMap.set(row.usoClave, { usoClave: row.usoClave, usoNombre: row.usoNombre, grupo: row.grupo, rows: [] })
        }
        usoMap.get(row.usoClave).rows.push(row)
      }

      const usos = [...usoMap.values()].map((uso) => {
        const rangoMap = new Map()
        for (const row of uso.rows) {
          if (!rangoMap.has(row.rangoClave)) {
            rangoMap.set(row.rangoClave, { rangoClave: row.rangoClave, rangoNombre: row.rangoNombre, rows: [] })
          }
          rangoMap.get(row.rangoClave).rows.push(row)
        }
        return { ...uso, rangos: [...rangoMap.values()].sort((a, b) => a.rangoClave.localeCompare(b.rangoClave)) }
      })

      return { matrizId, usos: usos.sort((a, b) => a.usoClave.localeCompare(b.usoClave)) }
    })
  }, [vucRows])

  if (!vucRows?.length) {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
        No hay tabla VUC cargada.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map((matriz) => (
        <section
          key={matriz.matrizId}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-200"
        >
          <h2 className="mb-4 text-base font-bold text-[#0f3557]">{matriz.matrizId}</h2>

          {matriz.usos.map((uso) => (
            <div key={`${matriz.matrizId}-${uso.usoClave}`} className="mb-6 rounded-xl border border-slate-200 p-3 last:mb-0">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-700">
                {uso.usoClave} — {uso.usoNombre}
              </h3>
              <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">{uso.grupo}</p>
              {uso.rangos.map((block) => (
                <div key={`${uso.usoClave}-${block.rangoClave}`} className="mb-4 last:mb-0">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Rango {block.rangoClave} — {block.rangoNombre}
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {block.rows.map((row) => (
                      <label key={`${row.matrizId}-${row.usoClave}-${row.clasificacion}`} className="rounded-xl border border-slate-200 p-3">
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Clase {row.clase} ({row.clasificacion})
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={sanitizeNumber(row.valorM2, 0)}
                          onChange={(event) =>
                            onVucChange(
                              row.matrizId,
                              row.usoClave,
                              row.rangoClave,
                              row.clase,
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring-2"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
