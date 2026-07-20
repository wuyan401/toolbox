export const id = 'game-2048';
export const name = '2048';
export const icon = '🔢';
export const description = '经典2048数字游戏，方向键/WASD移动';
export const category = '趣味工具';
export const enabled = true;

export function init(container) {
    const G = 15, C = 80, W = 4*C + 5*G;
    let grid, score, best, running = true, _t = [], tilePool = [];

    try { best = +localStorage.getItem('2048-best') || 0; } catch (e) {}

    container.innerHTML = `<div style="text-align:center;font-family:system-ui">
        <div style="display:flex;gap:16px;justify-content:center;align-items:center;margin-bottom:10px">
            <div style="text-align:center"><div style="font-size:11px;color:#999">得分</div><div id="s" style="font-size:24px;font-weight:700;color:#222">0</div></div>
            <div style="text-align:center"><div style="font-size:11px;color:#999">最高</div><div id="x" style="font-size:24px;font-weight:700;color:#222">${best}</div></div>
            <button class="btn btn-sm" id="r">新游戏</button>
        </div>
        <div id="b" style="position:relative;width:${W}px;height:${W}px;margin:0 auto;background:#bbada0;border-radius:10px;transition:transform .12s">
        </div>
        <div style="color:#999;font-size:11px;margin-top:8px">↑↓←→ / WASD</div></div>`;

    const B = container.querySelector('#b');
    const S = container.querySelector('#s'), X = container.querySelector('#x');

    // Background cells
    for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
        const bg = document.createElement('div');
        bg.style.cssText = `position:absolute;left:${c*C+(c+1)*G}px;top:${r*C+(r+1)*G}px;width:${C}px;height:${C}px;border-radius:6px;background:rgba(238,228,218,.35)`;
        B.appendChild(bg);
    }

    const st = document.createElement('style'); st.textContent = `
        .t{position:absolute;display:flex;align-items:center;justify-content:center;font-weight:700;border-radius:6px;transition:transform .15s;z-index:1}
        .tc2{background:#eee4da;color:#776e65}.tc4{background:#ede0c8;color:#776e65}
        .tc8{background:#f2b179;color:#f9f6f2}.tc16{background:#f59563;color:#f9f6f2}
        .tc32{background:#f67c5f;color:#f9f6f2}.tc64{background:#f65e3b;color:#f9f6f2}
        .tc128{background:#edcf72;color:#f9f6f2;box-shadow:0 0 30px rgba(237,207,114,.4)}.tc256{background:#edcc61;color:#f9f6f2;box-shadow:0 0 30px rgba(237,204,97,.4)}
        .tc512{background:#edc850;color:#f9f6f2;box-shadow:0 0 30px rgba(237,200,80,.5)}.tc1024{background:#edc53f;color:#f9f6f2;font-size:33px;box-shadow:0 0 30px rgba(237,197,63,.5)}
        .tc2048{background:#edc22e;color:#f9f6f2;font-size:33px;box-shadow:0 0 30px rgba(237,194,46,.6)}.tc4096{background:#3c3a32;color:#f9f6f2;font-size:27px}
        .tc8192{background:#1a1a1a;color:#f9f6f2;font-size:23px}.tc16384{background:#000;color:#f9f6f2;font-size:20px}
        .m{animation:mp .2s cubic-bezier(.34,1.56,.64,1)}@keyframes mp{0%{transform:scale(0)}50%{transform:scale(1.2)}100%{transform:scale(1)}}
        .tl{transform:perspective(600px) rotateY(5deg)}.tr{transform:perspective(600px) rotateY(-5deg)}
        .tu{transform:perspective(600px) rotateX(5deg)}.td{transform:perspective(600px) rotateX(-5deg)}`;
    container.appendChild(st);

    function ng() { grid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; score = 0; us(); sn(); sn(); render(); }
    function sn() { const e = []; for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (!grid[r][c]) e.push([r,c]); if (e.length) { const [r,c]=e[Math.random()*e.length|0]; grid[r][c]=Math.random()<.9?2:4; } }
    function us() { S.textContent=score; if(score>best){best=score;try{localStorage.setItem('2048-best',best)}catch(e){}} X.textContent=best; }

    function kh(e) {
        if (!running) return;
        const m = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
        if (m[e.key]) { e.preventDefault(); mv(m[e.key]); }
    }

    function mv(dir) {
        _t.forEach(clearTimeout); _t = [];
        const old = grid.map(r => [...r]);
        const merged = [[false,false,false,false],[false,false,false,false],[false,false,false,false],[false,false,false,false]];
        const moves = []; // {fromR,fromC,toR,toC}

        // 处理每一行/列
        const lines = [];
        if (dir === 'left' || dir === 'right') {
            for (let r = 0; r < 4; r++) {
                let vals = [], pos = [];
                for (let c = 0; c < 4; c++) if (grid[r][c]) { vals.push(grid[r][c]); pos.push(c); }
                if (dir === 'right') { vals.reverse(); pos.reverse(); }
                const res = compact(vals);
                for (let i = 0; i < res.vals.length; i++) {
                    const toC = dir === 'left' ? i : 3 - i;
                    moves.push({fromR:r, fromC:pos[i], toR:r, toC, merged:res.merged[i]});
                }
                // Apply to grid
                for (let c = 0; c < 4; c++) grid[r][c] = 0;
                for (let i = 0; i < res.vals.length; i++) {
                    const c = dir === 'left' ? i : 3 - i;
                    grid[r][c] = res.vals[i];
                    if (res.merged[i]) merged[r][c] = true;
                }
            }
        } else {
            for (let c = 0; c < 4; c++) {
                let vals = [], pos = [];
                for (let r = 0; r < 4; r++) if (grid[r][c]) { vals.push(grid[r][c]); pos.push(r); }
                if (dir === 'down') { vals.reverse(); pos.reverse(); }
                const res = compact(vals);
                for (let i = 0; i < res.vals.length; i++) {
                    const toR = dir === 'up' ? i : 3 - i;
                    moves.push({fromR:pos[i], fromC:c, toR, toC:c, merged:res.merged[i]});
                }
                for (let r = 0; r < 4; r++) grid[r][c] = 0;
                for (let i = 0; i < res.vals.length; i++) {
                    const r = dir === 'up' ? i : 3 - i;
                    grid[r][c] = res.vals[i];
                    if (res.merged[i]) merged[r][c] = true;
                }
            }
        }

        if (JSON.stringify(grid) === JSON.stringify(old)) return;
        score += moves.filter(m => m.merged).reduce((s,m) => s + grid[m.toR][m.toC], 0);

        // Animate: place tiles at FROM position, then slide to TO
        renderAnim(moves);
        us();
        setTimeout(() => { sn(); render(); }, 180);

        const ts = {left:'tl',right:'tr',up:'tu',down:'td'};
        B.classList.add(ts[dir]);
        _t.push(setTimeout(() => B.classList.remove(ts[dir]), 250));
    }

    function compact(vals) {
        let result = [], merged = [], i = 0;
        while (i < vals.length) {
            if (i + 1 < vals.length && vals[i] === vals[i+1]) {
                result.push(vals[i] * 2);
                merged.push(true);
                i += 2;
            } else {
                result.push(vals[i]);
                merged.push(false);
                i++;
            }
        }
        return {vals: result, merged};
    }

    function renderAnim(moves) {
        // Clear existing tiles
        tilePool.forEach(t => { if (t.el.parentNode) t.el.remove(); });
        tilePool = [];

        // Create tiles at FROM positions, then animate to TO
        for (let m of moves) {
            const d = document.createElement('div');
            d.className = 't tc' + grid[m.toR][m.toC];
            d.textContent = grid[m.toR][m.toC];
            d.style.width = d.style.height = C + 'px';
            d.style.fontSize = (grid[m.toR][m.toC] >= 100 ? 30 : 36) + 'px';

            // Place at FROM
            d.style.left = (m.fromC * C + (m.fromC + 1) * G) + 'px';
            d.style.top = (m.fromR * C + (m.fromR + 1) * G) + 'px';
            d.style.transform = 'translate(0,0)';

            B.appendChild(d);
            tilePool.push({el: d});

            // Slide to TO
            const dx = (m.toC - m.fromC) * (C + G);
            const dy = (m.toR - m.fromR) * (C + G);

            if (dx !== 0 || dy !== 0 || m.merged) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (m.merged) d.classList.add('m');
                        d.style.transform = `translate(${dx}px,${dy}px)`;
                    });
                });
            }
        }
    }

    function render() {
        tilePool.forEach(t => { if (t.el.parentNode) t.el.remove(); });
        tilePool = [];
        for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
            if (grid[r][c]) {
                const v = grid[r][c];
                const d = document.createElement('div');
                d.className = 't tc' + v;
                d.textContent = v;
                d.style.width = d.style.height = C + 'px';
                d.style.fontSize = (v >= 100 ? 30 : 36) + 'px';
                d.style.left = (c*C + (c+1)*G) + 'px';
                d.style.top = (r*C + (r+1)*G) + 'px';
                B.appendChild(d);
                tilePool.push({el: d});
            }
        }
    }

    document.addEventListener('keydown', kh);
    container.querySelector('#r').onclick = ng;
    ng();

    return { cleanup() { document.removeEventListener('keydown', kh); running = false; } };
}
