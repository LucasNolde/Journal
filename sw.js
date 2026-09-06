/* journal — réseau d'abord, cache de secours : une mise à jour de l'appli arrive tout de suite,
   et l'appli s'ouvre quand même sans réseau. */
const V = "journal-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;   // github, youtube : jamais mis en cache
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r && r.ok) { const copie = r.clone(); caches.open(V).then(c => c.put(e.request, copie)); }
        return r;
      })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match("./index.html")))
  );
});
