const V='v25';
const CORE=['./','./index.html','./3d.html','./style.css','./app.js','./data.js','./engine.js','./render.js','./sync.js','./leaderboard.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png',
'./assets/beasts.webp','./assets/scenery.webp','./assets/title-world.webp','./assets/zhangke.webp','./assets/quanquan.webp','./assets/dongdong.webp','./assets/weiwei.webp','./assets/qiangzi.webp'];
// 逐个文件缓存：任何一个 404 都不会让整批失败（addAll 的坑）
async function precache(){const c=await caches.open(V);let ok=0,bad=0;
for(const u of CORE){try{const r=await fetch(new Request(u,{cache:'reload'}));if(r.ok){await c.put(u,r);ok++;}else bad++;}catch{bad++;}}
return {ok,bad};}
self.addEventListener('install',e=>{e.waitUntil(precache().then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{const port=e.ports&&e.ports[0];if(e.data==='status'){caches.open(V).then(c=>c.keys()).then(keys=>{if(port)port.postMessage({version:V,count:keys.length});});}});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
if(/\.(?:js|css|webp|jpg|jpeg|png|webmanifest)$/.test(u.pathname)){e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})));return;}
e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r)));});