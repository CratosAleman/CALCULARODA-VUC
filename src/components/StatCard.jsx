import { hexToRgba } from '../utils/colorUtils'

export default function StatCard({ label, value, hint, pinColor }) {
  const tint = pinColor ? hexToRgba(pinColor, 0.1) : undefined
  return (
    <article
      className={`flex min-h-[118px] flex-col rounded-2xl p-4 shadow-sm ring-1 ring-slate-200/90 transition hover:shadow-md ${pinColor ? 'border-l-[6px]' : 'bg-white'}`}
      style={
        pinColor
          ? { borderLeftColor: pinColor, backgroundColor: tint ?? '#ffffff' }
          : undefined
      }
    >
      <div className="flex items-start gap-3">
        {pinColor ? (
          <span
            className="mt-0.5 h-4 w-4 shrink-0 rounded-full shadow-sm ring-2 ring-white"
            style={{ backgroundColor: pinColor }}
            aria-hidden
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900 break-words">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
      </div>
    </article>
  )
}
