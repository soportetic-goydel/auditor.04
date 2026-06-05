/*******************************************************
 * Flujo de firma para F-TIC-04.
 *******************************************************/

function crearSolicitudFirmaFTIC04_(payload, folder, documentResult, emailFirma) {
  const p = prepararPayloadGeneracionFTIC04_(payload);
  const config = obtenerConfigGeneracionFTIC04_();
  const signatureConfig = config.SIGNATURE || {};
  const email = clean_(emailFirma);

  if (!isEmail_(email)) {
    throw new Error('Ingresa un correo válido para enviar la firma F-TIC-04.');
  }

  const token = generarTokenFirmaFTIC04_();
  const signatureUrl = construirUrlFirmaFTIC04_(token);
  const request = {
    fecha_creacion: nowString_(),
    token: token,
    estado: signatureConfig.STATUS_PENDING || 'PENDIENTE_FIRMA',
    id_activo: p.id_activo,
    serie_service_tag: p.serie_service_tag || p.imei_1,
    hostname: p.hostname,
    dni_usuario: p.dni_usuario,
    usuario_asignado: p.usuario_asignado,
    email_firma: email,
    document_file_id: documentResult.documentFileId,
    document_url: documentResult.documentUrl,
    folder_id: folder.getId(),
    folder_url: folder.getUrl(),
    signature_file_id: '',
    signature_url: '',
    pdf_file_id: '',
    pdf_url: '',
    fecha_firma: '',
    usuario_ejecucion: getActiveUserEmail_(),
    mensaje: 'Solicitud de firma creada.'
  };

  appendSolicitudFirmaFTIC04_(request);
  enviarSolicitudFirmaFTIC04_(request, signatureUrl);

  request.signatureUrl = signatureUrl;
  return request;
}

function buscarSolicitudFirmaFTIC04(token) {
  try {
    const request = obtenerSolicitudFirmaPorTokenFTIC04_(token);

    if (!request) {
      return {
        ok: false,
        result: null,
        message: 'No se encontró una solicitud de firma válida.'
      };
    }

    return {
      ok: true,
      result: construirRespuestaSolicitudFirmaFTIC04_(request),
      message: request.estado === obtenerEstadoFirmaFTIC04_('STATUS_PENDING')
        ? 'Solicitud lista para firma.'
        : 'La solicitud ya fue procesada.'
    };
  } catch (err) {
    return {
      ok: false,
      result: null,
      message: err.message || 'No se pudo consultar la solicitud de firma.'
    };
  }
}

