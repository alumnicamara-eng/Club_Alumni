/* ==========================================================
   Bootstrap, event bindings y service worker.
   ========================================================== */

function bootApp() {
  $('#authOverlay').style.display = 'none';
  $('#appShell').classList.remove('hidden');
  renderNav();
  bindTabsAndFilters();
  renderProfile();
  route('inicio');
  updateBadge();
  if (State.user.role === 'admin') updateProposalsBadge();
  registerSW();
  if (initSupabase()) loadDataFromSupabase();
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
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
document.addEventListener('DOMContentLoaded', () => {
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('#videoOverlay').addEventListener('click', e => { if (e.target.id === 'videoOverlay') closeVideo(); });
  $('#authLogin').addEventListener('click', tryLogin);
  $('#authUser').addEventListener('keypress', e => { if (e.key === 'Enter') tryLogin(); });
  $('#authPass').addEventListener('keypress', e => { if (e.key === 'Enter') tryLogin(); });
  $('#calPrev').addEventListener('click', () => { State.calDate.setMonth(State.calDate.getMonth() - 1); State.calSelected = null; renderCalendar(); });
  $('#calNext').addEventListener('click', () => { State.calDate.setMonth(State.calDate.getMonth() + 1); State.calSelected = null; renderCalendar(); });

  if (autoLogin()) bootApp();
});
