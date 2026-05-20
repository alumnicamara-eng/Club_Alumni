/* ==========================================================
   UI primitives: modal, video overlay, menús, notificaciones, push
   ========================================================== */

/* ---------- Modal ---------- */
function showModal(title, body, actions) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = body;
  $('#modalFoot').innerHTML = (actions || [`<button class="btn btn-primary" onclick="closeModal()">Cerrar</button>`]).join('');
  $('#modal').classList.add('open');
}

function closeModal() {
  $('#modal').classList.remove('open');
}

/* ---------- Video overlay ---------- */
function openVideo(url) {
  $('#videoFrame').src = url + (url.includes('?') ? '&' : '?') + 'autoplay=1&rel=0';
  $('#videoOverlay').classList.add('open');
}

function closeVideo() {
  $('#videoFrame').src = '';
  $('#videoOverlay').classList.remove('open');
}

/* ---------- Menús ---------- */
function toggleUserMenu(e) {
  e?.stopPropagation();
  $('#userDropdown').classList.toggle('open');
  $('#notifDropdown').classList.remove('open');
}
function closeUserMenu() { $('#userDropdown').classList.remove('open'); }

function toggleNotifMenu(e) {
  e?.stopPropagation();
  renderNotifDropdown();
  $('#notifDropdown').classList.toggle('open');
  closeUserMenu();
}
function closeNotifMenu() { $('#notifDropdown').classList.remove('open'); }

/* ---------- Notificaciones ---------- */
function renderNotifDropdown() {
  const list = State.notifications.slice(0, 20);
  const items = list.length
    ? list.map(n => `<div class="notif-item ${n.read ? '' : 'unread'}">
        <div class="notif-item-body">
          <div class="notif-item-title">${escapeHtml(n.title)}</div>
          <div class="notif-item-text">${escapeHtml(n.body)}</div>
          <div class="notif-item-meta">${fmtRel(n.date)}</div>
        </div>
      </div>`).join('')
    : `<div class="notif-empty"><i class="fas fa-bell-slash" style="font-size:24px;color:var(--ink-300);display:block;margin-bottom:6px"></i>Aún no tienes notificaciones</div>`;
  $('#notifDropdown').innerHTML = items + `
    <div class="notif-foot">
      <button onclick="markAllRead()">Marcar como leídas</button>
      <button onclick="requestPush()">Activar push</button>
    </div>`;
}

function markAllRead() {
  State.notifications.forEach(n => n.read = true);
  updateBadge();
  renderNotifDropdown();
}

function pushNotify({ title, body }) {
  State.notifications.unshift({ title, body, date: Date.now(), read: false });
  updateBadge();
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: './img/logo.jpeg' }); } catch (e) {}
  }
}

function updateBadge() {
  const unread = State.notifications.filter(n => !n.read).length;
  $('#notifDot').classList.toggle('hidden', unread === 0);
}

async function requestPush() {
  if (!('Notification' in window)) { toast('Tu navegador no soporta notificaciones'); return; }
  const p = await Notification.requestPermission();
  if (p === 'granted') {
    toast('Notificaciones activadas');
    pushNotify({ title: 'Notificaciones activadas', body: 'Te avisaremos de eventos, talks y noticias.' });
  } else {
    toast('Permiso de notificaciones rechazado');
  }
  closeUserMenu();
  closeNotifMenu();
}

/* ---------- Cierre por click externo / Escape ---------- */
document.addEventListener('click', e => {
  if (!e.target.closest('#userPill') && !e.target.closest('#userDropdown')) closeUserMenu();
  if (!e.target.closest('#notifBtn')  && !e.target.closest('#notifDropdown')) closeNotifMenu();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeVideo(); closeUserMenu(); closeNotifMenu(); }
});
