/*******************************************************
 * Funciones publicas de autorizacion operativa.
 *******************************************************/

function autorizarPermisosFTIC04() {
  try {
    const response = UrlFetchApp.fetch('https://www.google.com/generate_204', {
      muteHttpExceptions: true
    });

    return {
      ok: true,
      result: {
        responseCode: response.getResponseCode(),
        usuario: getActiveUserEmail_(),
        fecha: nowString_()
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
