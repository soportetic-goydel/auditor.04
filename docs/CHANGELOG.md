# Changelog

## 2026-06-05 - Flujo de firma F-TIC-04 desde activo seleccionado

Tipo de cambio: funcionalidad, firma, correo, Drive/PDF.

Contexto:

- El modulo F-TIC-04 debe llenar el acta desde el activo seleccionado por serie/ID/hostname/usuario.
- El PDF final no debe generarse hasta que el usuario registre su firma.
- El flujo anterior del usuario usaba `Codigo.gs`, `Index.html` y `FirmaUsuario.html`; se adapto al proyecto modular sin reemplazar `Index.html`.

Cambios realizados:

- Se agrego ruta WebApp `?modo=firma&token=...`.
- Se agrego vista `src/modules/ftic04/Ftic04SignatureView.html` con canvas de firma.
- Se agrego servicio `src/modules/ftic04/Ftic04SignatureService.gs`.
- El boton `Generar F-TIC-04` ahora crea acta preliminar, registra solicitud pendiente y envia correo de firma.
- El PDF final se genera despues de insertar la firma.
- Se agrego hoja de control `F_TIC_04_FIRMAS` en el spreadsheet maestro.
- Se agrego scope `https://www.googleapis.com/auth/script.send_mail`.

Pendiente:

- Desplegar como nueva version Apps Script numerada.
- Reautorizar permisos de correo, Drive, Sheets y UrlFetchApp.
- Probar con activo real y correo interno.

## 2026-06-05 - Soporte de reautorizacion F-TIC-04

Tipo de cambio: soporte operativo, diagnostico, UI.

Contexto:

- Al generar F-TIC-04, la WebApp reporta falta de permiso para `UrlFetchApp.fetch`.
- El manifest local ya contiene `https://www.googleapis.com/auth/script.external_request`.
- El problema probable es falta de reautorizacion del usuario que despliega o uso de un deployment sin consentimiento actualizado.

Cambios realizados:

- Se agrego la funcion publica `autorizarPermisosFTIC04()` para forzar/verificar autorizacion sin generar un acta real.
- Se mejoro el mensaje del modulo F-TIC-04 cuando detecta errores de `UrlFetchApp.fetch` o `script.external_request`.
- Se actualizo la guia tecnica y operativa con el nuevo flujo de reautorizacion.

Pendiente:

- Ejecutar `autorizarPermisosFTIC04` en Apps Script con el usuario que despliega.
- Probar nuevamente la generacion F-TIC-04 desde la URL `/exec` vigente.

Despliegue:

- `clasp push --force`: OK, 45 archivos subidos.
- Version creada: `18`.
- Deployment actualizado: `AKfycbyPSJorPbCYpVphDvDkqfAdAHjmq7lF-tMoh2KDc0Vr3VVX9AKMSsLvcKk5nFC8q_P7fA`.
- Descripcion: `VS04 - soporte reautorizacion F-TIC-04`.
- URL `/exec`: `https://script.google.com/macros/s/AKfycbyPSJorPbCYpVphDvDkqfAdAHjmq7lF-tMoh2KDc0Vr3VVX9AKMSsLvcKk5nFC8q_P7fA/exec`.
- Rollback operativo: redeployar el mismo Deployment ID a la version `17`.

## 2026-06-04 - Onboarding local y prompt de rewind

Tipo de cambio: documentacion, gobierno, soporte a colaboracion local.

Contexto:

- Se requiere que otra persona pueda trabajar el proyecto localmente desde VSCode sin romper la arquitectura modular ni el flujo de despliegue con `clasp`.
- La carpeta `docs/` funciona como fuente de verdad para hacer rewind del proyecto en chats nuevos.

Cambios realizados:

- Se agrego una seccion de onboarding local en `docs/01_GUIA_GENERAL.md`.
- Se agrego checklist tecnico de trabajo local en `docs/02_GUIA_TECNICA.md`.
- Se agrego flujo de traspaso a otro desarrollador en `docs/03_GUIA_OPERATIVA_Y_GOBIERNO.md`.
- Se agrego un prompt simple de una oracion para pedir rewind del proyecto.
- Se registro la decision de usar `/docs` como punto obligatorio de contexto antes de retomar trabajo.

