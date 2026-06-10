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
    <div class="card-meta"><span>${fmtDate(e.date)} · ${escapeHtml(e.time)}</span><span><i class="fas fa-users"></i> ${e.enrolled.length}/${e.spots} inscritos</span></div>
    <div class="card-actions" style="flex-wrap:wrap;gap:6px">
      <button class="btn btn-outline btn-sm" onclick="openEventEnrollees(${e.id})"><i class="fas fa-users"></i> Ver inscritos</button>
      <button class="btn btn-outline btn-sm" onclick="openEventNotify(${e.id})"><i class="fas fa-bell"></i> Avisar</button>
      <button class="btn btn-ghost btn-sm" onclick="deleteEvent(${e.id})"><i class="fas fa-trash"></i></button>
    </div>
  </div>`).join('') || emptyMsg('No hay eventos creados', 'calendar');

  $('#adminTalksList').innerHTML = DATA.talks.map(t => `<div class="card">
    <div class="card-title">${escapeHtml(t.title)}</div>
    <div class="card-meta"><span>${escapeHtml(t.speaker)}</span><span>${fmtDate(t.date)}</span></div>
    <div class="card-actions"><button class="btn btn-ghost btn-sm" onclick="deleteTalk(${t.id})"><i class="fas fa-trash"></i></button></div>
  </div>`).join('') || emptyMsg('No hay conferencias publicadas', 'video');

  renderAdminEmbajadores();

  /* Admin > Usuarios: card con botón Eliminar */
  $('#adminUsersList').innerHTML = DATA.users.filter(u => u.role !== 'admin').map(u => `<div class="alumni-card">
    <div class="alumni-avatar">${initials(u.name)}</div>
    <div class="alumni-name">${escapeHtml(u.name)}</div>
    <div class="alumni-meta">${escapeHtml(u.position || '')} ${u.company ? '· ' + escapeHtml(u.company) : ''}</div>
    <div class="alumni-meta" style="margin-top:2px">${escapeHtml(u.ciclo || '')} ${u.year ? '· ' + u.year : ''}</div>
    <div class="alumni-meta" style="margin-top:2px;font-size:11px">${escapeHtml(u.email || '')}</div>
    <div class="card-actions mt-12" style="justify-content:center">
      <button class="btn btn-ghost btn-sm" onclick="deleteAlumni('${escapeHtml(u.dni)}', '${escapeHtml(u.name)}')"><i class="fas fa-trash"></i> Eliminar</button>
    </div>
  </div>`).join('') || emptyMsg('No hay alumnos/as registrados/as', 'user');

  renderProposals();
  updateProposalsBadge();
  renderPendingUsers();
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

/* Eliminar un alumni (solo admin) */
async function deleteAlumni(dni, name) {
  if (!confirm(`¿Eliminar a ${name}?\n\nSe borrarán también sus inscripciones, mentorías, posts y comentarios. Esta acción NO se puede deshacer.`)) return;
  /* Buscar el id real en DATA (puede no estar si la lista viene de API con id distinto al dni) */
  const u = DATA.users.find(x => x.dni === dni);
  const id = u?.id;
  if (!id) { toast('No se encuentra el usuario en la lista actual — refresca el panel'); return; }
  if (!API_BASE) {
    DATA.users = DATA.users.filter(x => x.dni !== dni);
    renderAdmin();
    toast('Eliminado (local)');
    return;
  }
  try {
    await API.deleteUsuario(id);
    await loadDataFromApi();
    renderAdmin();
    toast(`${name} eliminado`);
  } catch (e) {
    const msg = e.message || '';
    if (msg.includes('403')) toast('No puedes eliminarte a ti mismo');
    else toast('Error eliminando usuario');
  }
}

/* Envía push automático cuando se crea una noticia / evento / charla (llamado desde el admin) */
async function notifyAll(title, body, url) {
  if (!API_BASE) return;
  try { await API.sendPush(title, body, url || '/'); } catch (e) { console.warn('Push no enviado:', e); }
}

/* ============================================================
   IMPORTAR ALUMNOS/AS (pegar filas)
   ============================================================ */
async function importAlumnis() {
  const raw = $('#importBox').value.trim();
  if (!raw) { toast('Pega las filas de alumnos/as'); return; }

  const alumnis = raw.split(/\r?\n/).map(line => {
    const c = line.split(/[;\t]/).map(x => x.trim());
    if (!c[0]) return null;
    return {
      dni: c[0], fecha_nacimiento: c[1] || '', nombre: c[2] || '', apellidos: c[3] || '',
      email: c[4] || '', telefono: c[5] || '', direccion: c[6] || '', ciclo: c[7] || '', promocion: c[8] || '',
    };
  }).filter(Boolean);

  if (!alumnis.length) { toast('No se han detectado filas válidas'); return; }
  $('#importResult').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importando…';

  try {
    const res = await API.importAlumnis(alumnis);
    let html = `<div style="color:#16a34a"><i class="fas fa-check-circle"></i> ${res.creados} creados, ${res.actualizados} actualizados</div>`;
    if (res.errores?.length) {
      html += `<details style="margin-top:6px"><summary style="cursor:pointer;color:#dc2626">${res.errores.length} con avisos</summary>
        <ul style="margin:6px 0 0 18px;font-size:12px">${res.errores.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul></details>`;
    }
    $('#importResult').innerHTML = html;
    $('#importBox').value = '';
    renderPendingUsers();
  } catch (e) {
    $('#importResult').innerHTML = '<span style="color:#dc2626"><i class="fas fa-triangle-exclamation"></i> Error en la importación</span>';
  }
}

/* ============================================================
   ADMIN: Embajadores que se han ofrecido
   ============================================================ */
const ACCION_LABELS = {
  charla_clase: 'Charla en clase', video_testimonio: 'Vídeo testimonio',
  video_promo: 'Vídeo promocional', shooting_fotos: 'Shooting de fotos', otra: 'Otra',
};

async function renderAdminEmbajadores() {
  const cont = $('#adminMentorsList');
  if (!cont) return;
  if (!API_BASE) { cont.innerHTML = emptyMsg('Conecta el backend para ver embajadores', 'plug'); return; }
  cont.innerHTML = '<div class="text-muted" style="padding:16px"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>';
  try {
    const list = await API.getEmbajadores();
    cont.innerHTML = list.length ? list.map(e => `<div class="card">
      <div class="chip-row">
        <span class="chip chip-teal">${escapeHtml(ACCION_LABELS[e.tipo] || e.tipo)}</span>
        ${e.ciclo ? `<span class="chip">${escapeHtml(e.ciclo)} ${e.promocion || ''}</span>` : ''}
      </div>
      <div class="card-title">${escapeHtml((e.nombre || '') + ' ' + (e.apellidos || ''))}</div>
      <div class="card-meta">
        ${e.email    ? `<span><i class="fas fa-envelope"></i> <a href="mailto:${escapeHtml(e.email)}">${escapeHtml(e.email)}</a></span>` : ''}
        ${e.telefono ? `<span><i class="fas fa-phone"></i> <a href="tel:${escapeHtml(e.telefono)}">${escapeHtml(e.telefono)}</a></span>` : ''}
      </div>
      ${e.mensaje ? `<div class="card-desc">${escapeHtml(e.mensaje)}</div>` : ''}
    </div>`).join('') : emptyMsg('Aún no hay embajadores/as ofrecidos', 'handshake');
  } catch (err) {
    cont.innerHTML = emptyMsg('Error cargando embajadores', 'triangle-exclamation');
  }
}

/* Descarga una plantilla CSV (se abre en Excel) con las columnas correctas */
function downloadExcelTemplate() {
  const headers = ['DNI','FechaNacimiento (dd/mm/aaaa)','Nombre','Apellidos','Email','Telefono','Direccion','Ciclo','AnoPromocion'];
  const ejemplo = ['12345678A','15/03/1998','Lucía','Pérez García','lucia@email.com','600111222','C/ Mayor 1, Valencia','DAW','2022'];
  const csv = '﻿' + headers.join(';') + '\n' + ejemplo.join(';') + '\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'plantilla_alumnis_camarafp.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  toast('Plantilla descargada — ábrela en Excel');
}

/* ============================================================
   SOLICITUDES DE REGISTRO (pestaña Solicitudes)
   ============================================================ */

async function renderPendingUsers() {
  const list = $('#adminPendingList');
  if (!list) return;

  if (!API_BASE) {
    list.innerHTML = emptyMsg('Conecta el backend para ver solicitudes', 'plug');
    return;
  }

  list.innerHTML = '<div class="text-muted" style="padding:20px;text-align:center"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>';
  try {
    const users = await API.getPendingUsers();
    updatePendingBadge(users.length);
    list.innerHTML = users.length ? users.map(pendingUserCard).join('') : emptyMsg('No hay solicitudes pendientes', 'inbox');
  } catch (e) {
    list.innerHTML = emptyMsg('Error cargando solicitudes', 'triangle-exclamation');
  }
}

function pendingUserCard(u) {
  return `<div class="card" id="pending-${u.id}">
    <div class="chip-row">
      <span class="chip chip-warn">Sin darse de alta</span>
      ${u.ciclo ? `<span class="chip chip-teal">${escapeHtml(u.ciclo)} ${u.promocion || ''}</span>` : ''}
    </div>
    <div class="card-title">${escapeHtml(u.nombre)} ${escapeHtml(u.apellidos || '')}</div>
    <div class="card-meta">
      ${u.dni      ? `<span><i class="fas fa-id-card"></i> ${escapeHtml(u.dni)}</span>` : ''}
      ${u.email    ? `<span><i class="fas fa-envelope"></i> ${escapeHtml(u.email)}</span>` : ''}
      ${u.telefono ? `<span><i class="fas fa-phone"></i> ${escapeHtml(u.telefono)}</span>` : ''}
    </div>
    <div class="card-actions mt-12">
      <button class="btn btn-ghost btn-sm" onclick="reviewPending(${u.id}, 'reject')"><i class="fas fa-trash"></i> Quitar de la lista</button>
    </div>
  </div>`;
}

async function reviewPending(id, accion) {
  if (accion === 'reject' && !confirm('¿Quitar a este alumno/a de la lista? Ya no podrá darse de alta hasta volver a importarlo.')) return;
  try {
    await API.reviewPendingUser(id, accion);
    document.getElementById('pending-' + id)?.remove();
    toast('Eliminado de la lista');
    const remaining = $('#adminPendingList').querySelectorAll('.card').length;
    updatePendingBadge(remaining);
    if (remaining === 0) $('#adminPendingList').innerHTML = emptyMsg('No hay altas pendientes', 'inbox');
  } catch (e) { toast('Error al procesar'); }
}

function updatePendingBadge(n) {
  const badge = $('#pendingBadge');
  if (!badge) return;
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
}

/* ============================================================
   INSCRITOS A UN EVENTO (admin) + AVISAR
   ============================================================ */

async function openEventEnrollees(eventoId) {
  const ev = DATA.events.find(e => e.id === eventoId);
  if (!ev) return;

  showModal(`Inscritos a "${ev.title}"`,
    `<div class="text-muted" style="font-size:13px;margin-bottom:10px">${fmtDateLong(ev.date)} · ${escapeHtml(ev.time)} · ${escapeHtml(ev.place)}</div>
     <div id="enrolleesBody"><i class="fas fa-spinner fa-spin"></i> Cargando…</div>`,
    [`<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`]
  );

  let users = [];
  if (API_BASE) {
    try { users = await API.getEventEnrollees(eventoId); }
    catch (e) { $('#enrolleesBody').innerHTML = '<div class="text-muted">Error cargando inscritos</div>'; return; }
  } else {
    /* Fallback a mocks: buscar usuarios por DNI */
    users = (ev.enrolled || []).map(dni => {
      const u = findUser(dni) || {};
      return { id: dni, dni, nombre: u.name?.split(' ')[0] || '', apellidos: u.name?.split(' ').slice(1).join(' ') || '',
               email: u.email || '', telefono: u.phone || '', ciclo: u.ciclo, promocion: u.year, empresa: u.company, puesto: u.position };
    });
  }

  if (!users.length) {
    $('#enrolleesBody').innerHTML = emptyMsg('Nadie se ha apuntado todavía', 'users');
    return;
  }

  const emails = users.filter(u => u.email).map(u => u.email).join(',');
  $('#enrolleesBody').innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button class="btn btn-outline btn-sm" onclick="copyEnrolleesEmails('${escapeHtml(emails)}')"><i class="fas fa-copy"></i> Copiar emails (${users.filter(u=>u.email).length})</button>
      <a class="btn btn-outline btn-sm" href="mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent('Sobre el evento: ' + ev.title)}"><i class="fas fa-envelope"></i> Email a todos</a>
      <button class="btn btn-primary btn-sm" onclick="openEventNotify(${eventoId})"><i class="fas fa-bell"></i> Push a inscritos</button>
    </div>
    <div class="grid grid-1" style="gap:8px">
      ${users.map(u => `<div class="card" style="padding:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="mentor-avatar" style="width:36px;height:36px;font-size:13px">${initials((u.nombre || '') + ' ' + (u.apellidos || ''))}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600">${escapeHtml((u.nombre || '') + ' ' + (u.apellidos || ''))}</div>
            <div style="font-size:12px;color:var(--ink-600)">
              ${u.ciclo ? escapeHtml(u.ciclo) + ' ' + (u.promocion || '') : ''}
              ${u.empresa ? ' · ' + escapeHtml(u.empresa) : ''}
            </div>
          </div>
        </div>
        <div style="margin-top:6px;display:flex;gap:10px;flex-wrap:wrap;font-size:12px">
          ${u.email    ? `<a href="mailto:${escapeHtml(u.email)}"><i class="fas fa-envelope"></i> ${escapeHtml(u.email)}</a>` : ''}
          ${u.telefono ? `<a href="tel:${escapeHtml(u.telefono)}"><i class="fas fa-phone"></i> ${escapeHtml(u.telefono)}</a>` : ''}
        </div>
      </div>`).join('')}
    </div>`;
}

