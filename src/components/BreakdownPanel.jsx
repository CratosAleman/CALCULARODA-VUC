export default function BreakdownPanel({ rows }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
        Desglose del cálculo
      </h3>
      <div className="mt-4 max-h-[380px] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[56%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="sticky top-0 bg-slate-50">
            <tr className="text-slate-500">
              <th className="px-3 py-2 pr-2">Rubro</th>
              <th className="px-3 py-2 pr-2">Opción seleccionada</th>
              <th className="px-3 py-2 text-right">Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.itemName}-${index}`} className="border-t border-slate-100 align-top">
                <td className="px-3 py-2 pr-2">
                  <div className="font-medium text-slate-700">{row.itemName}</div>
                  <div className="text-xs text-slate-500">{row.section}</div>
                </td>
                <td className="px-3 py-2 pr-2 text-slate-600">{row.optionName}</td>
                <td className="px-3 py-2 text-right font-semibold text-slate-700">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
