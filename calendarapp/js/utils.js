/* ==========================================================
   Helpers de uso general — DOM, formato, escapes.
   ========================================================== */

const $  = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

function fmtDateLong(d) {
  return d ? new Date(d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : '—';
}

function fmtRel(ts) {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60)        return 'ahora';
  if (diff < 3600)      return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400)     return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `hace ${Math.floor(diff / 86400)} d`;
  return new Date(ts).toLocaleDateString('es-ES');
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function emptyMsg(msg, icon) {
  return `<div class="empty" style="grid-column:1/-1"><i class="fas fa-${icon}"></i>${escapeHtml(msg)}</div>`;
}

function findUser(dni) {
  return DATA.users.find(u => u.dni === dni);
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2500);
}
