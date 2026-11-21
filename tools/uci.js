// Small promise wrapper around stockfish lite-single for Node
const initEngine = require('stockfish');
function makeEngine(){
  return new Promise(res=>{
    let buf=[], waiter=null;
    const eng = initEngine('lite-single', line=>{
      buf.push(line);
      if(waiter && waiter.test(line)){const w=waiter;waiter=null;const out=buf;buf=[];w.done(out)}
    });
    const api={
      send:c=>eng.processCommand(c),
      wait:(re)=>new Promise(done=>{waiter={test:l=>re.test(l),done}}),
      async cmd(c,re){const p=api.wait(re);api.send(c);return p},
      quit:()=>eng.terminate&&eng.terminate()
    };
    setTimeout(async()=>{await api.cmd('uci',/^uciok/);await api.cmd('isready',/^readyok/);res(api)},50);
  });
}
// analyse: returns [{move, score:{cp}|{mate}, pv:[...]}] sorted by multipv
async function analyse(api,fen,{depth=12,multipv=2}={}){
  api.send('setoption name MultiPV value '+multipv);
  api.send('position fen '+fen);
  const lines=await api.cmd('go depth '+depth,/^bestmove/);
  const best={};
  for(const l of lines){
    const m=l.match(/^info .*?depth (\d+) .*?multipv (\d+) score (cp|mate) (-?\d+).*? pv (.+)$/);
    if(!m)continue;
    best[m[2]]={depth:+m[1],score:{[m[3]]:+m[4]},pv:m[5].split(' ')};
  }
  return Object.keys(best).sort().map(k=>best[k]);
}
module.exports={makeEngine,analyse};
