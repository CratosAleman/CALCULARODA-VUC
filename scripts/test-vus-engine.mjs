/**
 * Pruebas mínimas del motor VUS (sin dependencias extra).
 * Ejecutar desde la raíz del proyecto: npm run test:vus
 */
import assert from 'node:assert/strict'
import {
  buscarPorAvalor,
  buscarPorRegionManzana,
  consultarVUS,
  normalizarAlcaldia,
  normalizarAvalor,
  normalizarManzana,
  normalizarRegion,
} from '../src/utils/vusEngine.js'

assert.equal(normalizarRegion(37), '037')
assert.equal(normalizarRegion('  7 '), '007')
assert.equal(normalizarManzana(2), '002')
assert.equal(normalizarAlcaldia(1), '01')
assert.equal(normalizarAvalor(' a01 0012 '), 'A010012')

const mnz = [{ anio: 2026, avalor: 'A010012', reg: '037', man: '293', action: '' }]
const vus = [{ anio: 2026, avalor: 'A010012', alcaldia: '01', valor: 20707.55, add: '' }]

const r1 = consultarVUS({
  tipoBusqueda: 'region-manzana',
  reg: '037',
  man: '293',
  catalogoMnz: mnz,
  catalogoVus: vus,
})
assert.equal(r1.ok, true)
assert.equal(r1.coincidencias, 1)
assert.equal(r1.items[0].valorUnitarioSuelo, 20707.55)
assert.equal(r1.items[0].alcaldia, '01')

const r2 = consultarVUS({ tipoBusqueda: 'avalor', avalor: 'A010012', catalogoMnz: mnz, catalogoVus: vus })
assert.equal(r2.ok, true)
assert.equal(r2.valorUnitarioSuelo, 20707.55)
assert.equal(r2.regionesManzanas.length, 1)
assert.equal(r2.regionesManzanas[0].reg, '037')

const bad = consultarVUS({ tipoBusqueda: 'region-manzana', reg: 'xx', man: '293', catalogoMnz: mnz, catalogoVus: vus })
assert.equal(bad.ok, false)
assert.equal(bad.codigo, 'FORMATO_INVALIDO')

const rm = buscarPorRegionManzana('999', '999', mnz, vus)
assert.equal(rm.ok, true)
assert.equal(rm.coincidencias, 0)

const av = buscarPorAvalor('NOEXISTE', mnz, vus)
assert.equal(av.ok, true)
assert.equal(av.encontradoVus, false)

console.log('test:vus — todas las aserciones pasaron.')