function procesarFirmaFTIC04(datos) {
  const lock = LockService.getScriptLock();
  let request = null;

  try {
    lock.waitLock(30000);

    const data = datos || {};
    const token = clean_(data.token);
    const firmaDataUrl = clean_(data.firmaDataUrl || data.firmaResponsable);

    if (!token) {
      throw new Error('No se recibió token de firma.');
    }

    if (!firmaDataUrl || firmaDataUrl.indexOf('data:image/png;base64,') !== 0) {
      throw new Error('No se recibió una firma válida.');
    }

    request = obtenerSolicitudFirmaPorTokenFTIC04_(token);
    if (!request) {
      throw new Error('No se encontró una solicitud de firma válida.');
    }

    if (request.estado !== obtenerEstadoFirmaFTIC04_('STATUS_PENDING')) {
      return {
        ok: true,
        result: construirRespuestaSolicitudFirmaFTIC04_(request),
        message: 'Esta solicitud ya fue procesada.'
      };
    }

    const config = obtenerConfigGeneracionFTIC04_();
    const folder = DriveApp.getFolderById(request.folder_id);
    const signatureResult = insertarFirmaEnDocumentoFTIC04_(
      request.document_file_id,
      firmaDataUrl,
      config
    );
    const signatureFile = guardarFirmaImagenFTIC04_(folder, signatureResult.blob, request);
    const pdfName = construirNombreArchivoFirmaFTIC04_(request, config);
    const pdfBlob = exportarSpreadsheetGeneracionFTIC04_(
      request.document_file_id,
      signatureResult.sheetId,
      pdfName,
      config
    );
    const pdfFile = guardarPdfFTIC04_(folder, pdfBlob, pdfName);

    const updates = {
      estado: obtenerEstadoFirmaFTIC04_('STATUS_SIGNED'),
      signature_file_id: signatureFile.getId(),
      signature_url: signatureFile.getUrl(),
      pdf_file_id: pdfFile.getId(),
      pdf_url: pdfFile.getUrl(),
      fecha_firma: nowString_(),
      usuario_ejecucion: getActiveUserEmail_(),
      mensaje: 'Acta firmada y PDF generado.'
    };

    actualizarSolicitudFirmaFTIC04_(request.row_number, updates);
    request = Object.assign({}, request, updates);

    registrarLogGeneracionFTIC04_(
      request,
      'OK',
      'F-TIC-04 firmado y PDF generado.',
      request.folder_url,
      request.document_url,
      request.pdf_url
    );

    return {
      ok: true,
      result: construirRespuestaSolicitudFirmaFTIC04_(request),
      message: 'Firma registrada y PDF generado correctamente.'
    };
  } catch (err) {
    if (request && request.row_number) {
      actualizarSolicitudFirmaFTIC04_(request.row_number, {
        estado: obtenerEstadoFirmaFTIC04_('STATUS_ERROR'),
        mensaje: err.message || 'No se pudo procesar la firma.',
        usuario_ejecucion: getActiveUserEmail_()
      });
    }

    registrarLogGeneracionFTIC04_(
      request || {},
      'ERROR',
      err.message || 'No se pudo procesar la firma F-TIC-04.',
      request ? request.folder_url : '',
      request ? request.document_url : '',
      request ? request.pdf_url : ''
    );

    return {
      ok: false,
      result: null,
      message: err.message || 'No se pudo procesar la firma F-TIC-04.'
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function enviarSolicitudFirmaFTIC04_(request, signatureUrl) {
  const subject = [
    (CONFIG.FTIC04.SIGNATURE || {}).EMAIL_SUBJECT_PREFIX || 'Firma de Acta F-TIC-04',
    request.id_activo || request.serie_service_tag || ''
  ].filter(Boolean).join(' - ');
  const htmlBody = [
    '<p>Hola ' + escapeHtmlForEmail_(request.usuario_asignado || '') + ',</p>',
    '<p>Se ha generado un acta F-TIC-04 pendiente de firma para el activo <strong>' +
      escapeHtmlForEmail_(request.id_activo || request.serie_service_tag || '') +
      '</strong>.</p>',
    '<p><a href="' + signatureUrl + '" style="display:inline-block;padding:10px 16px;background:#1f5fae;color:#ffffff;text-decoration:none;border-radius:4px;">Firmar F-TIC-04</a></p>',
    '<p>Si el botón no abre, copia este enlace:</p>',
    '<p>' + signatureUrl + '</p>',
    '<p><small>Correo automático del sistema TIC.</small></p>'
  ].join('');

  MailApp.sendEmail({
    to: request.email_firma,
    subject: subject,
    htmlBody: htmlBody
  });
}

function appendSolicitudFirmaFTIC04_(entry) {
  const sheet = ensureFtic04SignatureSheet_();
  const source = entry || {};
  const row = CONFIG.FTIC04_SIGNATURE_HEADERS.map(header => clean_(source[header]));
  sheet.appendRow(row);
}

function actualizarSolicitudFirmaFTIC04_(rowNumber, updates) {
  const sheet = ensureFtic04SignatureSheet_();
  writeObjectByHeaders_(sheet, 1, rowNumber, updates || {});
}

function obtenerSolicitudFirmaPorTokenFTIC04_(token) {
  const sheet = ensureFtic04SignatureSheet_();
  const rowNumber = findRowByHeaderValue_(sheet, 1, 'token', token, 2);

  if (!rowNumber) return null;

  const request = readRowAsObject_(sheet, 1, rowNumber);
  request.row_number = rowNumber;
  return request;
}

function ensureFtic04SignatureSheet_() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.MASTER.SPREADSHEET_ID);
  const sheetName = (CONFIG.FTIC04.SIGNATURE || {}).REQUEST_SHEET_NAME || 'F_TIC_04_FIRMAS';
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, CONFIG.FTIC04_SIGNATURE_HEADERS.length).setValues([CONFIG.FTIC04_SIGNATURE_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, CONFIG.FTIC04_SIGNATURE_HEADERS.length).setValues([CONFIG.FTIC04_SIGNATURE_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const lastCol = sheet.getLastColumn();
  const currentHeaders = lastCol
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(header => clean_(header))
    : [];
  const missingHeaders = CONFIG.FTIC04_SIGNATURE_HEADERS.filter(header => currentHeaders.indexOf(header) === -1);

  if (missingHeaders.length) {
    sheet.getRange(1, lastCol + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function generarTokenFirmaFTIC04_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').substring(0, 8);
}

function construirUrlFirmaFTIC04_(token) {
  const baseUrl = ScriptApp.getService().getUrl();

  if (!baseUrl) {
    throw new Error('No se pudo obtener la URL de la WebApp para firma.');
  }

  return baseUrl + '?modo=firma&token=' + encodeURIComponent(token);
}

function guardarFirmaImagenFTIC04_(folder, signatureBlob, request) {
  const prefix = (CONFIG.FTIC04.SIGNATURE || {}).SIGNATURE_FILE_PREFIX || 'FIRMA F-TIC-04';
  const fileName = safeFolderName_(joinNonEmpty_([
    prefix,
    request.id_activo,
    request.serie_service_tag,
    Utilities.formatDate(new Date(), CONFIG.TZ, 'yyyyMMdd_HHmmss')
  ], ' - ')) + '.png';

  const imageBlob = Utilities.newBlob(
    signatureBlob.getBytes(),
    signatureBlob.getContentType(),
    fileName
  );

  return folder.createFile(imageBlob);
}

function construirNombreArchivoFirmaFTIC04_(request, config) {
  return construirNombreArchivoGeneracionFTIC04_({
    id_activo: request.id_activo,
    hostname: request.hostname,
    serie_service_tag: request.serie_service_tag
  }, (config || {}).PDF_NAME_PREFIX || 'F-TIC-04', config || CONFIG.FTIC04) + '.pdf';
}

function construirRespuestaSolicitudFirmaFTIC04_(request) {
  return {
    token: request.token,
    estado: request.estado,
    idActivo: request.id_activo,
    serie: request.serie_service_tag,
    hostname: request.hostname,
    dni: request.dni_usuario,
    usuario: request.usuario_asignado,
    emailFirma: request.email_firma,
    documentUrl: request.document_url,
    pdfUrl: request.pdf_url,
    folderUrl: request.folder_url,
    fechaCreacion: request.fecha_creacion,
    fechaFirma: request.fecha_firma,
    mensaje: request.mensaje
  };
}

function obtenerEstadoFirmaFTIC04_(key) {
  const signatureConfig = (CONFIG.FTIC04 && CONFIG.FTIC04.SIGNATURE) || {};
  return signatureConfig[key] || {
    STATUS_PENDING: 'PENDIENTE_FIRMA',
    STATUS_SIGNED: 'FIRMADO',
    STATUS_ERROR: 'ERROR'
  }[key];
}

function escapeHtmlForEmail_(value) {
  return clean_(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
