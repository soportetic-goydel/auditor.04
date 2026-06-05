/*******************************************************
 * Servicio de carpetas y evidencia documental en Drive.
 *******************************************************/

function saveEvidenceLinks(payload) {
  const p = normalizePayload_(payload || {});

  if (!p.id_activo) {
    throw new Error('No se puede crear carpeta documental sin ID de activo.');
  }

  const folder = getAssetEvidenceFolder_(p);
  const copied = [];

  (p.evidence_uploads || []).forEach(upload => {
    const field = clean_(upload.field);
    const fileName = safeFolderName_(upload.name || 'EVIDENCIA');
    const base64 = clean_(upload.base64);
    const mimeType = clean_(upload.mimeType) || MimeType.PLAIN_TEXT;
    const label = clean_(upload.label) || field || 'EVIDENCIA';

    if (!field || !base64) return;

    try {
      const bytes = Utilities.base64Decode(base64);
      const blob = Utilities.newBlob(bytes, mimeType, fileName);
      const copyName = safeFolderName_(label + ' - ' + p.id_activo + ' - ' + fileName);
      const existing = folder.getFilesByName(copyName);

      if (existing.hasNext()) {
        const existingFile = existing.next();
        copied.push({
          field: field,
          label: label,
          original_url: '',
          copied_url: existingFile.getUrl(),
          uploaded: true,
          reused: true
        });
        return;
      }

      const file = folder.createFile(blob).setName(copyName);
      copied.push({
        field: field,
        label: label,
        original_url: '',
        copied_url: file.getUrl(),
        uploaded: true
      });
    } catch (err) {
      copied.push({
        field: field,
        label: label,
        original_url: '',
        copied_url: '',
        uploaded: true,
        error: err.message || 'No se pudo subir el archivo.'
      });
    }
  });

  CONFIG.EVIDENCE_FIELDS.forEach(([field, label]) => {
    const url = clean_(p[field]);
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      copied.push({
        field: field,
        label: label,
        original_url: url,
        copied_url: '',
        note: 'Código documental registrado. No requiere copia de archivo.'
      });
      return;
    }

    const fileId = extractDriveFileId_(url);

    if (!fileId) {
      copied.push({
        field: field,
        label: label,
        original_url: url,
        copied_url: '',
        note: 'No es URL reconocible de Google Drive. Se conserva como enlace.'
      });
      return;
    }

    try {
      const sourceFile = DriveApp.getFileById(fileId);
      const copyName = safeFolderName_(label + ' - ' + p.id_activo + ' - ' + sourceFile.getName());
      const existing = folder.getFilesByName(copyName);

      if (existing.hasNext()) {
        const existingFile = existing.next();
        copied.push({
          field: field,
          label: label,
          original_url: url,
          copied_url: existingFile.getUrl(),
          reused: true
        });
        return;
      }

      const copiedFile = sourceFile.makeCopy(copyName, folder);
      copied.push({
        field: field,
        label: label,
        original_url: url,
        copied_url: copiedFile.getUrl()
      });
    } catch (err) {
      copied.push({
        field: field,
        label: label,
        original_url: url,
        copied_url: '',
        error: err.message || 'No se pudo copiar el archivo. Se conserva el enlace original.'
      });
    }
  });

  return {
    ok: true,
    folder_url: folder.getUrl(),
    copied: copied
  };
}

function saveAuditTxtRecord_(payload) {
  const p = payload || {};
  const txtContent = clean_(p.audit_txt_content);

  if (!txtContent) return null;

  try {
    const root = DriveApp.getFolderById(CONFIG.DRIVE.ROOT_FOLDER_ID);
    const recordsFolder = getOrCreateFolder_(root, CONFIG.DRIVE.TXT_RECORDS_FOLDER_NAME || 'Registros');
    const cecoFolder = getOrCreateFolder_(recordsFolder, safeFolderName_(p.centro_de_costo || 'SIN_CECO'));
    const fileName = safeFolderName_(
      joinNonEmpty_([p.id_activo, formatSerialOrImei_(p)], ' - ')
    ) + '.txt';

    const existingFiles = cecoFolder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      const existingFile = existingFiles.next();
      existingFile.setContent(txtContent);

      return {
        ok: true,
        file_url: existingFile.getUrl(),
        file_name: fileName,
        reused: true
      };
    }

    const file = cecoFolder.createFile(fileName, txtContent, MimeType.PLAIN_TEXT);
    return {
      ok: true,
      file_url: file.getUrl(),
      file_name: fileName
    };
  } catch (err) {
    return {
      ok: false,
      file_url: '',
      file_name: '',
      error: err.message || 'No se pudo almacenar el TXT de auditoría.'
    };
  }
}

function getAssetEvidenceFolder_(payload) {
  const p = payload || {};
  const root = DriveApp.getFolderById(CONFIG.DRIVE.ROOT_FOLDER_ID);

  const tipo = safeFolderName_(p.tipo_activo || 'OTRO');
  const temporal = 'TEMPORAL';
  const ceco = safeFolderName_(
    joinNonEmpty_([
      p.centro_de_costo ? 'CECO-' + p.centro_de_costo : '',
      p.proyecto_sede || p.ubicacion_fisica || 'SIN_CECO'
    ], ' ')
  );
  const assetName = safeFolderName_(
    joinNonEmpty_([
      p.id_activo,
      p.hostname,
      p.serie_service_tag
    ], ' - ')
  );

  const typeFolder = getOrCreateFolder_(root, tipo);
  const temporalFolder = getOrCreateFolder_(typeFolder, temporal);
  const cecoFolder = getOrCreateFolder_(temporalFolder, ceco);
  return getOrCreateFolder_(cecoFolder, assetName);
}

function getOrCreateFolder_(parent, name) {
  const folderName = safeFolderName_(name);
  const folders = parent.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parent.createFolder(folderName);
}
