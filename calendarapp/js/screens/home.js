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

// ==================== HOME.JS ====================

function loadHome() {
    const container = document.getElementById('homeNews');
    container.innerHTML = '';
    
    // Solo noticias - 4 últimas
    const news = (data.news || []).slice(0, 4);
    
    if (news.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay noticias recientes</div>';
        return;
    }
    
    news.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.onclick = () => window.open(item.link, '_blank');
        div.innerHTML = `
            <div class="card-image" style="background-image:url('${item.image}')"></div>
            <div class="card-body">
                <div class="card-cat">${item.category}</div>
                <div class="card-title">${item.title}</div>
                <div class="card-desc">${item.excerpt}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function renderNavbar() {
    const nav = document.getElementById('bottomNav');
    nav.innerHTML = `
        <button class="nav-item active" onclick="route('inicio')">
            <i class="fas fa-house"></i><span>Inicio</span>
        </button>
        <button class="nav-item" onclick="route('calendario')">
            <i class="fas fa-calendar"></i><span>Eventos</span>
        </button>
        <button class="nav-item" onclick="route('talks')">
            <i class="fas fa-video"></i><span>Talks</span>
        </button>
        <button class="nav-item" onclick="route('mentoria')">
            <i class="fas fa-users"></i><span>Mentores</span>
        </button>
        <button class="nav-item" onclick="route('comunidad')">
            <i class="fas fa-comments"></i><span>Comunidad</span>
        </button>
    `;
    
    // Actualizar nav active
    const current = document.querySelector('.screen.active').id.replace('s-', '');
    nav.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerHTML.includes(current === 'inicio' ? 'Incio' : current)) {
            btn.classList.add('active');
        }
    });
}
