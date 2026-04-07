# Actualización de datos VUC (Excel → JSON → GitHub → Vercel)

Este proyecto genera los datos de la calculadora desde un Excel y los empaqueta en el build de Vite. **Vercel no ejecuta `import:vuc` en el deploy**; lo que se publica es lo que esté **commiteado** en `src/data/*.json` después de correr el import en tu máquina (o en CI, si lo configuras).

## Archivos que regenera `npm run import:vuc`

- `src/data/usos.json`
- `src/data/matrices_puntos.json`
- `src/data/vuc_catalogo.json`
- `src/data/vuc_2026.json` (compatibilidad; opcional commitear si quieres mantenerlo al día)

**Excel fuente (local):** `data_fuente/VUC_2026_analisis_tablas_conpuntos_JMG.xlsx`  
Si cambias el nombre del archivo, actualiza la ruta en `scripts/import-vuc-2026.js` (`EXCEL_PATH`).

## Pasos recomendados

1. **Reemplazar el Excel**  
   Sustituye el archivo en `data_fuente/` (mismo nombre que espera el script, o ajusta `EXCEL_PATH`).

2. **Regenerar JSON**

   ```bash
   npm run import:vuc
   ```

   Debes ver en consola que se escribieron `usos.json`, `matrices_puntos.json` y `vuc_catalogo.json` (y `vuc_2026.json` si aplica).

3. **Probar el build local**

   ```bash
   npm run build
   ```

   Si el build falla, corrige antes de subir a Git.

4. **Versionar los cambios**

   ```bash
   git add .
   git commit -m "Actualización de datos VUC"
   git push origin main
   ```

   Usa la rama que tengas conectada a Vercel (p. ej. `main` o `master`).

5. **Deploy en Vercel**  
   Tras el `push`, Vercel lanza un deploy automático. Cuando termine, la app en producción usará los **nuevos JSON** incluidos en ese commit.

## Comportamiento en producción

- La app importa por defecto `usos.json`, `matrices_puntos.json` y `vuc_catalogo.json` en el bundle (build estático).
- Si un usuario ya usó la app, **puede tener datos viejos en `localStorage`** (p. ej. catálogo editado). Para ver los datos “de fábrica” del último deploy: pestaña **Restablecer datos base** en la calculadora o borrar el almacenamiento del sitio en el navegador.

## Comprobaciones rápidas

- Los JSON de `src/data/` **no** deben estar en `.gitignore` (deben subirse al repo para que el deploy los incluya).
- No hace falta configurar un comando extra en Vercel: el `build` estándar (`npm run build`) es suficiente si los JSON ya están en el repositorio.
