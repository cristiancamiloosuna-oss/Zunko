// Centro de mando Zunko: funciona sin internet. Cambia V cuando publiques una versión nueva.
const V='zunko-v7';
const SHELL=['./','./index.html','./calc.js','./app.js','./pauta.js','./landing.js','./fotos.js','./creativos.js','./crear.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('zunko-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put('./index.html',cp))}return res}).catch(()=>caches.match('./index.html')));
    return;
  }
  const fonts=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(u.origin!==location.origin&&!fonts)return;
  if(fonts){ // las fuentes no cambian: primero lo guardado
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})));
    return;
  }
  // archivos de la app: primero internet (siempre la versión nueva), lo guardado solo sin conexión
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r)));
});
