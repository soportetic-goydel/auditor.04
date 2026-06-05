/*******************************************************
 * Includes HTML para HtmlService.
 *******************************************************/

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}
