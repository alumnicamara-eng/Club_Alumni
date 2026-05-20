/* ==========================================================
   Mentoría — 1 mentor → 5 mentees del mismo ciclo. Sin mensajería.
   ========================================================== */

function renderMentors() {
  const filters = $('#mentorFilters');
  filters.innerHTML = `<button class="filter-btn ${State.filters.mentorCiclo === '' ? 'active' : ''}" data-c="">Todos los ciclos</button>` +
    CICLOS.map(c => `<button class="filter-btn ${State.filters.mentorCiclo === c ? 'active' : ''}" data-c="${c}">${c}</button>`).join('');
  filters.querySelectorAll('.filter-btn').forEach(b => b.onclick = () => {
    State.filters.mentorCiclo = b.dataset.c;
    renderMentors();
  });

  let list = DATA.mentors;
  if (State.filters.mentorCiclo) list = list.filter(m => m.ciclo === State.filters.mentorCiclo);

  $('#mentorsList').innerHTML = list.map(mentorCard).join('') || emptyMsg('No hay mentores en este ciclo todavía', 'user-graduate');
}

function mentorCard(m) {
  const u = findUser(m.userDni) || {};
  const pct  = Math.round((m.mentees.length / m.max) * 100);
  const full = m.mentees.length >= m.max;
  const already = m.mentees.includes(State.user?.dni);
  return `<div class="mentor-card">
    <div class="mentor-head">
      <div class="mentor-avatar">${initials(u.name)}</div>
      <div>
        <div class="mentor-name">${escapeHtml(u.name || 'Mentor')}</div>
        <div class="mentor-role">${escapeHtml(u.position || '')} ${u.company ? '· ' + escapeHtml(u.company) : ''}</div>
      </div>
    </div>
    <div class="chip-row">
      <span class="chip chip-teal">Ciclo ${escapeHtml(m.ciclo)}</span>
      <span class="chip ${full ? 'chip-danger' : 'chip-success'}">${m.mentees.length}/${m.max} plazas</span>
      ${already ? `<span class="chip chip-navy">Asignado a ti</span>` : ''}
    </div>
    <div class="mentor-bio">${escapeHtml(m.bio)}</div>
    <div class="mentor-progress"><div class="mentor-progress-bar" style="width:${pct}%"></div></div>
    <div class="mentor-stats"><span>${full ? 'Plazas cubiertas' : 'Plazas disponibles'}</span><span>${m.max - m.mentees.length} libres</span></div>
    <div class="card-actions">
      <button class="btn ${full || already ? 'btn-outline' : 'btn-accent'} btn-sm" ${full || already ? 'disabled' : ''} onclick="requestMentee(${m.id})">
        ${already ? 'Ya estás en esta mentoría' : full ? 'Cubierto' : 'Solicitar mentoría'}
      </button>
      <button class="btn btn-ghost btn-sm" onclick="openMentorDetail(${m.id})">Ver perfil</button>
    </div>
  </div>`;
}

function requestMentee(id) {
  if (!State.user) return;
  const m = DATA.mentors.find(x => x.id === id); if (!m) return;
  if (State.user.ciclo && State.user.ciclo !== m.ciclo) {
    toast(`Este mentor es de ${m.ciclo}. Solo puedes pedir mentor de tu ciclo (${State.user.ciclo || 'completa tu perfil'}).`);
    return;
  }
  if (m.mentees.length >= m.max) { toast('Plazas cubiertas'); return; }
  if (m.mentees.includes(State.user.dni)) { toast('Ya estás en esta mentoría'); return; }
  m.mentees.push(State.user.dni);
  toast('Solicitud enviada. El mentor recibirá un aviso.');
  pushNotify({ title: 'Mentoría solicitada', body: 'Esperando confirmación del mentor.' });
  renderMentors();
}

function openMentorDetail(id) {
  const m = DATA.mentors.find(x => x.id === id);
  const u = findUser(m.userDni) || {};
  showModal(u.name || 'Mentor', `
    <div class="chip-row">
      <span class="chip chip-teal">Ciclo ${escapeHtml(m.ciclo)}</span>
      ${u.year ? `<span class="chip">${u.year}</span>` : ''}
    </div>
    <div class="card-meta"><span><i class="fas fa-briefcase"></i>${escapeHtml(u.position || '')} ${u.company ? '· ' + escapeHtml(u.company) : ''}</span></div>
    <p style="margin-top:10px">${escapeHtml(m.bio)}</p>
    ${u.linkedin ? `<p class="mt-12"><a href="${escapeHtml(u.linkedin)}" target="_blank"><i class="fab fa-linkedin"></i> Perfil LinkedIn</a></p>` : ''}
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`,
    `<button class="btn btn-accent" onclick="requestMentee(${m.id})">Solicitar mentoría</button>`,
  ]);
}

function openMentorForm() {
  if (!State.user?.ciclo) {
    showModal('Completa tu perfil primero', `Para postularte como mentor necesitamos saber qué ciclo cursaste en Cámara FP.`, [
      `<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`,
      `<button class="btn btn-primary" onclick="closeModal(); route('perfil')">Ir a mi perfil</button>`,
    ]);
    return;
  }
  showModal('Postularme como mentor', `
    <div class="field"><label class="field-label">Ciclo que cursé</label><input class="field-input" value="${escapeHtml(State.user.ciclo)}" disabled></div>
    <div class="field-help">Solo podrás acompañar a alumnos del mismo ciclo que estudiaste.</div>
    <div class="field mt-12"><label class="field-label">Breve presentación</label><textarea id="mentorBio" placeholder="Cuéntales en qué les puedes ayudar, tu experiencia desde que saliste..."></textarea></div>
    <div class="field"><label class="field-label">Plazas que ofreces</label>
      <select class="field-input" id="mentorMax"><option>3</option><option selected>5</option><option>7</option></select>
    </div>
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>`,
    `<button class="btn btn-primary" onclick="submitMentor()">Confirmar candidatura</button>`,
  ]);
}

function submitMentor() {
  const bio = $('#mentorBio').value.trim();
  const max = parseInt($('#mentorMax').value);
  if (!bio) { toast('Escribe una presentación'); return; }
  const exists = DATA.mentors.find(m => m.userDni === State.user.dni);
  if (exists) { exists.bio = bio; exists.max = max; }
  else DATA.mentors.unshift({ id: Date.now(), userDni: State.user.dni, ciclo: State.user.ciclo, bio, max, mentees: [] });
  toast('Gracias, ya apareces como mentor');
  closeModal();
  renderMentors();
}
