/* ==========================================================
   Perfil del alumni — estilo LinkedIn.
   ========================================================== */

function renderProfile() {
  const u = State.user; if (!u) return;

  $('#pfName').value     = u.name     || '';
  $('#pfEmail').value    = u.email    || '';
  $('#pfPhone').value    = u.phone    || '';
  $('#pfBio').value      = u.bio      || '';
  $('#pfCiclo').value    = u.ciclo    || '';
  $('#pfYear').value     = u.year     || '';
  $('#pfCompany').value  = u.company  || '';
  $('#pfRole').value     = u.position || '';
  $('#pfSector').value   = u.sector   || '';
  $('#pfLinkedin').value = u.linkedin || '';
  $('#pfGithub').value   = u.github   || '';
  $('#pfWeb').value      = u.web      || '';

  $('#pfPushReminders').checked = !!u.push?.events;
  $('#pfPushNews').checked      = !!u.push?.news;
  $('#pfPushMentor').checked    = !!u.push?.mentor;

  $$('#pfInterests .tag-pick').forEach(t => {
    t.classList.toggle('selected', (u.interests || []).includes(t.dataset.v));
    t.onclick = () => t.classList.toggle('selected');
  });

  $('#profileNameLabel').textContent = u.name || '—';
  $('#profileRoleLabel').textContent = [u.position, u.company].filter(Boolean).join(' · ') || '—';
  $('#profilePhotoText').textContent = initials(u.name);
  if (u.photo) $('#profilePhoto').innerHTML = `<img src="${u.photo}" alt="">`;
  $('#profileSocial').innerHTML = `
    ${u.linkedin ? `<a href="${escapeHtml(u.linkedin)}" target="_blank"><i class="fab fa-linkedin-in"></i></a>` : ''}
    ${u.github   ? `<a href="${escapeHtml(u.github)}"   target="_blank"><i class="fab fa-github"></i></a>` : ''}
    ${u.web      ? `<a href="${escapeHtml(u.web)}"      target="_blank"><i class="fas fa-globe"></i></a>` : ''}
  `;

  $('#userName').textContent   = u.name?.split(' ')[0] || 'Mi cuenta';
  $('#userAvatar').textContent = initials(u.name);
}

function saveProfile() {
  const u = State.user;
  u.name     = $('#pfName').value.trim();
  u.email    = $('#pfEmail').value.trim();
  u.phone    = $('#pfPhone').value.trim();
  u.bio      = $('#pfBio').value.trim();
  u.ciclo    = $('#pfCiclo').value;
  u.year     = parseInt($('#pfYear').value) || null;
  u.company  = $('#pfCompany').value.trim();
  u.position = $('#pfRole').value.trim();
  u.sector   = $('#pfSector').value;
  u.linkedin = $('#pfLinkedin').value.trim();
  u.github   = $('#pfGithub').value.trim();
  u.web      = $('#pfWeb').value.trim();
  u.push = {
    events: $('#pfPushReminders').checked,
    news:   $('#pfPushNews').checked,
    mentor: $('#pfPushMentor').checked,
  };
  u.interests = $$('#pfInterests .tag-pick.selected').map(t => t.dataset.v);
  renderProfile();
  toast('Perfil actualizado');
}

document.addEventListener('change', e => {
  if (e.target.id === 'profilePhotoInput') {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      State.user.photo = ev.target.result;
      renderProfile();
      toast('Foto actualizada');
    };
    r.readAsDataURL(f);
  }
});
