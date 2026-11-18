const CACHE='cool-house-v13';
const FILES=['./','index.html','tile_fd.jpg','tile_ki.jpg','tile_lr.jpg','tile_of.jpg','icon.png','manifest.json','fd1.mp4','fd1_idle.mp4','fd2.mp4','fd2_idle.mp4','fd3.mp4','fd3_idle.mp4','fd4.mp4','ki1.mp4','lr1.mp4','of1.mp4','finale.mp4','ki_lights.jpg','lr_lights.jpg','ki1_idle.mp4','lr1_idle.mp4'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)))});
