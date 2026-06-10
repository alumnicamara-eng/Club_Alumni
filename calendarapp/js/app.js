/* ==========================================================
   Bootstrap, event bindings y service worker.
   ========================================================== */

async function bootApp() {
  $('#authOverlay').style.display = 'none';
  $('#appShell').classList.remove('hidden');
  renderNav();
  bindTabsAndFilters();
  renderProfile();
  route('inicio');
  updateBadge();
  registerSW();
  /* Carga datos REALES del backend antes de pintar nada definitivo */
  await loadDataFromApi();
  /* Renderiza la pantalla actual con datos frescos */
  if (typeof ROUTES !== 'undefined' && ROUTES[State.current]) ROUTES[State.current]();
  if (State.user.role === 'admin') {
    updateProposalsBadge();
    API.getPendingUsers().then(list => updatePendingBadge(list.length)).catch(() => {});
  }
}

function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  /* Cuando una versión nueva del Service Worker toma el control,
     recargamos UNA vez automáticamente para que el usuario tenga
     siempre la última versión sin tocar nada.
     Solo si ya había un SW controlando (no en la primera visita). */
  let refreshing = false;
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  navigator.serviceWorker.register('./sw.js').then(reg => {
    /* Si hay una versión esperando, que se active ya */
    if (reg.waiting) reg.waiting.postMessage('skipWaiting');
    /* Comprueba si hay actualización cada vez que se abre la app */
    reg.update();
  }).catch(() => {});
}

function bindTabsAndFilters() {
  $('#adminTabs').addEventListener('click', e => {
    const tab = e.target.closest('.admin-tab'); if (!tab) return;
    $$('#adminTabs .admin-tab').forEach(t => t.classList.toggle('active', t === tab));
    const id = tab.dataset.tab;
    $$('.admin-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'adminPanel-' + id));
  });
  bindFilterRow('#talksFilters', 'cat', v => { State.filters.talks   = v; renderTalks(); });
  bindFilterRow('#postFilters',  'cat', v => { State.filters.posts   = v; renderPosts(); });
}

function bindFilterRow(sel, attr, cb) {
  const row = document.querySelector(sel); if (!row) return;
  row.addEventListener('click', e => {
    const b = e.target.closest('.filter-btn'); if (!b) return;
    row.querySelectorAll('.filter-btn').forEach(x => x.classList.toggle('active', x === b));
    cb(b.dataset[attr]);
  });
}

/* ---------- Bindings DOM iniciales ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('#videoOverlay').addEventListener('click', e => { if (e.target.id === 'videoOverlay') closeVideo(); });
  $('#authLogin').addEventListener('click', tryLogin);
  $('#authUser').addEventListener('keypress', e => { if (e.key === 'Enter') tryLogin(); });
  $('#authPass').addEventListener('keypress', e => { if (e.key === 'Enter') tryLogin(); });
  $('#calPrev').addEventListener('click', () => { State.calDate.setMonth(State.calDate.getMonth() - 1); State.calSelected = null; renderCalendar(); });
  $('#calNext').addEventListener('click', () => { State.calDate.setMonth(State.calDate.getMonth() + 1); State.calSelected = null; renderCalendar(); });

  /* Comprueba sesión contra el backend. Si existe, entra directo. */
  if (await autoLogin()) bootApp();
});
