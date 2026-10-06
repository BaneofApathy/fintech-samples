// Registration never downloads the course. Only an explicit PREPARE does.
const MANIFEST = /* MANIFEST */ null;
const BASE = /* BASE */ "/";
const PREFIX = 'fintech-offline-', CACHE = PREFIX + MANIFEST.version, READY = BASE + '__offline_complete__';
let preparing = false;
self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
async function completeCaches() {
  const complete = [];
  for (const name of (await caches.keys()).filter(n => n.startsWith(PREFIX)))
    if (await (await caches.open(name)).match(READY)) complete.push(name);
  return complete.sort((a, b) => a === CACHE ? -1 : b === CACHE ? 1 : 0);
}
async function offlineStatus() {
  const names = await completeCaches();
  return { type: 'status', version: MANIFEST.version, ready: names.length > 0, current: names.includes(CACHE), totalBytes: MANIFEST.totalBytes, total: MANIFEST.assets.length };
}
self.addEventListener('message', event => {
  const port = event.ports[0]; if (!port) return;
  const send = data => port.postMessage(data);
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'STATUS') { send(await offlineStatus()); return; }
      if (event.data.type === 'REMOVE') {
        if (preparing) throw new Error('Wait for the current download to finish.');
        for (const name of await caches.keys()) if (name.startsWith('fintech-')) await caches.delete(name);
        send(await offlineStatus()); return;
      }
      if (event.data.type !== 'PREPARE') throw new Error('Unknown offline action.');
      if (preparing) throw new Error('An offline download is running in another tab.');
      preparing = true;
      try {
        const cache = await caches.open(CACHE); let completed = 0, bytes = 0;
        for (let i = 0; i < MANIFEST.assets.length; i += 6) {
          const results = await Promise.allSettled(MANIFEST.assets.slice(i, i + 6).map(async asset => {
            if (!(await cache.match(asset.url))) {
              const response = await fetch(asset.url, { cache: 'reload' });
              if (!response.ok) throw new Error('A course file could not be downloaded. Reconnect and retry.');
              await cache.put(asset.url, response);
            }
            completed++; bytes += asset.bytes;
            send({ type: 'progress', completed, bytes, total: MANIFEST.assets.length, totalBytes: MANIFEST.totalBytes });
          }));
          const failed = results.find(r => r.status === 'rejected'); if (failed) throw failed.reason;
        }
        await cache.put(BASE + 'offline-manifest.json', new Response(JSON.stringify(MANIFEST), { headers: { 'Content-Type': 'application/json' } }));
        await cache.put(READY, new Response(MANIFEST.version));
        // Delete previous versions only after this version is fully available.
        for (const name of await caches.keys()) if (name.startsWith('fintech-') && name !== CACHE) await caches.delete(name);
        send({ ...(await offlineStatus()), type: 'complete' });
      } finally { preparing = false; }
    } catch (error) { send({ type: 'error', message: error.message }); }
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const names = await completeCaches();
    const lookup = async () => {
      const url = new URL(event.request.url); url.search = '';
      for (const name of names) {
        const cache = await caches.open(name);
        const hit = await cache.match(url.href) || (url.pathname.endsWith('/') ? await cache.match(url.href + 'index.html') : undefined);
        if (hit) return hit;
      }
    };
    if (event.request.mode !== 'navigate' && !event.request.url.endsWith('/offline-manifest.json') && names.includes(CACHE)) {
      const hit = await lookup(); if (hit) return hit;
    }
    try { return await fetch(event.request); } catch { return await lookup() || Response.error(); }
  })());
});
