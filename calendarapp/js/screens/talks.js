/* ==========================================================
   Conferencias grabadas + propuestas de Alumni Talks.
   ========================================================== */

function renderTalks() {
  const cat = State.filters.talks;
  const list = DATA.talks.filter(t => cat === 'todas' || t.cat === cat);
  $('#talksList').innerHTML = list.map(talkCard).join('') || emptyMsg('No hay conferencias en esta categoría', 'video');
}

function talkCard(t) {
  return `<div class="video-card" onclick="openVideo('${escapeHtml(t.url)}')">
    <div class="video-thumb"><div class="play-badge"><i class="fas fa-play"></i></div></div>
    <div class="video-info">
      <div class="card-title">${escapeHtml(t.title)}</div>
      <div class="card-meta">
        <span><i class="fas fa-microphone"></i>${escapeHtml(t.speaker)}</span>
        <span><i class="fas fa-calendar"></i>${fmtDate(t.date)}</span>
      </div>
    </div>
  </div>`;
}

/* ---------- Propuestas de Alumni Talks ---------- */
function openProposeTalk() {
  const u = State.user;
  const datosPerfil = [u.ciclo, u.year].filter(Boolean).join(' · ');
  showModal('Proponer una Alumni Talk', `
    <p class="text-muted" style="font-size:13px;margin-bottom:14px">
      El equipo Alumni se pondrá en contacto contigo para confirmar fecha y formato.
    </p>
    <div style="padding:10px 12px;background:var(--surface-2);border-radius:10px;margin-bottom:14px;font-size:13px">
      <i class="fas fa-user-circle" style="color:var(--teal-700)"></i>
      Propuesta a nombre de <strong>${escapeHtml(u.name || '')}</strong>${datosPerfil ? ` (${escapeHtml(datosPerfil)})` : ''}.
      ${u.ciclo ? '' : '<br><span style="color:var(--ink-500);font-size:12px">Completa tu ciclo y promoción en Mi perfil para que aparezcan aquí.</span>'}
    </div>
    <div class="field"><label class="field-label">Tema de la charla</label><input class="field-input" id="propTopic" placeholder="Ej. Introducción a la observabilidad en sistemas modernos"></div>
    <div class="field"><label class="field-label">¿De qué quieres hablar?</label><textarea id="propDesc" placeholder="Breve descripción: qué cubrirás, a quién va dirigida, por qué te interesa..."></textarea></div>
    <div class="grid grid-2">
      <div class="field"><label class="field-label">Duración estimada</label>
        <select class="field-input" id="propDuration">
          <option value="30">30 min</option><option value="45" selected>45 min</option>
          <option value="60">1 h</option><option value="90">1 h 30 min</option>
        </select>
      </div>
      <div class="field"><label class="field-label">Formato preferido</label>
        <select class="field-input" id="propFormat"><option>Presencial</option><option>Online</option><option>Indiferente</option></select>
      </div>
    </div>
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>`,
    `<button class="btn btn-primary" onclick="submitProposal()"><i class="fas fa-paper-plane"></i> Enviar propuesta</button>`,
  ]);
}

async function submitProposal() {
  const u     = State.user;
  const topic = $('#propTopic').value.trim();
  const desc  = $('#propDesc').value.trim();
  if (!topic || !desc) { toast('Indica el tema y de qué quieres hablar'); return; }

  /* Los datos personales salen del perfil, no se piden de nuevo */
  const proposal = {
    nombre: u.name, email: u.email, ciclo: u.ciclo,
    promocion: u.year || null,
    tema: topic, descripcion: desc,
    duracion: $('#propDuration').value,
    formato:  $('#propFormat').value,
  };

  if (API_BASE) {
    try { await API.proponerCharla(proposal); }
    catch (e) { toast('No se pudo enviar la propuesta'); return; }
  } else {
    DATA.talkProposals.unshift({
      id: Date.now(), dni: u.dni,
      name: u.name, email: u.email, ciclo: u.ciclo, year: u.year || null,
      topic, desc,
      duration: $('#propDuration').value,
      format: $('#propFormat').value,
      date: Date.now(), status: 'pending',
    });
  }

  closeModal();
  updateProposalsBadge();
  toast('Propuesta enviada al equipo Alumni');
  pushNotify({ title: 'Propuesta enviada', body: 'Recibirás respuesta del equipo Alumni en breve.' });
}

function updateProposalsBadge() {
  const pending = DATA.talkProposals.filter(p => p.status === 'pending').length;
  const badge = $('#proposalsBadge');
  if (!badge) return;
  badge.textContent = pending;
  badge.classList.toggle('hidden', pending === 0);
}
