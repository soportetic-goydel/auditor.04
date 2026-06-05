/*******************************************************
 * Drive destino para F-TIC-04.
 *******************************************************/

function obtenerCarpetaDestinoFTIC04_(payload) {
  const p = prepararPayloadGeneracionFTIC04_(payload);
  const config = obtenerConfigGeneracionFTIC04_();
  const configuredFolderId = clean_(config.OUTPUT_FOLDER_ID);
  const baseFolder = configuredFolderId
    ? DriveApp.getFolderById(configuredFolderId)
    : getAssetEvidenceFolder_(p);
  const subfolderName = clean_(config.OUTPUT_SUBFOLDER_NAME);

  if (!subfolderName) return baseFolder;

  return getOrCreateFolder_(baseFolder, subfolderName);
}

function guardarPdfFTIC04_(folder, pdfBlob, pdfName) {
  if (!folder) {
    throw new Error('No se recibió carpeta destino para guardar el PDF F-TIC-04.');
  }

  if (!pdfBlob) {
    throw new Error('No se recibió PDF generado para guardar.');
  }

  const rawName = clean_(pdfName) || 'F-TIC-04.pdf';
  const baseName = rawName.replace(/\.pdf$/i, '');
  const finalName = safeFolderName_(baseName).substring(0, 116) + '.pdf';
  return folder.createFile(pdfBlob).setName(finalName);
}
