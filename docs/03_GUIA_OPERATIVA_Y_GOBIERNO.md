# Guia Operativa y Gobierno - INVENTARIO DE ACTIVOS DE HARDWARE VS01

Ultima actualizacion: 2026-06-04 America/Lima

## Flujo operativo normal

1. Ejecutar auditor PowerShell como administrador.
2. Generar TXT en Documentos.
3. Abrir WebApp.
4. Cargar TXT o registrar manualmente.
5. Validar DNI.
6. Cargar CECO.
7. Completar datos obligatorios.
8. Guardar activo.
9. Revisar inventario.
10. Regularizar incompletos.
11. Generar F-TIC-04 si corresponde.
12. Revisar logs.

## Empresa PERSONAL

El DNI sigue detectando automaticamente GOYDEL SAC, TDEM SRL o METRIN SAC segun la base de personal.

Si el equipo es de propiedad personal del trabajador y se alquila a la empresa mediante bono mensual, el operador puede cambiar manualmente el campo EMPRESA a `PERSONAL` despues de la deteccion por DNI.

Este cambio manual no elimina el usuario, cargo, proyecto ni datos autocompletados por DNI.

## Gobierno tecnico

Antes de modificar codigo, UI, configuracion o documentacion:

1. Leer las tres guias en `/docs`.
2. Identificar modulos afectados.
3. Mantener cambios pequenos y reversibles.
4. Validar sintaxis local.
5. Actualizar changelog y decisiones.

## Traspaso a otro desarrollador

Cuando otra persona tome el proyecto localmente, debe seguir este orden:

1. Leer `docs/01_GUIA_GENERAL.md` para entender alcance, modulos y reglas generales.
2. Leer `docs/02_GUIA_TECNICA.md` para entender estructura, includes, servicios, configuracion y despliegue.
3. Leer `docs/03_GUIA_OPERATIVA_Y_GOBIERNO.md` para entender uso normal, permisos, responsabilidades y riesgos.
4. Revisar `docs/CHANGELOG.md` para conocer los ultimos cambios.
5. Revisar `docs/DECISIONES.md` para no revertir decisiones tecnicas vigentes.
6. Revisar `.claspignore` antes de cualquier push.
7. Confirmar que esta trabajando en la raiz del proyecto principal.

El nuevo desarrollador no debe empezar preguntando por archivos sueltos. Primero debe pedir un rewind basado en `/docs`.

Prompt operativo recomendado:

```text
Lee la carpeta docs completa y hazme un rewind tecnico, operativo y de riesgos del proyecto para continuar trabajando localmente sin romper la arquitectura.
```

## Despliegue operativo

El despliegue se hace solo desde la raiz del proyecto principal.

No ejecutar:

```text
clasp push
```

desde `ftic05/`.

Comandos esperados:

```text
clasp push --force
clasp version "VSxx - descripcion"
clasp deployments
clasp redeploy --deploymentId <ID> --versionNumber <VERSION> --description "VSxx - descripcion"
```

Si no hay deployment productivo:

```text
clasp deploy --versionNumber <VERSION> --description "VSxx - descripcion"
```

## Permisos

La WebApp debe quedar como:

```json
"executeAs": "USER_DEPLOYING",
"access": "DOMAIN"
```

Esto implica ejecucion como usuario que despliega y acceso al dominio de la organizacion.

Scopes requeridos:

- Spreadsheets.
- Drive.
- Documents.
- External request para exportar PDF con `UrlFetchApp.fetch`.
- Email del usuario ejecutor para trazabilidad.

Tras agregar o cambiar scopes, se debe reautorizar la WebApp y redeployar.

### Correccion operativa del error UrlFetchApp.fetch

Si al generar F-TIC-04 aparece:

```text
No cuentas con el permiso para llamar a UrlFetchApp.fetch.
Permisos necesarios: https://www.googleapis.com/auth/script.external_request
```

proceder asi:

1. Confirmar que se este usando la URL `/exec` vigente:

```text
https://script.google.com/macros/s/AKfycbyPSJorPbCYpVphDvDkqfAdAHjmq7lF-tMoh2KDc0Vr3VVX9AKMSsLvcKk5nFC8q_P7fA/exec
```

2. Abrir el proyecto Apps Script principal `Auditor_VS04`.
3. Ejecutar una funcion simple, por ejemplo `doGet`, con el usuario que despliega.
4. Aceptar nuevamente los permisos solicitados.
5. Volver a abrir la WebApp desplegada y probar `F-TIC-04`.

Nota: `clasp push` y `clasp redeploy` suben el manifest, pero no aceptan permisos por el usuario. La autorizacion ocurre cuando el usuario ejecutor acepta el consentimiento en Apps Script/WebApp.

## Uso operativo del modulo F-TIC-04

1. Abrir modulo `F-TIC-04`.
2. Buscar activo por ID, serie/IMEI, hostname o usuario asignado.
3. Seleccionar el activo correcto.
4. Revisar la vista previa.
5. Presionar `Generar F-TIC-04`.
6. Abrir documento o PDF desde los botones resultantes.
7. Revisar `LOG_IMPORTACIONES` para confirmar accion `GENERAR_F_TIC_04`.

## Firma del acta F-TIC-04

Estado operativo actual:

- Si la plantilla configurada ya tiene una firma fija, se mantiene en las copias generadas.
- La WebApp todavia no captura ni inserta una firma dinamica.
- La celda/rango de referencia existe tecnicamente como `CONFIG.FTIC04.CELLS.firma`, pero no se usa aun para insertar imagen.

PENDIENTE de gobierno:

- Definir si la firma sera fija, por usuario, por responsable TIC o capturada al momento de generar el acta.
- Definir responsable de mantener las firmas.
- Definir si la firma sera obligatoria para bloquear o permitir la generacion del acta.

## Responsabilidades

- Arquitectura tecnica: mantener `src/` modular y documentado.
- Operacion TIC: validar datos y evidencias.
- Administrador Apps Script: controlar push, version, deployment y permisos.
- Documentacion viva: mantener `/docs`.

## Decisiones activas

Las decisiones vigentes se registran en:

- `docs/DECISIONES.md`
