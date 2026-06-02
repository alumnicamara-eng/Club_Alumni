/* ==========================================================
   Inicio — hero accionable + secciones destacadas (sin saludo, sin stats).
   ========================================================== */

function renderHome() {
  const now = new Date();
  const upcoming = DATA.events
    .filter(e => new Date(e.date + 'T' + e.time) >= now)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  $('#homeEvents').innerHTML = upcoming.slice(0, 4).map(eventCard).join('') || emptyMsg('No hay eventos próximos', 'calendar');
  $('#homeTalks').innerHTML  = DATA.talks.slice(0, 3).map(talkCard).join('')  || emptyMsg('Aún no hay conferencias publicadas', 'video');
  $('#homeNews').innerHTML   = DATA.news.slice(0, 4).map(newsCard).join('');
}