function copyEnrolleesEmails(emails) {
  if (!navigator.clipboard) { toast('Tu navegador no permite copiar al portapapeles'); return; }
  navigator.clipboard.writeText(emails).then(() => toast('Emails copiados'));
}

function openEventNotify(eventoId) {
  const ev = DATA.events.find(e => e.id === eventoId);
  if (!ev) return;
  closeModal();
  setTimeout(() => {
    showModal(`Avisar a inscritos · ${ev.title}`,
      `<p class="text-muted" style="font-size:13px;margin-bottom:14px">Se enviará una notificación push SOLO a los ${ev.enrolled.length} usuarios inscritos a este evento.</p>
       <div class="field"><label class="field-label">Título</label><input class="field-input" id="evNotifyTitle" value="Cambio en el evento: ${escapeHtml(ev.title)}"></div>
       <div class="field"><label class="field-label">Mensaje</label><textarea id="evNotifyBody" placeholder="Ej. La hora cambia a las 19:00. Disculpad las molestias." rows="4"></textarea></div>`,
      [
        `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>`,
        `<button class="btn btn-primary" onclick="sendEventNotify(${eventoId})"><i class="fas fa-paper-plane"></i> Enviar aviso</button>`,
      ]);
  }, 80);
}

async function sendEventNotify(eventoId) {
  const title = $('#evNotifyTitle').value.trim();
  const body  = $('#evNotifyBody').value.trim();
  if (!title || !body) { toast('Completa título y mensaje'); return; }
  if (!API_BASE) { toast('Necesitas backend para esto'); return; }
  try {
    const res = await API.notifyEventEnrollees(eventoId, title, body);
    toast(`📨 Enviado a ${res.sent} de ${res.total} inscritos${res.failed ? ` (${res.failed} fallos)` : ''}`);
    closeModal();
  } catch (e) { toast('Error enviando el aviso'); }
}
