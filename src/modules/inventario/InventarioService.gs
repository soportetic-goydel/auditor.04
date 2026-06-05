/*******************************************************
 * Servicio principal de inventario.
 *******************************************************/

function saveInventoryRecord(form) {
  const lock = LockService.getScriptLock();
  let payload = normalizePayload_(form || {});
  let evidenceResult = null;

  try {
    lock.waitLock(30000);

    payload = applyFtic05Rules_(normalizePayload_(payload));
    validateBeforeSave_(payload);

    const now = nowString_();
    const auditorSheet = getSheetOrThrow_(CONFIG.AUDITOR.SPREADSHEET_ID, CONFIG.AUDITOR.SHEET_NAME);
    const masterSpreadsheet = SpreadsheetApp.openById(CONFIG.MASTER.SPREADSHEET_ID);
    const masterSheet = masterSpreadsheet.getSheetByName(CONFIG.MASTER.SHEET_NAME);

    if (!masterSheet) {
      throw new Error('No existe la hoja interna MC-F-TIC-05.');
    }

    const existingMasterRow = findRowByHeaderValue_(
      masterSheet,
      CONFIG.MASTER.HEADER_ROW,
      CONFIG.MASTER.KEY_HEADER,
      payload.serie_service_tag,
      CONFIG.MASTER.FIRST_DATA_ROW
    );

    const existingAuditorRow = findRowByHeaderValue_(
      auditorSheet,
      CONFIG.AUDITOR.HEADER_ROW,
      CONFIG.AUDITOR.KEY_HEADER,
      payload.serie_service_tag,
      CONFIG.AUDITOR.FIRST_DATA_ROW
    );

    let idActivo = payload.id_activo || '';
    let fechaAlta = now;

    if (existingMasterRow) {
      const existingMaster = readRowAsObject_(masterSheet, CONFIG.MASTER.HEADER_ROW, existingMasterRow);
      idActivo = clean_(existingMaster.ID_ACTIVO) || idActivo;
      fechaAlta = clean_(existingMaster.FECHA_HORA_ALTA) || now;
    }

    if (!idActivo && existingAuditorRow) {
      const existingAuditor = readRowAsObject_(auditorSheet, CONFIG.AUDITOR.HEADER_ROW, existingAuditorRow);
      idActivo = clean_(existingAuditor['ID DE ACTIVO']);
    }

    payload.id_activo = idActivo || generateAssetId_();
    payload.fecha_hora_alta = fechaAlta;
    payload.fecha_hora_ultima_actualizacion = now;
    payload = applyFtic05Rules_(payload);

    try {
      evidenceResult = saveEvidenceLinks(payload);
      const txtResult = saveAuditTxtRecord_(payload);

      if (txtResult) {
        evidenceResult.audit_txt = txtResult;
      }

      if (evidenceResult && evidenceResult.copied && evidenceResult.copied.length) {
        evidenceResult.copied.forEach(item => {
          if (item.field && item.copied_url) {
            payload[item.field] = item.copied_url;
          }
        });
      }

      if (evidenceResult && evidenceResult.folder_url) {
        payload.url_evidencia_adicional = payload.url_evidencia_adicional || evidenceResult.folder_url;
      }
    } catch (driveErr) {
      evidenceResult = {
        ok: false,
        folder_url: '',
        copied: [],
        warning: 'No se pudo procesar carpeta documental: ' + driveErr.message
      };
    }

    const masterRowObject = mapToMasterRow_(payload);
    const auditorRowObject = mapToAuditorRow_(payload);

    const masterTargetRow = existingMasterRow || getNextWriteRow_(masterSheet, CONFIG.MASTER.FIRST_DATA_ROW);
    writeObjectByHeaders_(masterSheet, CONFIG.MASTER.HEADER_ROW, masterTargetRow, masterRowObject);

    const auditorTargetRow = existingAuditorRow || getNextWriteRow_(auditorSheet, CONFIG.AUDITOR.FIRST_DATA_ROW);
    writeObjectByHeaders_(auditorSheet, CONFIG.AUDITOR.HEADER_ROW, auditorTargetRow, auditorRowObject);

    appendImportLog_({
      fecha_hora: now,
      usuario_ejecucion: getActiveUserEmail_(),
      accion: existingMasterRow || existingAuditorRow ? 'UPSERT_ACTUALIZAR' : 'UPSERT_CREAR',
      id_activo: payload.id_activo,
      serie_service_tag: payload.serie_service_tag,
      hostname: payload.hostname,
      resultado: 'OK',
      mensaje: evidenceResult && evidenceResult.warning ? evidenceResult.warning : 'Registro procesado correctamente.',
      carpeta_documental: evidenceResult && evidenceResult.folder_url ? evidenceResult.folder_url : ''
    });

    return {
      ok: true,
      id_activo: payload.id_activo,
      action_master: existingMasterRow ? 'ACTUALIZADO' : 'CREADO',
      action_auditor: existingAuditorRow ? 'ACTUALIZADO' : 'CREADO',
      master_row: masterTargetRow,
      auditor_row: auditorTargetRow,
      evidence: evidenceResult
    };
  } catch (err) {
    appendImportLog_({
      fecha_hora: nowString_(),
      usuario_ejecucion: getActiveUserEmail_(),
      accion: 'UPSERT',
      id_activo: payload.id_activo,
      serie_service_tag: payload.serie_service_tag,
      hostname: payload.hostname,
      resultado: 'ERROR',
      mensaje: err.message || 'Error al guardar.',
      carpeta_documental: evidenceResult && evidenceResult.folder_url ? evidenceResult.folder_url : ''
    });

    return {
      ok: false,
      message: err.message || 'No se pudo guardar el registro.'
    };
  } finally {
    try {
      lock.releaseLock();
    } catch (e) {}
  }
}

