// ====== ONLINE: tài khoản, bạn bè, chat, chơi online (Firebase) ======
// Được chèn vào bên trong khối script chính của app.html khi build.
const FB={
  ready:null,auth:null,db:null,
  load(){
    if(this.ready)return this.ready;
    const add=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej('load '+src);document.head.appendChild(s)});
    this.ready=add('firebase-config.js')
      .then(()=>{if(!window.FIREBASE_CONFIG||!window.FIREBASE_CONFIG.apiKey)throw 'noconfig'})
      .then(()=>add('vendor/firebase-app-compat.js'))
      .then(()=>add('vendor/firebase-auth-compat.js'))
      .then(()=>add('vendor/firebase-database-compat.js'))
      .then(()=>{firebase.initializeApp(window.FIREBASE_CONFIG);this.auth=firebase.auth();this.auth.languageCode='vi';this.db=firebase.database()});
    this.ready.catch(()=>{this.ready=null});
    return this.ready;
  }
};
const TS=()=>firebase.database.ServerValue.TIMESTAMP;
const ref=p=>FB.db.ref(p);
let ME=null,MYP=null,FRIENDS={},STATUS={},LISTENERS=[],UNREAD={},onlineBooted=false,authRegistering=false,authKnown=null,authResolve=null;
authKnown=new Promise(r=>authResolve=r);
function listen(r,ev,fn){r.on(ev,fn);LISTENERS.push(()=>r.off(ev,fn))}
function stopAll(){LISTENERS.forEach(f=>{try{f()}catch(e){}});LISTENERS=[]}
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function lsRead(){return lsGet('covua-chatread-'+(ME?ME.uid:''))||{}}
function lsMarkRead(fid,ts){const r=lsRead();r[fid]=Math.max(r[fid]||0,ts||Date.now());lsSet('covua-chatread-'+ME.uid,r)}

// ---- Lọc chat cho trẻ em ----
const BAD_WORDS=['đm','dm','đmm','dmm','đcm','dcm','đkm','dkm','đcmm','dcmm','vcl','vkl','vl','vãi lồn','vãi l','cl','clgt','cmm','cc','cặc','cạc','lồn','loz','buồi','đéo','éo','đếch','địt','đụ','đù','đụ má','đù má','du ma','đĩ','điếm','mẹ mày','má mày','bố mày','con mẹ mày','thằng chó','con chó','chó chết','óc chó','ngu','ngu si','đần','khốn nạn','mất dạy','fuck','fucking','fck','shit','bitch','dick','asshole','wtf','stfu','damn'];
const BAD_RE=BAD_WORDS.sort((a,b)=>b.length-a.length).map(w=>new RegExp('(^|[^\\p{L}\\p{N}])('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?=$|[^\\p{L}\\p{N}])','giu'));
function cleanText(t){
  t=String(t).replace(/\s+/g,' ').trim().slice(0,200);
  t=t.replace(/(https?:\/\/|www\.)\S+/gi,'[đã ẩn link]');
  t=t.replace(/\b[\w-]+\.(com|vn|net|org|io|me|ly|gg|tv|app|xyz|info|link)\b\S*/gi,'[đã ẩn link]');
  t=t.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g,'[đã ẩn email]');
  t=t.replace(/\+?\d[\d\s.\-]{6,}\d/g,m=>m.replace(/\D/g,'').length>=8?'[đã ẩn số]':m);
  for(const re of BAD_RE)t=t.replace(re,(m,a,w)=>a+'*'.repeat(Math.min(w.length,4)));
  return t;
}
const QUICK=['👍','😄','😮','🎉','❤️','🤝','Chơi ván nữa nhé!','Hay quá!','Bạn giỏi quá!','Mình đang nghĩ...','Chúc bạn chơi vui!','Cảm ơn bạn!'];

