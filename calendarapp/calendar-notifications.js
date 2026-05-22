/* ================================================================
   Alumni Cámara FP — calendar-notifications.js
   
   MÓDULO UNIFICADO:
   1. Google Calendar  → addToGoogleCalendar(event)
   2. iPhone Calendar  → addToAppleCalendar(event)  [descarga .ics]
   3. WebCal feed      → subscribeWebcal() / subscribeGoogleFeed()
   4. Push notifications → initPush() / requestPush()
   5. Alarmas in-app   → scheduleAlarm(event, minutesBefore)
   6. Modal unificado  → openCalendarModal(event)
   
   INSTALACIÓN:
   · Añade en index.html antes de </body>:
       <script src="./js/calendar-notifications.js"></script>
   · Coloca sw.js en la raíz del proyecto (mismo nivel que index.html)
   · Cambia BASE_WEBCAL_URL por tu endpoint real cuando tengas backend
   ================================================================ */

// ─────────────────────────────────────────────────────────────
// 0. CONFIG
// ─────────────────────────────────────────────────────────────
const CAL_CFG = {
  // URL del feed ICS dinámico (para suscripción automática)
  webcalUrl: "https://alumni.camarafp.es/calendar/feed.ics",

  // VAPID public key para push (reemplaza por la tuya cuando tengas backend)
  // Genera una en: https://web-push-codelab.glitch.me/
  vapidKey: "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDkBNF8ETbpGTH4y0RFMFmjcDHDrHp-JM3MBHlTBzAA",

  // Cuánto antes avisar (minutos) para alarmas in-app por defecto
  defaultAlarmMinutes: [60, 1440], // 1h antes y 24h antes
};

// ─────────────────────────────────────────────────────────────
// 1. GOOGLE CALENDAR
// ─────────────────────────────────────────────────────────────
function addToGoogleCalendar(ev) {
  const start = fmtGCal(ev.date, ev.startTime || "09:00");
  const end   = fmtGCal(ev.date, ev.endTime   || "10:00");

  const details = [
    ev.description || "",
    ev.speaker     ? `👤 Ponente: ${ev.speaker}` : "",
    ev.location    ? `📍 Lugar: ${ev.location}`   : "",
    "\n📌 Evento exclusivo para Alumni Cámara FP",
  ].filter(Boolean).join("\n");

  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     ev.title,
    dates:    `${start}/${end}`,
    details,
    location: ev.location || "Alumni Cámara FP",
    sprop:    "name:Alumni Cámara FP",
  });

  window.open(
    `https://calendar.google.com/calendar/render?${params}`,
    "_blank",
    "noopener,noreferrer"
  );

  if (typeof toast === "function") toast("Abriendo Google Calendar…");
}

function fmtGCal(dateStr, timeStr) {
  return (dateStr.replace(/-/g, "") + "T" + (timeStr || "090000").replace(/:/g, "") + "00")
    .slice(0, 15);
}

// ─────────────────────────────────────────────────────────────
// 2. APPLE / iPhone CALENDAR (.ics)
// ─────────────────────────────────────────────────────────────
function addToAppleCalendar(ev) {
  const ics = buildCalendar([ev]);
  downloadBlob(ics, sanitize(ev.title) + ".ics", "text/calendar;charset=utf-8");
  if (typeof toast === "function")
    toast("Archivo .ics descargado — ábrelo desde Archivos para añadirlo al calendario iPhone");
}

/** Exporta TODOS los eventos (botón existente del calendario) */
function exportICS() {
  const events = window.DB?.events || [];
  if (!events.length) { if (typeof toast === "function") toast("No hay eventos para exportar"); return; }
  const ics = buildCalendar(events);
  downloadBlob(ics, "alumni-camara-fp.ics", "text/calendar;charset=utf-8");
  if (typeof toast === "function") toast("Calendario completo exportado (.ics)");
}

