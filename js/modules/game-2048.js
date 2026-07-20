export const id = 'game-2048';
export const name = '2048';
export const icon = '🔢';
export const description = '经典2048数字游戏，方向键/WASD移动';
export const category = '趣味工具';
export const enabled = true;

export function init(container) {
    const G = 16, C = 107, W = 4*C+G;
    let grid, score, best, running = true, _t = [];
    let tilePool = [];

    try { best = +localStorage.getItem('2048-best') || 0; } catch (e) {}

    container.innerHTML = `
        <div style="text-align:center;user-select:none;-webkit-user-select:none">
            <div style="display:flex;gap:20px;justify-content:center;margin-bottom:14px">
                <div style="text-align:center"><div style="font-size:11px;color:#999">得分</div><div id="s" style="font-size:22px;font-weight:700;color:#fff">0</div></div>
                <div style="text-align:center"><div style="font-size:11px;color:#999">最高</div><div id="x" style="font-size:22px;font-weight:700;color:#fff">${best}</div></div>
                <button class="btn btn-sm" id="r" style="align-self:center">新游戏</button>
            </div>
            <div id="o" style="position:relative;width:${W}px;height:${W}px;margin:0 auto;background:rgba(187,173,160,.35);border-radius:12px;padding:${G}px;transition:transform .15s;transform-origin:center center">
                <div id="p" style="position:relative;width:100%;height:100%"></div>
            </div>
            <div style="color:#666;font-size:11px;margin-top:8px">↑↓←→ / WASD</div>
        </div>`;

    const O = container.querySelector('#o'), P = container.querySelector('#p');
    const S = container.querySelector('#s'), X = container.querySelector('#x');

    const cs = document.createElement('style'); cs.textContent = `
        .t{position:absolute;display:flex;align-items:center;justify-content:center;font-weight:700;border-radius:6px;
           transition:transform .15s cubic-bezier(.2,.8,.3,1),opacity .15s;will-change:transform,opacity}
        .t.c2{background:#eee4da;color:#776e65}.t.c4{background:#ede0c8;color:#776e65}
        .t.c8{background:#f2b179;color:#f9f6f2}.t.c16{background:#f59563;color:#f9f6f2}
        .t.c32{background:#f67c5f;color:#f9f6f2}.t.c64{background:#f65e3b;color:#f9f6f2}
        .t.c128{background:#edcf72;color:#f9f6f2;font-size:45px;box-shadow:0 0 30px rgba(237,207,114,.4)}
        .t.c256{background:#edcc61;color:#f9f6f2;font-size:45px;box-shadow:0 0 30px rgba(237,204,97,.4)}
        .t.c512{background:#edc850;color:#f9f6f2;font-size:45px;box-shadow:0 0 30px rgba(237,200,80,.5)}
        .t.c1024{background:#edc53f;color:#f9f6f2;font-size:36px;box-shadow:0 0 40px rgba(237,197,63,.5)}
        .t.c2048{background:#edc22e;color:#f9f6f2;font-size:36px;box-shadow:0 0 40px rgba(237,194,46,.6)}
        .t.c4096{background:#3c3a32;color:#f9f6f2;font-size:30px;box-shadow:0 0 50px rgba(0,0,0,.5)}
        .t.c8192{background:#1a1a1a;color:#f9f6f2;font-size:26px;box-shadow:0 0 50px rgba(0,0,0,.7)}
        .p{animation:m .25s cubic-bezier(.34,1.56,.64,1)}@keyframes m{0%{transform:scale(0)}50%{transform:scale(1.15)}100%{transform:scale(1)}}
        .n{animation:pn .3s cubic-bezier(.34,1.56,.64,1)}@keyframes pn{0%{transform:scale(0);opacity:0}50%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}
        .tl{transform:perspective(800px) rotateY(4deg)}.tr{transform:perspective(800px) rotateY(-4deg)}
        .tu{transform:perspective(800px) rotateX(4deg)}.td{transform:perspective(800px) rotateX(-4deg)}`;
    container.appendChild(cs);

    function tileSize(v) { return v>=1000?36:v>=100?30:40; }

    function ensurePool(n) {
        while (tilePool.length < n) {
            const d = document.createElement('div'); d.className = 't'; d.style.display = 'none';
            P.appendChild(d); tilePool.push({ el: d, use: false });
        }
    }

    function render(anim) {
        const flats = []; for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (grid[r][c]) flats.push({r,c,v:grid[r][c]});
        ensurePool(16);

        // 释放全部
        for (let t of tilePool) { t.use = false; t.el.style.display = 'none'; t.el.className = 't'; t.el.style.transform = ''; t.el.style.opacity = ''; t.el.style.fontSize = ''; }
        P.querySelectorAll('.t').forEach(d => { d.style.display = 'none'; });

        let pi = 0;
        for (let f of flats) {
            while (pi < tilePool.length && tilePool[pi].use) pi++;
            if (pi >= tilePool.length) ensurePool(pi+1);
            const t = tilePool[pi]; t.use = true; const d = t.el;
            d.style.display = 'flex'; d.className = 't c'+f.v; d.textContent = f.v;
            d.style.fontSize = tileSize(f.v) + 'px';
            d.style.left = (f.c*(C+G)+G) + 'px';
            d.style.top = (f.r*(C+G)+G) + 'px';
            d.style.width = d.style.height = C+'px';

            if (anim) {
                const a = anim.get(f.r+','+f.c);
                if (a) {
                    if (a.type === 'merge') { d.className += ' p'; d.style.zIndex = '10'; }
                    else if (a.type === 'slide') {
                        d.style.transition = 'none';
                        d.style.transform = 'translate('+a.dx+'px,'+a.dy+'px)';
                        d.offsetHeight;
                        d.style.transition = 'transform .15s cubic-bezier(.2,.8,.3,1)';
                        d.style.transform = '';
                    }
                } else { d.className += ' n'; }
            } else { /* initial render: just show */ }
            pi++;
        }
    }

    function us() { S.textContent = score; if (score>best) { best=score; try { localStorage.setItem('2048-best',best); } catch(e){} } X.textContent = best; }

    function sn() { const e=[]; for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (!grid[r][c]) e.push([r,c]); if (e.length) { const [r,c]=e[Math.random()*e.length|0]; grid[r][c]=Math.random()<.9?2:4; } }

    function ng() { grid = Array.from({length:4},()=>Array(4).fill(0)); score=0; us(); sn(); sn(); render(null); }

    function kh(e) { if (!running) return; const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'}; if (m[e.key]) { e.preventDefault(); mv(m[e.key]); } }

    function mv(dir) {
        _t.forEach(clearTimeout); _t=[];
        const od = grid.map(r=>[...r]);
        const anim = new Map();
        const merged = Array.from({length:4},()=>Array(4).fill(false));
        const dx = {left:0,right:0,up:-1,down:1}, dy = {left:-1,right:1,up:0,down:0};
        const ds=dx[dir], dt=dy[dir];

        for (let o=0;o<4;o++) {
            const r=ds?(ds>0?0:3):o, c=dt?(dt>0?0:3):o;
            let nr=r, nc=c, moved=false;
            for (let s=1;s<4;s++) {
                const cr=r+ds*s, cc=c+dt*s;
                if (cr<0||cr>3||cc<0||cc>3) continue;
                if (!grid[cr][cc]) continue;
                const cv=grid[cr][cc], tv=grid[nr][nc];
                if (tv===cv && !merged[nr][nc]) {
                    grid[nr][nc]=cv*2; score+=cv*2; merged[nr][nc]=true; grid[cr][cc]=0;
                    anim.set(nr+','+nc, {type:'merge',v:cv*2});
                    if (nr!==cr||nc!==cc) {
                        const oldRC = findOldRC(cv, od, cr, cc);
                        anim.set(nr+','+nc, {type:'merge',v:cv*2,dx:(oldRC.c-nr)*(C+G),dy:(oldRC.r-nr)*(C+G),fromRC:oldRC});
                    }
                } else {
                    const onr=nr, onc=nc;
                    nr+=ds||0; nc+=dt||0;
                    if (nr!==cr||nc!==cc) { grid[nr][nc]=cv; grid[cr][cc]=0; moved=true; }
                    else if (onr===cr&&onc===cc) { nr=onr; nc=onc; }
                }
            }
        }

        if (JSON.stringify(grid)===JSON.stringify(od)) return;

        for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
            if (grid[r][c] && !anim.has(r+','+c)) {
                const ov = od[r][c];
                if (ov === grid[r][c]) continue;
                const src = findOldRC(grid[r][c], od, r, c);
                if (src && (src.r!==r||src.c!==c))
                    anim.set(r+','+c, {type:'slide',dx:(src.c-c)*(C+G),dy:(src.r-r)*(C+G)});
                else anim.set(r+','+c, {type:'slide',dx:0,dy:0});
            }
        }

        if (anim.size === 0) return;

        render(anim);

        const ts={left:'tl',right:'tr',up:'tu',down:'td'};
        O.classList.add(ts[dir]);
        _t.push(setTimeout(()=>O.classList.remove(ts[dir]),300));
        us();
        setTimeout(()=>{sn();render(null);},200);
    }

    function findOldRC(v, od, nr, nc) {
        const cands = [];
        for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (od[r][c]===v) cands.push({r,c,dist:Math.abs(r-nr)+Math.abs(c-nc)});
        cands.sort((a,b)=>a.dist-b.dist);
        return cands[0] || null;
    }

    document.addEventListener('keydown', kh);
    container.querySelector('#r').onclick = ng;
    ng();

    return { cleanup() { document.removeEventListener('keydown', kh); running = false; } };
}
