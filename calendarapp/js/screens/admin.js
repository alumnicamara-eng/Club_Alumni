/* ==========================================================
   Panel de administración — gestión de contenido y configuración.
   ========================================================== */

function renderAdmin() {
  if (State.user.role !== 'admin') { route('inicio'); return; }

  $('#adminNewsList').innerHTML = DATA.news.map(n => `<div class="card">
    <div class="card-title">${escapeHtml(n.title)}</div>
    <div class="card-meta"><span>${fmtDate(n.date)}</span><span>${escapeHtml(NEWS_TAGS[n.tag] || n.tag)}</span></div>
    <div class="card-desc">${escapeHtml(n.summary)}</div>
    <div class="card-actions">
      <a class="btn btn-outline btn-sm" href="${escapeHtml(n.wpUrl)}" target="_blank"><i class="fab fa-wordpress"></i> Abrir en WP</a>
      <button class="btn btn-ghost btn-sm" onclick="deleteNews(${n.id})"><i class="fas fa-trash"></i></button>
    </div>
  </div>`).join('') || emptyMsg('Aún no hay noticias publicadas', 'newspaper');

  $('#adminEventsList').innerHTML = DATA.events.map(e => `<div class="card">
    <div class="card-title">${escapeHtml(e.title)}</div>
    <div class="card-meta"><span>${fmtDate(e.date)} · ${escapeHtml(e.time)}</span><span>${e.enrolled.length}/${e.spots} inscritos</span></div>
    <div class="card-actions"><button class="btn btn-ghost btn-sm" onclick="deleteEvent(${e.id})"><i class="fas fa-trash"></i> Eliminar</button></div>
  </div>`).join('') || emptyMsg('No hay eventos creados', 'calendar');

  $('#adminTalksList').innerHTML = DATA.talks.map(t => `<div class="card">
    <div class="card-title">${escapeHtml(t.title)}</div>
    <div class="card-meta"><span>${escapeHtml(t.speaker)}</span><span>${fmtDate(t.date)}</span></div>
    <div class="card-actions"><button class="btn btn-ghost btn-sm" onclick="deleteTalk(${t.id})"><i class="fas fa-trash"></i></button></div>
  </div>`).join('') || emptyMsg('No hay conferencias publicadas', 'video');

  $('#adminMentorsList').innerHTML = DATA.mentors.map(m => {
    const u = findUser(m.userDni) || {};
    return `<div class="card">
      <div class="card-title">${escapeHtml(u.name || '')}</div>
      <div class="card-meta"><span>Ciclo ${escapeHtml(m.ciclo)}</span><span>${m.mentees.length}/${m.max} mentees</span></div>
      <div class="card-desc">${escapeHtml(m.bio)}</div>
    </div>`;
  }).join('') || emptyMsg('No hay mentores registrados', 'user-graduate');

  $('#adminUsersList').innerHTML = DATA.users.filter(u => u.role !== 'admin').map(alumniCard).join('');

  renderProposals();
  updateProposalsBadge();
}

/* ---------- CRUD noticias ---------- */
function openNewsForm() {
  showModal('Nueva noticia (enlace al WordPress)', `
    <div class="field"><label class="field-label">Título</label><input class="field-input" id="newsTitle"></div>
    <div class="field"><label class="field-label">URL en WordPress</label><input class="field-input" id="newsUrl" placeholder="https://alumni.camarafp.es/?p=..."></div>
    <div class="field"><label class="field-label">Resumen</label><textarea id="newsSummary"></textarea></div>
    <div class="field"><label class="field-label">Categoría</label>
      <select class="field-input" id="newsTag">
        ${Object.entries(NEWS_TAGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
      </select>
    </div>
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>`,
    `<button class="btn btn-primary" onclick="saveNews()">Publicar</button>`,
  ]);
}
async function saveNews() {
  const data = {
    titulo:  $('#newsTitle').value.trim(),
    wp_url:  $('#newsUrl').value.trim(),
    resumen: $('#newsSummary').value.trim(),
    tag:     $('#newsTag').value,
    fecha:   new Date().toISOString().slice(0, 10),
  };
  if (!data.titulo) { toast('Falta el título'); return; }

  if (API_BASE) {
    try {
      await API.createNoticia(data);
      await loadDataFromApi();
      notifyAll('📰 Nueva noticia Alumni', data.titulo, '/');
    } catch (e) { toast('Error guardando en el servidor'); return; }
  } else {
    DATA.news.unshift({
      id: Date.now(),
      title: data.titulo, wpUrl: data.wp_url, summary: data.resumen,
      tag: data.tag, date: data.fecha,
    });
  }
  closeModal(); renderAdmin(); renderHome(); toast('Noticia publicada');
}

