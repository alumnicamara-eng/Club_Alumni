/* ==========================================================
   Inicio — hero accionable + secciones destacadas (sin saludo, sin stats).
   ========================================================== */

function renderHome() {
  const now = new Date();
  const upcoming = DATA.events
    .filter(e => new Date(e.date + 'T' + e.time) >= now)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const nextEvent  = upcoming[0];
  const nextTalk   = DATA.talks[0];
  const openMentor = DATA.mentors.find(m => m.mentees.length < m.max);

  $('#heroHighlights').innerHTML = `
    ${nextEvent ? `
      <div class="hero-highlight">
        <div class="hero-highlight-label">Próximo evento</div>
        <div class="hero-highlight-title">${escapeHtml(nextEvent.title)}</div>
        <div class="hero-highlight-meta">${fmtDateLong(nextEvent.date)} · ${escapeHtml(nextEvent.time)}h · ${escapeHtml(nextEvent.place)}</div>
      </div>` : ''}
    ${nextTalk ? `
      <div class="hero-highlight">
        <div class="hero-highlight-label">Última conferencia</div>
        <div class="hero-highlight-title">${escapeHtml(nextTalk.title)}</div>
        <div class="hero-highlight-meta">${escapeHtml(nextTalk.speaker)}</div>
      </div>` : ''}
    ${openMentor ? `
      <div class="hero-highlight">
        <div class="hero-highlight-label">Mentoría disponible</div>
        <div class="hero-highlight-title">Plazas libres en ${escapeHtml(openMentor.ciclo)}</div>
        <div class="hero-highlight-meta">${openMentor.max - openMentor.mentees.length} plaza(s) abiertas</div>
      </div>` : ''}
  `;

  $('#homeEvents').innerHTML = upcoming.slice(0, 4).map(eventCard).join('') || emptyMsg('No hay eventos próximos', 'calendar');
  $('#homeTalks').innerHTML  = DATA.talks.slice(0, 3).map(talkCard).join('')  || emptyMsg('Aún no hay conferencias publicadas', 'video');
  $('#homeNews').innerHTML   = DATA.news.slice(0, 4).map(newsCard).join('');
}
