# Guia General - INVENTARIO DE ACTIVOS DE HARDWARE VS01

Ultima actualizacion: 2026-06-04 America/Lima

## Proposito

Este repositorio contiene el modulo de inventario de activos de hardware que luego debe encajar dentro del sistema matriz `zSGTIC_2026`.

El modulo mantiene:

- Auditor PowerShell para equipos Windows.
- WebApp Google Apps Script con HtmlService.
- Inventario oficial `F-TIC-05`.
- Maestro interno `MC-F-TIC-05`.
- Referencias de personal y CECO.
- Drive documental.
- Generacion documental F-TIC-04 integrada en el proyecto principal.

## Relacion con zSGTIC_2026

El proyecto ya no debe tratarse como un mini sistema aislado. La estructura local se organiza por carpetas para que sus modulos puedan migrarse o integrarse progresivamente a `zSGTIC_2026`.

Principios:

- Configuracion centralizada.
- Servicios por responsabilidad.
- Vistas y clientes frontend separados por modulo.
- Includes HtmlService en vez de un `Index.html` monolitico.
- Sin dependencias sobre `/ftic05` en el proyecto principal.

## Proyectos Apps Script

Proyecto principal:

```text
Auditor_VS04
Script ID: 10A0MHVYsKZAubygW2_qe6Zubdkw7iO1_KXg71ZLQHR8cBumlXZvtlvNh
```

Proyecto auxiliar solo de referencia:

```text
F-TIC-05 Automatizacion
Ruta local: ftic05/
```

`ftic05/` esta excluido del despliegue del proyecto principal mediante `.claspignore`.

## Modulos funcionales

- `INVENTARIO (F-TIC-05)`
- `FORMULARIO DE REGISTRO`
- `F-TIC-04`
- `LISTADO DE PERSONAL`
- `LOGS`

## Estado del modulo F-TIC-04

El modulo `F-TIC-04` genera el acta de entrega o devolucion desde datos ya registrados del inventario.

Estado vigente:

- Busca activos desde `MC-F-TIC-05` o `F-TIC-05`.
- Copia la plantilla configurada en `CONFIG.FTIC04`.
- Completa celdas mapeadas.
- Exporta PDF mediante `UrlFetchApp.fetch`.
- Guarda documento/PDF en Drive.
- Registra accion `GENERAR_F_TIC_04` en `LOG_IMPORTACIONES`.

La firma dinamica del acta esta pendiente. Si la plantilla contiene una firma fija, se conserva al copiar la plantilla. Si se requiere firma por usuario, debe implementarse como flujo separado y configurable.

## Estructura local vigente

```text
src/config/
src/core/
src/services/
src/modules/inventario/
src/modules/formulario/
src/modules/ftic04/
src/modules/personal/
src/modules/logs/
src/ui/
docs/
ftic05/  (referencia excluida de clasp)
```

## Onboarding local para nuevo colaborador

Este proyecto se trabaja localmente en VSCode y se despliega a Google Apps Script mediante `clasp`. La persona que lo retome debe entender primero la documentacion viva antes de modificar codigo.

Lectura minima obligatoria:

1. `docs/01_GUIA_GENERAL.md`
2. `docs/02_GUIA_TECNICA.md`
3. `docs/03_GUIA_OPERATIVA_Y_GOBIERNO.md`
4. `docs/CHANGELOG.md`
5. `docs/DECISIONES.md`

Flujo recomendado para iniciar:

1. Abrir la raiz del repositorio en VSCode.
2. Revisar `.clasp.json`, `.claspignore` y `appsscript.json`.
3. Identificar la separacion entre `src/config`, `src/core`, `src/services`, `src/modules` y `src/ui`.
4. Confirmar que `ftic05/` es solo referencia y no se despliega.
5. Hacer cambios pequenos, verificables y documentados.
6. Actualizar `/docs` si cambia UI, logica, configuracion, permisos, despliegue o decisiones.

Prompt simple de rewind para un chat nuevo:

```text
Lee la carpeta docs completa y hazme un rewind tecnico, operativo y de riesgos del proyecto para continuar trabajando localmente sin romper la arquitectura.
```

## Reglas de gobierno

- No hardcodear nuevos IDs, carpetas, rutas, plantillas ni reglas de negocio fuera de `CONFIG`.
- No modificar `ftic05/` salvo tarea separada explicita.
- No hacer `clasp push` desde `ftic05/`.
- Mantener llamadas backend por `google.script.run`.
- Mantener frontend servido por HtmlService e includes.
- Actualizar `/docs` ante cambios funcionales, visuales, tecnicos o de despliegue.