Archivos modificados:

- `docs/01_GUIA_GENERAL.md`
- `docs/02_GUIA_TECNICA.md`
- `docs/03_GUIA_OPERATIVA_Y_GOBIERNO.md`
- `docs/CHANGELOG.md`
- `docs/DECISIONES.md`

Validaciones:

- Actualizacion documental solamente.
- No se modifico codigo funcional ni configuracion de despliegue.

Prompt de rewind:

```text
Lee la carpeta docs completa y hazme un rewind tecnico, operativo y de riesgos del proyecto para continuar trabajando localmente sin romper la arquitectura.
```

## 2026-05-22 - Documentacion operativa F-TIC-04 permisos y firma

Tipo de cambio: documentacion, gobierno, soporte operativo.

Fecha: 2026-05-22 20:50:24 America/Lima

Contexto:

- El manifest local ya contiene `https://www.googleapis.com/auth/script.external_request`.
- El usuario reporto que el error de permiso de `UrlFetchApp.fetch` seguia apareciendo.
- Se reviso que el flujo F-TIC-04 tenia referencia de celda `firma`, pero no insercion dinamica de firma.

Cambios realizados:

- Se documento que el error de `UrlFetchApp.fetch` puede persistir si falta reautorizacion o si se abre un deployment antiguo.
- Se registro la URL `/exec` vigente del deployment version `17`.
- Se agrego flujo operativo para reautorizar permisos despues de cambiar scopes.
- Se documento el flujo tecnico completo de generacion F-TIC-04.
- Se documento el estado real de la firma: la plantilla conserva firma fija si existe, pero no hay firma dinamica implementada.
- Se marco como PENDIENTE definir fuente de verdad y gobierno de firmas.

Archivos modificados:

- `docs/01_GUIA_GENERAL.md`
- `docs/02_GUIA_TECNICA.md`
- `docs/03_GUIA_OPERATIVA_Y_GOBIERNO.md`
- `docs/CHANGELOG.md`
- `docs/DECISIONES.md`

Validaciones:

- Lectura de las tres guias antes de modificar.
- Actualizacion documental solamente; no se modifico codigo funcional.

Pendientes:

- Reautorizar con el usuario que despliega.
- Probar generacion F-TIC-04 en la URL `/exec` vigente.
- Definir e implementar firma dinamica si el proceso operativo la requiere.

## 2026-05-22 - Iteracion de Diseno: F-TIC-04 y UI operativa

Tipo de cambio: UI / diseno, integracion, configuracion, documentacion.

Fecha: 2026-05-22 11:09:25 America/Lima

Objetivo:

- Renombrar el modulo documental visible y tecnico a `F-TIC-04`.
- Mejorar armonia visual, responsividad y estados de carga.
- Corregir alcance de permisos agregando scope `documents` y conservando `script.external_request`.

Contexto:

- El modulo documental estaba nombrado como `GENERAR F-TIC-05`, aunque corresponde al acta `F-TIC-04 ACTA DE ENTREGA O DEVOLUCION DE EQUIPO INFORMATICO VS01`.
- La UI ya estaba modular, pero necesitaba estados de procesamiento y bordes menos agresivos.

Cambios realizados:

