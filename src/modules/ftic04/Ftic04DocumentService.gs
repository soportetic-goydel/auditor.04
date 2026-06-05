/*******************************************************
 * Creacion de documento y PDF para F-TIC-04.
 *******************************************************/

function crearDocumentoFTIC04_(payload, folder, options) {
  const p = prepararPayloadGeneracionFTIC04_(payload);
  const config = obtenerConfigGeneracionFTIC04_();
  const opts = options || {};
  const templateId = clean_(config.TEMPLATE_ID || config.TEMPLATE_SPREADSHEET_ID);

  if (!templateId) {
    throw new Error('Falta configurar CONFIG.FTIC04.TEMPLATE_ID.');
  }

  const templateFile = DriveApp.getFileById(templateId);
  const documentName = construirNombreArchivoGeneracionFTIC04_(p, config.DOCUMENT_NAME_PREFIX, config);
  const copy = templateFile.makeCopy(documentName, folder);
  const spreadsheet = SpreadsheetApp.openById(copy.getId());
  const sheet = obtenerHojaPlantillaGeneracionFTIC04_(spreadsheet, config);

  aplicarPayloadEnPlantillaFTIC04_(sheet, p, config);
  SpreadsheetApp.flush();

  const pdfName = construirNombreArchivoGeneracionFTIC04_(p, config.PDF_NAME_PREFIX, config) + '.pdf';
  const pdfBlob = opts.skipPdf || config.PDF_ENABLED === false
    ? null
    : exportarSpreadsheetGeneracionFTIC04_(copy.getId(), sheet.getSheetId(), pdfName, config);

  return {
    documentFileId: copy.getId(),
    documentUrl: copy.getUrl(),
    pdfBlob: pdfBlob,
    pdfName: pdfName
  };
}

function obtenerConfigGeneracionFTIC04_() {
  const config = CONFIG.FTIC04 || {};
  config.CELLS = config.CELLS || {};
  config.PDF_EXPORT_OPTIONS = config.PDF_EXPORT_OPTIONS || {};
  return config;
}

function obtenerHojaPlantillaGeneracionFTIC04_(spreadsheet, config) {
  const sheetName = clean_(config.SHEET_NAME);

  if (sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error('No existe la hoja de plantilla F-TIC-04: ' + sheetName);
    return sheet;
  }

  return spreadsheet.getSheets()[0];
}

function aplicarPayloadEnPlantillaFTIC04_(sheet, payload, config) {
  const values = construirValoresCeldasGeneracionFTIC04_(payload, config);
  const checks = construirChecksGeneracionFTIC04_(payload, config);

  limpiarChecksGeneracionFTIC04_(sheet, config);

  Object.keys(values).forEach(key => {
    const cell = clean_(config.CELLS[key]);
    if (!cell) return;
    sheet.getRange(cell).setValue(values[key]);
  });

  Object.keys(checks).forEach(key => {
    const cell = clean_(config.CELLS[key]);
    if (!cell) return;
    sheet.getRange(cell).setValue(checks[key]);
  });
}

function construirValoresCeldasGeneracionFTIC04_(payload, config) {
  const p = payload || {};
  const requestedBy = getActiveUserEmail_();
  const technicalSummary = joinNonEmpty_([
    p.tipo_activo,
    p.marca,
    p.modelo,
    p.serie_service_tag || p.imei_1,
    p.hostname
  ], ' - ');
  const justification = joinNonEmpty_([
    config.DEFAULT_JUSTIFICATION_PREFIX,
    p.observaciones,
    technicalSummary
  ], '. ');

  return {
    solicitante: requestedBy || p.usuario_asignado,
    fecha: nowString_(),
    dni: p.dni_usuario,
    usuario: p.usuario_asignado,
    cargo: p.cargo_usuario,
    proyecto: p.proyecto_sede || p.ubicacion_fisica,
    ceco: p.centro_de_costo,
    justificacion: justification,
    otroh2: p.tipo_activo,
    otross2: p.software_o_correo || p.antivirus
  };
}

function construirChecksGeneracionFTIC04_(payload, config) {
  const p = payload || {};
  const checks = {};
  const checkMark = clean_(config.CHECK_MARK) || 'X';
  const reasonCellKey = clean_(config.DEFAULT_REASON_CELL_KEY);
  const hardwareKey = obtenerHardwareCellKeyGeneracionFTIC04_(p.tipo_activo, config);
  const softwareKeys = obtenerSoftwareCellKeysGeneracionFTIC04_(p, config);

  if (reasonCellKey) checks[reasonCellKey] = checkMark;
  if (hardwareKey) checks[hardwareKey] = checkMark;

  softwareKeys.forEach(key => {
    checks[key] = checkMark;
  });

  return checks;
}

