export const id='game-2048';
export const name='2048';
export const icon='🔢';
export const description='经典2048数字游戏';
export const category='趣味工具';

let g,tl,bd,sc,best,oldG,_t,animId;
let running=true;
const B='2048-best';

function init(c){c.innerHTML=
`<div style="text-align:center">
 <div style="display:flex;gap:20px;justify-content:center;align-items:center;margin-bottom:12px">
  <div style="font-size:14px">得分:<b id="k9s">0</b></div>
  <div style="font-size:14px">最高:<b id="k9x">0</b></div>
  <button class="btn" id="k9r" style="padding:4px 12px">新游戏</button>
 </div>
 <div class="a3d" id="k9b" style="margin:0 auto">
  <div id="k9tl"></div>
 </div>
 <div style="color:var(--color-text-secondary);font-size:12px;margin-top:8px">方向键/WASD 移动</div>
</div>`;

tl=c.querySelector('#k9tl');bd=c.querySelector('#k9b');
best=Math.max(best,+((()=>{try{return localStorage.getItem(B)}catch{return null}})()||0));
c.querySelector('#k9x').textContent=best;
c.querySelector('#k9r').onclick=ng;

const st=document.createElement('style');st.textContent=
`.k9-tile{position:absolute;width:80px;height:80px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;border-radius:8px;transition:all .12s;color:#776e65;background:#eee4da}
.k9-tile.v2{background:#eee4da}.k9-tile.v4{background:#ede0c8}.k9-tile.v8{background:#f2b179;color:#f9f6f2}
.k9-tile.v16{background:#f59563;color:#f9f6f2}.k9-tile.v32{background:#f67c5f;color:#f9f6f2}.k9-tile.v64{background:#f65e3b;color:#f9f6f2}
.k9-tile.v128{background:#edcf72;color:#f9f6f2;font-size:24px}.k9-tile.v256{background:#edcc61;color:#f9f6f2;font-size:24px}
.k9-tile.v512{background:#edc850;color:#f9f6f2;font-size:24px}.k9-tile.v1024{background:#edc53f;color:#f9f6f2;font-size:20px}
.k9-tile.v2048{background:#edc22e;color:#f9f6f2;font-size:20px}.k9-tile.merged{animation:pop .2s}
@keyframes pop{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
.a3d{position:relative;width:360px;height:360px;background:rgba(187,173,160,.35);border-radius:10px;padding:8px;transition:transform .15s}
.t-l{transform:perspective(600px) rotateY(6deg)}.t-r{transform:perspective(600px) rotateY(-6deg)}
.t-u{transform:perspective(600px) rotateX(6deg)}.t-d{transform:perspective(600px) rotateX(-6deg)}`;
c.appendChild(st);

window.addEventListener('keydown', keyHandler);
ng();}

function keyHandler(e) {
    if (!running) return;
    const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
    if (m[e.key]) { e.preventDefault(); mv(m[e.key]); }
}

function ng() {g=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];sc=0;us();sn();sn();r(true);}

function sn(){const e=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(!g[r][c])e.push([r,c]);if(e.length){const[p,q]=e[Math.random()*e.length|0];g[p][q]=Math.random()<.9?2:4;}}

function mv(dir){_t.forEach(clearTimeout);_t=[];oldG=g.map(r=>[...r]);const merged=Array.from({length:4},()=>[false,false,false,false]);const d=dir==='left'?{r:0,c:1,dr:0,dc:-1,n:0,ir:0,ic:3}:
 dir==='right'?{r:0,c:-1,dr:0,dc:1,n:3,ir:0,ic:0}:dir==='up'?{r:1,c:0,dr:-1,dc:0,n:0,ir:3,ic:0}:
 {r:-1,c:0,dr:1,dc:0,n:3,ir:0,ic:0};
for(let o=0;o<4;o++){const r=d.ir+o*(d.dr||(dir==='up'?1:0));const c=d.ic+o*(d.dc||(dir==='left'?1:0));let nr=r,nc=c;for(let s=1;s<4;s++){const cr=r+d.r*s,cc=c+d.c*s;if(!g[cr]||g[cr][cc]===undefined)continue;if(g[cr][cc]){if(g[nr]&&g[nr][nc]===g[cr][cc]&&!merged[nr][nc]){g[nr][nc]*=2;sc+=g[nr][nc];merged[nr][nc]=true;g[cr][cc]=0;}else{nr+=d.dr||0;nc+=d.dc||0;if(nr!==cr||nc!==cc){g[nr][nc]=g[cr][cc];g[cr][cc]=0;}}}}}

if(JSON.stringify(g)===JSON.stringify(oldG))return;
const ts={left:'t-l',right:'t-r',up:'t-u',down:'t-d'};bd.className='a3d '+ts[dir];_t.push(setTimeout(()=>bd.className='a3d',400));
us();r(false);}

function r(first){
 const mg=new Set();
 if(oldG){const halfVals=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(oldG[r][c])halfVals.push(oldG[r][c]);
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){const v=g[r][c];if(!v||v<4)continue;if(halfVals.includes(v/2))mg.add(r+','+c);}}

 const matches=[];
 for(let r=0;r<4;r++)for(let c=0;c<4;c++){const v=g[r][c];const vv=oldG?oldG[r][c]:0;if(!v&&!vv)continue;const x=c*88+4,y=r*88+4;
  if(v&&!vv){matches.push({type:'spawn',x,y,v,r,c});}else if(v&&vv&&v!==vv&&mg.has(r+','+c)){
   matches.push({type:'merge',x,y,v,r,c,from:[findFrom(r,c,oldG,v)]});}else{matches.push({type:'slide',x,y,v,r,c,from:findFrom(r,c,oldG,v)});}}

 renderSlide(matches);
 if(first&&!matches.length)sn();
}

function findFrom(r,c,og,v){const src=[];for(let rr=0;rr<4;rr++)for(let cc=0;cc<4;cc++)if(og[rr][cc]===v)src.push({r:rr,c:cc,dist:Math.abs(rr-r)+Math.abs(cc-c)});
 return src.sort((a,b)=>a.dist-b.dist)[0]||{r,c};}

function renderSlide(matches){
 tl.innerHTML='';
 for(const m of matches){const d=document.createElement('div');d.className='k9-tile v'+m.v;
  if(m.type==='merge')d.classList.add('merged');
  if(m.from){const f=m.from;d.style.transform=`translate(${(f.c-m.c)*88}px,${(f.r-m.r)*88}px)`;d.style.opacity='0';
   requestAnimationFrame(()=>{requestAnimationFrame(()=>{d.style.transform='';d.style.opacity='1';});});}
  else if(m.type==='spawn'){d.style.transform='scale(0)';d.style.opacity='0';d.style.transitionDelay='.2s';
   requestAnimationFrame(()=>{requestAnimationFrame(()=>{d.style.transform='';d.style.opacity='1';});});}
  d.style.left=m.x+'px';d.style.top=m.y+'px';d.textContent=m.v;tl.appendChild(d);}
}

function us(){document.querySelector('#k9s').textContent=sc;if(sc>best){best=sc;try{localStorage.setItem(B,best)}catch{}}document.querySelector('#k9x').textContent=best;}

export function cleanup(){window.removeEventListener('keydown',keyHandler);running=false;}
export {init};