- Se movio `src/modules/generar_ftic05/` a `src/modules/ftic04/`.
- Se renombraron archivos del modulo documental a `Ftic04...`.
- Se cambiaron funciones publicas a `buscarActivosParaGenerarFTIC04`, `generarFTIC04DesdeActivo` y `generarFTIC04DesdePayload`.
- Se reemplazo `CONFIG.GENERAR_FTIC05` por `CONFIG.FTIC04`.
- Se agrego opcion `PERSONAL` en el campo EMPRESA.
- Se normaliza empresa en frontend para permitir autocompletado por DNI y sobrescritura manual a `PERSONAL`.
- Se agrego helper `setButtonLoading()` con spinner y texto de proceso.
- Se aplico loading en actualizar tabla, regularizar, procesar TXT, buscar DNI, guardar formulario, buscar activo documental y generar F-TIC-04.
- Se suavizaron cards, bordes, estados de campos, evidencias, tablas y mensajes.
- Se agrego scope `https://www.googleapis.com/auth/documents`.
- Se extendio `LOG_IMPORTACIONES` con `url_documento` y `url_pdf`; si la hoja ya existe, se agregan encabezados faltantes.

Archivos modificados:

- `appsscript.json`
- `Index.html`
- `src/config/Config.gs`
- `src/core/Router.gs`
- `src/services/SheetsService.gs`
- `src/ui/Layout.html`
- `src/ui/Sidebar.html`
- `src/ui/GlobalStyles.html`
- `src/ui/GlobalClient.html`
- `src/modules/inventario/InventarioView.html`
- `src/modules/inventario/InventarioClient.html`
- `src/modules/formulario/FormularioView.html`
- `src/modules/formulario/FormularioClient.html`
- `src/modules/ftic04/*`
- `docs/01_GUIA_GENERAL.md`
- `docs/02_GUIA_TECNICA.md`
- `docs/03_GUIA_OPERATIVA_Y_GOBIERNO.md`
- `docs/CHANGELOG.md`
- `docs/DECISIONES.md`

Impacto visual:

- Cards con bordes y sombras mas suaves.
- Indicadores por badges, fondos y puntos sutiles en encabezados.
- Menos bordes verticales fuertes.
- Botones con spinner y estado deshabilitado durante operaciones.
- Mejor adaptacion movil con grids y acciones en columna.

Impacto tecnico:

- El modulo documental queda atomizado como `ftic04`.
- La WebApp conserva `google.script.run`.
- Se mantiene Apps Script V8 y HtmlService.
- La generacion PDF conserva `UrlFetchApp.fetch`.

Riesgos:

- Requiere `clasp push`, redeploy y reautorizacion por scopes.
- La plantilla configurada en `CONFIG.FTIC04` debe corresponder realmente al acta F-TIC-04.
- Si la hoja `CECO` no contiene empresa `PERSONAL`, el usuario debera seleccionar CECO aplicable desde otra empresa o completar segun gobierno interno.

Validaciones realizadas:

- Sintaxis `.gs`: OK.
- Sintaxis JavaScript en fragments HTML: OK.
- JSON `appsscript.json`: OK.
- Busqueda de referencias activas a `FTIC05Generator`, `CONFIG.GENERAR_FTIC05` y funciones publicas antiguas en codigo desplegable: OK, sin coincidencias.

Pendientes:

- Probar en WebApp desplegada con activo real.
- Confirmar documento/PDF en Drive.
- Confirmar log `GENERAR_F_TIC_04`.
- Confirmar que el error de `UrlFetchApp.fetch` desaparece tras reautorizar.

Decision:

- `GENERAR F-TIC-05` se renombra a `F-TIC-04` porque el flujo corresponde al acta de entrega o devolucion de equipo informatico VS01.

Despliegue:

- `clasp push --force`: OK, 45 archivos subidos.
- Version creada: `17`.
- Deployment actualizado: `AKfycbyPSJorPbCYpVphDvDkqfAdAHjmq7lF-tMoh2KDc0Vr3VVX9AKMSsLvcKk5nFC8q_P7fA`.
- Descripcion: `VS04 - F-TIC-04 UI y scopes`.
- URL `/exec`: `https://script.google.com/macros/s/AKfycbyPSJorPbCYpVphDvDkqfAdAHjmq7lF-tMoh2KDc0Vr3VVX9AKMSsLvcKk5nFC8q_P7fA/exec`.

## 2026-05-21 - Inicializacion documental viva

Tipo de cambio: documentacion, gobierno, deuda tecnica.

Cambios:

- Se creo la carpeta `docs/`.
- Se creo `docs/01_GUIA_GENERAL.md`.
- Se creo `docs/02_GUIA_TECNICA.md`.
- Se creo `docs/03_GUIA_OPERATIVA_Y_GOBIERNO.md`.
- Se reemplazo `REWIND_AVANCE_VS04_1.md` con una bitacora vigente.
- Se registro como riesgo que faltan localmente `Index.html` y `appsscript.json` del proyecto matriz.

Validaciones:

- Lectura inicial de guias intentada antes de modificar.
- Se confirmo que las guias no existian.
- Se confirmo existencia del clon auxiliar `ftic05/`.

Pendiente:

- Resuelto en la iteracion de migracion local: se recuperaron `Index.html` y `appsscript.json` con `clasp pull`.
- Resuelto en la iteracion de migracion local: se ejecuto validacion de sintaxis.

## 2026-05-21 - Migracion local de generacion F-TIC-05

Tipo de cambio: integracion, logica funcional, configuracion, UI, documentacion.

Cambios:

- Se migro la generacion F-TIC-05 al proyecto matriz.
- Se elimino la dependencia de biblioteca externa del manifiesto.
- Se agrego `CONFIG.GENERAR_FTIC05`.
- Se reemplazo el antiguo puente del archivo `10_GenerarFTIC05Service.gs`.
- Se crearon `11_GenerarFTIC05DataService.gs`, `12_GenerarFTIC05DocumentService.gs`, `13_GenerarFTIC05DriveService.gs` y `14_GenerarFTIC05LogService.gs`.
- Se actualizo el modulo visual `GENERAR F-TIC-05` en `Index.html`.
- Se agrego scope `script.external_request` para exportar PDF.

Validaciones:

- Sintaxis `.gs`: OK.
- JSON `appsscript.json`: OK.
- JavaScript embebido en `Index.html`: OK.

Pendiente:

- Probar con activo real en WebApp desplegada.
- Verificar documento y PDF creados en Drive.
- Verificar log `GENERAR_FTIC05`.

## 2026-05-21 - Atomizacion modular para integracion zSGTIC_2026

Tipo de cambio: refactor, arquitectura local, UI modular, documentacion, despliegue.

Cambios:

- Se movio el backend a `src/config`, `src/core`, `src/services` y `src/modules`.
- Se convirtio `Index.html` en template liviano con includes HtmlService.
- Se separaron vistas, clientes y estilos por modulo.
- Se agrego `include(filename)`.
- Se agrego `Router.gs`.
- Se agrego `.claspignore` para excluir `ftic05/`.
- Se mantuvo `appsscript.json` con `executeAs: USER_DEPLOYING` y `access: DOMAIN`.
- Se actualizo traza `LAST_EDIT_TRACE`.

Validaciones:

- Sintaxis `.gs`: OK.
- Sintaxis JS en fragments HTML: OK.
- JSON `appsscript.json`: OK.
- Referencias include: OK.
- `clasp status`: OK, `ftic05/` excluido del tracking del proyecto matriz.

Pendiente:

- Ejecutar prueba real en WebApp desplegada.
- Confirmar comportamiento de includes con rutas `src/...` en Apps Script remoto.

## 2026-05-22 - Correccion de includes anidados HtmlService

Tipo de cambio: correccion tecnica, frontend HtmlService, documentacion.

Problema:

- Los includes anidados dentro de `src/ui/Layout.html` se mostraban como texto plano en la WebApp.

Causa:

- `include(filename)` usaba `HtmlService.createHtmlOutputFromFile(filename).getContent()`, que devuelve contenido estatico y no evalua scriptlets internos del archivo incluido.

Cambio:

- `include(filename)` ahora usa `HtmlService.createTemplateFromFile(filename).evaluate().getContent()`.

Validaciones:

- Sintaxis `.gs`: OK.
- Sintaxis JS en fragments HTML: OK.
- Referencias include: OK.

Pendiente:

- Ejecutar `clasp push --force` desde la raiz y probar la WebApp desplegada.
