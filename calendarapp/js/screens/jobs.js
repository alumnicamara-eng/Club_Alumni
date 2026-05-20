/* ==========================================================
   Empleo — bolsa de ofertas. Cualquier alumni puede publicar.
   ========================================================== */

const JOB_TYPES = ['Indefinido', 'Prácticas', 'Temporal', 'Freelance'];

function renderJobs() {
  const f = State.filters.jobsType;
  const list = DATA.jobs.filter(j => f === 'todas' || j.type === f);
  $('#jobsList').innerHTML = list.map(jobCard).join('') || emptyMsg('No hay ofertas activas con ese filtro', 'briefcase');
}

function jobCard(j) {
  const u = findUser(j.postedBy) || {};
  return `<div class="job-card" onclick="openJobDetail(${j.id})">
    <div class="job-head">
      <div class="job-logo">${initials(j.company)}</div>
      <div style="flex:1">
        <div class="card-title">${escapeHtml(j.title)}</div>
        <div class="job-company">${escapeHtml(j.company)}</div>
      </div>
    </div>
    <div class="chip-row mt-12">
      <span class="chip chip-teal">${escapeHtml(j.type)}</span>
      <span class="chip">${escapeHtml(j.remote)}</span>
      <span class="chip">${escapeHtml(j.location)}</span>
    </div>
    <div class="card-meta">
      <span><i class="fas fa-graduation-cap"></i>${j.ciclos.join(' · ')}</span>
      ${j.salary ? `<span><i class="fas fa-coins"></i>${escapeHtml(j.salary)}</span>` : ''}
      <span>${fmtRel(j.date)}</span>
    </div>
    <div class="card-desc">${escapeHtml((j.description || '').slice(0, 140))}${(j.description || '').length > 140 ? '…' : ''}</div>
    <div class="card-meta" style="margin-top:8px;font-size:11px">Publicada por ${escapeHtml(u.name || 'Alumni')}</div>
  </div>`;
}

function openJobDetail(id) {
  const j = DATA.jobs.find(x => x.id === id); if (!j) return;
  const u = findUser(j.postedBy) || {};
  showModal(j.title, `
    <div class="chip-row">
      <span class="chip chip-teal">${escapeHtml(j.type)}</span>
      <span class="chip">${escapeHtml(j.remote)}</span>
      <span class="chip">${escapeHtml(j.location)}</span>
    </div>
    <div class="card-title">${escapeHtml(j.company)}</div>
    <div class="card-meta">
      <span><i class="fas fa-graduation-cap"></i>${j.ciclos.join(' · ')}</span>
      ${j.salary ? `<span><i class="fas fa-coins"></i>${escapeHtml(j.salary)}</span>` : ''}
      <span>Publicada ${fmtRel(j.date)}</span>
    </div>
    <p class="mt-12">${escapeHtml(j.description)}</p>
    <div class="card mt-16" style="background:var(--teal-50);border-color:var(--teal-100)">
      <div class="card-title" style="font-size:13px">Contacto</div>
      <div class="card-meta"><span><i class="fas fa-envelope"></i>${escapeHtml(j.contact)}</span></div>
      <div class="text-muted" style="font-size:12px">Publicada por ${escapeHtml(u.name || 'Alumni')}</div>
    </div>
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`,
    `<a class="btn btn-accent" href="mailto:${escapeHtml(j.contact)}?subject=Candidatura: ${encodeURIComponent(j.title)}"><i class="fas fa-paper-plane"></i> Aplicar</a>`,
  ]);
}

function openJobForm() {
  showModal('Publicar oferta', `
    <div class="field"><label class="field-label">Título del puesto</label><input class="field-input" id="jbTitle" placeholder="Ej. Frontend Developer Junior"></div>
    <div class="grid grid-2">
      <div class="field"><label class="field-label">Empresa</label><input class="field-input" id="jbCompany"></div>
      <div class="field"><label class="field-label">Ubicación</label><input class="field-input" id="jbLocation" placeholder="Valencia"></div>
    </div>
    <div class="grid grid-2">
      <div class="field"><label class="field-label">Tipo</label>
        <select class="field-input" id="jbType">${JOB_TYPES.map(t => `<option>${t}</option>`).join('')}</select>
      </div>
      <div class="field"><label class="field-label">Modalidad</label>
        <select class="field-input" id="jbRemote"><option>Presencial</option><option>Híbrido</option><option>Remoto</option></select>
      </div>
    </div>
    <div class="field"><label class="field-label">Ciclos a los que va dirigida</label>
      <div class="tag-picker" id="jbCiclos">
        ${CICLOS.map(c => `<span class="tag-pick" data-v="${c}">${c}</span>`).join('')}
      </div>
    </div>
    <div class="grid grid-2">
      <div class="field"><label class="field-label">Salario / Rango</label><input class="field-input" id="jbSalary" placeholder="24-28k€"></div>
      <div class="field"><label class="field-label">Email de contacto</label><input class="field-input" id="jbContact" type="email"></div>
    </div>
    <div class="field"><label class="field-label">Descripción</label><textarea id="jbDesc" placeholder="Tareas, stack, requisitos, plan de carrera..."></textarea></div>
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cancelar</button>`,
    `<button class="btn btn-primary" onclick="submitJob()">Publicar oferta</button>`,
  ]);

  $$('#jbCiclos .tag-pick').forEach(t => t.onclick = () => t.classList.toggle('selected'));
}

function submitJob() {
  const title    = $('#jbTitle').value.trim();
  const company  = $('#jbCompany').value.trim();
  const location = $('#jbLocation').value.trim();
  const contact  = $('#jbContact').value.trim();
  const desc     = $('#jbDesc').value.trim();
  const ciclos   = $$('#jbCiclos .tag-pick.selected').map(t => t.dataset.v);
  if (!title || !company || !location || !contact || !desc || !ciclos.length) {
    toast('Completa todos los campos y al menos un ciclo'); return;
  }
  DATA.jobs.unshift({
    id: Date.now(), title, company, location,
    type:   $('#jbType').value,
    remote: $('#jbRemote').value,
    ciclos,
    salary: $('#jbSalary').value.trim(),
    contact, description: desc,
    postedBy: State.user.dni,
    date: Date.now(),
  });
  closeModal();
  renderJobs();
  if (State.current === 'admin') renderAdmin();
  toast('Oferta publicada');
}

function deleteJob(id) {
  DATA.jobs = DATA.jobs.filter(j => j.id !== id);
  renderAdmin();
  if (State.current === 'empleo') renderJobs();
  toast('Oferta eliminada');
}
