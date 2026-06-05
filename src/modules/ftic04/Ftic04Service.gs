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

function generarFTIC04DesdeActivo(idActivo, options) {
  try {
    const record = resolverActivoGeneracionFTIC04_(idActivo);

    if (!record || !record.payload) {
      return {
        ok: false,
        result: null,
        message: 'No se encontró el activo indicado.'
      };
    }

    return generarFTIC04DesdePayload(record.payload, options || {});
  } catch (err) {
    return {
      ok: false,
      result: null,
      message: err.message || 'No se pudo generar F-TIC-04 desde el activo.'
    };
  }
}

function generarFTIC04DesdePayload(payload, options) {
  const lock = LockService.getScriptLock();
  let normalizedPayload = {};

  try {
    lock.waitLock(30000);

    normalizedPayload = prepararPayloadGeneracionFTIC04_(payload);
    const opts = options || {};
    const emailFirma = clean_(
      opts.emailFirma ||
      opts.email ||
      extractEmail_(normalizedPayload.software_o_correo)
    );

    if (!isEmail_(emailFirma)) {
      throw new Error('Ingresa un correo válido para enviar la solicitud de firma F-TIC-04.');
    }

    const folder = obtenerCarpetaDestinoFTIC04_(normalizedPayload);
    const documentResult = crearDocumentoFTIC04_(normalizedPayload, folder, { skipPdf: true });
    const signatureRequest = crearSolicitudFirmaFTIC04_(
      normalizedPayload,
      folder,
      documentResult,
      emailFirma
    );

    const result = {
      documentUrl: documentResult.documentUrl,
      pdfUrl: '',
      signatureUrl: signatureRequest.signatureUrl,
      signatureStatus: signatureRequest.estado,
      emailFirma: signatureRequest.email_firma,
      folderUrl: folder.getUrl(),
      idActivo: normalizedPayload.id_activo,
      serie: normalizedPayload.serie_service_tag,
      documentFileId: documentResult.documentFileId,
      pdfFileId: ''
    };

    registrarLogGeneracionFTIC04_(
      normalizedPayload,
      'PENDIENTE_FIRMA',
      'F-TIC-04 preliminar generado y solicitud de firma enviada.',
      result.folderUrl,
      result.documentUrl,
      ''
    );

    return {
      ok: true,
      result: result,
      message: 'Solicitud de firma F-TIC-04 enviada a ' + emailFirma + '.'
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
