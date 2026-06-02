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
  closeUserMenu(); closeNotifMenu();
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    toast('Tu navegador no soporta notificaciones push'); return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') { toast('Permiso de notificaciones rechazado'); return; }

  /* Notificación local de confirmación */
  pushNotify({ title: 'Notificaciones activadas', body: 'Te avisaremos de eventos, talks y noticias.' });

  /* Si hay backend conectado, suscribirse al push real con VAPID */
  if (!API_BASE) { toast('Notificaciones locales activadas (backend no configurado)'); return; }

  try {
    /* 1. Pedir clave pública VAPID al servidor */
    const vapidRes = await fetch(API_BASE.replace(/\/$/, '') + '/vapid_public.php');
    const vapid = await vapidRes.json();
    if (!vapid.configured) { toast('El backend aún no tiene VAPID configurado (ejecuta generate-vapid.php)'); return; }

    /* 2. Suscribirse al PushManager con esa clave */
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
    });

    /* 3. Enviar la suscripción al backend */
    const body = sub.toJSON();
    await fetch(API_BASE.replace(/\/$/, '') + '/push_register.php', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    toast('🔔 Push notifications activadas en este dispositivo');
  } catch (e) {
    console.error('Error suscribiendo push:', e);
    toast('No se ha podido activar el push en este dispositivo');
  }
}

/* Convierte base64url (VAPID) a Uint8Array que necesita applicationServerKey */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/* ---------- Textos legales (privacidad / términos / cookies) ---------- */
const LEGAL_TEXTS = {
  privacidad: {
    title: 'Política de privacidad',
    body: `
      <p style="margin-bottom:10px"><strong>Responsable:</strong> Cámara de Comercio de Valencia (Cámara FP).</p>
      <p style="margin-bottom:10px"><strong>Finalidad:</strong> Gestionar la comunidad Alumni, organizar eventos y enviar comunicaciones de interés a antiguos alumnos.</p>
      <p style="margin-bottom:10px"><strong>Datos recogidos:</strong> Nombre, apellidos, email, teléfono (opcional), ciclo cursado, año de promoción, situación profesional y datos que voluntariamente añadas al perfil (LinkedIn, GitHub, foto…).</p>
      <p style="margin-bottom:10px"><strong>Legitimación:</strong> Consentimiento del interesado al registrarse en la plataforma.</p>
      <p style="margin-bottom:10px"><strong>Conservación:</strong> Mientras mantengas la cuenta activa. Puedes solicitar la baja en cualquier momento escribiendo a <a href="mailto:alumni@camarafp.es">alumni@camarafp.es</a>.</p>
      <p style="margin-bottom:10px"><strong>Cesión:</strong> Tus datos no se ceden a terceros salvo obligación legal. Algunos datos (nombre, ciclo, promoción, empresa) son visibles para otros alumnis dentro de la sección "Descubre Alumnis".</p>
      <p><strong>Derechos:</strong> Acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a href="mailto:alumni@camarafp.es">alumni@camarafp.es</a>.</p>
    `
  },
  terminos: {
    title: 'Términos de uso',
    body: `
      <p style="margin-bottom:10px"><strong>Acceso:</strong> Esta plataforma es de uso exclusivo para antiguos alumnos verificados de Cámara FP. La cuenta es personal e intransferible.</p>
      <p style="margin-bottom:10px"><strong>Contenido publicado:</strong> Eres responsable de lo que publicas en la comunidad. Está prohibido contenido ofensivo, discriminatorio, spam comercial o que vulnere derechos de terceros.</p>
      <p style="margin-bottom:10px"><strong>Mentoría:</strong> El programa de mentoría es voluntario y gratuito. Ni Cámara FP ni los mentores ofrecen garantía sobre los resultados.</p>
      <p style="margin-bottom:10px"><strong>Eventos:</strong> Las plazas son limitadas. La inscripción no garantiza acceso si el aforo está completo.</p>
      <p style="margin-bottom:10px"><strong>Moderación:</strong> Nos reservamos el derecho de eliminar publicaciones, cancelar mentorías o suspender cuentas que incumplan estos términos.</p>
      <p><strong>Modificaciones:</strong> Podemos actualizar estos términos. Te avisaremos por la app cuando haya cambios relevantes.</p>
    `
  },
  cookies: {
    title: 'Política de cookies',
    body: `
      <p style="margin-bottom:10px">Esta plataforma usa el almacenamiento local del navegador (<code>localStorage</code>) para:</p>
      <ul style="margin:0 0 10px 20px;line-height:1.7">
        <li>Mantener tu sesión iniciada entre visitas.</li>
        <li>Recordar tus preferencias de notificación.</li>
        <li>Cachear contenido para que funcione sin conexión (PWA).</li>
      </ul>
      <p style="margin-bottom:10px">No usamos cookies de seguimiento ni analítica de terceros.</p>
      <p>Puedes borrar estos datos en cualquier momento desde la configuración de tu navegador.</p>
    `
  }
};

function showLegal(kind) {
  const t = LEGAL_TEXTS[kind]; if (!t) return;
  showModal(t.title, t.body, [`<button class="btn btn-primary" onclick="closeModal()">Entendido</button>`]);
}

/* ---------- Cierre por click externo / Escape ---------- */
document.addEventListener('click', e => {
  if (!e.target.closest('#userPill') && !e.target.closest('#userDropdown')) closeUserMenu();
  if (!e.target.closest('#notifBtn')  && !e.target.closest('#notifDropdown')) closeNotifMenu();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeVideo(); closeUserMenu(); closeNotifMenu(); }
});
