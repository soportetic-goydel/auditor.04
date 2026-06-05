/*******************************************************
 * Punto de extension del modulo FORMULARIO DE REGISTRO.
 * La lectura de TXT se mantiene en PayloadParser.gs.
 *******************************************************/

function normalizarFormularioRegistro_(form) {
  return normalizePayload_(form || {});
}