function buildCalendar(events) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Alumni Cámara FP//App//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Alumni Cámara FP",
    "X-WR-CALDESC:Eventos exclusivos para alumni",
    "X-WR-TIMEZONE:Europe/Madrid",
    ...events.flatMap(buildVEVENT),
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildVEVENT(ev) {
  const uid     = `ev-${ev.id || Math.random().toString(36).slice(2)}@alumni.camarafp.es`;
  const stamp   = fmtICS(new Date());
  const dtStart = fmtICSLocal(ev.date, ev.startTime || "09:00");
  const dtEnd   = fmtICSLocal(ev.date, ev.endTime   || "10:00");

  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/Madrid:${dtStart}`,
    `DTEND;TZID=Europe/Madrid:${dtEnd}`,
    `SUMMARY:${icsEscape(ev.title)}`,
  ];

  if (ev.description) lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
  if (ev.location)    lines.push(`LOCATION:${icsEscape(ev.location)}`);

  // Alarmas: 24h antes y 1h antes
  lines.push(
    "BEGIN:VALARM","TRIGGER:-P1D","ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio mañana — Alumni Cámara FP","END:VALARM",
    "BEGIN:VALARM","TRIGGER:-PT1H","ACTION:DISPLAY",
    "DESCRIPTION:En 1 hora empieza tu evento — Alumni Cámara FP","END:VALARM"
  );

  lines.push("END:VEVENT");
  return lines;
}

function fmtICS(d) {
  return d.toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
}

function fmtICSLocal(dateStr, timeStr) {
  const [y, m, d] = (dateStr || "2025-01-01").split("-");
  const [hh, mm]  = (timeStr || "09:00").split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

function icsEscape(str) {
  return String(str || "")
    .replace(/\\/g, "\\\\").replace(/;/g, "\\;")
    .replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// ─────────────────────────────────────────────────────────────
// 3. WEBCAL — suscripción automática
// ─────────────────────────────────────────────────────────────
function subscribeWebcal() {
  const url = CAL_CFG.webcalUrl.replace(/^https?:\/\//, "webcal://");
  window.location.href = url;
  if (typeof toast === "function") toast("Abriendo suscripción en calendario iPhone…");
}

function subscribeGoogleFeed() {
  const enc = encodeURIComponent(CAL_CFG.webcalUrl);
  window.open(
    `https://calendar.google.com/calendar/r?cid=${enc}`,
    "_blank", "noopener,noreferrer"
  );
  if (typeof toast === "function") toast("Abriendo suscripción en Google Calendar…");
}

// ─────────────────────────────────────────────────────────────
// 4. PUSH NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
let _swReg = null; // referencia global al Service Worker

/** Llama esto al arrancar la app (en app.js o DOMContentLoaded) */
async function initPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.info("[Alumni] Push no soportado en este navegador");
    return;
  }
  try {
    _swReg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    console.info("[Alumni] Service Worker registrado ✓");

    // Reprograma alarmas guardadas (por si el usuario recargó)
    _rescheduleStoredAlarms();

    // Escucha mensajes del SW (ej: navegar a un evento)
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data?.type === "NAV_TO" && typeof route === "function") {
        route("calendario");
      }
    });
  } catch (err) {
    console.warn("[Alumni] Error registrando SW:", err);
  }
}

/** Solicita permiso de notificaciones y suscribe al push */
async function requestPush() {
  if (!("Notification" in window)) {
    if (typeof toast === "function") toast("Tu navegador no soporta notificaciones");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    if (typeof toast === "function") toast("Notificaciones denegadas. Actívalas en ajustes del navegador.");
    return;
  }

  if (typeof toast === "function") toast("✅ Notificaciones activadas");

  // Si no hay SW ni backend push, usamos notificaciones locales directamente
  if (!_swReg) {
    console.info("[Alumni] Sin SW — usando Notification API directa");
    return;
  }

  // Con backend real: suscribir al servidor push
  // try {
  //   const sub = await _swReg.pushManager.subscribe({
  //     userVisibleOnly: true,
  //     applicationServerKey: urlB64ToUint8Array(CAL_CFG.vapidKey),
  //   });
  //   await fetch("/api/push/subscribe", { method: "POST", body: JSON.stringify(sub), headers: { "Content-Type": "application/json" } });
  // } catch (err) { console.warn("[Alumni] Error suscribiendo push:", err); }
}

/** Envía notificación local inmediata (sin servidor) */
function notifyNow(title, body, options = {}) {
  if (Notification.permission !== "granted") return;

  if (_swReg) {
    _swReg.showNotification(title, {
      body,
      icon:  "./img/logo.jpeg",
      badge: "./img/logo.jpeg",
      vibrate: [200, 100, 200],
      ...options,
    });
  } else {
    new Notification(title, { body, icon: "./img/logo.jpeg", ...options });
  }
}