function getInventoryTable() {
  try {
    const sheet = getSheetOrThrow_(CONFIG.AUDITOR.SPREADSHEET_ID, CONFIG.AUDITOR.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    if (!lastCol || lastRow < CONFIG.AUDITOR.FIRST_DATA_ROW) {
      const headers = lastCol
        ? sheet.getRange(CONFIG.AUDITOR.HEADER_ROW, 1, 1, lastCol).getValues()[0].map(header => clean_(header)).filter(Boolean)
        : [];
      return {
        ok: true,
        headers: headers,
        rows: []
      };
    }

    const headers = sheet.getRange(CONFIG.AUDITOR.HEADER_ROW, 1, 1, lastCol).getValues()[0];
    const cleanHeaders = headers.map(header => clean_(header)).filter(Boolean);
    const companyBySerie = getMasterCompanyBySerie_();
    const values = sheet.getRange(
      CONFIG.AUDITOR.FIRST_DATA_ROW,
      1,
      lastRow - CONFIG.AUDITOR.FIRST_DATA_ROW + 1,
      lastCol
    ).getValues();

    const rows = values.map((row, index) => {
      const object = {};
      headers.forEach((header, colIndex) => {
        object[clean_(header)] = row[colIndex];
      });

      const hasAnyData = Object.keys(object).some(key => clean_(object[key]));
      if (!hasAnyData) return null;

      const status = isRecordComplete_(object) ? 'COMPLETO' : 'INCOMPLETO';
      const serie = clean_(object['NÚMERO DE SERIE O IMEI']);
      const empresa = clean_(object['EMPRESA'] || object['EMPRESA DEL GRUPO']) || companyBySerie[upperClean_(serie)] || '';

      return {
        row_number: CONFIG.AUDITOR.FIRST_DATA_ROW + index,
        values: object,
        id_activo: object['ID DE ACTIVO'],
        tipo_equipo: object['TIPO DE EQUIPO'],
        marca: object['MARCA'],
        modelo: object['MODELO'],
        serie: serie,
        hostname: object['NOMBRE DEL DISPOSITIVO'],
        usuario: object['USUARIO ASIGNADO'],
        ubicacion: object['UBICACIÓN'],
        ceco: object['CECO'],
        empresa: empresa,
        estado_operativo: object['ESTADO OPERATIVO'],
        status: status
      };
    }).filter(Boolean);

    return {
      ok: true,
      headers: cleanHeaders,
      rows: rows
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'No se pudo cargar el inventario.'
    };
  }
}

function getMasterCompanyBySerie_() {
  try {
    const sheet = getSheetOrThrow_(CONFIG.MASTER.SPREADSHEET_ID, CONFIG.MASTER.SHEET_NAME);
    const headerMap = getHeaderMap_(sheet, CONFIG.MASTER.HEADER_ROW);
    const serieCol = headerMap[normalizeHeader_(CONFIG.MASTER.KEY_HEADER)];
    const empresaCol = headerMap[normalizeHeader_('EMPRESA_DEL_GRUPO')];
    const lastRow = sheet.getLastRow();

    if (!serieCol || !empresaCol || lastRow < CONFIG.MASTER.FIRST_DATA_ROW) return {};

    const width = Math.max(serieCol, empresaCol);
    const values = sheet.getRange(
      CONFIG.MASTER.FIRST_DATA_ROW,
      1,
      lastRow - CONFIG.MASTER.FIRST_DATA_ROW + 1,
      width
    ).getValues();

    const map = {};
    values.forEach(row => {
      const serie = clean_(row[serieCol - 1]);
      if (!serie) return;
      map[upperClean_(serie)] = clean_(row[empresaCol - 1]);
    });

    return map;
  } catch (err) {
    return {};
  }
}

function getInventoryRecordBySerie(serie) {
  try {
    const searchSerie = clean_(serie);

    if (!searchSerie) {
      throw new Error('Serie vacía.');
    }

    const masterSheet = getSheetOrThrow_(CONFIG.MASTER.SPREADSHEET_ID, CONFIG.MASTER.SHEET_NAME);
    const masterRow = findRowByHeaderValue_(
      masterSheet,
      CONFIG.MASTER.HEADER_ROW,
      CONFIG.MASTER.KEY_HEADER,
      searchSerie,
      CONFIG.MASTER.FIRST_DATA_ROW
    );

    if (masterRow) {
      const object = readRowAsObject_(masterSheet, CONFIG.MASTER.HEADER_ROW, masterRow);
      return {
        ok: true,
        payload: normalizePayload_(object),
        source: 'MASTER',
        row_number: masterRow
      };
    }

    const auditorSheet = getSheetOrThrow_(CONFIG.AUDITOR.SPREADSHEET_ID, CONFIG.AUDITOR.SHEET_NAME);
    const auditorRow = findRowByHeaderValue_(
      auditorSheet,
      CONFIG.AUDITOR.HEADER_ROW,
      CONFIG.AUDITOR.KEY_HEADER,
      searchSerie,
      CONFIG.AUDITOR.FIRST_DATA_ROW
    );

    if (!auditorRow) {
      throw new Error('No se encontró el activo por serie.');
    }

    const auditorObject = readRowAsObject_(auditorSheet, CONFIG.AUDITOR.HEADER_ROW, auditorRow);

    return {
      ok: true,
      payload: normalizePayload_(mapAuditorObjectToPayload_(auditorObject)),
      source: 'AUDITOR',
      row_number: auditorRow
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'No se pudo cargar el registro.'
    };
  }
}
