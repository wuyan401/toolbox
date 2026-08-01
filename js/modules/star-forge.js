export const id = 'star-forge';
export const name = '星舰工坊';
export const icon = '🚀';
export const description = '像素风模块化飞船建造与战斗，Cosmoteer式拼舰，Reassembly式激战';
export const category = '趣味游戏';
export const enabled = true;

export function init(container) {
    // ===== 常量 =====
    const GRID = 32;
    const CELL = 16;
    const BATTLE_W = 960, BATTLE_H = 640;

    // ===== 模块定义 =====
    const MODULES = {
        core:      { name: '核心',     icon: '⬛', color: '#ffd54a', glow: '#ffb300', hp: 200, desc: '战舰心脏，被摧毁即失败' },
        armor:     { name: '装甲',     icon: '⬜', color: '#9fb2c8', glow: '#5f7fa3', hp: 90,  desc: '廉价结实的外壳' },
        thruster:  { name: '推进器',   icon: '🔵', color: '#29b6f6', glow: '#0288d1', hp: 50,  thrust: 130, desc: '提供推进力(0.13kN)' },
        laser:     { name: '激光炮',   icon: '🔴', color: '#ff5252', glow: '#ff1744', hp: 60,  dmg: 9, rate: 2.2, energy: 2.5, range: 340, desc: '高射速光束' },
        cannon:    { name: '加农炮',   icon: '🟠', color: '#ff9100', glow: '#ff6d00', hp: 70,  dmg: 26, rate: 0.65, energy: 1.8, range: 420, speed: 300, desc: '重弹丸' },
        missile:   { name: '导弹舱',   icon: '🟣', color: '#b388ff', glow: '#7c4dff', hp: 55,  dmg: 42, rate: 0.35, energy: 3.2, range: 500, speed: 190, desc: '追踪导弹' },
        shield:    { name: '护盾',     icon: '🔷', color: '#40c4ff', glow: '#00b0ff', hp: 100, shield: 550, energy: 4, desc: '生成护盾泡' },
        reactor:   { name: '反应堆',   icon: '⚡', color: '#ffeb3b', glow: '#ffd600', hp: 70,  power: 12, desc: '发电 12/s' },
        capacitor: { name: '电容',     icon: '🔋', color: '#69f0ae', glow: '#00e676', hp: 60,  store: 260, desc: '储电 260' },
    };
    const MODULE_KEYS = Object.keys(MODULES);

    // ===== DOM 构建 (科幻UI) =====
    container.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:10px;font-family:'Consolas','Courier New',monospace">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 12px;border-radius:12px;background:linear-gradient(135deg,rgba(10,20,50,.92),rgba(20,10,45,.92));border:1px solid rgba(64,196,255,.35);box-shadow:0 0 18px rgba(64,196,255,.15)">
        <button id="sf-battle" style="padding:6px 16px;border-radius:8px;border:1px solid #ff5252;background:rgba(255,82,82,.15);color:#ff8a80;cursor:pointer;font-size:13px;font-family:inherit">⚔️ 战斗</button>
        <button id="sf-build" style="padding:6px 16px;border-radius:8px;border:1px solid #40c4ff;background:rgba(64,196,255,.15);color:#80d8ff;cursor:pointer;font-size:13px;font-family:inherit">🛠️ 建造</button>
        <span style="font-size:12px;color:#80d8ff;letter-spacing:2px" id="sf-mode">建造模式</span>
        <button id="sf-wmode" style="padding:6px 12px;border-radius:8px;border:1px solid #69f0ae;background:rgba(105,240,174,.12);color:#b9f6ca;cursor:pointer;font-size:12px;font-family:inherit">🎮 自动</button>
        <button id="sf-keys" style="padding:6px 12px;border-radius:8px;border:1px solid #ffd54a;background:rgba(255,213,74,.12);color:#ffe082;cursor:pointer;font-size:12px;font-family:inherit">⌨️ 键位</button>
        <span style="margin-left:auto"></span>
        <button id="sf-save" style="padding:6px 12px;border-radius:8px;border:1px solid #b388ff;background:rgba(179,136,255,.12);color:#d1c4e9;cursor:pointer;font-size:12px;font-family:inherit">💾 保存</button>
        <button id="sf-load" style="padding:6px 12px;border-radius:8px;border:1px solid #ffd54a;background:rgba(255,213,74,.12);color:#ffe082;cursor:pointer;font-size:12px;font-family:inherit">📂 加载</button>
        <button id="sf-example" style="padding:6px 12px;border-radius:8px;border:1px solid #69f0ae;background:rgba(105,240,174,.12);color:#b9f6ca;cursor:pointer;font-size:12px;font-family:inherit">✨ 示例舰</button>
        <button id="sf-clear" style="padding:6px 12px;border-radius:8px;border:1px solid #ff5252;background:rgba(255,82,82,.1);color:#ff8a80;cursor:pointer;font-size:12px;font-family:inherit">🗑️ 清空</button>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div id="sf-panel" style="flex:0 0 172px;display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:linear-gradient(180deg,rgba(10,20,50,.9),rgba(20,10,45,.9));border:1px solid rgba(64,196,255,.25)">
          <div style="font-size:11px;font-weight:700;color:#80d8ff;letter-spacing:3px">▚ 模块库</div>
          <div id="sf-modules" style="display:grid;grid-template-columns:1fr 1fr;gap:4px"></div>
          <div id="sf-info" style="font-size:11px;color:#9ad1ff;background:rgba(0,20,60,.5);border:1px solid rgba(64,196,255,.2);border-radius:8px;padding:6px;line-height:1.6"></div>
          <div style="font-size:10px;color:#5c7fa3;line-height:1.7">
            🖱️ 左键放置 / 右键删除<br>
            🖲️ 滚轮缩放画面<br>
            ⚔️ 战斗中: WASD移动<br>
            鼠标=舰首瞄准<br>
            🎮 切手动: 按键开火<br>
            ⌨️ 键位可自定义
          </div>
        </div>
        <div style="flex:1;min-width:520px">
          <div style="position:relative;border-radius:12px;overflow:hidden;border:1px solid rgba(64,196,255,.35);box-shadow:0 0 24px rgba(64,196,255,.12)">
            <canvas id="sf-build-cv" width="512" height="512" style="display:block;width:100%;image-rendering:pixelated;background:#04081c"></canvas>
            <canvas id="sf-battle-cv" width="960" height="640" style="display:none;width:100%;image-rendering:pixelated;background:#030514"></canvas>
            <div id="sf-zoom" style="position:absolute;top:8px;right:10px;font-size:11px;color:#80d8ff;background:rgba(0,15,45,.7);padding:2px 8px;border-radius:6px;border:1px solid rgba(64,196,255,.3)">100%</div>
          </div>
          <div id="sf-hud" style="display:none;font-size:12px;color:#cfe8ff;margin-top:6px;display:flex;gap:16px;flex-wrap:wrap;padding:6px 10px;border-radius:8px;background:rgba(8,16,40,.8);border:1px solid rgba(64,196,255,.2)"></div>
        </div>
      </div>
    </div>`;

    const bcv = container.querySelector('#sf-build-cv');
    const bctx = bcv.getContext('2d');
    const wcv = container.querySelector('#sf-battle-cv');
    const wctx = wcv.getContext('2d');
    const hud = container.querySelector('#sf-hud');
    const modeLabel = container.querySelector('#sf-mode');
    const infoBox = container.querySelector('#sf-info');
    const zoomLabel = container.querySelector('#sf-zoom');

    // ===== 状态 =====
    let mode = 'build';
    let selected = 'core';
    let grid = Array.from({ length: GRID }, () => new Array(GRID).fill(null));
    let battle = null;
    let raf = 0;
    let lastTs = 0;
    let buildZoom = 1;
    let mouse = { x: -1, y: -1 };        // 鼠标世界位置(建造)
    let aim = { x: 480, y: 320 };        // 战斗中鼠标瞄准点

    // ===== 武器模式 + 按键绑定 =====
    let weaponMode = 'auto'; // auto | manual
    let bindings = { laser: 'j', cannon: 'k', missile: 'l' };
    try {
        const s = JSON.parse(localStorage.getItem('starforge-bindings') || 'null');
        if (s) bindings = Object.assign(bindings, s);
    } catch (e) {}
    function saveBindings() { try { localStorage.setItem('starforge-bindings', JSON.stringify(bindings)); } catch (e) {} }

    // 键位编辑器弹窗
    function openKeyEditor() {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:999;display:flex;align-items:center;justify-content:center';
        const box = document.createElement('div');
        box.style.cssText = 'background:linear-gradient(180deg,#0b1735,#140b2e);border:1px solid rgba(64,196,255,.4);border-radius:14px;padding:20px;min-width:340px;font-family:Consolas,monospace;color:#cfe8ff;box-shadow:0 0 30px rgba(64,196,255,.2)';
        box.innerHTML = `
            <div style="font-size:15px;font-weight:700;color:#80d8ff;margin-bottom:4px">⌨️ 武器按键绑定</div>
            <div style="font-size:12px;color:#5c7fa3;margin-bottom:12px">点击按键进行修改，再按下新按键（战斗时按绑定键手动开火）</div>
            <div id="kb-rows"></div>
            <button id="kb-close" style="margin-top:14px;width:100%;padding:8px;border-radius:8px;border:1px solid #40c4ff;background:rgba(64,196,255,.15);color:#80d8ff;cursor:pointer;font-family:inherit">✔ 完成</button>`;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        let editing = null;
        const rows = box.querySelector('#kb-rows');
        function renderRows() {
            rows.innerHTML = '';
            for (const key of ['laser', 'cannon', 'missile']) {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;margin:4px 0;border-radius:8px;background:rgba(0,20,60,.5);border:1px solid rgba(64,196,255,.2);cursor:pointer;transition:border-color .15s';
                row.innerHTML = `<span>${MODULES[key].icon} ${MODULES[key].name}</span><span id="kb-${key}" style="background:#1a2a55;padding:3px 12px;border-radius:6px;font-weight:700;color:#ffd54a">${(bindings[key] || '?').toUpperCase()}</span>`;
                row.onclick = () => {
                    editing = key;
                    document.querySelectorAll('#kb-rows div').forEach(r => r.style.borderColor = 'rgba(64,196,255,.2)');
                    row.style.borderColor = '#ffd54a';
                    const lbl = document.getElementById('kb-' + key);
                    lbl.textContent = '按任意键...';
                    lbl.style.color = '#69f0ae';
                };
                rows.appendChild(row);
            }
        }
        renderRows();
        const onKey = e => {
            e.preventDefault();
            if (!editing) return;
            const k = e.key.toLowerCase();
            const ok = (k.length === 1 && k >= 'a' && k <= 'z') || [' ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(k);
            if (ok) {
                bindings[editing] = k;
                saveBindings();
            }
            editing = null;
            renderRows();
        };
        window.addEventListener('keydown', onKey);
        const close = () => { window.removeEventListener('keydown', onKey); overlay.remove(); };
        box.querySelector('#kb-close').onclick = close;
        overlay.onclick = e => { if (e.target === overlay) close(); };
    }

    // ===== 像素纹理 (16×16, 1:1 绘制无缩放失真) =====
    function makeTexture(key) {
        const t = document.createElement('canvas');
        t.width = 16; t.height = 16;
        const c = t.getContext('2d');
        const M = MODULES[key];
        // 底
        c.fillStyle = M.color;
        c.fillRect(0, 0, 16, 16);
        // 斜面高光 (左上亮)
        c.fillStyle = 'rgba(255,255,255,.3)';
        c.fillRect(0, 0, 16, 2);
        c.fillRect(0, 0, 2, 16);
        // 暗边 (右下)
        c.fillStyle = 'rgba(0,0,0,.45)';
        c.fillRect(0, 14, 16, 2);
        c.fillRect(14, 0, 2, 16);
        // 铆钉 (四角装饰)
        c.fillStyle = 'rgba(255,255,255,.22)';
        c.fillRect(3, 3, 2, 2); c.fillRect(11, 3, 2, 2);
        c.fillRect(3, 11, 2, 2); c.fillRect(11, 11, 2, 2);
        // 中心细节 (每个模块独特)
        c.fillStyle = 'rgba(255,255,255,.9)';
        if (key === 'core') {
            c.fillStyle = '#8a6d00'; c.fillRect(4, 4, 8, 8);
            c.fillStyle = '#ffd54a'; c.fillRect(6, 6, 4, 4);
            c.fillStyle = '#fff'; c.fillRect(7, 7, 2, 2);
        } else if (key === 'armor') {
            c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(2, 7, 12, 2); c.fillRect(7, 2, 2, 12);
            c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(4, 4, 2, 8); c.fillRect(10, 4, 2, 8);
        } else if (key === 'thruster') {
            c.fillStyle = '#7a3d00'; c.fillRect(2, 9, 12, 5);
            c.fillStyle = '#ff9e40'; c.fillRect(3, 10, 10, 3);
            c.fillStyle = '#fff'; c.fillRect(5, 11, 6, 1);
        } else if (key === 'laser') {
            c.fillStyle = '#9c1f1f'; c.fillRect(5, 3, 2, 10);
            c.fillStyle = '#ff5252'; c.fillRect(6, 4, 3, 8);
            c.fillStyle = '#fff'; c.fillRect(7, 5, 2, 6);
        } else if (key === 'cannon') {
            c.fillStyle = '#5c3d00'; c.fillRect(3, 5, 10, 6);
            c.fillStyle = '#8a6d00'; c.fillRect(5, 4, 6, 8);
            c.fillStyle = '#ff9100'; c.fillRect(6, 6, 4, 4);
            c.fillStyle = '#3a2600'; c.fillRect(2, 5, 2, 6);
        } else if (key === 'missile') {
            c.fillStyle = '#e8d5ff'; c.fillRect(3, 6, 10, 4);
            c.fillStyle = '#b388ff'; c.fillRect(5, 5, 6, 6);
            c.fillStyle = '#ff5252'; c.fillRect(6, 6, 4, 2);
            c.fillStyle = '#7c4dff'; c.fillRect(4, 8, 8, 1);
        } else if (key === 'shield') {
            c.fillStyle = 'rgba(255,255,255,.85)';
            c.fillRect(3, 2, 2, 12); c.fillRect(11, 2, 2, 12);
            c.fillRect(2, 4, 12, 2); c.fillRect(2, 10, 12, 2);
            c.fillStyle = 'rgba(64,196,255,.6)'; c.fillRect(6, 5, 4, 6);
        } else if (key === 'reactor') {
            c.fillStyle = '#8a6d00';
            c.fillRect(6, 1, 4, 5); c.fillRect(6, 10, 4, 5); c.fillRect(1, 6, 5, 4); c.fillRect(10, 6, 5, 4);
            c.fillStyle = '#ffeb3b'; c.fillRect(7, 3, 2, 10); c.fillRect(3, 7, 10, 2);
            c.fillStyle = '#fff'; c.fillRect(7, 7, 2, 2);
        } else if (key === 'capacitor') {
            c.fillStyle = 'rgba(255,255,255,.85)';
            c.fillRect(3, 2, 2, 12); c.fillRect(11, 2, 2, 12);
            c.fillStyle = '#69f0ae'; c.fillRect(5, 5, 6, 6);
            c.fillStyle = '#2e7d5b'; c.fillRect(6, 6, 4, 4);
        }
        return t;
    }
    const textures = {};
    for (const k of MODULE_KEYS) textures[k] = makeTexture(k);

    // ===== 模块面板 =====
    const panel = container.querySelector('#sf-modules');
    MODULE_KEYS.forEach(k => {
        const M = MODULES[k];
        const b = document.createElement('button');
        b.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border-radius:8px;border:1px solid ${M.glow};background:rgba(10,25,60,.7);cursor:pointer;font-size:10px;color:#cfe8ff;font-family:inherit;transition:all .15s`;
        b.innerHTML = `<span style="font-size:18px;filter:drop-shadow(0 0 4px ${M.glow})">${M.icon}</span><span>${M.name}</span>`;
        b.onclick = () => {
            selected = k;
            document.querySelectorAll('#sf-modules button').forEach(x => { x.style.opacity = .5; x.style.boxShadow = 'none'; });
            b.style.opacity = 1;
            b.style.boxShadow = `0 0 10px ${M.glow}66`;
            infoBox.innerHTML = `<b style="color:${M.color};text-shadow:0 0 6px ${M.glow}">${M.icon} ${M.name}</b><br>${M.desc}<br>${M.hp ? 'HP ' + M.hp : ''}${M.thrust ? ' · 推力 ' + M.thrust : ''}${M.dmg ? ' · 伤害 ' + M.dmg : ''}${M.power ? ' · 发电 ' + M.power + '/s' : ''}${M.store ? ' · 储能 ' + M.store : ''}${M.energy ? ' · 耗电 ' + M.energy + '/s' : ''}`;
        };
        panel.appendChild(b);
    });
    panel.firstChild.click();

    // ===== 建造交互 (统一监听, 修复拖拽重绘) =====
    function gridFromEvent(e) {
        const r = bcv.getBoundingClientRect();
        // 考虑缩放: 画布逻辑坐标 = 屏幕偏移 / zoom (以中心为原点缩放)
        const cx = (e.clientX - r.left) / r.width * 512;
        const cy = (e.clientY - r.top) / r.height * 512;
        const ox = 256 - 256 * buildZoom, oy = 256 - 256 * buildZoom;
        const wx = (cx - ox) / buildZoom, wy = (cy - oy) / buildZoom;
        return { gx: Math.floor(wx / CELL), gy: Math.floor(wy / CELL), wx, wy };
    }
    bcv.addEventListener('mousemove', e => {
        const p = gridFromEvent(e);
        mouse = { x: p.gx, y: p.gy, wx: p.wx, wy: p.wy };
        if (e.buttons & 1) place(p.gx, p.gy);
        if (e.buttons & 2) remove(p.gx, p.gy);
        drawBuild();
    });
    bcv.addEventListener('mousedown', e => {
        const p = gridFromEvent(e);
        if (e.button === 0) place(p.gx, p.gy);
        if (e.button === 2) remove(p.gx, p.gy);
        drawBuild();
    });
    bcv.addEventListener('mouseleave', () => { mouse = { x: -1, y: -1 }; drawBuild(); });
    bcv.addEventListener('contextmenu', e => e.preventDefault());
    // 滚轮缩放 (建造)
    bcv.addEventListener('wheel', e => {
        e.preventDefault();
        buildZoom = Math.max(.4, Math.min(2.5, buildZoom * (e.deltaY < 0 ? 1.15 : .87)));
        zoomLabel.textContent = Math.round(buildZoom * 100) + '%';
        drawBuild();
    }, { passive: false });

    function place(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return;
        grid[gy][gx] = selected;
    }
    function remove(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return;
        grid[gy][gx] = null;
    }

    // ===== 建造渲染 (科幻霓虹) =====
    function drawBuild() {
        bctx.clearRect(0, 0, 512, 512);
        // 深空底
        const bg = bctx.createRadialGradient(256, 256, 50, 256, 256, 380);
        bg.addColorStop(0, '#0a1030');
        bg.addColorStop(1, '#04081c');
        bctx.fillStyle = bg;
        bctx.fillRect(0, 0, 512, 512);
        // 星点
        for (let i = 0; i < 40; i++) {
            const sx = (i * 97) % 512, sy = (i * 173) % 512;
            bctx.fillStyle = `rgba(180,210,255,${.25 + .3 * ((i * 13) % 10) / 10})`;
            bctx.fillRect(sx, sy, 1.5, 1.5);
        }
        // 视图变换: 以中心为原点缩放
        bctx.save();
        bctx.translate(256, 256);
        bctx.scale(buildZoom, buildZoom);
        bctx.translate(-256, -256);
        // 霓虹网格
        bctx.strokeStyle = 'rgba(64,196,255,.16)';
        bctx.lineWidth = 1;
        for (let i = 0; i <= GRID; i++) {
            bctx.beginPath(); bctx.moveTo(i * CELL, 0); bctx.lineTo(i * CELL, 512); bctx.stroke();
            bctx.beginPath(); bctx.moveTo(0, i * CELL); bctx.lineTo(512, i * CELL); bctx.stroke();
        }
        // 中心十字 + 光环
        bctx.strokeStyle = 'rgba(105,240,174,.35)';
        bctx.beginPath();
        bctx.moveTo(256, 240); bctx.lineTo(256, 272);
        bctx.moveTo(240, 256); bctx.lineTo(272, 256);
        bctx.stroke();
        bctx.strokeStyle = 'rgba(105,240,174,.12)';
        bctx.beginPath(); bctx.arc(256, 256, 48, 0, Math.PI * 2); bctx.stroke();
        // 模块 (发光边框)
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                if (grid[y][x]) {
                    const M = MODULES[grid[y][x]];
                    bctx.shadowColor = M.glow;
                    bctx.shadowBlur = 6;
                    bctx.drawImage(textures[grid[y][x]], x * CELL, y * CELL, CELL, CELL);
                    bctx.shadowBlur = 0;
                    bctx.strokeStyle = M.glow + '88';
                    bctx.lineWidth = 1;
                    bctx.strokeRect(x * CELL + .5, y * CELL + .5, CELL - 1, CELL - 1);
                }
            }
        }
        // 悬停预览
        if (mouse.x >= 0 && mouse.y >= 0 && mouse.x < GRID && mouse.y < GRID) {
            const px = mouse.x * CELL, py = mouse.y * CELL;
            if (grid[mouse.y][mouse.x]) {
                bctx.strokeStyle = 'rgba(255,82,82,.9)';
                bctx.lineWidth = 2;
                bctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
            } else {
                const M = MODULES[selected];
                bctx.globalAlpha = .55;
                bctx.shadowColor = M.glow;
                bctx.shadowBlur = 8;
                bctx.drawImage(textures[selected], px, py, CELL, CELL);
                bctx.shadowBlur = 0;
                bctx.globalAlpha = 1;
                bctx.strokeStyle = 'rgba(255,255,255,.7)';
                bctx.lineWidth = 1.5;
                bctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
            }
        }
        bctx.restore();
    }

    // ===== 设计保存/加载 =====
    function safeGet(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    container.querySelector('#sf-save').onclick = () => {
        const data = grid.map(row => row.map(c => c || '.').join('')).join('|');
        safeSet('starforge-design', data);
        flash('✅ 设计已保存');
    };
    container.querySelector('#sf-load').onclick = () => {
        const data = safeGet('starforge-design', '');
        if (!data) { flash('⚠️ 没有已保存的设计'); return; }
        const rows = data.split('|');
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                const ch = rows[y] ? rows[y][x] : '.';
                grid[y][x] = ch !== '.' ? ch : null;
            }
        }
        drawBuild();
        flash('📂 设计已加载');
    };
    container.querySelector('#sf-clear').onclick = () => {
        grid = Array.from({ length: GRID }, () => new Array(GRID).fill(null));
        drawBuild();
    };
    container.querySelector('#sf-example').onclick = () => {
        grid = Array.from({ length: GRID }, () => new Array(GRID).fill(null));
        const c = GRID / 2;
        set(c, c, 'core');
        set(c - 1, c, 'reactor'); set(c + 1, c, 'reactor');
        set(c, c - 1, 'capacitor'); set(c, c + 1, 'capacitor');
        set(c - 2, c, 'shield'); set(c + 2, c, 'shield');
        set(c - 1, c - 1, 'laser'); set(c + 1, c - 1, 'laser');
        set(c - 1, c + 1, 'cannon'); set(c + 1, c + 1, 'cannon');
        set(c - 3, c, 'missile'); set(c + 3, c, 'missile');
        set(c - 4, c, 'armor'); set(c + 4, c, 'armor');
        set(c, c - 2, 'armor'); set(c, c + 2, 'armor');
        set(c - 2, c - 2, 'armor'); set(c + 2, c - 2, 'armor');
        set(c - 2, c + 2, 'armor'); set(c + 2, c + 2, 'armor');
        set(c - 1, c + 3, 'thruster'); set(c + 1, c + 3, 'thruster');
        drawBuild();
    };
    function set(x, y, v) { if (x >= 0 && y >= 0 && x < GRID && y < GRID) grid[y][x] = v; }
    let flashTimer = 0;
    function flash(msg) {
        modeLabel.textContent = msg;
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => { modeLabel.textContent = mode === 'build' ? '建造模式' : '战斗模式'; }, 1600);
    }

    // ===== 战斗系统 =====
    function shipFromGrid(g, isPlayer) {
        const mods = [];
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                if (g[y][x]) {
                    const M = MODULES[g[y][x]];
                    if (!M) continue;
                    mods.push({ key: g[y][x], x, y, hp: M.hp, maxHp: M.hp, wx: (x - GRID / 2) * CELL, wy: (y - GRID / 2) * CELL });
                }
            }
        }
        let thrust = 0, power = 0, store = 0;
        for (const m of mods) {
            thrust += MODULES[m.key].thrust || 0;
            power += MODULES[m.key].power || 0;
            store += MODULES[m.key].store || 0;
        }
        return {
            isPlayer, mods,
            x: 0, y: 0, vx: 0, vy: 0, ang: isPlayer ? -Math.PI / 2 : Math.PI / 2,
            mass: mods.length * 6 + 10,
            thrust, power, store,
            energy: store * 0.8,
            shield: 0, shieldMax: 0,
            cds: {}, dead: false, flash: 0,
        };
    }

    // AI 敌舰模板
    const TPL_CODE = { C: 'core', A: 'armor', T: 'thruster', L: 'laser', O: 'cannon', M: 'missile', S: 'shield', R: 'reactor', B: 'capacitor' };
    const ENEMY_TEMPLATES = [
        { name: '侦察艇', grid: ['......', '...T..', '.A..A.', '.L.LL.', '.C.R..', '.L.LL.', '.A..A.', '...T..'] },
        { name: '炮舰', grid: ['.......', '..A.A..', '.O.C.R.', '.O.B...', '.O.C.R.', '..A.A..', '..T.T..'] },
        { name: '重装舰', grid: ['.........', '..A.A.A..', '.A.M.C.C.', '.M.S.R...', '.M.S.R...', '.A.M.C.C.', '..A.A.A..', '.T.T.T...'] },
    ];

    function templateToGrid(t) {
        const g = Array.from({ length: GRID }, () => new Array(GRID).fill(null));
        const rows = t.grid;
        const offX = Math.floor((GRID - rows[0].length) / 2);
        const offY = Math.floor((GRID - rows.length) / 2);
        for (let y = 0; y < rows.length; y++) {
            for (let x = 0; x < rows[y].length; x++) {
                const ch = rows[y][x];
                if (ch !== '.') g[y + offY][x + offX] = TPL_CODE[ch] || ch;
            }
        }
        return g;
    }

    function startBattle() {
        let hasCore = false;
        for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (grid[y][x] === 'core') hasCore = true;
        if (!hasCore) { flash('⚠️ 请先放置核心模块!'); return; }

        battle = {
            player: shipFromGrid(grid, true),
            enemies: [], bullets: [], particles: [],
            stars: [], nebulas: [], time: 0, result: null,
        };
        // 星云
        for (let i = 0; i < 4; i++) {
            battle.nebulas.push({ x: Math.random() * 1600 - 320, y: Math.random() * 1200 - 280, r: 120 + Math.random() * 200, hue: Math.random() * 360 });
        }
        for (let i = 0; i < 110; i++) {
            battle.stars.push({ x: Math.random() * BATTLE_W * 2, y: Math.random() * BATTLE_H * 2, s: Math.random() * 1.8 + .4, tw: Math.random() * 6.28, c: Math.random() < .15 ? '#aee6ff' : '#cfe0ff' });
        }
        const n = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
            const tpl = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
            const ship = shipFromGrid(templateToGrid(tpl), false);
            ship.name = tpl.name;
            const ang = Math.random() * Math.PI * 2;
            ship.x = battle.player.x + Math.cos(ang) * (320 + Math.random() * 130);
            ship.y = battle.player.y + Math.sin(ang) * (320 + Math.random() * 130);
            battle.enemies.push(ship);
        }
        const pe = battle.enemies[0];
        if (pe) battle.player.ang = Math.atan2(pe.x - battle.player.x, -(pe.y - battle.player.y));
        switchMode('battle');
    }

    // ===== 战斗更新 =====
    function shipRadius(s) {
        return Math.max(18, s.mods.length * 3 + 8);
    }

    function updateBattle(dt) {
        const B = battle;
        if (B.result) return;
        B.time += dt;
        const p = B.player;

        // 输入: WASD 平移 + 鼠标瞄准
        const ix = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
        const iy = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
        if (p.thrust > 0) {
            const acc = p.thrust * 65 / p.mass;
            // 船体坐标系: 前 = ang方向, 右 = ang+90°
            const fwdX = Math.sin(p.ang), fwdY = -Math.cos(p.ang);
            const rightX = Math.cos(p.ang), rightY = Math.sin(p.ang);
            p.vx += (fwdX * -iy + rightX * ix) * acc * dt;
            p.vy += (fwdY * -iy + rightY * ix) * acc * dt;
        }
        // 鼠标瞄准: 平滑转向
        const dx = aim.x - p.x, dy = aim.y - p.y;
        if (Math.hypot(dx, dy) > 4) {
            const want = Math.atan2(dx, -dy);
            let diff = want - p.ang;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            p.ang += Math.max(-4.5 * dt, Math.min(4.5 * dt, diff));
        }

        // 能量
        p.energy += (p.power || 0) * dt;
        p.energy = Math.min(p.energy, p.store + 200);

        // 护盾
        const shields = p.mods.filter(m => m.key === 'shield' && m.hp > 0);
        if (shields.length) {
            p.shieldMax = shields.length * MODULES.shield.shield;
            if (p.energy > 1 && p.shield < p.shieldMax) {
                const drain = Math.min(46 * dt, p.energy, p.shieldMax - p.shield);
                p.energy -= drain; p.shield += drain;
            }
        } else { p.shield = 0; p.shieldMax = 0; }

        fireWeapons(p, dt, nearestEnemy(p.x, p.y));

        // 移动 + 阻尼
        p.x += p.vx * dt; p.y += p.vy * dt;
        const d1 = Math.pow(.35, dt);
        p.vx *= d1; p.vy *= d1;

        // 敌舰 AI
        for (const e of B.enemies) {
            if (e.dead) continue;
            const dx2 = p.x - e.x, dy2 = p.y - e.y;
            const dist = Math.hypot(dx2, dy2);
            const want = Math.atan2(dx2, -dy2);
            let diff = want - e.ang;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            e.ang += Math.max(-2.2 * dt, Math.min(2.2 * dt, diff * 3));
            if (Math.abs(diff) < .6 && e.thrust > 0 && dist > 120) {
                e.vx += Math.sin(e.ang) * e.thrust * 60 * dt / e.mass;
                e.vy -= Math.cos(e.ang) * e.thrust * 60 * dt / e.mass;
            } else if (dist < 100) {
                // 保持距离 (撤退)
                e.vx -= Math.sin(e.ang) * e.thrust * 40 * dt / e.mass;
                e.vy += Math.cos(e.ang) * e.thrust * 40 * dt / e.mass;
            }
            e.x += e.vx * dt; e.y += e.vy * dt;
            const d2 = Math.pow(.35, dt);
            e.vx *= d2; e.vy *= d2;
            e.energy += (e.power || 0) * dt;
            e.energy = Math.min(e.energy, e.store + 200);
            const es = e.mods.filter(m => m.key === 'shield' && m.hp > 0);
            if (es.length) {
                e.shieldMax = es.length * MODULES.shield.shield;
                if (e.energy > 1 && e.shield < e.shieldMax) {
                    const drain = Math.min(40 * dt, e.energy, e.shieldMax - e.shield);
                    e.energy -= drain; e.shield += drain;
                }
            } else { e.shield = 0; e.shieldMax = 0; }
            fireWeapons(e, dt, p);
        }

        // ===== 飞船碰撞 (圆碰撞 + 分离) =====
        const allShips = [p, ...B.enemies.filter(x => !x.dead)];
        for (let i = 0; i < allShips.length; i++) {
            for (let j = i + 1; j < allShips.length; j++) {
                const a = allShips[i], b = allShips[j];
                const dxc = b.x - a.x, dyc = b.y - a.y;
                const d = Math.hypot(dxc, dyc);
                const minD = shipRadius(a) + shipRadius(b);
                if (d < minD && d > 0.01) {
                    const push = (minD - d) / 2;
                    const nx = dxc / d, ny = dyc / d;
                    a.x -= nx * push; a.y -= ny * push;
                    b.x += nx * push; b.y += ny * push;
                    // 速度交换 (弹性碰撞, 简化)
                    const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
                    if (rel > 0) {
                        const ma = a.mass, mb = b.mass;
                        const imp = rel * Math.min(1, 2 * mb / (ma + mb));
                        a.vx -= nx * imp * .8; a.vy -= ny * imp * .8;
                        b.vx += nx * imp * .8; b.vy += ny * imp * .8;
                    }
                }
            }
        }

        // 子弹
        for (let i = B.bullets.length - 1; i >= 0; i--) {
            const b = B.bullets[i];
            if (b.dead) { B.bullets.splice(i, 1); continue; }
            // 激光生命周期: 短暂存续后消散 (避免光束残留)
            if (b.type === 'laser') {
                b.life -= dt;
                if (b.life <= 0) { B.bullets.splice(i, 1); continue; }
            }
            if (b.track) {
                const t = b.owner === 'player' ? nearestEnemy(b.x, b.y) : B.player;
                if (t) {
                    const want = Math.atan2(t.y - b.y, t.x - b.x);
                    b.ang += Math.max(-3.5 * dt, Math.min(3.5 * dt, want - b.ang));
                }
            }
            b.x += Math.cos(b.ang) * b.speed * dt;
            b.y += Math.sin(b.ang) * b.speed * dt;
            if (b.trail && b.type === 'missile') {
                B.particles.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: .2, maxLife: .2, color: '#b388ff', size: 2 });
            }
            const camX = B.player.x, camY = B.player.y;
            if (Math.abs(b.x - camX) > BATTLE_W || Math.abs(b.y - camY) > BATTLE_H) { B.bullets.splice(i, 1); continue; }
            const targets = b.owner === 'player' ? B.enemies : [B.player];
            let hit = false;
            for (const t of targets) {
                if (t.dead) continue;
                if (b.type === 'laser') {
                    const hitInfo = rayHitShip(b.x, b.y, b.ang, b.range, t);
                    if (hitInfo) {
                        b.hitDist = hitInfo.dist;
                        const hx = b.x + Math.cos(b.ang) * hitInfo.dist, hy = b.y + Math.sin(b.ang) * hitInfo.dist;
                        damageShip(t, hitInfo.mod, b.dmg, hx, hy);
                        spark(hx, hy, MODULES[b.source].color);
                        hit = true;
                        break;
                    } else { b.hitDist = b.range; }
                } else {
                    const hr = shipRadius(t);
                    if (Math.hypot(b.x - t.x, b.y - t.y) < hr + 4) {
                        const mod = modAtWorld(t, b.x, b.y);
                        damageShip(t, mod, b.dmg, b.x, b.y);
                        boom(b.x, b.y, 10, MODULES[b.source].color);
                        hit = true;
                        break;
                    }
                }
            }
            if (hit) B.bullets.splice(i, 1);
        }

        // 粒子
        for (let i = B.particles.length - 1; i >= 0; i--) {
            const pt = B.particles[i];
            pt.life -= dt;
            if (pt.life <= 0) { B.particles.splice(i, 1); continue; }
            pt.x += pt.vx * dt; pt.y += pt.vy * dt;
            if (pt.ring) pt.r = (pt.r || 0) + 260 * dt;
        }

        // 死亡检查
        for (const e of B.enemies) {
            if (!e.dead && !e.mods.some(m => m.key === 'core' && m.hp > 0)) {
                e.dead = true;
                for (const m of e.mods) if (m.hp > 0) boom(m.x + e.x, m.y + e.y, 10, MODULES[m.key].color);
            }
        }
        if (!p.dead && !p.mods.some(m => m.key === 'core' && m.hp > 0)) {
            p.dead = true;
            for (const m of p.mods) if (m.hp > 0) boom(m.x + p.x, m.y + p.y, 10, MODULES[m.key].color);
        }
        if (p.dead) B.result = 'lose';
        else if (B.enemies.every(e => e.dead)) B.result = 'win';
    }

    function fireWeapons(ship, dt, target) {
        const B = battle;
        if (!B) return;
        // 手动模式下玩家不自动开火 (按绑定键手动发射)
        if (ship.isPlayer && weaponMode === 'manual') return;
        for (const m of ship.mods) {
            const M = MODULES[m.key];
            if (!M.dmg || m.hp <= 0) continue;
            ship.cds[m.key] = (ship.cds[m.key] || 0) - dt;
            if (ship.cds[m.key] > 0) continue;
            if (ship.energy < M.energy * .2) continue;
            const tgt = target && !target.dead ? target : null;
            if (!tgt) continue;
            const gx = ship.x + m.wx * Math.cos(ship.ang) - m.wy * Math.sin(ship.ang);
            const gy = ship.y + m.wx * Math.sin(ship.ang) + m.wy * Math.cos(ship.ang);
            const dist = Math.hypot(tgt.x - gx, tgt.y - gy);
            if (dist > M.range) continue;
            const ang = Math.atan2(tgt.y - gy, tgt.x - gx);
            if (m.key === 'laser') {
                B.bullets.push({ type: 'laser', x: gx, y: gy, ang, speed: 0, range: M.range, dmg: M.dmg, owner: ship.isPlayer ? 'player' : 'enemy', source: m.key, life: .12, dead: false });
                muzz(gx, gy, '#ff5252');
            } else if (m.key === 'cannon') {
                B.bullets.push({ type: 'cannon', x: gx, y: gy, ang, speed: M.speed, range: M.range, dmg: M.dmg, owner: ship.isPlayer ? 'player' : 'enemy', source: m.key, dead: false });
                muzz(gx, gy, '#ff9100');
            } else if (m.key === 'missile') {
                B.bullets.push({ type: 'missile', x: gx, y: gy, ang, speed: M.speed, range: M.range, dmg: M.dmg, owner: ship.isPlayer ? 'player' : 'enemy', source: m.key, track: true, trail: true, dead: false });
                muzz(gx, gy, '#b388ff');
            }
            ship.cds[m.key] = 1 / M.rate;
            ship.energy -= M.energy * .5;
        }
    }

    function nearestEnemy(x, y) {
        const B = battle;
        let best = null, bd = 1e9;
        for (const e of B.enemies) {
            if (e.dead) continue;
            const d = Math.hypot(e.x - x, e.y - y);
            if (d < bd) { bd = d; best = e; }
        }
        return best;
    }

    // 手动发射: 按绑定键发射对应类型全部武器 (朝舰首/鼠标方向)
    function manualFire(ship, key) {
        const B = battle;
        if (!B || ship.dead) return;
        const M = MODULES[key];
        if (!M || !M.dmg) return;
        let fired = false;
        for (const m of ship.mods) {
            if (m.key !== key || m.hp <= 0) continue;
            ship.cds[m.key] = (ship.cds[m.key] || 0) - 0;
            if (ship.cds[m.key] > 0) continue;
            if (ship.energy < M.energy * .2) continue;
            const gx = ship.x + m.wx * Math.cos(ship.ang) - m.wy * Math.sin(ship.ang);
            const gy = ship.y + m.wx * Math.sin(ship.ang) + m.wy * Math.cos(ship.ang);
            // 手动模式发射方向 = 舰首 (鼠标瞄准方向)
            const ang = ship.ang;
            if (key === 'laser') {
                B.bullets.push({ type: 'laser', x: gx, y: gy, ang, speed: 0, range: M.range, dmg: M.dmg, owner: 'player', source: key, life: .12, dead: false });
                muzz(gx, gy, '#ff5252');
            } else if (key === 'cannon') {
                B.bullets.push({ type: 'cannon', x: gx, y: gy, ang, speed: M.speed, range: M.range, dmg: M.dmg, owner: 'player', source: key, dead: false });
                muzz(gx, gy, '#ff9100');
            } else if (key === 'missile') {
                B.bullets.push({ type: 'missile', x: gx, y: gy, ang, speed: M.speed, range: M.range, dmg: M.dmg, owner: 'player', source: key, track: true, trail: true, dead: false });
                muzz(gx, gy, '#b388ff');
            }
            ship.cds[m.key] = 1 / M.rate;
            ship.energy -= M.energy * .5;
            fired = true;
        }
        // 无武器/无能量时提示
        if (!fired) flash(`⚠️ 无${M.name}可用或能量不足`);
    }

    function modAtWorld(ship, wx, wy) {
        const lx = (wx - ship.x) * Math.cos(ship.ang) + (wy - ship.y) * Math.sin(ship.ang);
        const ly = -(wx - ship.x) * Math.sin(ship.ang) + (wy - ship.y) * Math.cos(ship.ang);
        let best = null, bd = 1e9;
        for (const m of ship.mods) {
            if (m.hp <= 0) continue;
            const d = Math.hypot(lx - m.wx, ly - m.wy);
            if (d < CELL * .8 && d < bd) { bd = d; best = m; }
        }
        return best;
    }

    function rayHitShip(x, y, ang, range, ship) {
        let best = null;
        for (const m of ship.mods) {
            if (m.hp <= 0) continue;
            const gx = ship.x + m.wx * Math.cos(ship.ang) - m.wy * Math.sin(ship.ang);
            const gy = ship.y + m.wx * Math.sin(ship.ang) + m.wy * Math.cos(ship.ang);
            const dx = gx - x, dy = gy - y;
            const t = dx * Math.cos(ang) + dy * Math.sin(ang);
            if (t < 0 || t > range) continue;
            const perp = Math.abs(-dx * Math.sin(ang) + dy * Math.cos(ang));
            if (perp < CELL * .62) {
                if (!best || t < best.dist) best = { mod: m, dist: t };
            }
        }
        return best;
    }

    function damageShip(ship, mod, dmg, hx, hy) {
        if (!mod || mod.hp <= 0) return;
        if (ship.shield > 0) {
            const abs = Math.min(ship.shield, dmg * .85);
            ship.shield -= abs;
            dmg -= abs;
            if (dmg <= 0) { ripple(hx, hy); return; }
        }
        mod.hp -= dmg;
        ship.flash = .12;
        if (mod.hp <= 0) {
            boom(hx, hy, 14, MODULES[mod.key].color);
            recomputeShip(ship);
        }
    }

    function recomputeShip(ship) {
        let thrust = 0, power = 0, store = 0;
        for (const m of ship.mods) {
            if (m.hp <= 0) continue;
            thrust += MODULES[m.key].thrust || 0;
            power += MODULES[m.key].power || 0;
            store += MODULES[m.key].store || 0;
        }
        ship.thrust = thrust;
        ship.power = power;
        ship.store = store;
        ship.mass = ship.mods.filter(m => m.hp > 0).length * 6 + 10;
    }

    // ===== 粒子特效 =====
    function boom(x, y, n, color) {
        const B = battle;
        if (!B) return;
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 30 + Math.random() * 140;
            B.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .3 + Math.random() * .55, maxLife: .85, color, size: 1 + Math.random() * 2.5 });
        }
        B.particles.push({ x, y, vx: 0, vy: 0, life: .3, maxLife: .3, color: '#fff', size: 3, flash: true });
    }
    function spark(x, y, color) {
        const B = battle;
        if (!B) return;
        for (let i = 0; i < 5; i++) {
            const a = Math.random() * Math.PI * 2;
            B.particles.push({ x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: .12 + Math.random() * .18, maxLife: .3, color, size: 1.2 });
        }
    }
    function muzz(x, y, color) {
        const B = battle;
        if (!B) return;
        for (let i = 0; i < 7; i++) {
            const a = Math.random() * Math.PI * 2;
            B.particles.push({ x: x + Math.cos(a) * 4, y: y + Math.sin(a) * 4, vx: Math.cos(a) * 50, vy: Math.sin(a) * 50, life: .08 + Math.random() * .1, maxLife: .2, color, size: 1.5 });
        }
    }
    function ripple(x, y) {
        const B = battle;
        if (!B) return;
        B.particles.push({ x, y, vx: 0, vy: 0, life: .3, maxLife: .3, color: '#40c4ff', size: 3, ring: true, r: 2 });
    }

    // ===== 战斗渲染 (科幻) =====
    let resultBtns = [];

    function drawBtn(x, y, w, h, label, cb) {
        wctx.fillStyle = 'rgba(20,35,70,.92)';
        wctx.strokeStyle = '#7aa8ff';
        wctx.lineWidth = 2;
        wctx.beginPath();
        wctx.roundRect(x, y, w, h, 8);
        wctx.fill(); wctx.stroke();
        wctx.fillStyle = '#fff';
        wctx.font = 'bold 14px Consolas,monospace';
        wctx.textAlign = 'center';
        wctx.textBaseline = 'middle';
        wctx.fillText(label, x + w / 2, y + h / 2 + 1);
        resultBtns.push({ x, y, w, h, cb });
    }

    wcv.addEventListener('click', e => {
        if (!battle || !battle.result) return;
        const r = wcv.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * BATTLE_W;
        const cy = (e.clientY - r.top) / r.height * BATTLE_H;
        for (const b of resultBtns) {
            if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) { b.cb(); break; }
        }
    });

    function drawBattle() {
        const B = battle;
        if (!B) return;
        wctx.clearRect(0, 0, BATTLE_W, BATTLE_H);
        resultBtns = [];
        // 缩放 (以屏幕中心为原点)
        wctx.save();
        wctx.translate(BATTLE_W / 2, BATTLE_H / 2);
        wctx.scale(battleZoom, battleZoom);
        wctx.translate(-BATTLE_W / 2, -BATTLE_H / 2);
        // 摄像机
        const camX = B.player.x, camY = B.player.y;
        const ox = BATTLE_W / 2 - camX, oy = BATTLE_H / 2 - camY;

        // 星云
        for (const nb of B.nebulas) {
            const g = wctx.createRadialGradient(nb.x + ox, nb.y + oy, 0, nb.x + ox, nb.y + oy, nb.r);
            g.addColorStop(0, `hsla(${nb.hue},80%,45%,.10)`);
            g.addColorStop(1, 'hsla(0,0%,0%,0)');
            wctx.fillStyle = g;
            wctx.fillRect(nb.x + ox - nb.r, nb.y + oy - nb.r, nb.r * 2, nb.r * 2);
        }
        // 星星
        for (const s of B.stars) {
            const a = .35 + .45 * Math.sin(B.time * 2 + s.tw);
            wctx.fillStyle = s.c;
            wctx.globalAlpha = Math.max(.1, a);
            wctx.fillRect(s.x + ox, s.y + oy, s.s, s.s);
            wctx.globalAlpha = 1;
        }
        // 网格背景 (深空参考)
        wctx.strokeStyle = 'rgba(64,196,255,.05)';
        wctx.lineWidth = 1;
        const gs = 64;
        for (let gx = Math.floor(camX / gs) * gs; gx < camX + BATTLE_W / 2 + gs; gx += gs) {
            const sx = gx + ox;
            wctx.beginPath(); wctx.moveTo(sx, 0); wctx.lineTo(sx, BATTLE_H); wctx.stroke();
        }
        for (let gy = Math.floor(camY / gs) * gs; gy < camY + BATTLE_H / 2 + gs; gy += gs) {
            const sy = gy + oy;
            wctx.beginPath(); wctx.moveTo(0, sy); wctx.lineTo(BATTLE_W, sy); wctx.stroke();
        }

        // 敌舰
        for (const e of B.enemies) if (!e.dead) drawShip(wctx, e, ox, oy);
        // 玩家
        if (!B.player.dead) drawShip(wctx, B.player, ox, oy);

        // 子弹
        for (const b of B.bullets) {
            const sx = b.x + ox, sy = b.y + oy;
            if (b.type === 'laser') {
                const len = b.hitDist !== undefined ? b.hitDist : b.range;
                const ex = sx + Math.cos(b.ang) * len, ey = sy + Math.sin(b.ang) * len;
                wctx.strokeStyle = 'rgba(255,60,60,.12)'; wctx.lineWidth = 9;
                wctx.beginPath(); wctx.moveTo(sx, sy); wctx.lineTo(ex, ey); wctx.stroke();
                wctx.strokeStyle = 'rgba(255,90,90,.5)'; wctx.lineWidth = 4;
                wctx.beginPath(); wctx.moveTo(sx, sy); wctx.lineTo(ex, ey); wctx.stroke();
                wctx.strokeStyle = '#ffd0d0'; wctx.lineWidth = 1.5;
                wctx.beginPath(); wctx.moveTo(sx, sy); wctx.lineTo(ex, ey); wctx.stroke();
            } else if (b.type === 'missile') {
                wctx.save();
                wctx.translate(sx, sy); wctx.rotate(b.ang);
                wctx.shadowColor = '#b388ff'; wctx.shadowBlur = 8;
                wctx.fillStyle = '#b388ff';
                wctx.fillRect(-4, -2, 8, 4);
                wctx.shadowBlur = 0;
                wctx.fillStyle = '#ff9100';
                wctx.fillRect(-5, -1, 2, 2);
                wctx.restore();
            } else {
                wctx.shadowColor = '#ff9100'; wctx.shadowBlur = 6;
                wctx.fillStyle = '#ffc07a';
                wctx.fillRect(sx - 2.5, sy - 2.5, 5, 5);
                wctx.shadowBlur = 0;
            }
        }

        // 粒子
        for (const pt of B.particles) {
            const a = Math.max(0, pt.life / pt.maxLife);
            if (pt.ring) {
                wctx.strokeStyle = `rgba(64,196,255,${a})`;
                wctx.lineWidth = 2.5 * a;
                wctx.beginPath(); wctx.arc(pt.x + ox, pt.y + oy, pt.r, 0, Math.PI * 2); wctx.stroke();
            } else if (pt.flash) {
                wctx.fillStyle = `rgba(255,255,255,${a})`;
                wctx.beginPath(); wctx.arc(pt.x + ox, pt.y + oy, pt.size * (1.6 - a * .6), 0, Math.PI * 2); wctx.fill();
            } else {
                wctx.fillStyle = pt.color;
                wctx.globalAlpha = a;
                wctx.fillRect(pt.x + ox - pt.size / 2, pt.y + oy - pt.size / 2, pt.size, pt.size);
                wctx.globalAlpha = 1;
            }
        }

        // 结果横幅 (在缩放变换外, 保证按钮可点击)
        wctx.restore();
        if (B.result) {
            wctx.fillStyle = 'rgba(3,8,25,.75)';
            wctx.fillRect(0, BATTLE_H / 2 - 46, BATTLE_W, 100);
            wctx.font = 'bold 34px Consolas,monospace';
            wctx.textAlign = 'center';
            wctx.fillStyle = B.result === 'win' ? '#69f0ae' : '#ff5252';
            wctx.shadowColor = B.result === 'win' ? '#69f0ae' : '#ff5252';
            wctx.shadowBlur = 18;
            wctx.fillText(B.result === 'win' ? '🏆 胜利!' : '💥 战舰被摧毁', BATTLE_W / 2, BATTLE_H / 2 + 8);
            wctx.shadowBlur = 0;
            wctx.font = '14px Consolas,monospace';
            wctx.fillStyle = '#9ad1ff';
            wctx.fillText('R 再来一局 · B 返回建造', BATTLE_W / 2, BATTLE_H / 2 + 32);
            const bw = 150, bh = 34, by = BATTLE_H / 2 + 42;
            drawBtn(BATTLE_W / 2 - bw - 10, by, bw, bh, '🔄 再来一局', () => startBattle());
            drawBtn(BATTLE_W / 2 + 10, by, bw, bh, '🛠️ 返回建造', () => switchMode('build'));
        }

        // HUD
        const p = B.player;
        const einfo = B.enemies.filter(e => !e.dead).map(e => {
            const d = Math.round(Math.hypot(e.x - p.x, e.y - p.y));
            return `${e.name}<b style="color:#ff8a80">${d}px</b>`;
        }).join(' ');
        hud.innerHTML = `
            <span>❤️ <b style="color:#69f0ae">${p.mods.filter(m => m.hp > 0).length}</b>/${p.mods.length}</span>
            <span>🛡️ <b style="color:#40c4ff">${Math.round(p.shield)}</b>/${p.shieldMax}</span>
            <span>⚡ <b style="color:#ffeb3b">${p.energy.toFixed(0)}</b></span>
            <span>🚀 <b style="color:#80d8ff">${p.thrust}</b></span>
            <span>⚔️ ${einfo || '无目标'}</span>
            <span style="color:${weaponMode === 'auto' ? '#69f0ae' : '#ffd54a'}">${weaponMode === 'auto' ? '🔄 自动' : `🎮 [${(bindings.laser || '?').toUpperCase()}]激光 [${(bindings.cannon || '?').toUpperCase()}]加农 [${(bindings.missile || '?').toUpperCase()}]导弹`}</span>`;
    }

    function drawShip(ctx, ship, ox, oy) {
        ctx.save();
        ctx.translate(ship.x + ox, ship.y + oy);
        ctx.rotate(ship.ang);
        // 护盾 (六边形网格风格)
        if (ship.shield > 0) {
            const r = shipRadius(ship) + 6;
            const pulse = .22 + .12 * Math.sin(battle.time * 3);
            ctx.strokeStyle = `rgba(64,196,255,${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(64,196,255,.05)';
            ctx.fill();
            // 六边形网格
            ctx.strokeStyle = `rgba(64,196,255,${pulse * .6})`;
            ctx.lineWidth = 1;
            for (let k = 0; k < 6; k++) {
                const a = battle.time * .6 + k * Math.PI / 3;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * r * .72, Math.sin(a) * r * .72);
                ctx.lineTo(Math.cos(a + .5) * r, Math.sin(a + .5) * r);
                ctx.stroke();
            }
        }
        // 模块 (发光)
        for (const m of ship.mods) {
            if (m.hp <= 0) continue;
            const M = MODULES[m.key];
            ctx.shadowColor = M.glow;
            ctx.shadowBlur = 4;
            ctx.drawImage(textures[m.key], m.wx, m.wy, CELL, CELL);
            ctx.shadowBlur = 0;
            if (m.hp < m.maxHp * .4) {
                ctx.fillStyle = `rgba(255,60,60,${.3 + .2 * Math.sin(battle.time * 8)})`;
                ctx.fillRect(m.wx, m.wy, CELL, CELL);
            }
        }
        // 受击闪白
        if (ship.flash > 0) {
            ctx.fillStyle = `rgba(255,255,255,${ship.flash * 4})`;
            for (const m of ship.mods) if (m.hp > 0) ctx.fillRect(m.wx, m.wy, CELL, CELL);
            ship.flash -= 1 / 60;
        }
        // 推进器火焰 (脉冲)
        for (const m of ship.mods) {
            if (m.key !== 'thruster' || m.hp <= 0) continue;
            const flick = 5 + Math.sin(battle.time * 18 + m.x) * 3 + Math.random() * 3;
            ctx.shadowColor = '#ff9100';
            ctx.shadowBlur = 8;
            ctx.fillStyle = 'rgba(255,120,40,.9)';
            ctx.fillRect(m.wx + 2, m.wy + CELL / 2 - 2.5, flick, 5);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffeb3b';
            ctx.fillRect(m.wx + 2, m.wy + CELL / 2 - 1, flick * .5, 2);
        }
        ctx.restore();
    }

    // ===== 输入 =====
    const keys = {};
    function onKey(e, down) {
        const k = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
        if (k === 'arrowup') keys.w = down;
        else if (k === 'arrowdown') keys.s = down;
        else if (k === 'arrowleft') keys.a = down;
        else if (k === 'arrowright') keys.d = down;
        else keys[k] = down;
        if (down && mode === 'battle' && battle) {
            if (k === 'r' && battle.result) startBattle();
            if (k === 'b' && battle.result) switchMode('build');
            // 手动模式: 按绑定键开火
            if (weaponMode === 'manual' && !battle.result) {
                for (const wk in bindings) {
                    if (bindings[wk] === k && battle.player) manualFire(battle.player, wk);
                }
            }
        }
    }
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup', e => onKey(e, false));
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

    // 战斗鼠标瞄准
    wcv.addEventListener('mousemove', e => {
        if (mode !== 'battle' || !battle) return;
        const r = wcv.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * BATTLE_W;
        const cy = (e.clientY - r.top) / r.height * BATTLE_H;
        // 屏幕 → 世界
        aim.x = cx - BATTLE_W / 2 + battle.player.x;
        aim.y = cy - BATTLE_H / 2 + battle.player.y;
    });
    // 战斗滚轮缩放 (摄像机倍率, 简化: 缩放HUD不影响, 先做视野)
    wcv.addEventListener('wheel', e => {
        e.preventDefault();
        // 战斗缩放: 全局 zoom 变量 (用于渲染缩放, 简化: 调整摄像机显示)
        // 直接放大/缩小玩家船显示 (通过CSS transform 不现实, 用 scale 变量)
        battleZoom = Math.max(.6, Math.min(1.8, battleZoom * (e.deltaY < 0 ? 1.12 : .89)));
        zoomLabel.textContent = Math.round(battleZoom * 100) + '%';
    }, { passive: false });

    // ===== 模式切换 =====
    let battleZoom = 1;
    function switchMode(m) {
        mode = m;
        bcv.style.display = m === 'build' ? 'block' : 'none';
        wcv.style.display = m === 'battle' ? 'block' : 'none';
        hud.style.display = m === 'battle' ? 'flex' : 'none';
        modeLabel.textContent = m === 'build' ? '建造模式' : '战斗模式';
        container.querySelector('#sf-panel').style.display = m === 'build' ? 'flex' : 'none';
        zoomLabel.textContent = Math.round((m === 'build' ? buildZoom : battleZoom) * 100) + '%';
        if (m === 'build') drawBuild();
    }
    container.querySelector('#sf-build').onclick = () => switchMode('build');
    container.querySelector('#sf-battle').onclick = startBattle;
    // 武器模式切换
    const wmodeBtn = container.querySelector('#sf-wmode');
    wmodeBtn.onclick = () => {
        weaponMode = weaponMode === 'auto' ? 'manual' : 'auto';
        wmodeBtn.textContent = weaponMode === 'auto' ? '🎮 自动' : '🎮 手动';
        wmodeBtn.style.borderColor = weaponMode === 'auto' ? '#69f0ae' : '#ffd54a';
        wmodeBtn.style.color = weaponMode === 'auto' ? '#b9f6ca' : '#ffe082';
        flash(weaponMode === 'auto' ? '🔄 自动开火模式' : `🎮 手动开火: [${bindings.laser.toUpperCase()}]激光 [${bindings.cannon.toUpperCase()}]加农 [${bindings.missile.toUpperCase()}]导弹`);
    };
    container.querySelector('#sf-keys').onclick = openKeyEditor;

    // ===== 主循环 =====
    function frame(ts) {
        raf = requestAnimationFrame(frame);
        try {
            const dt = Math.min(.05, (ts - lastTs) / 1000 || .016);
            lastTs = ts;
            if (mode === 'battle' && battle) {
                updateBattle(dt);
                drawBattle();
            } else {
                drawBuild();
            }
        } catch (err) {
            console.error('星舰工坊帧异常:', err);
        }
    }

    // ===== 清理 =====
    function cleanup() {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('keyup', onKey);
        window.removeEventListener('blur', onKey);
        const btns = container.querySelectorAll('button');
        for (const b of btns) b.onclick = null;
    }

    // ===== 启动 =====
    switchMode('build');
    drawBuild();
    lastTs = performance.now();
    raf = requestAnimationFrame(frame);

    // 调试钩子
    window.__sf = {
        get battle() { return battle; },
        get mode() { return mode; },
        drawBattle, updateBattle, drawBuild,
        grid: () => grid,
    };

    return { cleanup };
}
