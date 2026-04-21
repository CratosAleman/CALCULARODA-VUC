import { useState } from 'react'
import vusManzanasDefault from '../data/vus_manzanas_2026.json'
import vusCatalogoDefault from '../data/vus_catalogo_2026.json'
import { useVUSRegistry } from '../hooks/useVUSRegistry'
import { consultarVUS } from '../utils/vusEngine'
import { formatCurrency } from '../utils/formatters'

const TIPO_REGION = 'region-manzana'
const TIPO_AVALOR = 'avalor'

export default function ConsultaVUS() {
  const [catalogoMnz] = useState(() => vusManzanasDefault)
  const [catalogoVus] = useState(() => vusCatalogoDefault)
  const { datosCargados, totalMnz, totalVus } = useVUSRegistry(catalogoMnz, catalogoVus)

  const [tipoBusqueda, setTipoBusqueda] = useState(TIPO_REGION)
  const [reg, setReg] = useState('037')
  const [man, setMan] = useState('293')
  const [avalor, setAvalor] = useState('A010012')
  const [resultado, setResultado] = useState(null)

  const puedeConsultar = datosCargados

  const ejecutarConsulta = () => {
    if (!datosCargados) {
      setResultado({ ok: false, mensaje: 'No hay catálogos VUS cargados. Revisa src/data y ACTUALIZAR_VUS.md.' })
      return
    }
    const r =
      tipoBusqueda === TIPO_REGION
        ? consultarVUS({
            tipoBusqueda: 'region-manzana',
            reg,
            man,
            catalogoMnz,
            catalogoVus,
          })
        : consultarVUS({
            tipoBusqueda: 'avalor',
            avalor,
            catalogoMnz,
            catalogoVus,
          })
    setResultado(r)
  }

  return (
    <section className="mx-auto mt-6 max-w-5xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:p-6">
        <h2 className="text-lg font-bold text-[#0f3557]">Consulta VUS</h2>
        <p className="mt-1 text-sm text-slate-600">
          Valor unitario de suelo. Llave de relación entre catálogos: <span className="font-semibold">AVALOR</span>.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Manzanas en datos: {totalMnz} · Registros VUS: {totalVus}
          {!datosCargados ? ' · Coloca JSON generados o ejecuta los scripts de conversión.' : null}
        </p>

        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Tipo de búsqueda</span>
            <select
              value={tipoBusqueda}
              onChange={(e) => {
                setTipoBusqueda(e.target.value)
                setResultado(null)
              }}
              className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
            >
              <option value={TIPO_REGION}>Por región y manzana</option>
              <option value={TIPO_AVALOR}>Por AVALOR</option>
            </select>
          </label>

          {tipoBusqueda === TIPO_REGION ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Región (3 dígitos)</span>
                <input
                  value={reg}
                  onChange={(e) => setReg(e.target.value)}
                  placeholder="ej. 037"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Manzana (3 dígitos)</span>
                <input
                  value={man}
                  onChange={(e) => setMan(e.target.value)}
                  placeholder="ej. 293"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
                />
              </label>
            </div>
          ) : (
            <label className="block max-w-md space-y-1">
              <span className="text-sm font-medium text-slate-700">AVALOR</span>
              <input
                value={avalor}
                onChange={(e) => setAvalor(e.target.value)}
                placeholder="ej. A010012"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase outline-none ring-[#7a1f3d]/30 transition focus:ring-2"
              />
            </label>
          )}

          <button
            type="button"
            disabled={!puedeConsultar}
            onClick={ejecutarConsulta}
            className="rounded-xl bg-[#0f3557] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0c2b46] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Consultar
          </button>
        </div>
      </div>

      {resultado ? <ResultadoVUS resultado={resultado} /> : null}
    </section>
  )
}

