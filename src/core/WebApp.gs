/*******************************************************
 * Entrada WebApp.
 * Las funciones publicas usadas por google.script.run estan
 * definidas en los servicios: parseAuditTxt, saveInventoryRecord,
 * getInventoryTable, getInventoryRecordBySerie, lookupPersonByDni
 * y getCecoList.
 *******************************************************/

function doGet(e) {
  const params = (e && e.parameter) || {};

  if (params.modo === 'firma') {
    const template = HtmlService.createTemplateFromFile('src/modules/ftic04/Ftic04SignatureView');
    template.tokenUrl = clean_(params.token);
    return template
      .evaluate()
      .setTitle('Firma F-TIC-04')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.APP.TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
