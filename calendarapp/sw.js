const CACHE_NAME = 'alumni-camarafp-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './img/logo.jpeg',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/screens.css',
  './js/data.js',
  './js/utils.js',
  './js/ui.js',
  './js/auth.js',
  './js/router.js',
  './js/app.js',
  './js/screens/home.js',
  './js/screens/news.js',
  './js/screens/calendar.js',
  './js/screens/talks.js',
  './js/screens/mentors.js',
  './js/screens/community.js',
  './js/screens/directory.js',
  './js/screens/profile.js',
  './js/screens/admin.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('push', e => {
  let data = { title: 'Alumni Cámara FP', body: 'Tienes una notificación nueva.' };
  try { data = e.data ? e.data.json() : data; } catch (err) {}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './img/logo.jpeg',
    badge: './img/logo.jpeg',
    data: data.url || './'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || './'));
});

/* ================================================================
   Alumni Cámara FP — Service Worker
   Gestiona: Push Notifications + Alarmas offline de eventos
   ================================================================ */

const CACHE_NAME = "alumni-fp-v1";

// ── Instalación ──────────────────────────────────────────────
self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

// ── Push recibido desde servidor ─────────────────────────────
self.addEventListener("push", (e) => {
  let data = { title: "Alumni Cámara FP", body: "Tienes una novedad en la comunidad.", icon: "./img/logo.jpeg", badge: "./img/logo.jpeg" };

  try { data = { ...data, ...e.data.json() }; } catch (_) {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon    || "./img/logo.jpeg",
      badge:   data.badge   || "./img/logo.jpeg",
      tag:     data.tag     || "alumni-push",
      data:    { url: data.url || "/" },
      actions: [
        { action: "open",    title: "Ver evento" },
        { action: "dismiss", title: "Cerrar"     },
      ],
      vibrate: [200, 100, 200],
      requireInteraction: true,
    })
  );
});

// ── Alarma programada (via postMessage desde la app) ─────────
self.addEventListener("message", (e) => {
  if (e.data?.type === "SCHEDULE_ALARM") {
    const { eventId, title, body, fireAt } = e.data;
    const delay = new Date(fireAt).getTime() - Date.now();
    if (delay <= 0) return;

    // Usamos setTimeout en el SW (sólo fiable cuando la app está abierta/background)
    setTimeout(() => {
      self.registration.showNotification(`🔔 ${title}`, {
        body,
        icon:  "./img/logo.jpeg",
        badge: "./img/logo.jpeg",
        tag:   `alarm-${eventId}`,
        data:  { url: "/", eventId },
        vibrate: [300, 150, 300, 150, 300],
        requireInteraction: true,
      });
    }, delay);
  }
});

// ── Click en notificación ────────────────────────────────────
self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  if (e.action === "dismiss") return;

  const url = e.notification.data?.url || "/";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.postMessage({ type: "NAV_TO", url });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
