/* ==========================================================
   Service Worker — estrategia network-first para el "app shell".
   Objetivo: que TODOS los usuarios reciban siempre la última versión
   automáticamente, sin tener que limpiar caché manualmente.

   - HTML / CSS / JS  → network-first (busca en el servidor; si no hay
     internet, usa la última copia cacheada).
   - /api/            → siempre red, nunca caché.
   - Imágenes/fuentes → cache-first (cambian poco, cargan al instante).
   - skipWaiting + clients.claim → la versión nueva toma el control ya.
   ========================================================== */

const CACHE_NAME = 'alumni-camarafp-v22';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './img/logo-club-alumni.png',
  './img/hall.jpg',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/screens.css',
  './js/data.js',
  './js/utils.js',
  './js/ui.js',
  './js/auth.js',
  './js/router.js',
  './js/api.js',
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
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* API → siempre red, nunca caché (evita datos obsoletos). */
  if (url.pathname.includes('/api/')) {
    e.respondWith(fetch(req));
    return;
  }

  const sameOrigin = url.origin === location.origin;
  const isImage = /\.(png|jpe?g|gif|svg|webp|ico)$/i.test(url.pathname);

  /* Imágenes y recursos externos (fuentes, FontAwesome) → cache-first. */
  if (isImage || !sameOrigin) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached))
    );
    return;
  }

  /* HTML / CSS / JS propios → NETWORK-FIRST.
     Siempre intenta el servidor; si falla (sin internet), usa la caché. */
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
  );
});

/* ---------- Push notifications ---------- */
self.addEventListener('push', e => {
  let data = { title: 'Club Alumni — Cámara FP', body: 'Tienes una notificación nueva.' };
  try { data = e.data ? e.data.json() : data; } catch (err) {}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './img/logo-club-alumni.png',
    badge: './img/logo-club-alumni.png',
    data: data.url || './'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || './'));
});