// ─────────────────────────────────────────────────────────────
// 5. ALARMAS PROGRAMADAS (in-app + SW)
// ─────────────────────────────────────────────────────────────
const _alarmTimers = {}; // { alarmId: timerId }

/**
 * Programa una alarma para un evento.
 * @param {Object} ev           Objeto evento de la app
 * @param {number} minutesBefore  Minutos antes del inicio del evento
 */
function scheduleAlarm(ev, minutesBefore) {
  const startMs = getEventStartMs(ev);
  if (!startMs) return false;

  const fireAt = startMs - minutesBefore * 60 * 1000;
  const delay  = fireAt - Date.now();
  const alarmId = `${ev.id}-${minutesBefore}`;

  if (delay <= 0) {
    // Ya pasó
    console.info("[Alumni] Alarma en el pasado, ignorada:", alarmId);
    return false;
  }

  // Cancela la anterior si existía
  cancelAlarm(alarmId);

  const title = `🗓 ${ev.title}`;
  const body  = minutesBefore >= 60
    ? `Empieza en ${minutesBefore / 60}h${ev.location ? " · " + ev.location : ""}`
    : `Empieza en ${minutesBefore} min${ev.location ? " · " + ev.location : ""}`;

  // Timer en JS (funciona con app abierta)
  const timerId = setTimeout(() => {
    notifyNow(title, body, { tag: alarmId });
    _removeStoredAlarm(alarmId);
  }, delay);

  _alarmTimers[alarmId] = timerId;

  // Delegar al SW (funciona con app en background/cerrada)
  if (_swReg?.active) {
    _swReg.active.postMessage({
      type:    "SCHEDULE_ALARM",
      eventId: ev.id,
      title,
      body,
      fireAt:  new Date(fireAt).toISOString(),
    });
  }

  // Persistir para reschedule tras recarga
  _saveAlarm(alarmId, { ev, minutesBefore, fireAt });

  console.info(`[Alumni] Alarma programada: "${ev.title}" en ${Math.round(delay / 60000)} min`);
  return true;
}

function cancelAlarm(alarmId) {
  if (_alarmTimers[alarmId]) {
    clearTimeout(_alarmTimers[alarmId]);
    delete _alarmTimers[alarmId];
  }
  _removeStoredAlarm(alarmId);
}

/** Cancela TODAS las alarmas de un evento */
function cancelEventAlarms(eventId) {
  Object.keys(_alarmTimers).forEach((id) => {
    if (id.startsWith(`${eventId}-`)) cancelAlarm(id);
  });
}

function getEventStartMs(ev) {
  if (!ev?.date) return null;
  const [hh, mm] = (ev.startTime || "09:00").split(":").map(Number);
  const d = new Date(ev.date + "T00:00:00");
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
}

// ── Persistencia de alarmas en localStorage ──────────────────
function _saveAlarm(alarmId, data) {
  try {
    const stored = JSON.parse(localStorage.getItem("alumni_alarms") || "{}");
    stored[alarmId] = data;
    localStorage.setItem("alumni_alarms", JSON.stringify(stored));
  } catch (_) {}
}

function _removeStoredAlarm(alarmId) {
  try {
    const stored = JSON.parse(localStorage.getItem("alumni_alarms") || "{}");
    delete stored[alarmId];
    localStorage.setItem("alumni_alarms", JSON.stringify(stored));
  } catch (_) {}
}

