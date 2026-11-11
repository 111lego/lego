const V='v23';
const CORE=['./','./index.html','./3d.html','./style.css','./app.js','./data.js','./engine.js','./render.js','./sync.js','./leaderboard.js',
'./assets/beasts.webp','./assets/scenery.webp','./assets/title-world.webp','./assets/zhangke.webp','./assets/quanquan.webp','./assets/dongdong.webp','./assets/weiwei.webp','./assets/qiangzi.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
if(/\.(?:js|css|webp|jpg|jpeg|png)$/.test(u.pathname)){e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})));return;}
e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r)));});