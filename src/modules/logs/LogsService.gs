/*******************************************************
 * Punto de extension del modulo LOGS.
 * La tabla actual se sirve desde getImportLogTable().
 *******************************************************/

function normalizarFiltroLogs_(query) {
  return upperClean_(query);
}