function _rescheduleStoredAlarms() {
  try {
    const stored = JSON.parse(localStorage.getItem("alumni_alarms") || "{}");
    Object.entries(stored).forEach(([alarmId, { ev, minutesBefore, fireAt }]) => {
      if (new Date(fireAt) > new Date()) {
        scheduleAlarm(ev, minutesBefore);
      } else {
        _removeStoredAlarm(alarmId);
      }
    });
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────
// 6. MODAL UNIFICADO — "📅 Añadir al calendario"
// ─────────────────────────────────────────────────────────────

/**
 * Abre el modal con todas las opciones de calendario + alarmas.
 * Llama a esta función desde cualquier tarjeta de evento.
 * Ejemplo: <button onclick="openCalendarModal(ev)">📅 Calendario</button>
 */
function openCalendarModal(ev) {
  // Leer alarmas activas para este evento
  const stored  = JSON.parse(localStorage.getItem("alumni_alarms") || "{}");
  const active1h  = !!stored[`${ev.id}-60`];
  const active24h = !!stored[`${ev.id}-1440`];
  const evJSON    = escAttr(JSON.stringify(ev));

  const body = `
  <div style="display:flex;flex-direction:column;gap:16px;padding:4px 0">

    <!-- Resumen del evento -->
    <div style="background:var(--navy-50,#f0f4f8);border-radius:10px;padding:12px 14px">
      <div style="font-weight:700;font-size:15px;color:var(--navy-800,#0F2C44)">${ev.title}</div>
      <div style="font-size:13px;color:var(--ink-500,#6b7280);margin-top:4px">
        ${fmtDate(ev.date)}
        ${ev.startTime ? " · <strong>" + ev.startTime + "</strong>" : ""}
        ${ev.location  ? " · 📍 " + ev.location : ""}
      </div>
    </div>

    <!-- Añadir a calendario externo -->
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-400,#9ca3af);margin-bottom:8px">Añadir a tu calendario</div>
      <div style="display:flex;flex-direction:column;gap:8px">

        <button class="btn btn-primary btn-full"
          onclick="addToGoogleCalendar(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(ev))}')))"
          style="justify-content:flex-start;gap:10px">
          <svg width="16" height="16" viewBox="0 0 48 48" style="flex-shrink:0"><rect width="48" height="48" rx="4" fill="#fff"/><path d="M34 6H14a8 8 0 00-8 8v20a8 8 0 008 8h20a8 8 0 008-8V14a8 8 0 00-8-8z" fill="#fff"/><path d="M34 6H14a8 8 0 00-8 8v1h36v-1a8 8 0 00-8-8z" fill="#EA4335"/><path d="M6 34v-1h36v1a8 8 0 01-8 8H14a8 8 0 01-8-8z" fill="#34A853"/><path d="M6 15h36v18H6z" fill="#4285F4"/><path d="M6 15h36v9H6z" fill="#fff" opacity=".2"/></svg>
          Google Calendar
        </button>

        <button class="btn btn-outline btn-full"
          onclick="addToAppleCalendar(JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(ev))}')))"
          style="justify-content:flex-start;gap:10px">
          <svg width="16" height="16" viewBox="0 0 24 24" style="flex-shrink:0"><rect width="24" height="24" rx="4" fill="#1C1C1E"/><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z" fill="#1C1C1E" stroke="#555" stroke-width=".5"/><path d="M8 4h8M8 4v2M16 4v2" stroke="#FF453A" stroke-width="1.5" stroke-linecap="round"/><rect x="5" y="7" width="14" height="12" rx="1.5" fill="#2C2C2E"/><text x="12" y="16.5" text-anchor="middle" font-size="6" fill="white" font-family="system-ui">📅</text></svg>
          iPhone / macOS Calendar (.ics)
        </button>

      </div>
    </div>

    <!-- Suscripción automática -->
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-400,#9ca3af);margin-bottom:8px">Suscripción automática (todos los eventos)</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-ghost btn-sm" onclick="subscribeWebcal()" style="flex:1;min-width:140px">📲 iPhone / macOS</button>
        <button class="btn btn-ghost btn-sm" onclick="subscribeGoogleFeed()" style="flex:1;min-width:140px">🔄 Google Calendar</button>
      </div>
      <div style="font-size:11px;color:var(--ink-400,#9ca3af);margin-top:6px">Se actualiza automáticamente al añadir nuevos eventos.</div>
    </div>

    <!-- Separador -->
    <hr style="border:none;border-top:1px solid var(--ink-100,#f1f5f9);margin:0">

    <!-- Alarmas in-app -->
    <div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-400,#9ca3af);margin-bottom:8px">🔔 Recordatorios en esta app</div>
      <div style="font-size:12px;color:var(--ink-500,#6b7280);margin-bottom:10px">
        Recibirás una notificación antes del evento (requiere tener la app abierta o en background).
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 10px;border-radius:8px;background:var(--navy-50,#f0f4f8)">
          <input type="checkbox" id="alarm1h" ${active1h ? "checked" : ""}
            onchange="toggleAlarm(this, ${escAttr(JSON.stringify(ev))}, 60)"
            style="accent-color:var(--navy-800,#0F2C44);width:16px;height:16px">
          <div>
            <div style="font-size:13px;font-weight:600">1 hora antes</div>
            <div style="font-size:11px;color:var(--ink-400,#9ca3af)">${getAlarmTime(ev, 60)}</div>
          </div>
        </label>

        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 10px;border-radius:8px;background:var(--navy-50,#f0f4f8)">
          <input type="checkbox" id="alarm24h" ${active24h ? "checked" : ""}
            onchange="toggleAlarm(this, ${escAttr(JSON.stringify(ev))}, 1440)"
            style="accent-color:var(--navy-800,#0F2C44);width:16px;height:16px">
          <div>
            <div style="font-size:13px;font-weight:600">24 horas antes</div>
            <div style="font-size:11px;color:var(--ink-400,#9ca3af)">${getAlarmTime(ev, 1440)}</div>
          </div>
        </label>
      </div>

      <button class="btn btn-outline btn-sm w-full mt-8" onclick="requestPush()" style="margin-top:10px">
        <i class="fas fa-bell"></i>&nbsp; Activar notificaciones push
      </button>
    </div>

  </div>`;

  if (typeof openModal === "function") {
    openModal("📅 Calendario y recordatorios", body, "");
  } else {
    console.warn("[Alumni] openModal no disponible");
  }
}

/** Toggle de alarma desde el checkbox del modal */
function toggleAlarm(checkbox, ev, minutesBefore) {
  if (checkbox.checked) {
    if (Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") {
          const ok = scheduleAlarm(ev, minutesBefore);
          if (!ok) { checkbox.checked = false; if (typeof toast === "function") toast("El evento ya ha pasado"); }
          else if (typeof toast === "function") toast(`✅ Recordatorio activado (${minutesBefore >= 60 ? minutesBefore/60+"h" : minutesBefore+"min"} antes)`);
        } else {
          checkbox.checked = false;
          if (typeof toast === "function") toast("Notificaciones denegadas — actívalas en ajustes del navegador");
        }
      });
    } else if (Notification.permission === "granted") {
      const ok = scheduleAlarm(ev, minutesBefore);
      if (!ok) { checkbox.checked = false; if (typeof toast === "function") toast("El evento ya ha pasado"); }
      else if (typeof toast === "function") toast(`✅ Recordatorio activado (${minutesBefore >= 60 ? minutesBefore/60+"h" : minutesBefore+"min"} antes)`);
    } else {
      checkbox.checked = false;
      if (typeof toast === "function") toast("Notificaciones bloqueadas — actívalas en ajustes del navegador");
    }
  } else {
    cancelAlarm(`${ev.id}-${minutesBefore}`);
    if (typeof toast === "function") toast("Recordatorio cancelado");
  }
}

