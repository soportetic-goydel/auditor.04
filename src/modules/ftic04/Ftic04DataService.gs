/*******************************************************
 * Datos y payload para F-TIC-04.
 *******************************************************/

function buscarActivosGeneracionFTIC04_(query, limit) {
  const searchText = upperClean_(query);
  const maxItems = limit || 25;
  const found = [];
  const seen = {};

  if (!searchText) return found;

  const masterSheet = getSheetOrThrow_(CONFIG.MASTER.SPREADSHEET_ID, CONFIG.MASTER.SHEET_NAME);
  buscarActivosEnHojaGeneracionFTIC04_(
    masterSheet,
    CONFIG.MASTER.HEADER_ROW,
    CONFIG.MASTER.FIRST_DATA_ROW,
    'MASTER',
    searchText,
    maxItems,
    found,
    seen
  );

  if (found.length < maxItems) {
    const auditorSheet = getSheetOrThrow_(CONFIG.AUDITOR.SPREADSHEET_ID, CONFIG.AUDITOR.SHEET_NAME);
    buscarActivosEnHojaGeneracionFTIC04_(
      auditorSheet,
      CONFIG.AUDITOR.HEADER_ROW,
      CONFIG.AUDITOR.FIRST_DATA_ROW,
      'AUDITOR',
      searchText,
      maxItems,
      found,
      seen
    );
  }

  return found.slice(0, maxItems);
}

function resolverActivoGeneracionFTIC04_(selection) {
  const selected = typeof selection === 'object' && selection !== null
    ? selection
    : { query: selection };
  const source = upperClean_(selected.source);
  const rowNumber = Number(selected.row_number || 0);

  if (source === 'MASTER' && rowNumber) {
    return leerActivoGeneracionDesdeMaster_(rowNumber);
  }

  if (source === 'AUDITOR' && rowNumber) {
    return leerActivoGeneracionDesdeAuditor_(rowNumber);
  }

  const query = clean_(
    selected.id_activo ||
    selected.serie_service_tag ||
    selected.hostname ||
    selected.usuario_asignado ||
    selected.query
  );

  if (!query) return null;

  const matches = buscarActivosGeneracionFTIC04_(query, 25);
  if (!matches.length) return null;

  const exact = seleccionarCoincidenciaExactaGeneracionFTIC04_(matches, query);
  return resolverActivoGeneracionFTIC04_(exact || matches[0]);
}

function leerActivoGeneracionDesdeMaster_(rowNumber) {
  const sheet = getSheetOrThrow_(CONFIG.MASTER.SPREADSHEET_ID, CONFIG.MASTER.SHEET_NAME);
  const raw = readRowAsObject_(sheet, CONFIG.MASTER.HEADER_ROW, rowNumber);

  return {
    source: 'MASTER',
    row_number: rowNumber,
    raw: raw,
    payload: normalizePayload_(raw)
  };
}

function leerActivoGeneracionDesdeAuditor_(rowNumber) {
  const sheet = getSheetOrThrow_(CONFIG.AUDITOR.SPREADSHEET_ID, CONFIG.AUDITOR.SHEET_NAME);
  const raw = readRowAsObject_(sheet, CONFIG.AUDITOR.HEADER_ROW, rowNumber);

  return {
    source: 'AUDITOR',
    row_number: rowNumber,
    raw: raw,
    payload: normalizePayload_(mapAuditorObjectToPayload_(raw))
  };
}

function buscarActivosEnHojaGeneracionFTIC04_(sheet, headerRow, firstDataRow, source, query, limit, found, seen) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (!lastCol || lastRow < firstDataRow || found.length >= limit) return;

  const headers = sheet.getRange(headerRow, 1, 1, lastCol).getValues()[0].map(header => clean_(header));
  const values = sheet.getRange(firstDataRow, 1, lastRow - firstDataRow + 1, lastCol).getValues();
  const searchableHeaders = obtenerEncabezadosBusquedaGeneracionFTIC04_(source);

  for (let index = 0; index < values.length; index++) {
    if (found.length >= limit) return;

    const object = {};
    headers.forEach((header, colIndex) => {
      object[header] = values[index][colIndex];
    });

    const matches = searchableHeaders.some(header => upperClean_(object[header]).indexOf(query) !== -1);
    if (!matches) continue;

    const payload = source === 'MASTER'
      ? normalizePayload_(object)
      : normalizePayload_(mapAuditorObjectToPayload_(object));
    const key = upperClean_(payload.id_activo || payload.serie_service_tag || source + '-' + (firstDataRow + index));

    if (seen[key]) continue;
    seen[key] = true;

    found.push(construirItemBusquedaGeneracionFTIC04_(payload, source, firstDataRow + index));
  }
}

function obtenerEncabezadosBusquedaGeneracionFTIC04_(source) {
  if (source === 'MASTER') {
    return ['ID_ACTIVO', 'SERIE_SERVICE_TAG', 'HOSTNAME', 'USUARIO_ASIGNADO'];
  }

  return ['ID DE ACTIVO', 'NÚMERO DE SERIE O IMEI', 'NOMBRE DEL DISPOSITIVO', 'USUARIO ASIGNADO'];
}

function construirItemBusquedaGeneracionFTIC04_(payload, source, rowNumber) {
  const p = applyFtic05Rules_(normalizePayload_(payload || {}));

  return {
    source: source,
    row_number: rowNumber,
    id_activo: p.id_activo,
    serie_service_tag: p.serie_service_tag || p.imei_1,
    hostname: p.hostname,
    usuario_asignado: p.usuario_asignado,
    empresa_grupo: p.empresa_grupo,
    tipo_activo: p.tipo_activo,
    marca: p.marca,
    modelo: p.modelo,
    centro_de_costo: p.centro_de_costo,
    estado_operativo: p.estado_operativo
  };
}

function seleccionarCoincidenciaExactaGeneracionFTIC04_(items, query) {
  const normalizedQuery = upperClean_(query);

  return (items || []).find(item => {
    return [
      item.id_activo,
      item.serie_service_tag,
      item.hostname,
      item.usuario_asignado
    ].some(value => upperClean_(value) === normalizedQuery);
  }) || null;
}