async function deleteNews(id) {
  if (!confirm('¿Eliminar esta noticia?')) return;
  if (API_BASE) {
    try { await API.deleteNoticia(id); await loadDataFromApi(); }
    catch (e) { toast('Error eliminando'); return; }
  } else {
    DATA.news = DATA.news.filter(n => n.id !== id);
  }
  renderAdmin(); renderHome(); toast('Noticia eliminada');
}

/* ---------- CRUD eventos ---------- */
function openEventForm() {
  showModal('Crear evento', `
    <div class="field"><label class="field-label">Título</label><input class="field-input" id="evTitle"></div>
    <div class="field"><label class="field-label">Descripción</label><textarea id="evDesc"></textarea></div>
    <div class="grid grid-2">
      <div class="field"><label class="field-label">Fecha</label><input type="date" class="field-input" id="evDate"></div>
      <div class="field"><label class="field-label">Hora</label><input type="time" class="field-input" id="evTime"></div>
    </div>
    <div class="field"><label class="field-label">Lugar / enlace</label><input class="field-input" id="evPlace"></div>
    <div class="field"><label class="field-label">Plazas</label><input class="field-input" id="evSpots" type="number" value="50"></div>
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>`,
    `<button class="btn btn-primary" onclick="saveEvent()">Crear</button>`,
  ]);
}
async function saveEvent() {
  const data = {
    titulo:      $('#evTitle').value.trim(),
    descripcion: $('#evDesc').value.trim(),
    fecha:       $('#evDate').value,
    hora:        ($('#evTime').value || '18:00') + ':00',
    ubicacion:   $('#evPlace').value.trim(),
    plazas:      parseInt($('#evSpots').value) || 50,
    categoria:   'evento',
  };
  if (!data.titulo || !data.fecha) { toast('Faltan título y fecha'); return; }

  if (API_BASE) {
    try {
      await API.createEvento(data);
      await loadDataFromApi();
      notifyAll('📅 Nuevo evento Alumni', `${data.titulo} — ${fmtDateLong(data.fecha)}`, '/');
    } catch (e) { toast('Error guardando en el servidor'); return; }
  } else {
    DATA.events.push({
      id: Date.now(),
      title: data.titulo, desc: data.descripcion,
      date: data.fecha, time: data.hora.slice(0, 5),
      place: data.ubicacion, spots: data.plazas,
      enrolled: [], category: data.categoria,
    });
  }
  closeModal(); renderAdmin();
  if (State.current === 'calendario') renderCalendar();
  toast('Evento creado');
}

async function deleteEvent(id) {
  if (!confirm('¿Eliminar este evento? Las inscripciones se borran también.')) return;
  if (API_BASE) {
    try { await apiFetch(`eventos.php?id=${id}`, { method: 'DELETE' }); await loadDataFromApi(); }
    catch (e) { toast('Error eliminando'); return; }
  } else {
    DATA.events = DATA.events.filter(e => e.id !== id);
  }
  renderAdmin();
  if (State.current === 'calendario') renderCalendar();
  toast('Evento eliminado');
}

/* ---------- CRUD conferencias ---------- */
function openTalkForm() {
  showModal('Nueva conferencia grabada', `
    <div class="field"><label class="field-label">Título</label><input class="field-input" id="tkTitle"></div>
    <div class="field"><label class="field-label">Ponente</label><input class="field-input" id="tkSpeaker"></div>
    <div class="field"><label class="field-label">URL embed YouTube (privado)</label><input class="field-input" id="tkUrl" placeholder="https://www.youtube.com/embed/..."></div>
    <div class="field"><label class="field-label">Descripción</label><textarea id="tkDesc"></textarea></div>
    <div class="field"><label class="field-label">Categoría</label>
      <select class="field-input" id="tkCat"><option>tecnologia</option><option>empleabilidad</option><option>emprendimiento</option><option>liderazgo</option></select>
    </div>
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>`,
    `<button class="btn btn-primary" onclick="saveTalk()">Publicar</button>`,
  ]);
}
async function saveTalk() {
  const data = {
    titulo:      $('#tkTitle').value.trim(),
    ponente:     $('#tkSpeaker').value.trim(),
    youtube_url: $('#tkUrl').value.trim(),
    descripcion: $('#tkDesc').value.trim(),
    categoria:   $('#tkCat').value,
    fecha:       new Date().toISOString().slice(0, 10),
  };
  if (!data.titulo || !data.ponente || !data.youtube_url) { toast('Faltan campos obligatorios'); return; }

  if (API_BASE) {
    try {
      await API.createConferencia(data);
      await loadDataFromApi();
      notifyAll('🎥 Nueva conferencia disponible', `${data.titulo} — ${data.ponente}`, '/');
    } catch (e) { toast('Error guardando en el servidor'); return; }
  } else {
    DATA.talks.unshift({
      id: Date.now(),
      title: data.titulo, speaker: data.ponente, url: data.youtube_url,
      desc: data.descripcion, cat: data.categoria, date: data.fecha,
    });
  }
  closeModal(); renderAdmin();
  if (State.current === 'talks') renderTalks();
  toast('Conferencia publicada');
}

