export const id = 'game-2048';
export const name = '2048';
export const icon = '🔢';
export const description = '经典2048数字游戏，方向键/WASD移动';
export const category = '趣味工具';

export function init(container) {
    let grid, score, best, oldGrid, _t, running = true;

    best = 0;
    try { best = +(localStorage.getItem('2048-best') || 0); } catch(e) {}

    container.innerHTML = `
        <div style="text-align:center">
            <div style="display:flex;gap:20px;justify-content:center;align-items:center;margin-bottom:12px">
                <div>得分:<b id="s9">0</b></div>
                <div>最高:<b id="x9">${best}</b></div>
                <button class="btn" id="r9">新游戏</button>
            </div>
            <div style="position:relative;width:360px;height:360px;margin:0 auto;background:rgba(187,173,160,.35);border-radius:10px;padding:8px;transition:transform .15s" id="b9">
                <div id="t9"></div>
            </div>
            <div style="color:#999;font-size:12px;margin-top:8px">方向键/WASD 移动</div>
        </div>`;

    const S = document.createElement('style');
    S.textContent = '.t9{position:absolute;width:80px;height:80px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;border-radius:8px;transition:all .12s;color:#776e65;background:#eee4da}.v2{background:#eee4da}.v4{background:#ede0c8}.v8{background:#f2b179;color:#f9f6f2}.v16{background:#f59563;color:#f9f6f2}.v32{background:#f67c5f;color:#f9f6f2}.v64{background:#f65e3b;color:#f9f6f2}.v128{background:#edcf72;color:#f9f6f2;font-size:24px}.v256{background:#edcc61;color:#f9f6f2;font-size:24px}.v512{background:#edc850;color:#f9f6f2;font-size:24px}.v1024{background:#edc53f;color:#f9f6f2;font-size:20px}.v2048{background:#edc22e;color:#f9f6f2;font-size:20px}@keyframes p9{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}.m9{animation:p9 .2s}.tl{transform:perspective(600px) rotateY(6deg)}.tr{transform:perspective(600px) rotateY(-6deg)}.tu{transform:perspective(600px) rotateX(6deg)}.td{transform:perspective(600px) rotateX(-6deg)}';
    container.appendChild(S);

    const tl = container.querySelector('#t9');
    const bd = container.querySelector('#b9');
    const sc = () => {
        const s = container.querySelector('#s9'), x = container.querySelector('#x9');
        if (s) s.textContent = score;
        if (score > best) { best = score; try { localStorage.setItem('2048-best', best); } catch(e) {} }
        if (x) x.textContent = best;
    };

    function ng() {
        grid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        score = 0; sc(); sn(); sn(); r(true);
    }

    function sn() {
        const e = [];
        for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (!grid[r][c]) e.push([r,c]);
        if (e.length) { const [p,q] = e[Math.random()*e.length|0]; grid[p][q] = Math.random()<.9?2:4; }
    }

    function kh(e) {
        if (!running) return;
        const m = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
        if (m[e.key]) { e.preventDefault(); mv(m[e.key]); }
    }

    function mv(dir) {
        if (_t) _t.forEach(clearTimeout); _t = [];
        oldGrid = grid.map(r => [...r]);
        const merged = [[false,false,false,false],[false,false,false,false],[false,false,false,false],[false,false,false,false]];
        const dx = {left:0,right:0,up:-1,down:1}, dy = {left:-1,right:1,up:0,down:0};
        const ds = dx[dir], dt = dy[dir];
        for (let o=0;o<4;o++) {
            const r = ds ? (ds>0?0:3) : o, c = dt ? (dt>0?0:3) : o;
            let nr = r, nc = c;
            for (let s=1;s<4;s++) {
                const cr = r+ds*s, cc = c+dt*s;
                if (cr<0||cr>3||cc<0||cc>3) continue;
                if (!grid[cr][cc]) continue;
                const cv = grid[cr][cc], tv = grid[nr][nc];
                if (tv === cv && !merged[nr][nc]) {
                    grid[nr][nc] = cv*2; score += cv*2; merged[nr][nc] = true; grid[cr][cc] = 0;
                } else {
                    nr += ds||0; nc += dt||0;
                    if (nr!==cr || nc!==cc) { grid[nr][nc] = cv; grid[cr][cc] = 0; }
                }
            }
        }
        if (JSON.stringify(grid) === JSON.stringify(oldGrid)) return;
        const ts = {left:'tl',right:'tr',up:'tu',down:'td'};
        bd.className = bd.className.split(' ')[0] + ' ' + ts[dir];
        _t.push(setTimeout(() => bd.className = bd.className.split(' ')[0], 400));
        sc(); r(false);
    }

    function r(first) {
        const mg = new Set();
        if (oldGrid) {
            const hv = [];
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (oldGrid[r][c]) hv.push(oldGrid[r][c]);
            for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
                const v = grid[r][c]; if (!v||v<4) continue;
                if (hv.includes(v/2)) mg.add(r+','+c);
            }
        }
        const ms = [];
        for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
            const v = grid[r][c], vv = oldGrid ? oldGrid[r][c] : 0;
            if (!v && !vv) continue;
            const x = c*88+4, y = r*88+4;
            if (v && !vv) ms.push({type:'spawn',x,y,v});
            else if (v && vv && v!==vv && mg.has(r+','+c)) ms.push({type:'merge',x,y,v});
            else ms.push({type:'slide',x,y,v});
        }
        rs(ms);
        if (first) sn();
    }

    function rs(ms) {
        tl.innerHTML = '';
        for (const m of ms) {
            const d = document.createElement('div');
            d.className = 't9 v'+m.v + (m.type==='merge'?' m9':'');
            if (m.type==='spawn') { d.style.transform = 'scale(0)'; d.style.opacity = '0'; d.style.transitionDelay = '.2s';
                requestAnimationFrame(() => { requestAnimationFrame(() => { d.style.transform=''; d.style.opacity='1'; }); });
            }
            d.style.left = m.x+'px'; d.style.top = m.y+'px'; d.textContent = m.v; tl.appendChild(d);
        }
    }

    document.addEventListener('keydown', kh);
    container.querySelector('#r9').onclick = ng;
    ng();

    return {
        cleanup() {
            document.removeEventListener('keydown', kh);
            running = false;
        }
    };
}
