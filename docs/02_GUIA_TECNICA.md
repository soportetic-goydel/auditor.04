# Guia Tecnica - INVENTARIO DE ACTIVOS DE HARDWARE VS01

Ultima actualizacion: 2026-06-04 America/Lima

## Arquitectura modular

Configuracion:

- `src/config/Config.gs`
- `src/config/Constants.gs`

Core:

- `src/core/WebApp.gs`
- `src/core/Router.gs`
- `src/core/Utils.gs`
- `src/core/HtmlIncludes.gs`

Servicios compartidos:

- `src/services/SheetsService.gs`
- `src/services/DriveService.gs`
- `src/services/ReferenceService.gs`

Modulos:

- `src/modules/inventario/`
- `src/modules/formulario/`
- `src/modules/ftic04/`
- `src/modules/personal/`
- `src/modules/logs/`

UI compartida:

- `src/ui/Layout.html`
- `src/ui/Sidebar.html`
- `src/ui/Header.html`
- `src/ui/Components.html`
- `src/ui/Dashboard.html`
- `src/ui/GlobalStyles.html`
- `src/ui/GlobalClient.html`

## HtmlService e includes

`Index.html` es un template liviano.

`src/core/WebApp.gs` usa:

```javascript
HtmlService.createTemplateFromFile('Index').evaluate()
```

Helper obligatorio:

```javascript
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}
```

El helper evalua templates anidados. Esto es obligatorio porque `src/ui/Layout.html` tambien contiene llamadas `<?!= include(...) ?>`.

Los includes usan rutas locales compatibles con clasp:

```html
<?!= include('src/ui/Layout'); ?>
<?!= include('src/modules/inventario/InventarioView'); ?>
```

## Backend publico

Funciones publicas vigentes para `google.script.run`:

- `parseAuditTxt`
- `saveInventoryRecord`
- `getInventoryTable`
- `getInventoryRecordBySerie`
- `lookupPersonByDni`
- `getCecoList`
- `getPersonnelList`
- `getImportLogTable`
- `buscarActivosParaGenerarFTIC04`
- `autorizarPermisosFTIC04`
- `generarFTIC04DesdeActivo`
- `generarFTIC04DesdePayload`
- `buscarSolicitudFirmaFTIC04`
- `procesarFirmaFTIC04`

Las funciones internas nuevas deben terminar con `_`.

## Configuracion

`CONFIG` vive en `src/config/Config.gs` y conserva:

- IDs de Sheets.
- Nombres de hojas.
- Filas de encabezado.
- Carpeta Drive.
- Encabezados oficiales.
- `CONFIG.FTIC04`.
- Reglas de evidencia y logs.
- Opcion de empresa `PERSONAL` para equipos de propiedad personal alquilados a la empresa.

Traza actual:

```javascript
LAST_EDIT_TRACE: '2026-05-22 11:09:25 America/Lima'
```

## clasp

`.clasp.json` mantiene:

```json
"rootDir": "",
"skipSubdirectories": false
```

`.claspignore` excluye:

- `ftic05/**`
- `docs/**`
- archivos locales no Apps Script.

El proyecto principal se despliega desde la raiz del repositorio, nunca desde `ftic05/`.

## Trabajo local en VSCode

Reglas para trabajar localmente:

- Abrir siempre la raiz del repositorio, no una subcarpeta.
- Mantener la arquitectura por carpetas dentro de `src/`.
- No mover archivos a la raiz salvo `Index.html` y `appsscript.json`.
- No usar `<script src="">` ni `<link href="">` para archivos locales de Apps Script.
- Usar `include()` para HTML, CSS y JS fragmentado.
- Mantener funciones publicas minimas para `google.script.run`.
- Mantener funciones internas con sufijo `_`.
- Centralizar IDs, hojas, carpetas, plantillas, rutas y reglas en `CONFIG`.
- No modificar `ftic05/` desde este proyecto.

Checklist tecnico antes de desplegar:

1. Revisar que `appsscript.json` conserve scopes y configuracion `webapp`.
2. Revisar que `.claspignore` siga excluyendo `docs/**` y `ftic05/**`.
3. Validar que los includes apunten a rutas existentes.
4. Validar sintaxis `.gs` y JS embebido en fragments HTML.
5. Confirmar que no existan referencias a funciones o modulos obsoletos.
6. Confirmar que los cambios fueron documentados en `/docs`.
7. Ejecutar `clasp push --force` solo desde la raiz.

## Manifiesto

`appsscript.json` mantiene:

```json
"webapp": {
  "executeAs": "USER_DEPLOYING",
  "access": "DOMAIN"
}
```

Scopes:

- Sheets.
- Drive.
- Documents.
- `script.external_request`.
- `userinfo.email`.

Nota de autorizacion:

Si aparece el error:

```text
No cuentas con el permiso para llamar a UrlFetchApp.fetch.
Permisos necesarios: https://www.googleapis.com/auth/script.external_request
```

y el scope ya existe en `appsscript.json`, la causa probable no es el codigo local sino una de estas condiciones:

- La WebApp abierta corresponde a un deployment antiguo.
- El deployment nuevo todavia no fue reautorizado por el usuario que despliega.
- El usuario ejecutor no acepto el nuevo consentimiento despues del cambio de scopes.

