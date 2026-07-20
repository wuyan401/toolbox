export const id = 'game-2048';
export const name = '2048';
export const icon = '🔢';
export const description = '经典2048数字游戏，方向键/WASD移动';
export const category = '趣味工具';

let g, tl, bd, sc, best, oldG, _t, running;

export function init(c) {
    running = true;
    _t = [];
    best = Math.max(best, +((() => {
        try { return localStorage.getItem('2048-best'); } catch (e) { return 0; }
    })() || 0));

    c.innerHTML = `
        <div style="text-align:center">
            <div style="display:flex;gap:20px;justify-content:center;align-items:center;margin-bottom:12px">
                <div style="font-size:14px">得分:<b id="s2048">0</b></div>
                <div style="font-size:14px">最高:<b id="x2048">${best}</b></div>
                <button class="btn" id="r2048">新游戏</button>
            </div>
            <div class="bd2048" id="bd2048">
                <div id="tl2048"></div>
            </div>
            <div style="color:#999;font-size:12px;margin-top:8px">方向键/WASD 移动</div>
        </div>`;

    const S = document.createElement('style');
    S.textContent = `
        .bd2048{position:relative;width:360px;height:360px;margin:0 auto;background:rgba(187,173,160,.35);border-radius:10px;padding:8px;transition:transform .15s}
        .tile2048{position:absolute;width:80px;height:80px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;border-radius:8px;transition:all .12s;color:#776e65;background:#eee4da}
        .v2{background:#eee4da}.v4{background:#ede0c8}.v8{background:#f2b179;color:#f9f6f2}
        .v16{background:#f59563;color:#f9f6f2}.v32{background:#f67c5f;color:#f9f6f2}.v64{background:#f65e3b;color:#f9f6f2}
        .v128{background:#edcf72;color:#f9f6f2;font-size:24px}.v256{background:#edcc61;color:#f9f6f2;font-size:24px}
        .v512{background:#edc850;color:#f9f6f2;font-size:24px}.v1024{background:#edc53f;color:#f9f6f2;font-size:20px}
        .v2048{background:#edc22e;color:#f9f6f2;font-size:20px}@keyframes pop{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
        .merged{animation:pop .2s}.t-l{transform:perspective(600px) rotateY(6deg)}.t-r{transform:perspective(600px) rotateY(-6deg)}
        .t-u{transform:perspective(600px) rotateX(6deg)}.t-d{transform:perspective(600px) rotateX(-6deg)}`;
    c.appendChild(S);

    tl = c.querySelector('#tl2048');
    bd = c.querySelector('#bd2048');
    c.querySelector('#x2048').textContent = best;
    c.querySelector('#r2048').onclick = ng;
    document.addEventListener('keydown', kh);
    ng();
}

function ng() {
    g = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    sc = 0; us(); sn(); sn(); r(true);
}
function sn() {
    const e = [];
    for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (!g[r][c]) e.push([r,c]);
    if (e.length) { const [p,q] = e[Math.random()*e.length|0]; g[p][q] = Math.random()<.9?2:4; }
}
function kh(e) {
    if (!running) return;
    const m = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
    if (m[e.key]) { e.preventDefault(); mv(m[e.key]); }
}
function mv(dir) {
    _t.forEach(clearTimeout); _t = [];
    oldG = g.map(r => [...r]);
    const merged = [[false,false,false,false],[false,false,false,false],[false,false,false,false],[false,false,false,false]];
    const dx = {left:0,right:0,up:-1,down:1}, dy = {left:-1,right:1,up:0,down:0};
    const ds = dx[dir], dt = dy[dir];
    for (let o=0;o<4;o++) {
        const r = ds ? (ds>0?0:3) : o, c = dt ? (dt>0?0:3) : o;
        let nr = r, nc = c;
        for (let s=1;s<4;s++) {
            const cr = r+ds*s, cc = c+dt*s;
            if (cr<0||cr>3||cc<0||cc>3) continue;
            if (!g[cr][cc]) continue;
            if (g[nr][nc] === g[cr][cc] && !merged[nr][nc]) {
                g[nr][nc] *= 2; sc += g[nr][nc]; merged[nr][nc] = true; g[cr][cc] = 0;
            } else {
                nr += ds||0; nc += dt||0;
                if (nr!==cr || nc!==cc) { g[nr][nc] = g[cr][cc]; g[cr][cc] = 0; }
            }
        }
    }
    if (JSON.stringify(g) === JSON.stringify(oldG)) return;
    const ts = {left:'t-l',right:'t-r',up:'t-u',down:'t-d'};
    bd.className = 'bd2048 '+ts[dir];
    _t.push(setTimeout(() => bd.className = 'bd2048', 400));
    us(); r(false);
}
function r(first) {
    const mg = new Set();
    if (oldG) {
        const hv = [];
        for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (oldG[r][c]) hv.push(oldG[r][c]);
        for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
            const v = g[r][c]; if (!v||v<4) continue;
            if (hv.includes(v/2)) mg.add(r+','+c);
        }
    }
    const ms = [];
    for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
        const v = g[r][c], vv = oldG ? oldG[r][c] : 0;
        if (!v && !vv) continue;
        const x = c*88+4, y = r*88+4;
        if (v && !vv) {
            ms.push({type:'spawn',x,y,v,r,c});
        } else if (v && vv && v!==vv && mg.has(r+','+c)) {
            ms.push({type:'merge',x,y,v,r,c,from:[ff(r,c,oldG,v)]});
        } else {
            ms.push({type:'slide',x,y,v,r,c,from:ff(r,c,oldG,v)});
        }
    }
    rs(ms);
    if (first) sn();
}
function ff(r,c,og,v) {
    const s = [];
    for (let rr=0;rr<4;rr++) for (let cc=0;cc<4;cc++)
        if (og[rr][cc] === v) s.push({r:rr,c:cc,dist:Math.abs(rr-r)+Math.abs(cc-c)});
    return s.sort((a,b) => a.dist-b.dist)[0] || {r,c};
}
function rs(ms) {
    tl.innerHTML = '';
    for (const m of ms) {
        const d = document.createElement('div');
        d.className = 'tile2048 v'+m.v + (m.type==='merge'?' merged':'');
        if (m.from) {
            const f = m.from;
            d.style.transform = `translate(${(f.c-m.c)*88}px,${(f.r-m.r)*88}px)`;
            d.style.opacity = '0';
            requestAnimationFrame(() => { requestAnimationFrame(() => { d.style.transform=''; d.style.opacity='1'; }); });
        } else if (m.type==='spawn') {
            d.style.transform = 'scale(0)'; d.style.opacity = '0'; d.style.transitionDelay = '.2s';
            requestAnimationFrame(() => { requestAnimationFrame(() => { d.style.transform=''; d.style.opacity='1'; }); });
        }
        d.style.left = m.x+'px'; d.style.top = m.y+'px'; d.textContent = m.v; tl.appendChild(d);
    }
}
function us() {
    const s = document.getElementById('s2048'), x = document.getElementById('x2048');
    if (s) s.textContent = sc;
    if (sc > best) { best = sc; try { localStorage.setItem('2048-best', best); } catch(e) {} }
    if (x) x.textContent = best;
}

export function cleanup() {
    document.removeEventListener('keydown', kh);
    running = false;
}
