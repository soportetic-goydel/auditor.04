# Decisiones Tecnicas y de Diseno

## 2026-06-04 - Usar docs como punto unico de rewind para trabajo local

Contexto: el proyecto se trabaja localmente en VSCode y se despliega con `clasp`, por lo que un nuevo colaborador necesita entender arquitectura, reglas, riesgos y despliegue antes de modificar archivos.

Decision: documentar que cualquier persona que retome el proyecto debe leer `/docs` completo y pedir un rewind basado en esas guias antes de tocar codigo, UI, configuracion o despliegue.

Impacto:

- `/docs` queda como fuente viva de contexto del proyecto.
- El traspaso a otro desarrollador tiene un flujo claro.
- Se reduce el riesgo de trabajar desde una subcarpeta, modificar `ftic05/` o romper includes/clasp.

Riesgo:

- Si la documentacion no se actualiza despues de cada cambio funcional, el rewind puede quedar desfasado.

## 2026-05-22 - Documentar reautorizacion como causa probable de error UrlFetchApp

Contexto: `appsscript.json` ya incluye `https://www.googleapis.com/auth/script.external_request`, pero el error de permiso de `UrlFetchApp.fetch` puede seguir apareciendo en ejecucion.

Decision: documentar que, si el scope ya esta en manifest, el siguiente paso no es cambiar codigo sino reautorizar y confirmar que se use el deployment `/exec` vigente.

Impacto:

- El flujo de soporte operativo queda claro para el administrador Apps Script.
- Se evita duplicar scopes o modificar funciones sin necesidad.

Riesgo:

- Si el usuario abre una URL antigua o no acepta permisos con la cuenta desplegadora, el error seguira apareciendo aunque el codigo sea correcto.

## 2026-05-22 - Firma F-TIC-04 queda pendiente como flujo especifico

Contexto: `CONFIG.FTIC04.CELLS.firma = 'K48'` existe, pero la implementacion actual no inserta imagen ni captura firma dinamica.

Decision: documentar el estado real y no hacer parecer funcional la firma dinamica. La firma fija de plantilla se conserva si ya existe.

Impacto:

- La generacion F-TIC-04 sigue disponible sin firma dinamica.
- Cualquier firma por usuario, responsable TIC o captura manual debe implementarse como nueva iteracion configurable.

Riesgo:

- Si el acta requiere firma obligatoria, el proceso operativo debe definir fuente, responsable y regla de bloqueo antes de automatizarla.

## 2026-05-22 - Renombrar modulo documental a F-TIC-04

Contexto: el modulo documental visible figuraba como `GENERAR F-TIC-05`, pero su objetivo operativo corresponde a `F-TIC-04 ACTA DE ENTREGA O DEVOLUCION DE EQUIPO INFORMATICO VS01`.

Decision: renombrar la vista, carpeta local, archivos, funciones publicas y configuracion del modulo a F-TIC-04. La configuracion central queda en `CONFIG.FTIC04`.

Impacto:

- La UI muestra el modulo como `F-TIC-04`.
- Las llamadas frontend usan `buscarActivosParaGenerarFTIC04` y `generarFTIC04DesdeActivo`.
- Los logs usan accion `GENERAR_F_TIC_04`.
- Se descarta cualquier dependencia de biblioteca o simbolo `FTIC05Generator`.

Riesgo:

- Requiere probar con plantilla real configurada en `CONFIG.FTIC04`.

## 2026-05-22 - Corregir permisos para exportacion documental

Contexto: la generacion documental usa `UrlFetchApp.fetch` para exportar PDF y puede requerir permisos de documentos por la manipulacion de plantillas.

Decision: mantener `script.external_request` y agregar `https://www.googleapis.com/auth/documents` en `appsscript.json`.

Impacto:

- Desaparece el bloqueo por falta de permiso de `UrlFetchApp.fetch` despues de reautorizar.
- La WebApp debe redeployarse y reautorizarse.

Riesgo:

- Hasta redeploy y reautorizacion, el usuario puede seguir viendo errores de permisos en la version desplegada.

## 2026-05-22 - Permitir empresa PERSONAL como sobrescritura manual

Contexto: algunos equipos/laptops son propiedad personal del trabajador y se alquilan a la empresa con bono mensual.

Decision: agregar `PERSONAL` como opcion manual en EMPRESA sin cambiar la deteccion automatica por DNI.

Impacto:

- El DNI sigue autocompletando empresa, usuario, cargo y proyecto.
- El operador puede cambiar manualmente EMPRESA a `PERSONAL` despues del autocompletado.

Riesgo:

- El gobierno operativo debe definir que CECO usar cuando EMPRESA sea `PERSONAL` si no existe CECO especifico para esa categoria.

## 2026-05-21 - Atomizar como modulo integrable en zSGTIC_2026

Contexto: el proyecto funcionaba como WebApp autocontenida con archivos grandes y un `Index.html` monolitico.

Decision: reestructurar localmente en `src/` por configuracion, core, servicios, modulos y UI. El objetivo es que el inventario pueda incorporarse luego como engranaje dentro de `zSGTIC_2026`.

Impacto:

- `Index.html` queda como template liviano.
- HtmlService ensambla la UI con `include()`.
- `ftic05/` queda excluido por `.claspignore`.
- Los contratos publicos de `google.script.run` se mantienen.

Riesgo:

- Se debe confirmar en Apps Script remoto que los includes con rutas `src/...` resuelven correctamente despues del push.

## 2026-05-21 - Mantener /ftic05 solo como referencia

Contexto: `/ftic05` es un proyecto Apps Script auxiliar clonado para analisis.

Decision: excluir `/ftic05` del despliegue del proyecto matriz mediante `.claspignore`.

Impacto:

- `clasp push` desde la raiz ya no intenta subir archivos del auxiliar.
- El auxiliar no se modifica en esta arquitectura.
