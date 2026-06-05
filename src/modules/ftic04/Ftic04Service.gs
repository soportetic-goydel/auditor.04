/*******************************************************
 * Servicio publico y orquestacion del modulo F-TIC-04.
 *******************************************************/

function buscarActivosParaGenerarFTIC04(query) {
  try {
    const searchText = clean_(query);

    if (!searchText) {
      return {
        ok: false,
        result: { items: [] },
        message: 'Ingresa ID de activo, serie/IMEI, hostname o usuario asignado.'
      };
    }

    const items = buscarActivosGeneracionFTIC04_(searchText, 25);

    return {
      ok: true,
      result: { items: items },
      message: items.length ? 'Activos encontrados: ' + items.length : 'No se encontraron activos.'
    };
  } catch (err) {
    return {
      ok: false,
      result: { items: [] },
      message: err.message || 'No se pudo buscar activos para generar F-TIC-04.'
    };
  }
}

function generarFTIC04DesdeActivo(idActivo) {
  try {
    const record = resolverActivoGeneracionFTIC04_(idActivo);

    if (!record || !record.payload) {
      return {
        ok: false,
        result: null,
        message: 'No se encontró el activo indicado.'
      };
    }

    return generarFTIC04DesdePayload(record.payload);
  } catch (err) {
    return {
      ok: false,
      result: null,
      message: err.message || 'No se pudo generar F-TIC-04 desde el activo.'
    };
  }
}

function generarFTIC04DesdePayload(payload) {
  const lock = LockService.getScriptLock();
  let normalizedPayload = {};

  try {
    lock.waitLock(30000);

    normalizedPayload = prepararPayloadGeneracionFTIC04_(payload);
    const folder = obtenerCarpetaDestinoFTIC04_(normalizedPayload);
    const documentResult = crearDocumentoFTIC04_(normalizedPayload, folder);
    const pdfFile = documentResult.pdfBlob
      ? guardarPdfFTIC04_(folder, documentResult.pdfBlob, documentResult.pdfName)
      : null;

    const result = {
      documentUrl: documentResult.documentUrl,
      pdfUrl: pdfFile ? pdfFile.getUrl() : '',
      folderUrl: folder.getUrl(),
      idActivo: normalizedPayload.id_activo,
      serie: normalizedPayload.serie_service_tag,
      documentFileId: documentResult.documentFileId,
      pdfFileId: pdfFile ? pdfFile.getId() : ''
    };

    registrarLogGeneracionFTIC04_(
      normalizedPayload,
      'OK',
      'F-TIC-04 generado correctamente.',
      result.folderUrl,
      result.documentUrl,
      result.pdfUrl
    );

    return {
      ok: true,
      result: result,
      message: 'F-TIC-04 generado correctamente.'
    };
  } catch (err) {
    registrarLogGeneracionFTIC04_(
      normalizedPayload,
      'ERROR',
      err.message || 'No se pudo generar F-TIC-04.',
      '',
      '',
      ''
    );

    return {
      ok: false,
      result: null,
      message: err.message || 'No se pudo generar F-TIC-04.'
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function prepararPayloadGeneracionFTIC04_(payload) {
  const normalized = applyFtic05Rules_(normalizePayload_(payload || {}));

  if (!clean_(normalized.id_activo)) {
    throw new Error('No se puede generar F-TIC-04 sin ID de activo.');
  }

  if (!clean_(normalized.serie_service_tag) && !clean_(normalized.imei_1)) {
    throw new Error('No se puede generar F-TIC-04 sin serie o IMEI.');
  }

  return normalized;
}