// ---- Mở mục online ----
async function openOnline(){
  show('onWait');$('waitAv').textContent='🌐';$('waitText').textContent='Đang kết nối...';$('waitCancel').classList.add('hidden');
  try{await FB.load()}
  catch(e){
    show('home');
    say(e==='noconfig'?'Phần chơi online đang được cài đặt, bố mẹ hoàn tất Firebase là dùng được nhé.':'Không kết nối được. Kiểm tra mạng rồi thử lại nhé.');
    return;
  }
  $('waitCancel').classList.remove('hidden');
  bootOnline();await authKnown;
  if(FB.auth.currentUser&&MYP)openHub();
  else if(!FB.auth.currentUser)openLogin();
  else $('waitText').textContent='Đang tải hồ sơ...';
}
function bootOnline(){
  if(onlineBooted)return;onlineBooted=true;
  FB.auth.onAuthStateChanged(async u=>{
    stopAll();ME=u;MYP=null;FRIENDS={};STATUS={};UNREAD={};authResolve();
    if(!u){lsSet('covua-online',0);if(['onHub','onChat','online','onWait'].includes(view))openLogin();return}
    lsSet('covua-online',1);
    if(authRegistering)return; // đang đăng ký, hồ sơ sẽ được tạo xong rồi mới vào
    await startSession();
  });
}
async function startSession(){
  const snap=await ref('users/'+ME.uid).get();
  if(!snap.exists()){ // tài khoản cũ chưa có hồ sơ (hiếm): tạo hồ sơ
    const p=curPlayer();await createProfile(p?p.name:'Bạn mới',p?p.avatar:'🦁');
  }
  // trạng thái online
  const st=ref('status/'+ME.uid);
  listen(ref('.info/connected'),'value',s=>{if(s.val()===true){st.onDisconnect().set({online:false,ts:TS()});st.set({online:true,ts:TS()})}});
  listen(ref('users/'+ME.uid),'value',s=>{MYP=s.val();renderMe();if((view==='onWait'||view==='onLogin')&&!OG.waiting)openHub()});
  listen(ref('friends/'+ME.uid),'value',s=>{FRIENDS=s.val()||{};watchFriends();renderFriends()});
  listen(ref('friendRequests/'+ME.uid),'value',s=>renderRequests(s.val()||{}));
  listen(ref('invites/'+ME.uid),'value',s=>renderInvites(s.val()||{}));
}
async function createProfile(name,avatar){
  const AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code=null;
  for(let i=0;i<8&&!code;i++){
    const c=Array.from({length:6},()=>AL[Math.floor(Math.random()*AL.length)]).join('');
    const r=await ref('codes/'+c).transaction(cur=>cur===null?ME.uid:undefined);
    if(r.committed)code=c;
  }
  if(!code)throw new Error('code');
  await ref('users/'+ME.uid).set({name,avatar,code,createdAt:Date.now(),stats:{wins:0,losses:0,draws:0}});
}

// ---- Đăng nhập / đăng ký ----
let regMode=false,onAv='🦁';
function openLogin(){
  show('onLogin');setRegMode(regMode);
  say('Đăng nhập để chơi và nhắn tin với bạn bè. Chưa có tài khoản thì bấm Đăng ký nhé.',{voice:false});
}
function setRegMode(r){
  regMode=r;$('tabLogin').classList.toggle('on',!r);$('tabReg').classList.toggle('on',r);
  $('regExtra').classList.toggle('hidden',!r);$('onSubmit').textContent=r?'Tạo tài khoản':'Đăng nhập';
  $('onForgot').classList.toggle('hidden',r);
  $('onPass').autocomplete=r?'new-password':'current-password';
  if(r){const p=curPlayer();if(p&&!$('onName').value){$('onName').value=p.name;onAv=p.avatar}drawOnAvs()}
}
function drawOnAvs(){$('onAvs').innerHTML=AVATARS.map(a=>`<button class="${a===onAv?'on':''}" data-a="${a}">${a}</button>`).join('');
  $('onAvs').querySelectorAll('button').forEach(b=>b.onclick=()=>{onAv=b.dataset.a;drawOnAvs()})}
