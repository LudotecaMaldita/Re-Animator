const CACHE="lm-narrador-v3.2.24-director-folds";
const SHELL=["./","index.html","manifest.webmanifest","assets/icon-192.png","assets/icon-512.png","assets/apple-touch-icon.png","assets/logo-ludoteca-maldita-oficial.png","assets/reanimator-portada-escenario.png","assets/trailer-reanimator.mp4","assets/reanimator-narracion-comienzo.mp3","assets/bso-reanimator.m4a"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("message",e=>{if(e.data?.type==="SKIP_WAITING")self.skipWaiting()});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);if(u.pathname.startsWith("/api/"))return;
  if(e.request.mode==="navigate"){e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put("index.html",copy));return r}).catch(()=>caches.match("index.html")));return}
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(r=>{if(e.request.method==="GET"&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r})));
});