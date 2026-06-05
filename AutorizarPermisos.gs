/*******************************************************
 * Funciones publicas de autorizacion operativa.
 *******************************************************/

function autorizarPermisosFTIC04() {
  try {
    const fetchResponse = UrlFetchApp.fetch('https://www.google.com/generate_204', {
      muteHttpExceptions: true
    });
    const rootFolder = DriveApp.getFolderById(CONFIG.DRIVE.ROOT_FOLDER_ID);
    const templateFile = DriveApp.getFileById(CONFIG.FTIC04.TEMPLATE_ID);
    const auditorSpreadsheet = SpreadsheetApp.openById(CONFIG.AUDITOR.SPREADSHEET_ID);
    const masterSpreadsheet = SpreadsheetApp.openById(CONFIG.MASTER.SPREADSHEET_ID);
    const referenceSpreadsheet = SpreadsheetApp.openById(CONFIG.REFERENCE_DB.SPREADSHEET_ID);
    const remainingMailQuota = MailApp.getRemainingDailyQuota();

    return {
      ok: true,
      result: {
        responseCode: fetchResponse.getResponseCode(),
        usuario: getActiveUserEmail_(),
        fecha: nowString_(),
        carpetaRaiz: rootFolder.getName(),
        plantillaFtic04: templateFile.getName(),
        inventarioOficial: auditorSpreadsheet.getName(),
        inventarioMaestro: masterSpreadsheet.getName(),
        referencias: referenceSpreadsheet.getName(),
        correosDisponibles: remainingMailQuota
      },
      message: 'Permisos F-TIC-04 verificados. Ya puedes volver a generar el acta.'
    };
  } catch (err) {
    return {
      ok: false,
      result: null,
      message: err.message || 'No se pudieron verificar los permisos F-TIC-04.'
    };
  }
}