$('tabLogin').onclick=()=>setRegMode(false);$('tabReg').onclick=()=>setRegMode(true);
const AUTH_ERR={'auth/email-already-in-use':'Email này đã có tài khoản. Bấm Đăng nhập nhé.','auth/invalid-email':'Email chưa đúng.',
  'auth/weak-password':'Mật khẩu cần ít nhất 6 ký tự.','auth/invalid-credential':'Email hoặc mật khẩu chưa đúng.','auth/wrong-password':'Email hoặc mật khẩu chưa đúng.',
  'auth/user-not-found':'Email hoặc mật khẩu chưa đúng.','auth/too-many-requests':'Thử sai nhiều quá, đợi một lúc rồi thử lại nhé.',
  'auth/network-request-failed':'Mất mạng rồi, kiểm tra kết nối nhé.','auth/missing-password':'Bạn nhớ nhập mật khẩu nhé.'};
$('onSubmit').onclick=async()=>{
  const email=$('onEmail').value.trim(),pass=$('onPass').value;
  if(!email||!pass){say('Bạn nhập email và mật khẩu nhé.');return}
  $('onSubmit').disabled=true;
  try{
    if(regMode){
      const name=$('onName').value.trim().replace(/\s+/g,' ');
      if(pass!==$('onPass2').value)throw {code:'x',message:'Hai mật khẩu chưa giống nhau.'};
      if(!name)throw {code:'x',message:'Bạn nhập tên hiển thị nhé.'};
      authRegistering=true;
      const cred=await FB.auth.createUserWithEmailAndPassword(email,pass);
      ME=cred.user;await createProfile(cleanText(name).slice(0,20)||'Bạn mới',onAv);
      authRegistering=false;await startSession();
      say(`Tạo tài khoản xong! ID của bạn là ${MYP?MYP.code:''}. Gửi ID này cho bạn bè để kết bạn nhé.`,{happy:true});
    }else{
      await FB.auth.signInWithEmailAndPassword(email,pass);
    }
    $('onPass').value='';$('onPass2').value='';
  }catch(e){
    authRegistering=false;
    say(e.code==='x'?e.message:(AUTH_ERR[e.code]||'Có lỗi, thử lại nhé.'));
  }finally{$('onSubmit').disabled=false}
};
$('onForgot').onclick=async()=>{
  const email=$('onEmail').value.trim();
  if(!email){say('Nhập email vào ô trên rồi bấm Quên mật khẩu nhé.');return}
  try{await FB.auth.sendPasswordResetEmail(email);say('Đã gửi thư đặt lại mật khẩu. Bố mẹ mở email để đặt mật khẩu mới nhé.')}
  catch(e){say(AUTH_ERR[e.code]||'Chưa gửi được, thử lại nhé.')}
};
$('onLogout').onclick=async()=>{try{await ref('status/'+ME.uid).set({online:false,ts:TS()})}catch(e){}FB.auth.signOut()};

// ---- Sảnh: hồ sơ, bạn bè, lời mời ----
function openHub(){show('onHub');renderMe();renderFriends();
  say(MYP?`Chào ${MYP.name}! Bấm ⚔️ để mời bạn chơi, 💬 để nhắn tin.`:'Đang tải...',{voice:false})}
