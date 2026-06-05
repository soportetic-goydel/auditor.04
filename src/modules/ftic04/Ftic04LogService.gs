/*******************************************************
 * Logs para F-TIC-04.
 *******************************************************/

function registrarLogGeneracionFTIC04_(payload, result, message, folderUrl, documentUrl, pdfUrl) {
  const p = payload || {};

  appendImportLog_({
    fecha_hora: nowString_(),
    usuario_ejecucion: getActiveUserEmail_(),
    accion: 'GENERAR_F_TIC_04',
    id_activo: p.id_activo,
    serie_service_tag: p.serie_service_tag || p.imei_1,
    hostname: p.hostname,
    resultado: result,
    mensaje: message,
    carpeta_documental: folderUrl,
    url_documento: documentUrl,
    url_pdf: pdfUrl
  });
}
