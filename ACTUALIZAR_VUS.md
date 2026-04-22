# Actualizar datos VUS (Valor unitario de suelo)

Los catálogos de la pestaña **Consulta VUS** se generan leyendo los TXT oficiales **en la raíz del proyecto** (mismo directorio que `package.json`) y escribiendo JSON en `src/data/`.

## Archivos fuente (en la raíz)

1. `AV_MNZ_2026_391_591_connombres.txt`  
   Columnas: `anio|avalor|reg|man|action` (primera fila = encabezado).

2. `AV_VUS_2026_391_591_connombre.txt`  
   Columnas: `ANIO|AVALOR|ALCALDIA|VALOR|ADD` (primera fila = encabezado).

El script usa `path.resolve(process.cwd(), ...)`; ejecuta **siempre** `npm run generar:vus` desde la raíz del repositorio.

## Regenerar JSON

Con los TXT ya colocados en la raíz:

```bash
npm run generar:vus
```

(Sigue disponible el alias `npm run import:vus` y hace lo mismo.)

Se sobrescriben:

- `src/data/vus_manzanas_2026.json`
- `src/data/vus_catalogo_2026.json`

Lógica del conversor: `scripts/convertir_vus_desde_root.js`.

Si el año o los nombres de archivo cambian, ajusta las constantes `ENTRADA_MNZ` y `ENTRADA_VUS` en ese script, y el nombre de salida de los JSON si aplica.

## Normalización (en script + motor `vusEngine.js`)

- Región: 3 dígitos, manzana: 3 dígitos, alcaldía: 2 dígitos.
- AVALOR: mayúsculas, sin espacios superfluos.
- VALOR: número en punto flotante (comas de miles se eliminan antes de parsear).

## Pruebas del motor

```bash
npm run test:vus
```

## Motor y UI

- Lógica: `src/utils/vusEngine.js`
- Vista: `src/components/ConsultaVUS.jsx` (importa los JSON generados)
