/* 2048 · 动画版
   游戏逻辑不动 · 滑动用DOM复用 · 合并/新块直接创建 */

export const id='game-2048';export const name='2048';export const icon='🧩';
export const description='经典2048，流畅动画';export const category='趣味工具';export const enabled=true;

const B='k3b',CG=6,CP=6,CW=94;
const C={2:['#eee4da','#776e65'],4:['#ede0c8','#776e65'],8:['#f2b179','#f9f6f2'],16:['#f59563','#f9f6f2'],32:['#f67c5f','#f9f6f2'],64:['#f65e3b','#f9f6f2'],128:['#edcf72','#f9f6f2'],256:['#edcc61','#f9f6f2'],512:['#edc850','#f9f6f2'],1024:['#edc53f','#f9f6f2'],2048:['#edc22e','#f9f6f2'],4096:['#3c3a32','#f9f6f2'],8192:['#3c3a32','#f9f6f2']};

function init(cn){
 let g,sc,best,ov,wn,ud,_t=[],oldG=null;
 cn.innerHTML=`<div class="a3">
  <div class="a3h"><div class="a3l">2048</div><div class="a3s"><div class="a3b"><span>分数</span><b id="a3v">0</b></div><div class="a3b"><span>最高</span><b id="a3x">0</b></div></div></div>
  <div class="a3c"><button class="btn btn-sm" id="a3n">🔄新游戏</button><button class="btn btn-sm" id="a3u" disabled>↩撤销</button></div>
  <div class="a3w"><div class="a3d" id="a3d">${'<div class="a3bg"></div>'.repeat(16)}<div class="a3tl" id="a3tl"></div></div></div>
  <div class="a3e" id="a3e" style="display:none"><div class="a3em" id="a3em"></div><button class="btn btn-primary" id="a3a">再来一局</button></div></div>`;
 const S=document.createElement('style');S.textContent=`
.a3{max-width:420px;margin:0 auto;display:flex;flex-direction:column;gap:10px}
.a3h{display:flex;justify-content:space-between;align-items:center}
.a3l{font-size:40px;font-weight:700;color:var(--color-accent);font-family:var(--font-display)}
.a3s{display:flex;gap:8px}
.a3b{padding:4px 16px;background:var(--color-accent-light);border-radius:8px;text-align:center;min-width:70px;transition:transform .15s}
.a3b span{display:block;font-size:10px;color:var(--color-text-muted)}
.a3b b{font-size:20px;color:var(--color-accent);font-weight:700;font-family:var(--font-family-mono)}
.a3c{display:flex;gap:8px;justify-content:center}
.a3w{perspective:800px}
.a3d{width:400px;height:400px;background:#bbada0;border-radius:10px;padding:6px;margin:0 auto;display:grid;grid-template:repeat(4,1fr)/repeat(4,1fr);gap:6px;position:relative;transition:transform .4s cubic-bezier(.22,1,.36,1)}
.a3d.t-l{transform:rotateY(-5deg)}.a3d.t-r{transform:rotateY(5deg)}.a3d.t-u{transform:rotateX(5deg)}.a3d.t-d{transform:rotateX(-5deg)}
.a3bg{background:rgba(238,228,218,.35);border-radius:6px}
.a3tl{position:absolute;inset:6px;pointer-events:none}
.a3t{position:absolute;width:94px;height:94px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-family:var(--font-display);transition:transform .12s ease}
.a3t.nw{animation:a3in .18s}@keyframes a3in{from{transform:scale(0);opacity:0}}
.a3t.mg{animation:a3mg .18s}@keyframes a3mg{50%{transform:scale(1.2)}}
.a3e{position:absolute;inset:0;background:rgba(238,228,218,.75);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:10}
.a3em{font-size:28px;font-weight:700;color:#776e65}
`;cn.appendChild(S);

 const tl=cn.querySelector('#a3tl'),sv=cn.querySelector('#a3v'),xv=cn.querySelector('#a3x');
 const sb=cn.querySelector('.a3b'),ub=cn.querySelector('#a3u'),bd=cn.querySelector('#a3d');
 const ee=cn.querySelector('#a3e'),em=cn.querySelector('#a3em');
 const px=(r,c)=>`translate(${c*(CW+CG)}px,${r*(CW+CG)}px)`;

 function ig(){
  g=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];sc=0;ov=wn=false;ud=null;oldG=null;
  ub.disabled=true;ee.style.display='none';bd.className='a3d';tl.innerHTML='';
  best=Math.max(best,+((()=>{try{return localStorage.getItem(B)}catch{return null}})()||0));sp();sp();us();r(true);
 }
 function sp(){const e=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(!g[r][c])e.push([r,c]);if(!e.length)return;const[r,c]=e[Math.random()*e.length|0];g[r][c]=Math.random()<.9?2:4;}
 function sn(){return{grid:g.map(r=>[...r]),score:sc};}
 function rs(s){g=s.grid.map(r=>[...r]);sc=s.score;ov=false;}

 function mv(dir){
  if(ov)return;ud=sn();ub.disabled=false;oldG=g.map(r=>[...r]);
  for(let i=0;i<4;i++){let a=[];if(dir==='left')a=g[i].filter(v=>v);if(dir==='right')a=g[i].filter(v=>v).reverse();if(dir==='up')a=[g[0][i],g[1][i],g[2][i],g[3][i]].filter(v=>v);if(dir==='down')a=[g[0][i],g[1][i],g[2][i],g[3][i]].filter(v=>v).reverse();for(let j=0;j<a.length-1;j++)if(a[j]&&a[j]===a[j+1]){a[j]*=2;sc+=a[j];a[j+1]=0;}a=a.filter(v=>v);while(a.length<4)a.push(0);if(dir==='right')a.reverse();if(dir==='down'){a.reverse();for(let r=0;r<4;r++)g[r][i]=a[r];continue;}if(dir==='up'){for(let r=0;r<4;r++)g[r][i]=a[r];continue;}g[i]=a;}
  if(JSON.stringify(g)===JSON.stringify(oldG))return;
  const ts={left:'t-l',right:'t-r',up:'t-u',down:'t-d'};bd.className='a3d '+ts[dir];_t.push(setTimeout(()=>bd.className='a3d',400));
  sp();us();r(false);ck();
 }

 function r(first){
  // 找合并：新值>=4 且旧grid中存在该值的半数
  const mg=new Set();
  if(oldG){
   const halfVals=[];
   for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(oldG[r][c])halfVals.push(oldG[r][c]);
   for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    const v=g[r][c];if(!v||v<4)continue;
    // 旧grid中是否有 v/2 的tile? 
    if(halfVals.includes(v/2))mg.add(r+','+c);
   }
<<<<<<< Updated upstream
=======
  },150);

  check();
 }

 function renderSlide(matches){
  tl.innerHTML='';
  for(const m of matches){
   const d=document.createElement('div');d.className='k9-tile';
   if(m.type==='merge')d.classList.add('merged');
   if(m.type==='new')d.classList.add('spawn');
   d.textContent=m.val;
   const[bg,tx]=C[m.val]||['#3c3a32','#f9f6f2'];
   d.style.background=bg;d.style.color=tx;
   d.style.fontSize=m.val<100?'28px':m.val<1000?'22px':'16px';
   d.style.transform=px(m.oldR,m.oldC);
   tl.appendChild(d);
>>>>>>> Stashed changes
  }

  // 收集旧DOM → 收集新需求
  const oldEls=[];
  tl.querySelectorAll('.a3t').forEach(e=>oldEls.push({el:e,r:+e.dataset.r,c:+e.dataset.c,v:+e.dataset.v}));
  const used=new Set(); // 标记已复用的旧DOM索引

  // 先处理新grid中每个位置
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){
   const v=g[r][c];if(!v)continue;
   const isMerged=mg.has(r+','+c);

   // 尝试复用：找oldEls中同值、同向的tile
   let found=-1;
   for(let i=0;i<oldEls.length;i++){
    if(used.has(i))continue;
    const o=oldEls[i];
    if(isMerged){
     // 合并：旧值*2===新值，且位置可能在附近
     if(o.v*2===v) {found=i;break;}
    }else{
     // 滑动：值相同
     if(o.v===v) {found=i;break;}
    }
   }

   if(found>=0){
    const o=oldEls[found];used.add(found);
    const el=o.el;
    const[bg,tx]=C[v]||['#3c3a32','#f9f6f2'];el.style.background=bg;el.style.color=tx;
    el.textContent=v;el.style.fontSize=v<100?'28px':v<1000?'22px':'16px';
    el.dataset.r=r;el.dataset.c=c;el.dataset.v=v;
    el.classList.remove('nw','mg');
    if(isMerged){el.classList.add('mg');setTimeout(()=>el.classList.remove('mg'),200);}
    el.style.transform=px(r,c);
   }else{
    const el=document.createElement('div');el.className='a3t nw';
    el.dataset.r=r;el.dataset.c=c;el.dataset.v=v;
    const[bg,tx]=C[v]||['#3c3a32','#f9f6f2'];el.style.background=bg;el.style.color=tx;
    el.textContent=v;el.style.fontSize=v<100?'28px':v<1000?'22px':'16px';
    el.style.transform=px(r,c);tl.appendChild(el);
   }
  }
  // 移除未复用的旧DOM
  for(let i=0;i<oldEls.length;i++){if(!used.has(i))oldEls[i].el.remove();}
 }

 function us(){sv.textContent=sc;if(sc>best){best=sc;try{localStorage.setItem(B,best)}catch{}}xv.textContent=best;sb.style.transform='scale(1.15)';_t.push(setTimeout(()=>sb.style.transform='',150));}
 function ck(){
  if(!wn){for(let r=0;r<4;r++)for(let c=0;c<4;c++)if(g[r][c]>=2048){wn=true;em.textContent='🎉你赢了！';ee.style.display='';return;}}
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){if(!g[r][c])return;if(r<3&&g[r][c]===g[r+1][c])return;if(c<3&&g[r][c]===g[r][c+1])return;}
  ov=true;em.textContent='😞游戏结束';ee.style.display='';
 }
 function ok(e){const m={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};const d=m[e.code];if(d){e.preventDefault();mv(d);}}
 document.addEventListener('keydown',ok);
 cn.querySelector('#a3n').addEventListener('click',ig);
 cn.querySelector('#a3a').addEventListener('click',ig);
 cn.querySelector('#a3u').addEventListener('click',()=>{if(ud){rs(ud);ud=null;ub.disabled=true;us();r(true);}});
 ig();
 return{cleanup(){document.removeEventListener('keydown',ok);_t.forEach(clearTimeout);}};
}
export{init};
