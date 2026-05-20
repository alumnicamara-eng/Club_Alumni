/* ==========================================================
   Directorio — buscar alumni por nombre, ciclo, promoción.
   ========================================================== */

function renderDirectory() {
  const yearSel = $('#dirYear');
  const years = Array.from(new Set(DATA.users.filter(u => u.year).map(u => u.year))).sort((a, b) => b - a);
  if (yearSel.children.length === 1) years.forEach(y => yearSel.appendChild(new Option(y, y)));
  applyDirFilter();
  $('#dirSearch').oninput = applyDirFilter;
  $('#dirCiclo').onchange  = applyDirFilter;
  $('#dirYear').onchange   = applyDirFilter;
}

function applyDirFilter() {
  const q = $('#dirSearch').value.toLowerCase();
  const c = $('#dirCiclo').value;
  const y = $('#dirYear').value;
  const list = DATA.users
    .filter(u => u.role !== 'admin')
    .filter(u => !q || (u.name + u.company + u.position + u.ciclo).toLowerCase().includes(q))
    .filter(u => !c || u.ciclo === c)
    .filter(u => !y || String(u.year) === y);
  $('#dirList').innerHTML = list.map(alumniCard).join('') || emptyMsg('No hay alumnis con esos filtros', 'user');
}

function alumniCard(u) {
  return `<div class="alumni-card" onclick="openAlumniDetail('${u.dni}')">
    <div class="alumni-avatar">${initials(u.name)}</div>
    <div class="alumni-name">${escapeHtml(u.name)}</div>
    <div class="alumni-meta">${escapeHtml(u.position || '')} ${u.company ? '· ' + escapeHtml(u.company) : ''}</div>
    <div class="alumni-meta" style="margin-top:2px">${escapeHtml(u.ciclo || '')} ${u.year ? '· ' + u.year : ''}</div>
    <div class="alumni-social" onclick="event.stopPropagation()">
      ${u.linkedin ? `<a href="${escapeHtml(u.linkedin)}" target="_blank"><i class="fab fa-linkedin-in"></i></a>` : ''}
      ${u.github   ? `<a href="${escapeHtml(u.github)}"   target="_blank"><i class="fab fa-github"></i></a>` : ''}
      ${u.web      ? `<a href="${escapeHtml(u.web)}"      target="_blank"><i class="fas fa-globe"></i></a>` : ''}
    </div>
  </div>`;
}

function openAlumniDetail(dni) {
  const u = findUser(dni); if (!u) return;
  showModal(u.name, `
    <div class="text-center mt-8">
      <div class="alumni-avatar" style="margin:0 auto 10px">${initials(u.name)}</div>
      <div class="card-title">${escapeHtml(u.name)}</div>
      <div class="text-muted">${escapeHtml(u.position || '')} ${u.company ? '· ' + escapeHtml(u.company) : ''}</div>
      <div class="chip-row" style="justify-content:center;margin-top:10px">
        ${u.ciclo ? `<span class="chip chip-teal">${escapeHtml(u.ciclo)}</span>` : ''}
        ${u.year  ? `<span class="chip">${u.year}</span>` : ''}
        ${u.sector? `<span class="chip">${escapeHtml(u.sector)}</span>` : ''}
      </div>
    </div>
    ${u.bio ? `<p class="mt-16">${escapeHtml(u.bio)}</p>` : ''}
    <div class="alumni-social mt-16">
      ${u.linkedin ? `<a href="${escapeHtml(u.linkedin)}" target="_blank"><i class="fab fa-linkedin-in"></i></a>` : ''}
      ${u.github   ? `<a href="${escapeHtml(u.github)}"   target="_blank"><i class="fab fa-github"></i></a>` : ''}
      ${u.web      ? `<a href="${escapeHtml(u.web)}"      target="_blank"><i class="fas fa-globe"></i></a>` : ''}
      ${u.email    ? `<a href="mailto:${escapeHtml(u.email)}"><i class="fas fa-envelope"></i></a>` : ''}
    </div>
  `, [`<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`]);
}
