export const id = 'game-2048';
export const name = '2048';
export const icon = '🔢';
export const description = '经典2048数字游戏，方向键/WASD移动，滑动合成';
export const category = '趣味工具';
export const enabled = true;

export function init(container) {
    const SIZE = 4, GAP = 8, CELL = 80;
    const TOTAL = CELL + GAP;
    const W = TOTAL * SIZE + GAP;

    let grid, score, best, cells, running = true, _t = [];

    try { best = +localStorage.getItem('2048-best') || 0; } catch(e) {}

    container.innerHTML = `
        <div style="text-align:center;font-family:system-ui,sans-serif">
            <div style="display:flex;gap:16px;justify-content:center;align-items:center;margin-bottom:10px">
                <span style="font-size:14px;color:var(--color-text-secondary)">得分 <b id="s2048" style="color:var(--color-text)">0</b></span>
                <span style="font-size:14px;color:var(--color-text-secondary)">最高 <b id="x2048" style="color:var(--color-text)">${best}</b></span>
                <button class="btn btn-sm" id="r2048">新游戏</button>
            </div>
            <div id="g2048" style="position:relative;width:${W}px;height:${W}px;margin:0 auto;background:rgba(187,173,160,.35);border-radius:10px;padding:${GAP}px;transition:transform .15s">
                <div id="c2048" style="position:relative;width:100%;height:100%"></div>
            </div>
        </div>`;

    const S = document.createElement('style'); S.textContent = `
        .k-cell{position:absolute;width:${CELL}px;height:${CELL}px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;border-radius:8px;transition:transform .12s,opacity .12s}
        .k-cell.merged{animation:k-pop .25s cubic-bezier(.34,1.56,.64,1)}
        @keyframes k-pop{0%{transform:scale(0)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
        .k2{background:#eee4da;color:#776e65}.k4{background:#ede0c8;color:#776e65}
        .k8{background:#f2b179;color:#fff}.k16{background:#f59563;color:#fff}
        .k32{background:#f67c5f;color:#fff}.k64{background:#f65e3b;color:#fff}
        .k128{background:#edcf72;color:#fff;font-size:24px}.k256{background:#edcc61;color:#fff;font-size:24px}
        .k512{background:#edc850;color:#fff;font-size:24px}.k1024{background:#edc53f;color:#fff;font-size:20px}
        .k2048{background:#edc22e;color:#fff;font-size:20px}.k4096{background:#3c3a32;color:#fff;font-size:18px}
        .t-l{transform:perspective(500px) rotateY(5deg)}.t-r{transform:perspective(500px) rotateY(-5deg)}
        .t-u{transform:perspective(500px) rotateX(5deg)}.t-d{transform:perspective(500px) rotateX(-5deg)}`;
    container.appendChild(S);

    const gEl = container.querySelector('#g2048');
    const cEl = container.querySelector('#c2048');
    cells = [];

    // 创建所有tile（复用）
    function ensureCells(n) {
        while (cells.length < n) {
            const d = document.createElement('div'); d.className = 'k-cell';
            d.style.opacity = '0'; d.style.transform = 'scale(0)';
            cEl.appendChild(d); cells.push(d);
        }
    }
    ensureCells(16); // 最多16个

    function showCell(idx, val, fromRC) {
        const d = cells[idx]; if (!d || !val) return;
        const r = fromRC ? fromRC.r : Math.floor(idx/4);
        const c = fromRC ? fromRC.c : idx%4;
        const nx = c * TOTAL + GAP/2, ny = r * TOTAL + GAP/2;
        const ox = fromRC ? (fromRC.oc - c) * TOTAL : 0;
        const oy = fromRC ? (fromRC.or - r) * TOTAL : 0;

        d.className = 'k-cell k' + val + (fromRC && val !== fromRC.oval ? ' merged' : '');
        d.textContent = val;
        d.style.left = nx + 'px'; d.style.top = ny + 'px';
        d.style.opacity = '1';
        if (ox || oy) {
            d.style.transform = 'translate(' + ox + 'px,' + oy + 'px)';
            d.style.transition = 'none';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    d.style.transition = 'transform .12s';
                    d.style.transform = 'translate(0,0)';
                });
            });
        } else {
            d.style.transform = 'scale(0)';
            d.style.transition = 'none';
            setTimeout(() => { d.style.transition = 'transform .25s cubic-bezier(.34,1.56,.64,1)'; d.style.transform = 'scale(1)'; }, 100);
        }
    }

    function render(g) {
        const flats = [];
        for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (g[r][c]) flats.push({r,c,v:g[r][c]});
        ensureCells(flats.length);
        for (let i = 0; i < Math.max(flats.length, cells.length); i++) {
            if (i < flats.length) showCell(i, flats[i].v, null);
            else { cells[i].style.opacity = '0'; cells[i].style.transform = 'scale(0)'; }
        }
    }

    // 带来源动画
    function renderAnim(g, oldG, merges) {
        const flats = [];
        for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (g[r][c]) {
            const oval = oldG ? oldG[r][c] : 0;
            const isMerge = merges && merges.has(r+','+c);
            flats.push({r,c,v:g[r][c], oval: oval||g[r][c], or:r, oc:c});
        }
        // 找来源位置
        if (oldG) {
            for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (oldG[r][c]) {
                const v = oldG[r][c];
                let found = false;
                for (const f of flats) { if (f.v === v && !found) { f.or = r; f.oc = c; found = true; } }
            }
        }
        ensureCells(flats.length);
        for (let i = 0; i < Math.max(flats.length, cells.length); i++) {
            if (i < flats.length) showCell(i, flats[i].v, {r:flats[i].r, c:flats[i].c, or:flats[i].or, oc:flats[i].oc, oval:flats[i].oval});
            else { cells[i].style.opacity = '0'; cells[i].style.transform = 'scale(0)'; }
        }
    }

    function us() {
        const s = container.querySelector('#s2048'), x = container.querySelector('#x2048');
        if (s) s.textContent = score; if (score>best){best=score;try{localStorage.setItem('2048-best',best)}catch(e){}} if (x) x.textContent = best;
    }

    function sn() {
        const e = []; for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (!grid[r][c]) e.push([r,c]);
        if (e.length) { const [r,c] = e[Math.random()*e.length|0]; grid[r][c] = Math.random()<.9?2:4; }
    }

    function ng() { grid = Array.from({length:SIZE},()=>Array(SIZE).fill(0)); score=0;us();sn();sn();render(grid); }

    function kh(e) {
        if (!running) return;
        const m = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
        if (m[e.key]) { e.preventDefault(); mv(m[e.key]); }
    }

    function mv(dir) {
        _t.forEach(clearTimeout); _t = [];
        const oldG = grid.map(r => [...r]);
        const merged = Array.from({length:SIZE},()=>Array(SIZE).fill(false));
        const dx = {left:0,right:0,up:-1,down:1}, dy = {left:-1,right:1,up:0,down:0};
        const ds = dx[dir], dt = dy[dir];

        for (let o=0;o<SIZE;o++) {
            const r = ds ? (ds>0?0:SIZE-1) : o, c = dt ? (dt>0?0:SIZE-1) : o;
            let nr = r, nc = c;
            for (let s=1;s<SIZE;s++) {
                const cr = r+ds*s, cc = c+dt*s;
                if (cr<0||cr>=SIZE||cc<0||cc>=SIZE) continue;
                if (!grid[cr][cc]) continue;
                const cv = grid[cr][cc], tv = grid[nr][nc];
                if (tv === cv && !merged[nr][nc]) { grid[nr][nc]=cv*2; score+=cv*2; merged[nr][nc]=true; grid[cr][cc]=0; }
                else { nr+=ds||0; nc+=dt||0; if (nr!==cr || nc!==cc) { grid[nr][nc]=cv; grid[cr][cc]=0; } }
            }
        }
        if (JSON.stringify(grid) === JSON.stringify(oldG)) return;

        const ms = new Set();
        for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (merged[r][c]) ms.add(r+','+c);
        renderAnim(grid, oldG, ms);

        const ts = {left:'t-l',right:'t-r',up:'t-u',down:'t-d'};
        gEl.className = gEl.className.split(' ')[0] + ' ' + ts[dir];
        _t.push(setTimeout(() => gEl.className = gEl.className.split(' ')[0], 300));
        us();
        setTimeout(() => sn() && render(grid), 200);
    }

    document.addEventListener('keydown', kh);
    container.querySelector('#r2048').onclick = ng;
    ng();

    return { cleanup() { document.removeEventListener('keydown', kh); running = false; } };
}
