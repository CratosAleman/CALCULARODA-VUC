import { sanitizeNumber } from '../utils/calculations'

export default function ScoreEditor({ sections, onScoreChange }) {
  const visibleSections = (sections ?? [])
    .map((section) => ({
      ...section,
      items: (section.items ?? []).filter((item) => (item.options ?? []).length > 0),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="space-y-4">
      {visibleSections.map((section) => (
        <section key={section.key} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-600">
            {section.label}
          </h3>

          <div className="space-y-3">
            {(section.items ?? []).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                <p className="mb-3 text-sm font-semibold text-slate-800">{item.name}</p>
                <div className="space-y-2">
                  {(item.options ?? []).map((option) => (
                    <div
                      key={option.id}
                      className="grid items-center gap-2 md:grid-cols-[2fr_1fr]"
                    >
                      <span className="text-sm text-slate-700">{option.label}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={sanitizeNumber(option.score, 0)}
                        onChange={(event) =>
                          onScoreChange(section.key, item.id, option.id, event.target.value)
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-400 transition focus:ring-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
