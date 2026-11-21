const {makeEngine,analyse}=require('./uci.js');
const {Chess}=require('chess.js');const fs=require('fs');
const all=fs.readdirSync(__dirname).filter(f=>f.endsWith('.json')).flatMap(f=>JSON.parse(fs.readFileSync(__dirname+'/'+f)));
const seen=new Set();const uniq=all.filter(p=>{const k=p.fen.split(' ')[0];if(seen.has(k))return false;seen.add(k);return true});
const mv=(g,u)=>g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
(async()=>{
  const e=await makeEngine();const ok=[];const rej={};
  for(const p of uniq){
    try{
      const g=new Chess(p.fen); if(g.turn()!=='w')throw 'turn';
      if(p.theme==='mate1'){const m=g.moves({verbose:true}).filter(m=>{g.move(m);const c=g.isCheckmate();g.undo();return c});if(!m.length)throw 'nomate';}
      else{
        const a=await analyse(e,p.fen,{depth:18,multipv:2});
        if(a[0].pv[0]!==p.sol[0])throw 'best changed';
        if(p.theme==='mate2'){
          if(a[0].score.mate!==2)throw 'not m2';
          if(a[1]&&a[1].score.mate>0&&a[1].score.mate<=2)throw 'm2 not unique';
          mv(g,p.sol[0]);
          for(const r of g.moves({verbose:true})){g.move(r);const has=g.moves({verbose:true}).some(x=>{g.move(x);const c=g.isCheckmate();g.undo();return c});g.undo();if(!has)throw 'not forced';}
          mv(g,p.sol[1]);
        }else{
          const b=a[0].score.cp,s=a[1]?(a[1].score.mate!==undefined?(a[1].score.mate>0?9999:-9999):a[1].score.cp):-9999;
          if(a[0].score.mate===undefined&&(b<250||s>150||b-s<200))throw 'not unique win';
          mv(g,p.sol[0]); if(p.cont){mv(g,p.cont[0]);mv(g,p.cont[1])}
        }
      }
      ok.push({theme:p.theme,fen:p.fen,sol:p.sol,...(p.cont?{cont:p.cont}:{})});
    }catch(err){rej[err]=(rej[err]||0)+1}
  }
  const cnt={};ok.forEach(p=>cnt[p.theme]=(cnt[p.theme]||0)+1);
  console.log('unique',uniq.length,'ok',ok.length,cnt,'rejected',rej);
  // order: by theme, then fewer pieces first (easier to see)
  const pieces=f=>f.split(' ')[0].replace(/[^a-z]/gi,'').length;
  const order=['mate1','capture','fork','mate2'];
  ok.sort((a,b)=>order.indexOf(a.theme)-order.indexOf(b.theme)||pieces(a.fen)-pieces(b.fen));
  fs.writeFileSync(__dirname+'/../puzzles.js','// Câu đố được sinh tự động từ các ván Stockfish tự đấu và kiểm tra lời giải (tools/genpuzzles.js, tools/verify.js)\nwindow.PUZZLES='+JSON.stringify(ok)+';\n');
  e.quit();process.exit(0);
})();
