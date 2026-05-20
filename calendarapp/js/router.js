/* ==========================================================
   Routing + render del menú lateral y bottom-nav.
   ========================================================== */

const ROUTES = {
  inicio:     () => renderHome(),
  noticias:   () => renderNews(),
  calendario: () => renderCalendar(),
  talks:      () => renderTalks(),
  mentoria:   () => renderMentors(),
  comunidad:  () => renderPosts(),
  directorio: () => renderDirectory(),
  perfil:     () => renderProfile(),
  admin:      () => renderAdmin(),
};

function route(id) {
  if (!ROUTES[id]) id = 'inicio';
  if (id === 'admin' && State.user?.role !== 'admin') id = 'inicio';

  State.current = id;
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 's-' + id));
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.id === id));
  $$('.bottom-nav-item').forEach(n => n.classList.toggle('active', n.dataset.id === id));

  closeUserMenu();
  closeNotifMenu();
  window.scrollTo({ top: 0, behavior: 'instant' });
  ROUTES[id]();
}

function renderNav() {
  const sidebar = $('#sidebar');
  const bottom  = $('#bottomNav');
  const isAdmin = State.user?.role === 'admin';

  sidebar.innerHTML = `
    <div class="nav-section">Comunidad</div>
    ${NAV.map(n => `<button class="nav-item" data-id="${n.id}" onclick="route('${n.id}')"><i class="fas ${n.icon}"></i> ${n.label}</button>`).join('')}
    <div class="nav-section">Mi cuenta</div>
    <button class="nav-item" data-id="perfil" onclick="route('perfil')"><i class="fas fa-user"></i> Mi perfil</button>
    ${isAdmin ? `<button class="nav-item" data-id="admin" onclick="route('admin')"><i class="fas fa-shield-halved"></i> Administración</button>` : ''}
  `;

  bottom.innerHTML = MOBILE_NAV_IDS.map(id => {
    const n = NAV.find(x => x.id === id);
    return `<button class="bottom-nav-item" data-id="${id}" onclick="route('${id}')"><i class="fas ${n.icon}"></i><span>${n.label}</span></button>`;
  }).join('');

  $('#dropdownAdmin').style.display = isAdmin ? 'flex' : 'none';
}