function renderMe(){
  if(!MYP)return;
  $('meAv').textContent=MYP.avatar;$('meName').textContent=MYP.name;$('meCode').textContent=MYP.code;
  const s=MYP.stats||{};$('meStats').textContent=`🏆 Thắng ${s.wins||0} · Thua ${s.losses||0} · Hòa ${s.draws||0}`;
}
function watchFriends(){
  Object.keys(FRIENDS).forEach(fid=>{
    if(STATUS[fid]!==undefined)return;STATUS[fid]=false;
    listen(ref('status/'+fid),'value',s=>{STATUS[fid]=!!(s.val()&&s.val().online);renderFriends()});
    const [a,b]=[ME.uid,fid].sort();
    listen(ref(`chats/${a}/${b}`).limitToLast(1),'child_added',s=>{const m=s.val();
      if(m&&m.from===fid&&(m.ts||0)>(lsRead()[fid]||0)&&!(view==='onChat'&&CH&&CH.fid===fid)&&!(view==='online'&&OG.opp===fid&&!$('miniChat').classList.contains('hidden'))){UNREAD[fid]=true;renderFriends();
        if(m.ts>Date.now()-60000)toast(`💬 ${FRIENDS[fid]?FRIENDS[fid].name:'Bạn'} nhắn tin`,'Xem',()=>openChat(fid))}});
  });
}
function renderFriends(){
  const ids=Object.keys(FRIENDS).sort((a,b)=>(STATUS[b]?1:0)-(STATUS[a]?1:0));
  $('friendList').innerHTML=ids.length?ids.map(fid=>{const f=FRIENDS[fid];
    return `<div class="frow"><div class="av">${esc(f.avatar)}<span class="dot2 ${STATUS[fid]?'on':''}"></span></div>
      <div class="nm">${esc(f.name)}<div class="note">${STATUS[fid]?'Đang online':'Offline'} · ${esc(f.code)}</div></div>
      <button class="btn small" data-chat="${fid}">💬${UNREAD[fid]?'<span class="badge">mới</span>':''}</button>
      <button class="btn green small" data-play="${fid}">⚔️</button></div>`}).join('')
    :'<div class="note" style="text-align:center;padding:10px">Chưa có bạn nào. Gửi ID của bạn cho bạn bè, hoặc nhập ID của bạn ấy ở ô trên.</div>';
  $('friendList').querySelectorAll('[data-chat]').forEach(b=>b.onclick=()=>openChat(b.dataset.chat));
  $('friendList').querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>inviteFriend(b.dataset.play));
}
function renderRequests(reqs){
  const ids=Object.keys(reqs);
  $('reqBox').innerHTML=ids.map(fid=>{const r=reqs[fid];return `<div class="frow"><div class="av">${esc(r.avatar)}</div>
    <div class="nm">${esc(r.name)}<div class="note">muốn kết bạn · ${esc(r.code)}</div></div>
    <button class="btn green small" data-acc="${fid}">Đồng ý</button><button class="btn red small" data-dec="${fid}">Không</button></div>`}).join('');
  $('reqBox').querySelectorAll('[data-acc]').forEach(b=>b.onclick=async()=>{const fid=b.dataset.acc,r=reqs[fid];
    try{await ref().update({[`friends/${ME.uid}/${fid}`]:{name:r.name,avatar:r.avatar,code:r.code},
      [`friends/${fid}/${ME.uid}`]:{name:MYP.name,avatar:MYP.avatar,code:MYP.code},[`friendRequests/${ME.uid}/${fid}`]:null});
      say(`Bạn và ${r.name} đã là bạn bè! Mời bạn ấy chơi một ván nhé.`,{happy:true});sfx.star()}catch(e){say('Chưa kết bạn được, thử lại nhé.')}});
  $('reqBox').querySelectorAll('[data-dec]').forEach(b=>b.onclick=()=>ref(`friendRequests/${ME.uid}/${b.dataset.dec}`).remove());
  if(ids.length&&view!=='onHub')toast(`👋 ${reqs[ids[0]].name} muốn kết bạn`,'Xem',openOnline);
}
$('addBtn').onclick=async()=>{
  const code=$('addCode').value.trim().toUpperCase();
  if(!/^[A-Z0-9]{6}$/.test(code)){say('ID gồm 6 chữ và số, ví dụ K7M2QP.');return}
  if(MYP&&code===MYP.code){say('Đây là ID của chính bạn đó!');return}
  try{
    const u=(await ref('codes/'+code).get()).val();
    if(!u){say('Không tìm thấy ID này. Kiểm tra lại nhé.');return}
    if(FRIENDS[u]){say('Hai bạn đã là bạn bè rồi.');return}
    await ref(`friendRequests/${u}/${ME.uid}`).set({name:MYP.name,avatar:MYP.avatar,code:MYP.code,ts:TS()});
    $('addCode').value='';say('Đã gửi lời mời kết bạn. Khi bạn ấy đồng ý, tên sẽ hiện trong danh sách.');
  }catch(e){say('Chưa gửi được lời mời. Có thể bạn ấy đã chặn, hoặc mạng có vấn đề.')}
};

