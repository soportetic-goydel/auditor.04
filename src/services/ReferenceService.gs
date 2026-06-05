/*******************************************************
 * Servicios de referencia: personal y CECO.
 *******************************************************/

function lookupPersonByDni(dni) {
  try {
    const searchDni = clean_(dni);

    if (!searchDni) {
      throw new Error('Ingresa un DNI.');
    }

    if (!/^\d{8}$/.test(searchDni)) {
      throw new Error('El DNI debe tener 8 dígitos.');
    }

    const spreadsheet = SpreadsheetApp.openById(CONFIG.REFERENCE_DB.SPREADSHEET_ID);

    for (const sheetName of CONFIG.REFERENCE_DB.SHEETS_PERSONAL) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() < 2) continue;

      const values = sheet.getDataRange().getValues();
      const headerMap = buildReferenceHeaderMap_(values[0]);

      const dniCol = headerMap.DNI;
      if (dniCol === undefined) continue;

      for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex];
        const rowDni = clean_(row[dniCol]);

        if (rowDni === searchDni) {
          return {
            ok: true,
            empresa_grupo: companyFromPersonalSheet_(sheetName),
            dni_usuario: rowDni,
            usuario_asignado: clean_(row[headerMap['APELLIDOS Y NOMBRES']]),
            cargo_usuario: clean_(row[headerMap.CARGO]),
            area_usuario: clean_(row[headerMap.AREA]),
            proyecto_sede: clean_(row[headerMap.PROYECTO])
          };
        }
      }
    }

    return {
      ok: false,
      message: 'DNI no encontrado en la base de personal.'
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'No se pudo buscar el DNI.'
    };
  }
}

function getCecoList(empresa) {
  try {
    const companyKey = normalizeCompanyKey_(empresa);
    const spreadsheet = SpreadsheetApp.openById(CONFIG.REFERENCE_DB.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.REFERENCE_DB.SHEET_CECO);

    if (!sheet) {
      throw new Error('No existe la hoja CECO.');
    }

    if (sheet.getLastRow() < 2) {
      return {
        ok: true,
        items: []
      };
    }

    const values = sheet.getDataRange().getValues();
    const result = [];

    for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
      const row = values[rowIndex];
      const razon = clean_(row[0]);
      const ceco = clean_(row[1]);
      const centroCosto = clean_(row[2]);
      const nombre = clean_(row[3]);
      const estado = upperClean_(row[4]);

      if (!ceco || estado !== 'ACTIVO') continue;
      if (companyKey && normalizeCompanyKey_(razon) !== companyKey) continue;

      result.push({
        empresa: normalizeCompanyKey_(razon) || razon,
        ceco: ceco,
        centro_costo: centroCosto,
        nombre: nombre
      });
    }

    return {
      ok: true,
      items: result
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'No se pudo cargar CECO.'
    };
  }
}

function getPersonnelList() {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONFIG.REFERENCE_DB.SPREADSHEET_ID);
    const headers = ['EMPRESA', 'DNI', 'APELLIDOS Y NOMBRES', 'CARGO', 'PROYECTO'];
    const rows = [];

    CONFIG.REFERENCE_DB.SHEETS_PERSONAL.forEach(sheetName => {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet || sheet.getLastRow() < 2) return;

      const values = sheet.getDataRange().getValues();
      const headerMap = buildReferenceHeaderMap_(values[0]);
      const company = companyFromPersonalSheet_(sheetName);

      for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
        const row = values[rowIndex];
        const dni = clean_(row[headerMap.DNI]);
        const nombre = clean_(row[headerMap['APELLIDOS Y NOMBRES']]);

        if (!dni && !nombre) continue;

        rows.push({
          row_number: rowIndex + 1,
          values: {
            EMPRESA: company,
            DNI: dni,
            'APELLIDOS Y NOMBRES': nombre,
            CARGO: clean_(row[headerMap.CARGO]),
            PROYECTO: clean_(row[headerMap.PROYECTO])
          }
        });
      }
    });

    return {
      ok: true,
      headers: headers,
      rows: rows
    };
  } catch (err) {
    return {
      ok: false,
      message: err.message || 'No se pudo cargar el listado de personal.'
    };
  }
}

function buildReferenceHeaderMap_(headers) {
  const map = {};
  (headers || []).forEach((header, index) => {
    const normalized = normalizeHeader_(header);
    if (normalized) map[normalized] = index;
  });
  return map;
}

function companyFromPersonalSheet_(sheetName) {
  const normalized = normalizeHeader_(sheetName);
  if (normalized === 'TDEMSRL') return 'TDEM';
  if (normalized === 'GOYDELSAC') return 'GOYDEL';
  return clean_(sheetName);
}