Funcion auxiliar disponible para forzar/verificar autorizacion sin generar un acta real:

```javascript
autorizarPermisosFTIC04()
```

El deployment productivo vigente registrado es:

```text
Deployment ID: AKfycbwC34HUXdR0tmNiNJDD4hC2d13XHH0FLoADhyaAb4X3ZW6ZRnsMqd2fHlhoblBa2-Occg
Version: 23
URL /exec: https://script.google.com/macros/s/AKfycbwC34HUXdR0tmNiNJDD4hC2d13XHH0FLoADhyaAb4X3ZW6ZRnsMqd2fHlhoblBa2-Occg/exec
```

## UI y estados de carga

La UI compartida vive en `src/ui/GlobalStyles.html` y `src/ui/GlobalClient.html`.

Componentes reutilizables vigentes:

- Cards suaves con borde y sombra ligera.
- Badges de estado.
- Mensajes `status` con animacion sutil.
- Helper `setButtonLoading(buttonOrId, loading, label)` para deshabilitar botones y mostrar spinner.

El helper de loading se usa en:

- Actualizacion de inventario.
- Regularizacion.
- Procesamiento TXT.
- Busqueda DNI.
- Guardado de formulario.
- Busqueda y generacion F-TIC-04.

## Modulo F-TIC-04

El modulo documental esta en `src/modules/ftic04/` y corresponde a:

```text
F-TIC-04 ACTA DE ENTREGA O DEVOLUCION DE EQUIPO INFORMATICO VS01
```

Archivos:

- `Ftic04Service.gs`
- `Ftic04DataService.gs`
- `Ftic04DocumentService.gs`
- `Ftic04DriveService.gs`
- `Ftic04LogService.gs`
- `Ftic04View.html`
- `Ftic04Client.html`
- `Ftic04Styles.html`

Configuracion central:

```javascript
CONFIG.FTIC04 = {
  TEMPLATE_ID: '',
  OUTPUT_FOLDER_ID: '',
  PDF_ENABLED: true,
  FILE_NAME_PATTERN: '',
  PLACEHOLDERS: {}
}
```

La generacion usa datos de `MC-F-TIC-05` o `F-TIC-05`, crea copia preliminar de plantilla, envia enlace de firma por correo y registra accion `GENERAR_F_TIC_04` en `LOG_IMPORTACIONES`. El PDF final se exporta con `UrlFetchApp.fetch` despues de registrar la firma.

### Flujo tecnico F-TIC-04

1. `buscarActivosParaGenerarFTIC04(query)` busca coincidencias por ID, serie/IMEI, hostname o usuario.
2. `generarFTIC04DesdeActivo(idActivo, options)` resuelve el activo desde `MC-F-TIC-05` o `F-TIC-05`.
3. `generarFTIC04DesdePayload(payload, options)` normaliza datos, aplica reglas del inventario y toma lock de script.
4. `obtenerCarpetaDestinoFTIC04_()` usa la carpeta documental del activo o `CONFIG.FTIC04.OUTPUT_FOLDER_ID`.
5. `crearDocumentoFTIC04_()` copia la plantilla `CONFIG.FTIC04.TEMPLATE_ID` sin exportar PDF aun.
6. `aplicarPayloadEnPlantillaFTIC04_()` escribe valores y marcas en celdas declaradas en `CONFIG.FTIC04.CELLS`.
7. `crearSolicitudFirmaFTIC04_()` registra token en `F_TIC_04_FIRMAS` y envia correo con `?modo=firma&token=...`.
8. `procesarFirmaFTIC04(datos)` inserta imagen en `CONFIG.FTIC04.CELLS.firma`.
9. `exportarSpreadsheetGeneracionFTIC04_()` exporta PDF mediante `UrlFetchApp.fetch` usando `ScriptApp.getOAuthToken()`.
10. `guardarPdfFTIC04_()` guarda el PDF en Drive si `CONFIG.FTIC04.PDF_ENABLED` esta activo.
11. `registrarLogGeneracionFTIC04_()` escribe log con documento, PDF y carpeta.

### Firma F-TIC-04

Configuracion actual:

```javascript
CONFIG.FTIC04.CELLS.firma = 'K48'
```

Estado vigente:

- El mapeo de celda de firma existe como referencia de plantilla.
- El codigo actual no inserta una firma dinamica ni una imagen de firma.
- Si la plantilla ya contiene una firma fija, esa firma se conserva al copiar la plantilla.

PENDIENTE si se requiere firma dinamica:

- Definir fuente de verdad de firmas: archivo Drive por DNI, carga de imagen o firma dibujada en canvas.
- Agregar configuracion en `CONFIG.FTIC04`, por ejemplo carpeta de firmas o regla de busqueda.
- Insertar imagen en la celda/rango configurado antes de exportar PDF.
- Registrar en log si la firma fue insertada, omitida o no disponible.

## Flujo tecnico de despliegue

1. `clasp push --force`
2. `clasp version "VSxx - descripcion"`
3. Consultar deployment con `clasp deployments`.
4. Si existe deployment productivo: `clasp redeploy --deploymentId <ID> --versionNumber <VERSION> --description "VSxx - descripcion"`
5. Si no existe: `clasp deploy --versionNumber <VERSION> --description "VSxx - descripcion"`
