// Service worker: cho phép mở web và chơi khi không có mạng (trừ phần online).
const CACHE='covua-v2';
const CORE=['./','index.html','puzzles.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png',
  'engine/stockfish-19-lite-single.js','engine/stockfish-19-lite-single.wasm'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==location.origin)return; // Firebase và trang khác: đi thẳng ra mạng
  if(req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('index.html')){
    // Trang chính: ưu tiên bản mới trên mạng, mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('index.html',cp));return r})
      .catch(()=>caches.match('index.html')));
    return;
  }
  // Tệp khác: dùng bản đã lưu ngay, đồng thời tải bản mới về cho lần sau
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(r=>{if(r.ok)c.put(new Request(url.origin+url.pathname),r.clone());return r}).catch(()=>hit);
    return hit||net;
  }));
});