async function deleteTalk(id) {
  if (!confirm('¿Eliminar esta conferencia?')) return;
  if (API_BASE) {
    try { await apiFetch(`conferencias.php?id=${id}`, { method: 'DELETE' }); await loadDataFromApi(); }
    catch (e) { toast('Error eliminando'); return; }
  } else {
    DATA.talks = DATA.talks.filter(t => t.id !== id);
  }
  renderAdmin();
  if (State.current === 'talks') renderTalks();
  toast('Conferencia eliminada');
}

/* ---------- Propuestas ---------- */
function renderProposals() {
  const list = DATA.talkProposals;
  $('#adminProposalsList').innerHTML = list.length
    ? list.map(p => `<div class="card">
        <div class="chip-row">
          <span class="chip ${p.status === 'pending' ? 'chip-warn' : p.status === 'accepted' ? 'chip-success' : 'chip-danger'}">
            ${p.status === 'pending' ? 'Pendiente' : p.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
          </span>
          <span class="chip chip-teal">${escapeHtml(p.ciclo)} ${p.year || ''}</span>
          <span class="chip">${escapeHtml(p.duration)} min · ${escapeHtml(p.format || '')}</span>
        </div>
        <div class="card-title">${escapeHtml(p.topic)}</div>
        <div class="card-meta"><span><i class="fas fa-user"></i>${escapeHtml(p.name)}</span><span><i class="fas fa-envelope"></i>${escapeHtml(p.email)}</span><span>${fmtRel(p.date)}</span></div>
        <div class="card-desc">${escapeHtml(p.desc)}</div>
        <div class="card-actions">
          <a class="btn btn-outline btn-sm" href="mailto:${escapeHtml(p.email)}?subject=Tu propuesta de Alumni Talk"><i class="fas fa-envelope"></i> Contactar</a>
          ${p.status === 'pending' ? `
            <button class="btn btn-accent btn-sm" onclick="reviewProposal(${p.id},'accepted')"><i class="fas fa-check"></i> Aceptar</button>
            <button class="btn btn-ghost  btn-sm" onclick="reviewProposal(${p.id},'rejected')"><i class="fas fa-xmark"></i> Rechazar</button>
          ` : `<button class="btn btn-ghost btn-sm" onclick="reviewProposal(${p.id},'pending')">Reabrir</button>`}
        </div>
      </div>`).join('')
    : emptyMsg('Aún no hay propuestas', 'microphone-lines');
}
async function reviewProposal(id, status) {
  const p = DATA.talkProposals.find(x => x.id === id); if (!p) return;
  p.status = status;
  if (API_BASE && status !== 'pending') {
    try { await API.reviewPropuesta(id, status); } catch (e) { console.warn('No se pudo guardar el estado:', e); }
  }
  renderProposals(); updateProposalsBadge();
  toast(status === 'accepted' ? 'Propuesta aceptada' : status === 'rejected' ? 'Propuesta rechazada' : 'Propuesta reabierta');
}

/* ---------- Exportaciones / Push ---------- */
function exportCSV() {
  const rows = [['nombre', 'dni', 'ciclo', 'año', 'empresa', 'puesto']].concat(
    DATA.users.filter(u => u.role !== 'admin').map(u => [u.name, u.dni, u.ciclo, u.year, u.company, u.position])
  );
  const csv = rows.map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = 'alumnis.csv'; a.click();
}

async function adminTestPush() {
  const title = $('#pushTitle').value || 'Alumni Cámara FP';
  const body  = $('#pushBody').value  || 'Mensaje de prueba';

  /* Notificación local en este dispositivo (para que el admin vea el formato) */
  pushNotify({ title, body });

  /* Si hay backend, enviar push REAL a todos los suscriptores */
  if (!API_BASE) { toast('Push local enviado (backend no configurado)'); return; }
  try {
    const res = await API.sendPush(title, body, '/');
    toast(`📨 Enviado a ${res.sent} de ${res.total} dispositivos${res.failed ? ` (${res.failed} fallidos)` : ''}`);
  } catch (e) {
    console.error(e);
    toast('Error enviando push — revisa la consola y vapid.php');
  }
}

/* Envía push automático cuando se crea una noticia / evento / charla (llamado desde el admin) */
async function notifyAll(title, body, url) {
  if (!API_BASE) return;
  try { await API.sendPush(title, body, url || '/'); } catch (e) { console.warn('Push no enviado:', e); }
}
