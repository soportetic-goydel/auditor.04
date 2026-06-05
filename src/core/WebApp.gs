/*******************************************************
 * Entrada WebApp.
 * Las funciones publicas usadas por google.script.run estan
 * definidas en los servicios: parseAuditTxt, saveInventoryRecord,
 * getInventoryTable, getInventoryRecordBySerie, lookupPersonByDni
 * y getCecoList.
 *******************************************************/

function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle(CONFIG.APP.TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
