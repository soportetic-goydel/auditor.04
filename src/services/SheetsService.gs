/*******************************************************
 * Servicios base para Google Sheets.
 *******************************************************/

function getSheetOrThrow_(spreadsheetId, sheetName) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error('No existe la hoja: ' + sheetName);
  }

  return sheet;
}

function writeObjectByHeaders_(sheet, headerRow, targetRow, objectByHeader) {
  const lastCol = sheet.getLastColumn();
  if (!lastCol) throw new Error('La hoja no tiene encabezados.');

  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  let rowValues = new Array(lastCol).fill('');

  if (targetRow <= sheet.getLastRow()) {
    rowValues = sheet.getRange(targetRow, 1, 1, lastCol).getValues()[0];
  }

  headers.forEach((header, index) => {
    const cleanHeader = clean_(header);
    if (Object.prototype.hasOwnProperty.call(objectByHeader, cleanHeader)) {
      rowValues[index] = objectByHeader[cleanHeader];
    }
  });

  sheet.getRange(targetRow, 1, 1, lastCol).setValues([rowValues]);
}

function findRowByHeaderValue_(sheet, headerRow, headerName, value, firstDataRow) {
  const searchValue = clean_(value);
  if (!searchValue) return null;

  const headerMap = getHeaderMap_(sheet, headerRow);
  const col = headerMap[normalizeHeader_(headerName)];

  if (!col) {
    throw new Error('No se encontró el encabezado: ' + headerName);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < firstDataRow) return null;

  const values = sheet.getRange(firstDataRow, col, lastRow - firstDataRow + 1, 1).getValues();
  const normalizedSearch = searchValue.toUpperCase();

  for (let index = 0; index < values.length; index++) {
    if (clean_(values[index][0]).toUpperCase() === normalizedSearch) {
      return firstDataRow + index;
    }
  }

  return null;
}

function readRowAsObject_(sheet, headerRow, row) {
  const lastCol = sheet.getLastColumn();
  if (!lastCol) return {};

  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  const object = {};

  headers.forEach((header, index) => {
    object[clean_(header)] = values[index];
  });

  return object;
}

function getHeaderMap_(sheet, headerRow) {
  const lastCol = sheet.getLastColumn();
  if (!lastCol) return {};

  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0];
  const map = {};

  headers.forEach((header, index) => {
    const normalized = normalizeHeader_(header);
    if (normalized) map[normalized] = index + 1;
  });

  return map;
}

function getNextWriteRow_(sheet, firstDataRow) {
  return Math.max(sheet.getLastRow() + 1, firstDataRow);
}

function generateAssetId_() {
  const year = Utilities.formatDate(new Date(), CONFIG.TZ, 'yyyy');
  const key = 'ASSET_SEQ_' + year;
  const properties = PropertiesService.getScriptProperties();
  const current = Number(properties.getProperty(key) || '0') + 1;

  properties.setProperty(key, String(current));

  return 'ACT-F-TIC-05-' + year + '-' + String(current).padStart(5, '0');
}

function ensureLogSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(CONFIG.MASTER.LOG_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.MASTER.LOG_SHEET_NAME);
    sheet.getRange(1, 1, 1, CONFIG.LOG_HEADERS.length).setValues([CONFIG.LOG_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, CONFIG.LOG_HEADERS.length).setValues([CONFIG.LOG_HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const lastCol = sheet.getLastColumn();
  const currentHeaders = lastCol
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(header => clean_(header))
    : [];
  const missingHeaders = CONFIG.LOG_HEADERS.filter(header => currentHeaders.indexOf(header) === -1);

  if (missingHeaders.length) {
    sheet.getRange(1, lastCol + 1, 1, missingHeaders.length).setValues([missingHeaders]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function appendImportLog_(entry) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.MASTER.SPREADSHEET_ID);
    const sheet = ensureLogSheet_(spreadsheet);
    const source = entry || {};

    const row = CONFIG.LOG_HEADERS.map(header => clean_(source[header]));
    sheet.appendRow(row);
  } catch (e) {
    console.error('No se pudo registrar LOG_IMPORTACIONES: ' + e.message);
  }
}

function getImportLogTable() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.MASTER.SPREADSHEET_ID);
    const sheet = ensureLogSheet_(spreadsheet);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (!lastCol || lastRow < 2) {
      return {
        ok: true,
        headers: CONFIG.LOG_HEADERS,
        rows: []
      };
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(header => clean_(header));
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    const rows = values
      .map((row, index) => {
        const object = {};
        headers.forEach((header, colIndex) => {
          object[header] = row[colIndex];
        });

        return {
          row_number: index + 2,
          values: object
        };
      })
      .reverse()
      .slice(0, 250);

    return {
      ok: true,
      headers: headers,
      rows: rows
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'No se pudo cargar el LOG.'
    };
  }
}
