/*******************************************************
 * Punto de extension del modulo LISTADO DE PERSONAL.
 * Las funciones publicas de personal se mantienen en ReferenceService.gs.
 *******************************************************/

function normalizarFiltroPersonal_(query) {
  return upperClean_(query);
}