// ─────────────────────────────────────────────────────────────
// 7. PATCH — añade botón 📅 a tarjetas de evento ya renderizadas
// ─────────────────────────────────────────────────────────────
function patchEventCards() {
  document.querySelectorAll(".event-card[data-event-id]").forEach((card) => {
    if (card.querySelector(".cal-add-btn")) return;
    const id = card.dataset.eventId;
    const ev = (window.DB?.events || []).find((e) => String(e.id) === String(id));
    if (!ev) return;

    const btn = document.createElement("button");
    btn.className  = "btn btn-ghost btn-sm cal-add-btn";
    btn.style.cssText = "margin-top:6px;width:100%;font-size:12px";
    btn.innerHTML  = `📅 Calendario y recordatorio`;
    btn.onclick = (e) => { e.stopPropagation(); openCalendarModal(ev); };

    const footer = card.querySelector(".card-actions") || card;
    footer.appendChild(btn);
  });
}

// ─────────────────────────────────────────────────────────────
// 8. ARRANQUE AUTOMÁTICO
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initPush();
});

// ─────────────────────────────────────────────────────────────
// UTILIDADES INTERNAS
// ─────────────────────────────────────────────────────────────
function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function sanitize(str) {
  return String(str || "evento").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50);
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function getAlarmTime(ev, minutesBefore) {
  const ms = getEventStartMs(ev);
  if (!ms) return "";
  const d = new Date(ms - minutesBefore * 60 * 1000);
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })
    + " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function escAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Convierte VAPID key base64 a Uint8Array (para suscripción push real)
function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