// ---- Chat ----
let CH=null; // {fid,path,off}
function chatPath(fid){const [a,b]=[ME.uid,fid].sort();return `chats/${a}/${b}`}
function drawQuick(el,send){el.innerHTML=QUICK.map((q,i)=>`<button data-q="${i}">${q}</button>`).join('');el.querySelectorAll('button').forEach(b=>b.onclick=()=>send(QUICK[+b.dataset.q]))}
function attachMessages(fid,box){
  box.innerHTML='';
  const r=ref(chatPath(fid)).limitToLast(60);
  const fn=s=>{const m=s.val();if(!m)return;const d=document.createElement('div');d.className='msg'+(m.from===ME.uid?' me':'');
    d.textContent=cleanText(m.text);const t=document.createElement('small');t.textContent=new Date(m.ts||Date.now()).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});d.appendChild(t);
    box.appendChild(d);box.scrollTop=box.scrollHeight;lsMarkRead(fid,m.ts);UNREAD[fid]=false};
  r.on('child_added',fn);return ()=>r.off('child_added',fn);
}
async function sendMsg(fid,text){
  const t=cleanText(text);if(!t)return;
  try{await ref(chatPath(fid)).push({from:ME.uid,text:t,ts:TS()})}catch(e){say('Chưa gửi được tin nhắn.')}
}
function openChat(fid){
  const f=FRIENDS[fid];if(!f)return;
  if(CH&&CH.off)CH.off();
  CH={fid,off:null};show('onChat');
  $('chatAv').textContent=f.avatar;$('chatName').textContent=f.name;
  CH.off=attachMessages(fid,$('chatMsgs'));UNREAD[fid]=false;
  drawQuick($('chatQuick'),t=>sendMsg(fid,t));
  say(`Nhắn tin với ${f.name}. Nhớ lịch sự nhé! Không gửi số điện thoại, địa chỉ hay mật khẩu cho ai.`,{voice:false});
}
$('chatSend').onclick=()=>{if(!CH)return;sendMsg(CH.fid,$('chatInput').value);$('chatInput').value=''};
$('chatInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('chatSend').click()});
$('chatBack').onclick=()=>{if(CH&&CH.off)CH.off();CH=null;openHub()};
$('chatPlay').onclick=()=>CH&&inviteFriend(CH.fid);
$('chatReport').onclick=async()=>{
  if(!CH)return;const msgs=[...$('chatMsgs').querySelectorAll('.msg:not(.me)')].slice(-10).map(d=>d.firstChild.textContent).join(' | ');
  try{await ref('reports').push({by:ME.uid,about:CH.fid,text:msgs.slice(0,1000),ts:TS()});say('Đã gửi báo cáo cho người quản lý. Nếu bạn ấy làm con buồn, con nói với bố mẹ nhé.')}catch(e){say('Chưa gửi được báo cáo.')}
};
let blockArm=null;
$('chatBlock').onclick=async()=>{
  if(!CH)return;const fid=CH.fid,f=FRIENDS[fid];
  if(blockArm!==fid){blockArm=fid;say(`Chặn ${f?f.name:'bạn này'} sẽ xóa kết bạn, hai bạn không nhắn tin và mời chơi được nữa. Bấm Chặn lần nữa để xác nhận.`);setTimeout(()=>{if(blockArm===fid)blockArm=null},6000);return}
  blockArm=null;
  try{await ref().update({[`blocks/${ME.uid}/${fid}`]:true,[`friends/${ME.uid}/${fid}`]:null,[`friends/${fid}/${ME.uid}`]:null});
    if(CH.off)CH.off();CH=null;openHub();say('Đã chặn.')}catch(e){say('Chưa chặn được, thử lại nhé.')}
};

// ---- Lời mời chơi ----
const OG={gid:null,data:null,chess:null,myColor:'w',opp:null,sel:null,off:null,waiting:false,counted:false,chatOff:null};
async function inviteFriend(fid){
  const f=FRIENDS[fid];if(!f||!MYP)return;
  const gid=ref('games').push().key,meWhite=Math.random()<.5;
  const names={[ME.uid]:{name:MYP.name,avatar:MYP.avatar},[fid]:{name:f.name,avatar:f.avatar}};
  try{
    await ref('games/'+gid).set({white:meWhite?ME.uid:fid,black:meWhite?fid:ME.uid,status:'waiting',moves:'',createdAt:TS(),by:ME.uid,names});
    await ref(`invites/${fid}/${ME.uid}`).set({gameId:gid,name:MYP.name,avatar:MYP.avatar,ts:TS()});
  }catch(e){say('Chưa gửi được lời mời chơi.');return}
  if(CH&&CH.off){CH.off();CH=null}
  OG.waiting=true;show('onWait');$('waitAv').textContent=f.avatar;$('waitText').textContent=`Đang chờ ${f.name} nhận lời...`;$('waitCancel').classList.remove('hidden');
  say(STATUS[fid]?`Đã mời ${f.name}. Chờ bạn ấy bấm đồng ý nhé!`:`${f.name} đang offline. Lời mời vẫn được giữ, khi bạn ấy vào sẽ thấy.`,{voice:false});
  watchGame(gid,fid);
  $('waitCancel').onclick=async()=>{OG.waiting=false;try{await ref().update({[`invites/${fid}/${ME.uid}`]:null,[`games/${gid}/status`]:'cancelled'})}catch(e){}leaveGame();openHub()};
}
function renderInvites(inv){
  const ids=Object.keys(inv);
  $('invBox').innerHTML=ids.map(fid=>{const v=inv[fid];return `<div class="frow" style="background:#fff3c4"><div class="av">${esc(v.avatar)}</div>
    <div class="nm">${esc(v.name)}<div class="note">mời bạn chơi một ván!</div></div>
    <button class="btn green small" data-go1="${fid}">Chơi</button><button class="btn red small" data-no1="${fid}">Không</button></div>`}).join('');
  const accept=async fid=>{const v=inv[fid];
    try{await ref().update({[`invites/${ME.uid}/${fid}`]:null,[`games/${v.gameId}/status`]:'active',[`games/${v.gameId}/startedAt`]:TS()});
      watchGame(v.gameId,fid)}catch(e){say('Ván cờ này không còn nữa.');ref(`invites/${ME.uid}/${fid}`).remove()}};
  $('invBox').querySelectorAll('[data-go1]').forEach(b=>b.onclick=()=>accept(b.dataset.go1));
  $('invBox').querySelectorAll('[data-no1]').forEach(b=>b.onclick=async()=>{const fid=b.dataset.no1;try{await ref().update({[`invites/${ME.uid}/${fid}`]:null,[`games/${inv[fid].gameId}/status`]:'declined'})}catch(e){ref(`invites/${ME.uid}/${fid}`).remove()}});
  if(ids.length){sfx.star();
    if(view!=='onHub')toast(`⚔️ ${inv[ids[0]].name} mời chơi cờ!`,'Chơi',()=>accept(ids[0]));
    else say(`${inv[ids[0]].name} mời bạn chơi! Bấm Chơi để bắt đầu.`)}
}

// ---- Ván cờ online ----
function leaveGame(){if(OG.off)OG.off();OG.off=null;if(OG.chatOff)OG.chatOff();OG.chatOff=null;OG.gid=null;OG.data=null;OG.waiting=false}
function watchGame(gid,fid){
  leaveGame();OG.gid=gid;OG.opp=fid;OG.counted=!!(lsGet('covua-counted')||{})[gid];OG.waiting=true;OG.lastLen=-1;
  const r=ref('games/'+gid);
  const fn=s=>{const d=s.val();if(!d)return;OG.data=d;
    if(d.status==='waiting')return;
    if(d.status==='declined'||d.status==='cancelled'){
      if(OG.waiting){OG.waiting=false;leaveGame();openHub();say(d.status==='declined'?'Bạn ấy chưa chơi được lúc này. Thử lại sau nhé!':'Lời mời đã bị hủy.')}
      return}
    OG.waiting=false;
    OG.myColor=d.white===ME.uid?'w':'b';
    const mv=(d.moves||'').split(' ').filter(Boolean);
    const c=new Chess();for(const u of mv){try{c.move(uciMove(u))}catch(e){break}}
    const changed=mv.length!==OG.lastLen;OG.lastLen=mv.length;
    OG.chess=c;
    if(view!=='online'&&view!=='review'){show('online');flip=OG.myColor==='b';$('capTop').textContent='';$('capBottom').textContent='';
      say(`Ván cờ với ${oppName()} bắt đầu! Bạn cầm quân ${OG.myColor==='w'?'Trắng, đi trước':'Đen, bạn ấy đi trước'}.`,{happy:true})}
    if(changed&&mv.length){const h=c.history({verbose:true});const last=h[h.length-1];last.captured?sfx.capture():sfx.move();
      if(d.status==='active'&&c.turn()===OG.myColor){let t=`${oppName()} đi ${NAMES[last.piece]} đến ${last.to}.`;if(c.inCheck())t+=' Vua của bạn đang bị chiếu!';say(t,{voice:false})}}
    renderOnline();
    if(d.status==='over')onlineOver(d);
  };
  r.on('value',fn);OG.off=()=>r.off('value',fn);
}
const oppName=()=>{const d=OG.data;return d&&d.names&&d.names[OG.opp]?d.names[OG.opp].name:'Bạn ấy'};
function renderOnline(){
  if(view!=='online'||!OG.chess)return;
  const c=OG.chess,d=OG.data,h=c.history({verbose:true}),last=h[h.length-1];
  const marks={};if(last){marks[last.from]='last';marks[last.to]='last'}
  const myTurn=d.status==='active'&&c.turn()===OG.myColor;
  drawBoard(boardCells(c,{selected:myTurn?OG.sel:null,marks}));
  const on=STATUS[OG.opp];
  const n=d.names||{},me=n[ME.uid]||{},op=n[OG.opp]||{};
  $('onlineBar').innerHTML=`${esc(me.avatar||'')} ${esc(me.name||'')} <span style="opacity:.6">vs</span> ${esc(op.avatar||'')} ${esc(op.name||'')} ${on?'🟢':'⚪'}<br>`+
    (d.status==='over'?'Ván cờ đã kết thúc':myTurn?'<span style="color:#2b8442">Đến lượt bạn!</span>':`Đợi ${esc(op.name||'bạn ấy')} đi...`);
  $('ogResign').classList.toggle('hidden',d.status!=='active');
  $('ogReview').classList.toggle('hidden',d.status!=='over'||h.length<4);
  $('ogRematch').classList.toggle('hidden',d.status!=='over');
}
function onlineClick(sq){
  const c=OG.chess,d=OG.data;if(!c||!d||d.status!=='active'||c.turn()!==OG.myColor)return;
  const p=c.get(sq);
  if(OG.sel){const mv=c.moves({square:OG.sel,verbose:true}).find(m=>m.to===sq);if(mv){onlineMove(mv);return}}
  if(p&&p.color===OG.myColor){OG.sel=sq;renderOnline()}else{OG.sel=null;renderOnline()}
}
async function onlineMove(mv){
  const c=OG.chess,res=c.move({from:mv.from,to:mv.to,promotion:'q'});OG.sel=null;
  const moves=c.history({verbose:true}).map(m=>m.from+m.to+(m.promotion||'')).join(' ');
  const upd={moves,lastTs:TS()};
  if(c.isGameOver()){upd.status='over';
    if(c.isCheckmate()){upd.result=OG.myColor==='w'?'white':'black';upd.reason='checkmate'}
    else{upd.result='draw';upd.reason=c.isStalemate()?'stalemate':'draw'}}
  OG.lastLen=c.history().length;res.captured?sfx.capture():sfx.move();renderOnline();
  try{await ref('games/'+OG.gid).update(upd)}catch(e){c.undo();renderOnline();say('Mất kết nối, nước đi chưa gửi được. Thử lại nhé.')}
}
function onlineOver(d){
  const myRes=d.result==='draw'?'draw':((d.result==='white')===(OG.myColor==='w')?'win':'loss');
  const why={checkmate:'Chiếu hết!',resign:'Có người đầu hàng.',stalemate:'Hết nước đi, hòa.',draw:'Hòa.'}[d.reason]||'';
  if(!OG.counted){OG.counted=true;const cnt=lsGet('covua-counted')||{};cnt[OG.gid]=1;lsSet('covua-counted',cnt);
    const key={win:'wins',loss:'losses',draw:'draws'}[myRes];
    ref(`users/${ME.uid}/stats/${key}`).transaction(v=>(v||0)+1).catch(()=>{});
    if(myRes==='win'){confetti();sfx.win()}}
  say(why+' '+(myRes==='win'?`Bạn thắng ${oppName()} rồi!`:myRes==='loss'?`${oppName()} thắng ván này. Bấm Xem lại ván để học từ lỗi nhé!`:'Ván cờ hòa!'),{happy:myRes==='win'});
}
$('ogResign').onclick=()=>{
  if(!OG.data||OG.data.status!=='active')return;
  if($('ogResign').dataset.arm!=='1'){$('ogResign').dataset.arm='1';$('ogResign').textContent='Chắc chắn đầu hàng?';
    setTimeout(()=>{$('ogResign').dataset.arm='';$('ogResign').textContent='🏳️ Đầu hàng'},4000);return}
  $('ogResign').dataset.arm='';$('ogResign').textContent='🏳️ Đầu hàng';
  ref('games/'+OG.gid).update({status:'over',result:OG.myColor==='w'?'black':'white',reason:'resign'});
};
$('ogBack').onclick=()=>{leaveGame();openHub()};
$('ogRematch').onclick=()=>{const f=OG.opp;leaveGame();inviteFriend(f)};
$('ogReview').onclick=()=>{if(!OG.chess)return;game=OG.chess;rvColor=OG.myColor;reviewFrom='online';flip=OG.myColor==='b';const keep=OG.chess;leaveGame();game=keep;reviewGame()};
$('ogChat').onclick=()=>{
  const mc=$('miniChat');const showIt=mc.classList.contains('hidden');mc.classList.toggle('hidden',!showIt);
  if(showIt){if(OG.chatOff)OG.chatOff();OG.chatOff=attachMessages(OG.opp,$('ogMsgs'));drawQuick($('ogQuick'),t=>sendMsg(OG.opp,t))}
};
$('ogSend').onclick=()=>{sendMsg(OG.opp,$('ogInput').value);$('ogInput').value=''};
$('ogInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('ogSend').click()});

// ---- Thông báo nổi ----
let toastTimer=null;
function toast(text,btn,fn){
  const t=$('toast');t.innerHTML='';const s=document.createElement('span');s.textContent=text;t.appendChild(s);
  const b=document.createElement('button');b.textContent=btn;b.style.background='#7be495';b.onclick=()=>{t.classList.add('hidden');fn()};t.appendChild(b);
  const x=document.createElement('button');x.textContent='✕';x.style.background='#eee';x.onclick=()=>t.classList.add('hidden');t.appendChild(x);
  t.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.add('hidden'),12000);
}
// Đã đăng nhập từ trước: kết nối ngầm để nhận lời mời và tin nhắn
if(lsGet('covua-online')===1)FB.load().then(bootOnline).catch(()=>{});
