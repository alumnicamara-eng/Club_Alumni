/* ==========================================================
   Inicio — hero accionable + secciones destacadas (sin saludo, sin stats).
   ========================================================== */

function renderHome() {
  $('#homeNews').innerHTML = DATA.news.map(newsCard).join('') || emptyMsg('Aún no hay noticias publicadas', 'newspaper');
}
