/*******************************************************
 * Punto de extension para validaciones del modulo inventario.
 * Las reglas vigentes se conservan en InventarioMapper.gs para
 * mantener compatibilidad funcional en esta atomizacion.
 *******************************************************/

function validarInventarioAntesDeGuardar_(payload) {
  return validateBeforeSave_(payload);
}
