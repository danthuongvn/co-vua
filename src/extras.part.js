// ====== EXTRAS: Elo + biểu đồ, trang phụ huynh, giới hạn thời gian, cài như ứng dụng ======
// Được chèn vào bên trong khối script chính của app.html khi build.

// ---- Elo (điểm ước tính trong web, không phải Elo FIDE) ----
const BOT_ELO=[400,600,900,1200,1500];
const PUZ_ELO={mate1:500,capture:700,fork:900,mate2:1100};
const ELO_START=600;
function eloOf(){progress.elo=Object.assign({g:ELO_START,p:ELO_START},progress.elo||{});return progress.elo}
const eloNew=(r,opp,score,K)=>Math.round(r+K*(score-1/(1+Math.pow(10,(opp-r)/400))));
function recordElo(){
  const e=eloOf(),d=todayKey();progress.eloHist=progress.eloHist||[];
  const last=progress.eloHist[progress.eloHist.length-1],row={d,g:e.g,p:e.p};if(e.o!==undefined)row.o=e.o;
  if(last&&last.d===d)Object.assign(last,row);else progress.eloHist.push(row);
  if(progress.eloHist.length>400)progress.eloHist.shift();
}
function rateGame(score){ // ván với máy
  const e=eloOf(),before=e.g;const K=(progress.games||0)<20?40:24;
  e.g=Math.max(100,eloNew(e.g,BOT_ELO[startedLevel]||600,score,K));recordElo();save();
  return e.g-before;
}
function ratePuzzle(theme,score,id){
  progress.ratedPuz=progress.ratedPuz||{};if(id!==undefined){if(progress.ratedPuz[id])return 0;progress.ratedPuz[id]=1}
  const e=eloOf(),before=e.p;e.p=Math.max(100,eloNew(e.p,PUZ_ELO[theme]||700,score,16));recordElo();save();
  return e.p-before;
}
const signed=n=>(n>0?'+':'')+n;
function eloDelta(key,days){ // thay đổi so với `days` ngày trước
  const h=progress.eloHist||[];if(!h.length)return 0;
  const cut=new Date();cut.setDate(cut.getDate()-days);
  const keyDate=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
  let base=null;for(const r of h){if(keyDate(r.d)<=cut&&r[key]!==undefined)base=r[key]}
  if(base===null){const first=h.find(r=>r[key]!==undefined);base=first?first[key]:null}
  const cur=key==='o'?eloOf().o:eloOf()[key];
  return base===null||cur===undefined?0:cur-base;
}
// Biểu đồ đường SVG
function eloChart(hist){
  const rows=(hist||[]).slice(-30);
  if(rows.length<2)return '<div class="note" style="text-align:center;padding:16px">Chơi thêm vài ngày nữa là có biểu đồ tiến bộ nhé!</div>';
  const S=[['g','Ván đấu','#3fae5a'],['p','Câu đố','#9b59ff'],['o','Online','#14a3a3']].filter(([k])=>rows.some(r=>r[k]!==undefined));
  const vals=rows.flatMap(r=>S.map(([k])=>r[k]).filter(v=>v!==undefined));
  let lo=Math.min(...vals),hi=Math.max(...vals);if(hi-lo<100){const m=(hi+lo)/2;lo=m-50;hi=m+50}
  lo=Math.floor(lo/50)*50;hi=Math.ceil(hi/50)*50;
  const W=320,H=170,L=34,R=8,T=10,B=24;
  const x=i=>L+(W-L-R)*i/(rows.length-1),y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  let g='';
  for(let k=0;k<=4;k++){const v=lo+(hi-lo)*k/4;g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#0001"/><text x="${L-4}" y="${y(v)+4}" font-size="10" text-anchor="end" fill="#8a7a66">${Math.round(v)}</text>`}
  const short=d=>{const [,m,dd]=d.split('-');return dd+'/'+m};
  g+=`<text x="${L}" y="${H-6}" font-size="10" fill="#8a7a66">${short(rows[0].d)}</text><text x="${W-R}" y="${H-6}" font-size="10" text-anchor="end" fill="#8a7a66">${short(rows[rows.length-1].d)}</text>`;
  for(const [k,,c] of S){
    const pts=rows.map((r,i)=>r[k]===undefined?null:[x(i),y(r[k])]).filter(Boolean);
    g+=`<polyline fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;
    const lp=pts[pts.length-1];g+=`<circle cx="${lp[0]}" cy="${lp[1]}" r="4" fill="${c}"/>`;
  }
  const legend=S.map(([,n,c])=>`<span style="display:inline-flex;align-items:center;gap:4px;margin:0 6px"><i style="width:14px;height:4px;border-radius:2px;background:${c};display:inline-block"></i>${n}</span>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${g}</svg><div class="note" style="text-align:center">${legend}</div>`;
}
function eloCards(){
  const e=eloOf();
  const card=(k,label,icon,v)=>{const d=eloDelta(k,7);return `<div class="ecard"><div class="note">${icon} ${label}</div><div class="ev">${v}</div><div class="note" style="color:${d>0?'#2b8442':d<0?'#b83640':'inherit'}">${d?signed(d)+' trong 7 ngày':'—'}</div></div>`};
  return `<div class="ecards">${card('g','Ván đấu','🤖',e.g)}${card('p','Câu đố','🧩',e.p)}${e.o!==undefined?card('o','Online','🌐',e.o):''}</div>`;
}
function minutesToday(pr){const s=((pr||progress).usage||{})[todayKey()]||0;return Math.floor(s/60)}

// ---- Trang Tiến bộ ----
function openProgress(){
  show('progressView');
  const pr=progress;
  $('progressView').innerHTML=`<div class="sectitle">📈 Tiến bộ của ${esc(fullName())}</div>${eloCards()}
    <div class="form" style="padding:12px">${eloChart(pr.eloHist)}</div>
    <div class="form" style="gap:6px">
      <div>🧩 Câu đố đã giải: <b>${solvedCount()}</b>/${PUZ.length}</div>
      <div>🤖 Ván với máy: <b>${pr.games||0}</b> ván, thắng <b>${pr.wins||0}</b></div>
      <div>📚 Bài học xong: <b>${Object.keys(pr.lessons).length}</b>/${LESSONS.length}</div>
      <div>⏱️ Hôm nay đã chơi: <b>${minutesToday()}</b> phút</div>
    </div>
    <div class="note">Điểm Elo ở đây là điểm ước tính trong web, giúp xem mình tiến bộ, không phải Elo chính thức của Liên đoàn cờ.</div>`;
  const e=eloOf(),d=eloDelta('p',7)+eloDelta('g',7);
  say(d>0?`Tuần này ${shortName()} tiến bộ ${d} điểm. Giỏi quá!`:'Mỗi ngày giải vài câu đố và chơi vài ván, điểm sẽ tăng dần đó!',{voice:false});
}

// ---- Cổng người lớn (phép tính) ----
let gateNext=null,gateAns=null;
function askGate(title,next){
  gateNext=next;$('lockView').classList.add('hidden');show('gateView');
  const r=(a,b)=>a+Math.floor(Math.random()*(b-a+1));const a=r(12,19),b=r(3,9),c=r(11,29);gateAns=a*b-c;
  $('gateTitle').textContent=title;$('gateQ').textContent=`${a} × ${b} − ${c} = ?`;$('gateIn').value='';
  setTimeout(()=>$('gateIn').focus(),50);say('Phần này dành cho người lớn. Hãy giải phép tính nhé.',{voice:false});
}
$('gateOk').onclick=()=>{
  const v=$('gateIn').value.trim();
  if(v!==''&&+v===gateAns){const n=gateNext;gateNext=null;n&&n()}
  else{sfx.bad();askGate($('gateTitle').textContent,gateNext);say('Chưa đúng, thử phép tính mới nhé.',{voice:false})}
};
$('gateIn').addEventListener('keydown',e=>{if(e.key==='Enter')$('gateOk').click()});
$('gateCancel').onclick=()=>{gateNext=null;isLocked()?showLock():goHome()};

// ---- Giới hạn thời gian ----
const LIMITS=[0,15,30,45,60,90,120];
function isLocked(){
  if(!curPlayer()||!progress.limit)return false;
  const extra=((progress.extra||{})[todayKey()]||0);
  return minutesToday()>=progress.limit+extra;
}
function showLock(){
  if(!$('lockView').classList.contains('hidden'))return;
  $('lockView').classList.remove('hidden');
  $('lockText').textContent=`${fullName()} đã chơi ${minutesToday()} phút hôm nay, đủ giờ bố mẹ đặt rồi. Nghỉ ngơi, đọc sách, chạy nhảy một chút, mai mình chơi tiếp nhé!`;
  say('Hôm nay chơi đủ rồi! Nghỉ mắt một chút, mai mình gặp lại nhé!');
}
$('lockSwitch').onclick=()=>openPlayers();
$('lockMore').onclick=()=>askGate('Cho chơi thêm 15 phút hôm nay?',()=>{
  progress.extra=progress.extra||{};const k=todayKey();progress.extra[k]=(progress.extra[k]||0)+15;save();goHome();say('Được chơi thêm 15 phút nữa nhé!')});
let lastBreakTip=0;
setInterval(()=>{
  if(!curPlayer()||document.visibilityState!=='visible')return;
  if(['players','playerForm','delForm','gateView','parentView'].includes(view)||!$('lockView').classList.contains('hidden'))return;
  progress.usage=progress.usage||{};const k=todayKey();progress.usage[k]=(progress.usage[k]||0)+10;
  // chỉ giữ 60 ngày gần nhất
  const keys=Object.keys(progress.usage);if(keys.length>60)delete progress.usage[keys[0]];
  save();
  const m=minutesToday();
  if(m>0&&m%25===0&&m!==lastBreakTip){lastBreakTip=m;toastLocal(`👀 ${shortName()} đã chơi ${m} phút. Nhìn ra xa một chút cho mắt nghỉ nhé!`)}
  if(isLocked()&&!(view==='online'&&OG.data&&OG.data.status==='active'))showLock();
},10000);
function toastLocal(text){
  const t=$('toast');t.innerHTML='';const sp=document.createElement('span');sp.textContent=text;t.appendChild(sp);
  const x=document.createElement('button');x.textContent='OK';x.style.background='#7be495';x.onclick=()=>t.classList.add('hidden');t.appendChild(x);
  t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),10000);
}

// ---- Trang phụ huynh ----
function openParent(){askGate('Vào trang phụ huynh',renderParent)}
function renderParent(){
  show('parentView');
  const cards=players.list.map(pl=>{
    const pr=Object.assign(blankProgress(),lsGet('covua-progress-'+pl.id)||{});
    const e=Object.assign({g:ELO_START,p:ELO_START},pr.elo||{});
    const used=Math.floor(((pr.usage||{})[todayKey()]||0)/60),lim=pr.limit||0;
    const week=(()=>{let s=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);s+=(pr.usage||{})[d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()]||0}return Math.round(s/60)})();
    return `<div class="form" data-pl="${pl.id}">
      <div style="display:flex;align-items:center;gap:10px"><span style="font-size:2.2rem">${pl.avatar}</span><b class="pn" style="font-size:1.15rem;flex:1"></b></div>
      <div class="note">Elo ván đấu <b>${e.g}</b> · câu đố <b>${e.p}</b>${e.o!==undefined?' · online <b>'+e.o+'</b>':''} · đã giải ${Object.keys(pr.solved).length} câu · thắng máy ${pr.wins||0}/${pr.games||0} ván</div>
      <div>⏱️ Hôm nay: <b>${used}</b> phút${lim?` / giới hạn ${lim} phút`:''} · 7 ngày: <b>${week}</b> phút</div>
      <div class="levelrow" style="justify-content:flex-start">Giới hạn/ngày: ${LIMITS.map(l=>`<button data-lim="${l}" class="${lim===l?'on':''}">${l?l+"'":'Không'}</button>`).join('')}</div>
      <details><summary>📈 Biểu đồ tiến bộ</summary>${eloChart(pr.eloHist)}</details>
    </div>`}).join('');
  $('parentView').innerHTML=`<div class="sectitle">👨‍👩‍👦 Trang phụ huynh</div>${cards||'<div class="note">Chưa có người chơi nào.</div>'}
    <div id="parentOnline"></div>
    <div class="controls"><button class="btn green" id="parentDone">✅ Xong</button></div>`;
  $('parentView').querySelectorAll('[data-pl]').forEach(card=>{
    const id=card.dataset.pl,pl=players.list.find(p=>p.id===id);card.querySelector('.pn').textContent=pl.name;
    card.querySelectorAll('[data-lim]').forEach(b=>b.onclick=()=>{
      const pr=Object.assign(blankProgress(),lsGet('covua-progress-'+id)||{});pr.limit=+b.dataset.lim;lsSet('covua-progress-'+id,pr);
      if(id===players.current)progress.limit=pr.limit;renderParent();
      say(pr.limit?`Đã đặt giới hạn ${pr.limit} phút mỗi ngày cho ${pl.name}.`:`Đã bỏ giới hạn thời gian cho ${pl.name}.`,{voice:false})});
  });
  $('parentDone').onclick=()=>curPlayer()?goHome():openPlayers();
  if(typeof renderParentOnline==='function')renderParentOnline($('parentOnline'));
  say('Ở đây bố mẹ đặt giới hạn thời gian chơi, xem tiến bộ và quản lý phần online.',{voice:false});
}

// ---- Cài như ứng dụng ----
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;updateInstallBtn()});
window.addEventListener('appinstalled',()=>{installEvt=null;updateInstallBtn();say('Đã cài xong! Từ giờ mở Cờ Vua từ màn hình chính nhé.',{happy:true})});
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function updateInstallBtn(){$('installBtn').classList.toggle('hidden',isStandalone())}
$('installBtn').onclick=async()=>{
  if(installEvt){installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;return}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  say(ios?'Trên iPhone/iPad: mở trang này bằng Safari, bấm nút Chia sẻ (ô vuông có mũi tên lên), rồi chọn "Thêm vào MH chính".'
         :'Mở menu ⋮ của trình duyệt, chọn "Cài đặt ứng dụng" hoặc "Thêm vào màn hình chính".');
};
updateInstallBtn();
if('serviceWorker' in navigator&&location.protocol!=='file:'){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
window.addEventListener('offline',()=>toastLocal('📴 Mất mạng. Vẫn chơi được với máy, câu đố và bài học nhé!'));
window.addEventListener('online',()=>toastLocal('📶 Có mạng trở lại.'));