function ResultadoVUS({ resultado }) {
  if (!resultado.ok) {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
        <p className="font-semibold">No se pudo completar la consulta</p>
        <p className="mt-1">{resultado.mensaje}</p>
        {resultado.codigo ? <p className="mt-1 text-xs opacity-80">Código: {resultado.codigo}</p> : null}
      </div>
    )
  }

  if (resultado.tipo === 'region-manzana') {
    return (
      <div className="space-y-4">
        {resultado.advertencia ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{resultado.mensaje}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ResumenCampo label="Región consultada" value={resultado.regionConsultada} />
              <ResumenCampo label="Manzana consultada" value={resultado.manzanaConsultada} />
            </div>
          </div>
        ) : null}
        {resultado.vacio ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{resultado.mensaje}</div>
        ) : (
          <>
            {resultado.multiple ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                Hay varias coincidencias ({resultado.coincidencias}). Revisa la tabla.
              </div>
            ) : null}
            <div className="rounded-2xl border border-[#d4c3a3] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="grid gap-3 sm:grid-cols-3">
                <ResumenCampo label="Región consultada" value={resultado.regionConsultada} />
                <ResumenCampo label="Manzana consultada" value={resultado.manzanaConsultada} />
                <ResumenCampo label="Coincidencias" value={String(resultado.coincidencias)} />
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-slate-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-2">AVALOR</th>
                      <th className="px-3 py-2">Alcaldía</th>
                      <th className="px-3 py-2">Valor unitario de suelo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(resultado.items ?? []).map((row, i) => (
                      <tr key={`${row.avalor}-${i}`} className="border-t border-slate-100 bg-white">
                        <td className="px-3 py-2 font-mono text-slate-800">{row.avalor}</td>
                        <td className="px-3 py-2">{row.alcaldia}</td>
                        <td className="px-3 py-2 font-semibold text-[#0f3557]">{formatCurrency(row.valorUnitarioSuelo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  if (resultado.tipo === 'avalor') {
    if (resultado.vacio) {
      return (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{resultado.mensaje}</div>
          {resultado.regionesManzanas?.length > 0 ? (
            <div className="rounded-2xl border border-[#d4c3a3] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-700">Regiones/manzanas asociadas al AVALOR (sin fila VUS)</p>
              <ListaRegMan lista={resultado.regionesManzanas} />
            </div>
          ) : null}
        </div>
      )
    }

    return (
      <div className="rounded-2xl border border-[#d4c3a3] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 sm:grid-cols-3">
          <ResumenCampo label="AVALOR" value={resultado.avalor} mono />
          <ResumenCampo label="Alcaldía" value={resultado.alcaldia} />
          <ResumenCampo label="Valor unitario de suelo" value={formatCurrency(resultado.valorUnitarioSuelo)} highlight />
        </div>
        {resultado.sinManzanas ? (
          <p className="mt-4 text-sm text-slate-600">No hay manzanas asociadas a este AVALOR en el catálogo de manzanas.</p>
        ) : (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Regiones y manzanas asociadas</p>
            <ListaRegMan lista={resultado.regionesManzanas} />
          </div>
        )}
      </div>
    )
  }

  return null
}

function ResumenCampo({ label, value, mono, highlight }) {
  return (
    <div className={`rounded-xl p-4 ring-1 ring-slate-200 ${highlight ? 'bg-slate-50' : 'bg-slate-50/80'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <p className={`mt-2 text-lg font-semibold text-[#0f3557] ${mono ? 'font-mono text-base' : ''}`}>{value}</p>
    </div>
  )
}

function ListaRegMan({ lista }) {
  if (!lista?.length) return null
  return (
    <div className="mt-2 overflow-x-auto rounded-xl ring-1 ring-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-3 py-2">Región</th>
            <th className="px-3 py-2">Manzana</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((row, i) => (
            <tr key={`${row.reg}-${row.man}-${i}`} className="border-t border-slate-100 bg-white">
              <td className="px-3 py-2 font-mono">{row.reg}</td>
              <td className="px-3 py-2 font-mono">{row.man}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
