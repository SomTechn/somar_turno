/* Somar Turno · service worker: guarda la app para que abra rápido y sin señal */
const CACHE = 'somar-turno-v1';
const ARCHIVOS = ['/', '/index.html', '/assets/css/app.css', '/assets/js/config.js', '/assets/js/core.js', '/assets/js/data.js', '/assets/js/cliente.js', '/assets/img/icon.svg', '/manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
/* Primero la red (para tener siempre lo último); si no hay señal, lo guardado */
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); return res; })
    .catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('/index.html') : undefined))));
});
