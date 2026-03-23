import { sanitizeNumber } from '../utils/calculations'

export default function CategorySelector({ section, selections, onSelectionChange }) {
  const visibleItems = (section.items ?? []).filter((item) => (item.options ?? []).length > 0)

  if (!visibleItems.length) return null

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
      <h3 className="mb-4 inline-flex rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200">
        {section.label}
      </h3>

      <div className="space-y-3">
        {visibleItems.map((item) => {
          const selectedOptionId = selections[item.id]
          const selectedOption = (item.options ?? []).find((opt) => opt.id === selectedOptionId)
          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_96px] md:items-center">
                <label className="min-w-0 text-sm font-semibold text-slate-700 break-words">
                  {item.name}
                </label>
                <div className="min-w-0">
                  <select
                    value={selectedOptionId ?? ''}
                    onChange={(event) => onSelectionChange(item.id, event.target.value)}
                    className="block w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
                  >
                    {(item.options ?? []).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24 shrink-0 rounded-full bg-[#0f3557] px-3 py-2 text-center text-sm font-bold text-white shadow-sm">
                  {sanitizeNumber(selectedOption?.score, 0)} pts
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