function limpiarChecksGeneracionFTIC04_(sheet, config) {
  const keys = [
    'nuevoingreso',
    'reemplazoaveria',
    'requirimiento',
    'otro',
    'pcportatil',
    'pcescritorio',
    'smartphone',
    'impresora',
    'otrosh',
    'estandar',
    'autocad',
    'ms',
    'soft',
    'otross'
  ];

  keys.forEach(key => {
    const cell = clean_(config.CELLS[key]);
    if (cell) sheet.getRange(cell).clearContent();
  });
}

function obtenerHardwareCellKeyGeneracionFTIC04_(assetType, config) {
  const canonical = canonicalAssetType_(assetType) || clean_(assetType);
  const map = config.HARDWARE_TYPE_CELL_KEYS || {};
  return clean_(map[canonical] || map[upperClean_(canonical)] || 'otrosh');
}

function obtenerSoftwareCellKeysGeneracionFTIC04_(payload, config) {
  const p = payload || {};
  const keys = [];
  const type = canonicalAssetType_(p.tipo_activo);
  const standardTypes = config.STANDARD_SOFTWARE_ASSET_TYPES || [];
  const softwareText = upperClean_(joinNonEmpty_([
    p.software_o_correo,
    p.antivirus,
    p.sistema_operativo
  ], ' '));

  if (standardTypes.indexOf(type) !== -1) {
    keys.push('estandar');
  }

  (config.SOFTWARE_KEYWORDS || []).forEach(rule => {
    if (softwareText.indexOf(upperClean_(rule.pattern)) !== -1) {
      keys.push(clean_(rule.cellKey));
    }
  });

  if (!keys.length && softwareText) {
    keys.push('otross');
  }

  return keys.filter(Boolean);
}

function exportarSpreadsheetGeneracionFTIC04_(spreadsheetId, sheetId, pdfName, config) {
  const exportOptions = Object.assign({}, config.PDF_EXPORT_OPTIONS || {}, {
    gid: sheetId
  });
  const query = Object.keys(exportOptions)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(exportOptions[key]))
    .join('&');
  const url = 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(spreadsheetId) + '/export?' + query;
  const response = UrlFetchApp.fetch(url, {
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();

  if (code < 200 || code >= 300) {
    throw new Error('No se pudo exportar F-TIC-04 a PDF. Código HTTP: ' + code);
  }

  return response.getBlob().setName(pdfName);
}

function insertarFirmaEnDocumentoFTIC04_(spreadsheetId, firmaDataUrl, config) {
  const cfg = config || obtenerConfigGeneracionFTIC04_();
  const signatureConfig = cfg.SIGNATURE || {};
  const signatureCell = clean_(cfg.CELLS && cfg.CELLS.firma) || 'K48';
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = obtenerHojaPlantillaGeneracionFTIC04_(spreadsheet, cfg);
  const range = sheet.getRange(signatureCell);
  const base64Data = clean_(firmaDataUrl).split(',')[1];

  if (!base64Data) {
    throw new Error('No se recibió imagen de firma válida.');
  }

  const blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data),
    'image/png',
    'firma-ftic04.png'
  );
  const image = sheet.insertImage(blob, range.getColumn(), range.getRow());
  image.setWidth(Number(signatureConfig.SIGNATURE_WIDTH || 200));
  image.setHeight(Number(signatureConfig.SIGNATURE_HEIGHT || 60));
  SpreadsheetApp.flush();

  return {
    blob: blob,
    sheetId: sheet.getSheetId()
  };
}

function construirNombreArchivoGeneracionFTIC04_(payload, prefix, config) {
  const p = payload || {};
  const stamp = Utilities.formatDate(new Date(), CONFIG.TZ, 'yyyyMMdd_HHmmss');
  const pattern = clean_((config || {}).FILE_NAME_PATTERN);

  if (pattern) {
    return safeFolderName_(pattern
      .replace('{prefix}', prefix || 'F-TIC-04')
      .replace('{id_activo}', p.id_activo || '')
      .replace('{hostname}', p.hostname || '')
      .replace('{serie}', p.serie_service_tag || p.imei_1 || '')
      .replace('{stamp}', stamp));
  }

  return safeFolderName_(joinNonEmpty_([
    prefix || 'F-TIC-04',
    p.id_activo,
    p.hostname,
    p.serie_service_tag || p.imei_1,
    stamp
  ], ' - '));
}
