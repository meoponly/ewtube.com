const CACHE_NAME = 'ewtube-v1';
const PRECACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js',
];
const NO_CACHE = ['googleapis.com/youtube','firebasedatabase.app','suggestqueries'];
const ALWAYS_CACHE = ['fonts.googleapis.com','fonts.gstatic.com','www.gstatic.com/firebasejs'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache=>
    Promise.allSettled(PRECACHE.map(u=>cache.add(u).catch(()=>{})))
  ).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>
    Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
  ).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const url = e.request.url;
  if(e.request.method!=='GET') return;
  if(NO_CACHE.some(d=>url.includes(d))) return;
  if(url.includes('i.ytimg.com')||url.includes('yt3.ggpht')||url.includes('yt3.googleusercontent')){
    e.respondWith(caches.open(CACHE_NAME).then(cache=>
      cache.match(e.request).then(cached=>{
        if(cached) return cached;
        return fetch(e.request).then(r=>{if(r.ok)cache.put(e.request,r.clone());return r;}).catch(()=>cached);
      })
    ));
    return;
  }
  if(ALWAYS_CACHE.some(d=>url.includes(d))){
    e.respondWith(caches.open(CACHE_NAME).then(cache=>
      cache.match(e.request).then(cached=>{
        if(cached) return cached;
        return fetch(e.request).then(r=>{if(r.ok)cache.put(e.request,r.clone());return r;});
      })
    ));
    return;
  }
  if(url.endsWith('.html')||url.endsWith('/')){
    e.respondWith(fetch(e.request).then(r=>{
      if(r.ok) caches.open(CACHE_NAME).then(c=>c.put(e.request,r.clone()));
      return r;
    }).catch(()=>caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));
});
self.addEventListener('message',e=>{
  if(e.data?.type==='CACHE_URLS'){
    caches.open(CACHE_NAME).then(cache=>{
      (e.data.urls||[]).forEach(u=>fetch(u).then(r=>{if(r.ok)cache.put(u,r);}).catch(()=>{}));
    });
  }
});
