// Generate kid-friendly tactics puzzles from engine self-play. Usage: node tools/genpuzzles.js SECONDS SEED
const {makeEngine,analyse}=require('./uci.js');
const {Chess}=require('chess.js');
const fs=require('fs');
const OUT=process.env.OUT||__dirname+'/puzzles.raw.json';
const VAL={p:1,n:3,b:3,r:5,q:9,k:0};
let seed=+(process.argv[3]||1);
const rnd=()=>{seed=(seed*1103515245+12345)%2147483648;return seed/2147483648};
const sc=s=>s.mate!==undefined?(s.mate>0?100000-s.mate:-100000-s.mate):s.cp;

function mirrorSq(s){return s[0]+(9-+s[1])}
function mirrorUci(u){return mirrorSq(u.slice(0,2))+mirrorSq(u.slice(2,4))+(u.slice(4)||'')}
function mirrorFen(fen){
  const [b,t,c,e,h,f]=fen.split(' ');
  const rows=b.split('/').reverse().map(r=>r.replace(/[a-z]/gi,ch=>ch===ch.toUpperCase()?ch.toLowerCase():ch.toUpperCase()));
  let cc=c==='-'?'-':c.split('').map(ch=>ch===ch.toUpperCase()?ch.toLowerCase():ch.toUpperCase()).sort((a,b)=>'KQkq'.indexOf(a)-'KQkq'.indexOf(b)).join('');
  return [rows.join('/'),t==='w'?'b':'w',cc,e==='-'?'-':mirrorSq(e),h,f].join(' ');
}
function attackedValuable(g,sq){ // pieces the piece on sq attacks after the move (opponent's), via flipped turn
  const f=g.fen().split(' ');f[1]=f[1]==='w'?'b':'w';f[3]='-';
  let t;try{t=new Chess(f.join(' '))}catch(e){return []}
  return t.moves({square:sq,verbose:true}).filter(m=>m.captured&&(VAL[m.captured]>=3)).map(m=>m.captured)
    .concat(g.inCheck()?['k']:[]);
}

(async()=>{
  const e=await makeEngine();
  const out=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT)):[];
  const seen=new Set(out.map(p=>p.fen.split(' ')[0]));
  const t0=Date.now(), limit=(+process.argv[2]||300)*1000;
  let games=0;
  while(Date.now()-t0<limit){
    const g=new Chess(); games++;
    let lastMove=null;
    while(!g.isGameOver()&&g.history().length<120&&Date.now()-t0<limit){
      const fen=g.fen(), ply=g.history().length;
      if(ply>=8){
        const a=await analyse(e,fen,{depth:13,multipv:2});
        if(a.length){
          const b=a[0], s=a[1], bs=sc(b.score), ss=s?sc(s.score):-1e9;
          const mv=b.pv[0];
          let p=null;
          const tmp=new Chess(fen); const m=tmp.move({from:mv.slice(0,2),to:mv.slice(2,4),promotion:mv[4]||'q'});
          if(b.score.mate===1) p={theme:'mate1',sol:[mv]};
          else if(b.score.mate===2&&b.pv.length>=3&&!(s&&s.score.mate>0&&s.score.mate<=2)) p={theme:'mate2',sol:b.pv.slice(0,3)};
          else if(b.score.cp!==undefined&&bs>=300&&ss<=150&&bs-ss>=250&&!(lastMove&&m.captured&&lastMove.to===m.to&&lastMove.captured)){
            const att=attackedValuable(tmp,m.to);
            if(m.captured&&VAL[m.captured]>=3&&!att.length) p={theme:'capture',sol:[mv]};
            else if(att.length>=2) p={theme:'fork',sol:[mv]};
            else if(m.captured&&VAL[m.captured]>=3) p={theme:'capture',sol:[mv]};
            if(p) p.cont=b.pv.slice(1,3);
          }
          if(p&&!seen.has(fen.split(' ')[0])){
            p.fen=fen; p.eval=bs;
            if(fen.split(' ')[1]==='b'){p.fen=mirrorFen(fen);p.sol=p.sol.map(mirrorUci);if(p.cont)p.cont=p.cont.map(mirrorUci)}
            seen.add(fen.split(' ')[0]); out.push(p);
          }
        }
      }
      // choose self-play move: human-like, sometimes imperfect
      const c=await analyse(e,fen,{depth:5,multipv:4});
      let pick=c[0];
      const r=rnd();
      if(r<0.12) { const ms=g.moves({verbose:true}); const x=ms[Math.floor(rnd()*ms.length)]; lastMove=g.move(x); continue }
      if(r<0.5&&c.length>1) pick=c[1+Math.floor(rnd()*(c.length-1))];
      const u=pick.pv[0];
      lastMove=g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
    }
    fs.writeFileSync(OUT,JSON.stringify(out));
  }
  const cnt={};out.forEach(p=>cnt[p.theme]=(cnt[p.theme]||0)+1);
  console.log('games',games,'total',out.length,cnt);
  e.quit();process.exit(0);
})();
