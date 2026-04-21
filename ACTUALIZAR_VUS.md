# Actualizar datos VUS (Valor unitario de suelo)

Los catálogos de la pestaña **Consulta VUS** se generan a partir de archivos de texto delimitados por `|` y se guardan como JSON en `src/data/`.

## Archivos fuente

1. **Manzanas** (nombre esperado): `AV_MNZ_2026_391_591_connombres.txt`  
   Columnas: `anio`, `avalor`, `reg`, `man`, `action` (la primera línea puede ser encabezado con esos nombres).

2. **Valores VUS** (nombre esperado): `AV_VUS_2026_391_591_connombre.txt`  
   Columnas: `ANIO`, `AVALOR`, `ALCALDIA`, `VALOR`, `ADD` (encabezado opcional).

Coloca los TXT en `scripts/vus-fuentes/` **o** indica la ruta completa como argumento al script.

## Regenerar JSON cada año

1. Sustituye los TXT por la versión del nuevo año (ajusta también los nombres de archivo en los comandos si cambian).

2. Desde la raíz del proyecto ejecuta:

```bash
npm run import:vus:manzanas
npm run import:vus:catalogo
```

O ambos en un solo paso:

```bash
npm run import:vus
```

3. Esto sobrescribe:

- `src/data/vus_manzanas_2026.json`
- `src/data/vus_catalogo_2026.json`

4. Si cambias el año en los nombres de archivo, actualiza las rutas por defecto dentro de:

- `scripts/convertir_manzanas_txt_a_json.js`
- `scripts/convertir_vus_txt_a_json.js`

y, si aplica, renombra los JSON y actualiza los `import` en `src/components/ConsultaVUS.jsx`.

5. Haz commit de los JSON regenerados y despliega (por ejemplo push a `main` si usas Vercel conectado a Git).

## Normalización aplicada

- Región y manzana: 3 dígitos (`037`, `002`).
- Alcaldía: 2 dígitos (`01`).
- AVALOR: mayúsculas, sin espacios.
- VALOR: número (se aceptan comas como separador decimal miles según el contenido del TXT; el script usa `Number.parseFloat` tras quitar comas).

## Pruebas del motor

```bash
npm run test:vus
```

## Motor y UI

- Lógica: `src/utils/vusEngine.js` (índices por `reg-man` y por `avalor`).
- Vista: `src/components/ConsultaVUS.jsx`.
