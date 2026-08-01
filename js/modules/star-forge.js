export const id = 'star-forge';
export const name = '星舰工坊';
export const icon = '🚀';
export const description = '像素风模块化飞船建造与战斗，Cosmoteer式拼舰，Reassembly式激战';
export const category = '趣味游戏';
export const enabled = true;

export function init(container) {
    // ===== 常量 =====
    const GRID = 32;          // 建造网格 32×32
    const CELL = 16;          // 模块像素尺寸
    const CANVAS = 512;       // 建造画布
    const BATTLE_W = 960, BATTLE_H = 640;

    // ===== 模块定义 =====
    const MODULES = {
        core:      { name: '核心',     icon: '⬛', color: '#ffd54a', hp: 200, desc: '战舰心脏，被摧毁即失败' },
        armor:     { name: '装甲',     icon: '⬜', color: '#b8c4d4', hp: 90,  desc: '廉价结实的外壳' },
        thruster:  { name: '推进器',   icon: '🔵', color: '#4fc3f7', hp: 50,  thrust: 130, desc: '提供推进力(0.13kN)' },
        laser:     { name: '激光炮',   icon: '🔴', color: '#ff5252', hp: 60,  dmg: 9, rate: 2.2, energy: 2.5, range: 340, desc: '高射速光束' },
        cannon:    { name: '加农炮',   icon: '🟠', color: '#ff9e40', hp: 70,  dmg: 26, rate: 0.65, energy: 1.8, range: 420, speed: 300, desc: '重弹丸' },
        missile:   { name: '导弹舱',   icon: '🟣', color: '#b388ff', hp: 55,  dmg: 42, rate: 0.35, energy: 3.2, range: 500, speed: 190, desc: '追踪导弹' },
        shield:    { name: '护盾',     icon: '🔷', color: '#40c4ff', hp: 100, shield: 550, energy: 4, desc: '生成护盾泡' },
        reactor:   { name: '反应堆',   icon: '⚡', color: '#ffeb3b', hp: 70,  power: 12, desc: '发电 12/s' },
        capacitor: { name: '电容',     icon: '🔋', color: '#69f0ae', hp: 60,  store: 260, desc: '储电 260' },
    };
    const MODULE_KEYS = Object.keys(MODULES);

    // ===== DOM 构建 =====
    container.innerHTML = `
    <div style="max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" id="sf-battle">⚔️ 战斗</button>
        <button class="btn" id="sf-build">🛠️ 建造</button>
        <span style="font-size:12px;color:var(--color-text-secondary)" id="sf-mode">建造模式</span>
        <span style="margin-left:auto"></span>
        <button class="btn" id="sf-save">💾 保存设计</button>
        <button class="btn" id="sf-load">📂 加载设计</button>
        <button class="btn" id="sf-example">✨ 示例舰</button>
        <button class="btn" id="sf-clear">🗑️ 清空</button>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div id="sf-panel" style="flex:0 0 168px;display:flex;flex-direction:column;gap:6px">
          <div style="font-size:12px;font-weight:600;color:var(--color-text-secondary)">模块面板</div>
          <div id="sf-modules" style="display:grid;grid-template-columns:1fr 1fr;gap:4px"></div>
          <div id="sf-info" style="font-size:11px;color:var(--color-text-secondary);background:rgba(255,255,255,.5);border-radius:8px;padding:6px;line-height:1.6"></div>
          <div style="font-size:11px;color:var(--color-text-secondary)">🖱️ 左键放置 / 右键删除<br>⌨️ 战斗中 WASD 移动<br>鼠标方向=舰首朝向</div>
        </div>
        <div style="flex:1;min-width:520px">
          <canvas id="sf-build-cv" width="512" height="512" style="width:100%;image-rendering:pixelated;border-radius:10px;border:2px solid rgba(0,0,0,.15);background:#0b1026;display:block"></canvas>
          <canvas id="sf-battle-cv" width="960" height="640" style="width:100%;image-rendering:pixelated;border-radius:10px;border:2px solid rgba(0,0,0,.15);background:#05081a;display:none"></canvas>
          <div id="sf-hud" style="display:none;font-size:12px;color:#cfe8ff;margin-top:6px;display:flex;gap:16px;flex-wrap:wrap"></div>
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

    // ===== 状态 =====
    let mode = 'build';                 // build | battle
    let selected = 'core';
    let grid = Array.from({ length: GRID }, () => new Array(GRID).fill(null));
    let battle = null;                  // 战斗状态
    let raf = 0;
    let lastTs = 0;

    // ===== 像素纹理生成 (8×8 程序化纹理) =====
    function makeTexture(key) {
        const t = document.createElement('canvas');
        t.width = 8; t.height = 8;
        const c = t.getContext('2d');
        const M = MODULES[key];
        c.fillStyle = M.color;
        c.fillRect(0, 0, 8, 8);
        // 边框阴影
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.fillRect(0, 0, 8, 1); c.fillRect(0, 7, 8, 1); c.fillRect(0, 0, 1, 8); c.fillRect(7, 0, 1, 8);
        c.fillStyle = 'rgba(255,255,255,.3)';
        c.fillRect(1, 1, 6, 1);
        // 类型细节
        if (key === 'core') {
            c.fillStyle = '#fff'; c.fillRect(2, 3, 4, 2); c.fillStyle = '#7a5c00'; c.fillRect(3, 3, 1, 2);
        } else if (key === 'thruster') {
            c.fillStyle = '#ff9e40'; c.fillRect(2, 6, 4, 2); c.fillStyle = '#fff'; c.fillRect(3, 6, 2, 1);
        } else if (key === 'laser') {
            c.fillStyle = '#ffd1d1'; c.fillRect(3, 2, 2, 2);
        } else if (key === 'cannon') {
            c.fillStyle = '#5c3d00'; c.fillRect(3, 2, 2, 3);
        } else if (key === 'missile') {
            c.fillStyle = '#e8d5ff'; c.fillRect(2, 3, 4, 2); c.fillStyle = '#ff5252'; c.fillRect(3, 3, 2, 1);
        } else if (key === 'shield') {
            c.fillStyle = '#e1f5fe'; c.fillRect(2, 2, 2, 4); c.fillRect(4, 2, 2, 4);
        } else if (key === 'reactor') {
            c.fillStyle = '#fff'; c.fillRect(3, 1, 2, 2); c.fillRect(3, 5, 2, 2);
        } else if (key === 'capacitor') {
            c.fillStyle = '#ffffff'; c.fillRect(2, 2, 1, 4); c.fillRect(5, 2, 1, 4);
        } else if (key === 'armor') {
            c.fillStyle = 'rgba(255,255,255,.15)'; c.fillRect(1, 3, 6, 2);
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
        b.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border-radius:8px;border:2px solid ${M.color};background:rgba(255,255,255,.55);cursor:pointer;font-size:10px;color:#333`;
        b.innerHTML = `<span style="font-size:20px">${M.icon}</span><span>${M.name}</span>`;
        b.onclick = () => {
            selected = k;
            document.querySelectorAll('#sf-modules button').forEach(x => x.style.opacity = .55);
            b.style.opacity = 1;
            infoBox.innerHTML = `<b style="color:${M.color}">${M.icon} ${M.name}</b><br>${M.desc}<br>${M.hp ? 'HP ' + M.hp : ''}${M.thrust ? ' · 推力 ' + M.thrust : ''}${M.dmg ? ' · 伤害 ' + M.dmg : ''}${M.power ? ' · 发电 ' + M.power + '/s' : ''}${M.store ? ' · 储能 ' + M.store : ''}${M.energy ? ' · 耗电 ' + M.energy + '/s' : ''}`;
        };
        panel.appendChild(b);
    });
    panel.firstChild.click();

    // ===== 建造交互 =====
    bcv.addEventListener('mousemove', e => {
        const r = bcv.getBoundingClientRect();
        const gx = Math.floor((e.clientX - r.left) / r.width * GRID);
        const gy = Math.floor((e.clientY - r.top) / r.height * GRID);
        if (e.buttons & 1) place(gx, gy);
        if (e.buttons & 2) remove(gx, gy);
        drawBuild();
    });
    bcv.addEventListener('mousedown', e => {
        const r = bcv.getBoundingClientRect();
        const gx = Math.floor((e.clientX - r.left) / r.width * GRID);
        const gy = Math.floor((e.clientY - r.top) / r.height * GRID);
        if (e.button === 0) place(gx, gy);
        if (e.button === 2) remove(gx, gy);
        drawBuild();
    });
    bcv.addEventListener('contextmenu', e => e.preventDefault());

    function place(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return;
        if (grid[gy][gx] === selected) { grid[gy][gx] = null; return; }
        grid[gy][gx] = selected;
    }
    function remove(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return;
        grid[gy][gx] = null;
    }

    // ===== 建造渲染 =====
    function drawBuild() {
        bctx.clearRect(0, 0, CANVAS, CANVAS);
        // 星空底
        bctx.fillStyle = '#0b1026';
        bctx.fillRect(0, 0, CANVAS, CANVAS);
        // 网格线
        bctx.strokeStyle = 'rgba(120,160,255,.12)';
        bctx.lineWidth = 1;
        for (let i = 0; i <= GRID; i++) {
            bctx.beginPath(); bctx.moveTo(i * CELL, 0); bctx.lineTo(i * CELL, CANVAS); bctx.stroke();
            bctx.beginPath(); bctx.moveTo(0, i * CELL); bctx.lineTo(CANVAS, i * CELL); bctx.stroke();
        }
        // 模块
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                if (grid[y][x]) {
                    bctx.drawImage(textures[grid[y][x]], x * CELL, y * CELL, CELL, CELL);
                }
            }
        }
        // 悬停预览
        // (鼠标位置由 drawBuild 的调用者传递——简化: 记录 hover)
        if (hoverCell && hoverCell.x >= 0) {
            const { x, y } = hoverCell;
            if (grid[y][x]) {
                bctx.strokeStyle = 'rgba(255,80,80,.8)';
            } else {
                bctx.strokeStyle = 'rgba(255,255,255,.6)';
                bctx.drawImage(textures[selected], x * CELL, y * CELL, CELL, CELL);
                bctx.globalAlpha = .45;
                bctx.fillStyle = '#fff';
                bctx.fillRect(x * CELL, y * CELL, CELL, CELL);
                bctx.globalAlpha = 1;
            }
            bctx.lineWidth = 2;
            bctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
        }
        // 中心十字标记 (便于对称设计)
        bctx.strokeStyle = 'rgba(255,255,255,.25)';
        bctx.beginPath();
        bctx.moveTo(CANVAS / 2, CANVAS / 2 - 8); bctx.lineTo(CANVAS / 2, CANVAS / 2 + 8);
        bctx.moveTo(CANVAS / 2 - 8, CANVAS / 2); bctx.lineTo(CANVAS / 2 + 8, CANVAS / 2);
        bctx.stroke();
    }
    let hoverCell = { x: -1, y: -1 };
    bcv.addEventListener('mousemove', e => {
        const r = bcv.getBoundingClientRect();
        hoverCell = { x: Math.floor((e.clientX - r.left) / r.width * GRID), y: Math.floor((e.clientY - r.top) / r.height * GRID) };
    });
    bcv.addEventListener('mouseleave', () => { hoverCell = { x: -1, y: -1 }; drawBuild(); });

    // ===== 设计保存/加载 =====
    function safeGet(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

    container.querySelector('#sf-save').onclick = () => {
        const data = grid.map(row => row.map(c => c || '.').join('')).join('|');
        safeSet('starforge-design', data);
        alert('✅ 设计已保存到浏览器');
    };
    container.querySelector('#sf-load').onclick = () => {
        const data = safeGet('starforge-design', '');
        if (!data) { alert('没有已保存的设计'); return; }
        const rows = data.split('|');
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                const ch = rows[y] ? rows[y][x] : '.';
                grid[y][x] = ch !== '.' ? ch : null;
            }
        }
        drawBuild();
    };
    container.querySelector('#sf-clear').onclick = () => {
        grid = Array.from({ length: GRID }, () => new Array(GRID).fill(null));
        drawBuild();
    };
    container.querySelector('#sf-example').onclick = () => {
        grid = Array.from({ length: GRID }, () => new Array(GRID).fill(null));
        // 示例舰: 中心核心 + 反应堆 + 护盾 + 武器 + 装甲 + 推进器
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
        // 推进器尾部
        set(c - 1, c + 3, 'thruster'); set(c + 1, c + 3, 'thruster');
        drawBuild();
    };
    function set(x, y, v) { if (x >= 0 && y >= 0 && x < GRID && y < GRID) grid[y][x] = v; }

    // ===== 战斗系统 =====
    function shipFromGrid(g, isPlayer) {
        const mods = [];
        for (let y = 0; y < GRID; y++) {
            for (let x = 0; x < GRID; x++) {
                if (g[y][x]) {
                    const M = MODULES[g[y][x]];
                    if (!M) { console.warn('星舰工坊: 无效模块 key =', JSON.stringify(g[y][x]), 'at', x, y); continue; }
                    mods.push({
                        key: g[y][x], x, y,
                        hp: M.hp, maxHp: M.hp,
                        wx: (x - GRID / 2) * CELL, wy: (y - GRID / 2) * CELL,
                    });
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
            cds: {},            // 武器CD: key → 剩余
            dead: false,
        };
    }

    // AI 敌舰模板 (单字符代号: C=core A=armor T=thruster L=laser O=cannon M=missile S=shield R=reactor B=capacitor)
    const TPL_CODE = { C: 'core', A: 'armor', T: 'thruster', L: 'laser', O: 'cannon', M: 'missile', S: 'shield', R: 'reactor', B: 'capacitor' };
    const ENEMY_TEMPLATES = [
        { name: '侦察艇', grid: [
            '......',
            '...T..',
            '.A..A.',
            '.L.LL.',
            '.C.R..',
            '.L.LL.',
            '.A..A.',
            '...T..',
        ]},
        { name: '炮舰', grid: [
            '.......',
            '..A.A..',
            '.O.C.R.',
            '.O.B...',
            '.O.C.R.',
            '..A.A..',
            '..T.T..',
        ]},
        { name: '重装舰', grid: [
            '.........',
            '..A.A.A..',
            '.A.M.C.C.',
            '.M.S.R...',
            '.M.S.R...',
            '.A.M.C.C.',
            '..A.A.A..',
            '.T.T.T...',
        ]},
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
        // 校验核心
        let hasCore = false;
        for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (grid[y][x] === 'core') hasCore = true;
        if (!hasCore) { alert('⚠️ 请先放置核心模块!'); return; }

        battle = {
            player: shipFromGrid(grid, true),
            enemies: [],
            bullets: [],
            particles: [],
            stars: [],
            time: 0,
            result: null,
        };
        // 星空
        for (let i = 0; i < 90; i++) {
            battle.stars.push({ x: Math.random() * BATTLE_W, y: Math.random() * BATTLE_H, s: Math.random() * 1.6 + .4, tw: Math.random() * 6.28 });
        }
        // 敌舰
        const n = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
            const tpl = ENEMY_TEMPLATES[Math.floor(Math.random() * ENEMY_TEMPLATES.length)];
            const ship = shipFromGrid(templateToGrid(tpl), false);
            ship.name = tpl.name;
            const ang = Math.random() * Math.PI * 2;
            ship.x = battle.player.x + Math.cos(ang) * (300 + Math.random() * 120);
            ship.y = battle.player.y + Math.sin(ang) * (300 + Math.random() * 120);
            battle.enemies.push(ship);
        }
        // 玩家初始朝最近敌舰
        const pe = battle.enemies[0];
        if (pe) battle.player.ang = Math.atan2(pe.x - battle.player.x, -(pe.y - battle.player.y));
        switchMode('battle');
    }

    function shipScreenPos(ship) {
        // 玩家船固定在屏幕中心偏左, 摄像机跟随
        const camX = ship.x, camY = ship.y;
        return { camX, camY };
    }

    // 战斗更新
    function updateBattle(dt) {
        const B = battle;
        if (B.result) return;
        B.time += dt;
        const p = B.player;

        // 输入
        const thrustF = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
        const turnF = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
        if (p.thrust > 0) {
            const ax = Math.sin(p.ang) * p.thrust * thrustF * 60 / p.mass;
            const ay = -Math.cos(p.ang) * p.thrust * thrustF * 60 / p.mass;
            p.vx += ax * dt; p.vy += ay * dt;
        }
        p.ang += turnF * 2.2 * dt;

        // 能量: 产出 + 存储
        p.energy = Math.min(p.store + (p.power || 0) * 8, p.store + 200);
        p.energy += (p.power || 0) * dt;
        p.energy = Math.min(p.energy, p.store + 200);

        // 护盾充能
        const shields = p.mods.filter(m => m.key === 'shield' && m.hp > 0);
        if (shields.length) {
            p.shieldMax = shields.length * MODULES.shield.shield;
            if (p.energy > 1 && p.shield < p.shieldMax) {
                const drain = Math.min(40 * dt, p.energy, p.shieldMax - p.shield);
                p.energy -= drain;
                p.shield += drain;
            }
        } else { p.shield = 0; p.shieldMax = 0; }

        // 武器开火
        fireWeapons(p, dt, nearestEnemy(p.x, p.y));

        // 移动
        const damp = Math.pow(.3, dt);
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= damp; p.vy *= damp;

        // 敌舰 AI
        for (const e of B.enemies) {
            if (e.dead) continue;
            const dx = p.x - e.x, dy = p.y - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 60) {
                const want = Math.atan2(dx, -dy); // 朝向玩家
                let diff = want - e.ang;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                e.ang += Math.max(-1.6 * dt, Math.min(1.6 * dt, diff * 2.2 * dt * 5));
                if (Math.abs(diff) < .5 && e.thrust > 0) {
                    e.vx += Math.sin(e.ang) * e.thrust * 55 * dt / e.mass;
                    e.vy -= Math.cos(e.ang) * e.thrust * 55 * dt / e.mass;
                }
            }
            e.x += e.vx * dt; e.y += e.vy * dt;
            const d2 = Math.pow(.3, dt);
            e.vx *= d2; e.vy *= d2;
            e.energy += (e.power || 0) * dt;
            e.energy = Math.min(e.energy, e.store + 200);
            const es = e.mods.filter(m => m.key === 'shield' && m.hp > 0);
            if (es.length) {
                e.shieldMax = es.length * MODULES.shield.shield;
                if (e.energy > 1 && e.shield < e.shieldMax) {
                    const drain = Math.min(35 * dt, e.energy, e.shieldMax - e.shield);
                    e.energy -= drain; e.shield += drain;
                }
            } else { e.shield = 0; e.shieldMax = 0; }
            fireWeapons(e, dt, p);
        }

        // 子弹
        for (let i = B.bullets.length - 1; i >= 0; i--) {
            const b = B.bullets[i];
            if (b.dead) { B.bullets.splice(i, 1); continue; }
            // 追踪
            if (b.track) {
                const t = b.owner === 'player' ? nearestEnemy(b.x, b.y) : B.player;
                if (t) {
                    const want = Math.atan2(t.y - b.y, t.x - b.x);
                    b.ang += Math.max(-3 * dt, Math.min(3 * dt, want - b.ang));
                }
            }
            b.x += Math.cos(b.ang) * b.speed * dt;
            b.y += Math.sin(b.ang) * b.speed * dt;
            // 出界
            const cam = shipScreenPos(b.owner === 'player' ? B.player : B.player);
            if (Math.abs(b.x - cam.camX) > BATTLE_W || Math.abs(b.y - cam.camY) > BATTLE_H) { B.bullets.splice(i, 1); continue; }
            // 命中检测
            const targets = b.owner === 'player' ? B.enemies : [B.player];
            let hit = false;
            for (const t of targets) {
                if (t.dead) continue;
                if (b.type === 'laser') {
                    // 光束: 射线检测, 每帧扫描; 画到命中点或满射程
                    const hitInfo = rayHitShip(b.x, b.y, b.ang, b.range, t);
                    if (hitInfo) {
                        b.hitDist = hitInfo.dist;
                        damageShip(t, hitInfo.mod, b.dmg, b.x + Math.cos(b.ang) * hitInfo.dist, b.y + Math.sin(b.ang) * hitInfo.dist);
                        spark(b.x + Math.cos(b.ang) * hitInfo.dist, b.y + Math.sin(b.ang) * hitInfo.dist, MODULES[b.source].color);
                        hit = true;
                        break;
                    } else {
                        b.hitDist = b.range;
                    }
                } else {
                    const hr = shipHitRadius(t);
                    if (Math.hypot(b.x - t.x, b.y - t.y) < hr + 3) {
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
        }

        // 死亡检查
        for (const e of B.enemies) {
            if (!e.dead && !e.mods.some(m => m.key === 'core' && m.hp > 0)) {
                e.dead = true;
                for (const m of e.mods) boom(m.x, m.y, 8, MODULES[m.key].color);
            }
        }
        if (!p.dead && !p.mods.some(m => m.key === 'core' && m.hp > 0)) {
            p.dead = true;
            for (const m of p.mods) boom(m.x, m.y, 8, MODULES[m.key].color);
        }
        if (p.dead) B.result = 'lose';
        else if (B.enemies.every(e => e.dead)) B.result = 'win';
    }

    function fireWeapons(ship, dt, target) {
        const B = battle;
        if (!B) return;
        for (const m of ship.mods) {
            const M = MODULES[m.key];
            if (!M.dmg) continue; // 非武器
            if (m.hp <= 0) continue;
            ship.cds[m.key] = (ship.cds[m.key] || 0) - dt;
            if (ship.cds[m.key] > 0) continue;
            if (ship.energy < M.energy * .2) continue;
            // 索敌范围
            const tgt = target && !target.dead ? target : null;
            if (!tgt) continue;
            const gx = ship.x + m.wx * Math.cos(ship.ang) - m.wy * Math.sin(ship.ang);
            const gy = ship.y + m.wx * Math.sin(ship.ang) + m.wy * Math.cos(ship.ang);
            const dist = Math.hypot(tgt.x - gx, tgt.y - gy);
            if (dist > M.range) continue;
            const ang = Math.atan2(tgt.y - gy, tgt.x - gx);
            if (m.key === 'laser') {
                B.bullets.push({ type: 'laser', x: gx, y: gy, ang, speed: 0, range: M.range, dmg: M.dmg, owner: ship.isPlayer ? 'player' : 'enemy', source: m.key, dead: false });
                muzz(gx, gy, '#ff5252');
            } else if (m.key === 'cannon') {
                B.bullets.push({ type: 'cannon', x: gx, y: gy, ang, speed: M.speed, range: M.range, dmg: M.dmg, owner: ship.isPlayer ? 'player' : 'enemy', source: m.key, dead: false });
                muzz(gx, gy, '#ff9e40');
            } else if (m.key === 'missile') {
                B.bullets.push({ type: 'missile', x: gx, y: gy, ang, speed: M.speed, range: M.range, dmg: M.dmg, owner: ship.isPlayer ? 'player' : 'enemy', source: m.key, track: true, dead: false });
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

    function shipHitRadius(s) {
        return Math.max(16, s.mods.length * 3.2);
    }

    function modAtWorld(ship, wx, wy) {
        // 世界坐标 → 船体局部
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
        // 射线 vs 模块矩形 (简化: 圆)
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
        // 护盾吸收
        if (ship.shield > 0) {
            const abs = Math.min(ship.shield, dmg * .85);
            ship.shield -= abs;
            dmg -= abs;
            if (dmg <= 0) {
                ripple(hx, hy);
                return;
            }
        }
        mod.hp -= dmg;
        if (mod.hp <= 0) {
            boom(hx, hy, 12, MODULES[mod.key].color);
            // 重新统计属性
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
            const sp = 30 + Math.random() * 120;
            B.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .3 + Math.random() * .5, maxLife: .8, color, size: 1 + Math.random() * 2 });
        }
    }
    function spark(x, y, color) {
        const B = battle;
        if (!B) return;
        for (let i = 0; i < 4; i++) {
            const a = Math.random() * Math.PI * 2;
            B.particles.push({ x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, life: .12 + Math.random() * .15, maxLife: .3, color, size: 1 });
        }
    }
    function muzz(x, y, color) {
        const B = battle;
        if (!B) return;
        for (let i = 0; i < 6; i++) {
            const a = Math.random() * Math.PI * 2;
            B.particles.push({ x: x + Math.cos(a) * 4, y: y + Math.sin(a) * 4, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, life: .08 + Math.random() * .1, maxLife: .2, color, size: 1.5 });
        }
    }
    function ripple(x, y) {
        const B = battle;
        if (!B) return;
        B.particles.push({ x, y, vx: 0, vy: 0, life: .25, maxLife: .25, color: '#40c4ff', size: 3, ring: true, r: 0 });
    }

    // 结果按钮状态
    let resultBtns = [];

    function drawBtn(x, y, w, h, label, cb) {
        wctx.fillStyle = 'rgba(30,45,80,.9)';
        wctx.strokeStyle = '#7aa8ff';
        wctx.lineWidth = 2;
        wctx.beginPath();
        wctx.roundRect(x, y, w, h, 8);
        wctx.fill(); wctx.stroke();
        wctx.fillStyle = '#fff';
        wctx.font = 'bold 14px monospace';
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
            if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
                b.cb();
                break;
            }
        }
    });

    // ===== 战斗渲染 =====
    function drawBattle() {
        const B = battle;
        if (!B) return;
        wctx.clearRect(0, 0, BATTLE_W, BATTLE_H);
        resultBtns = [];
        // 星空
        for (const s of B.stars) {
            const a = .4 + .4 * Math.sin(B.time * 2 + s.tw);
            wctx.fillStyle = `rgba(200,220,255,${a})`;
            wctx.fillRect(s.x, s.y, s.s, s.s);
        }
        // 摄像机: 跟随玩家
        const camX = B.player.x, camY = B.player.y;
        const ox = BATTLE_W / 2 - camX, oy = BATTLE_H / 2 - camY;

        // 敌舰
        for (const e of B.enemies) drawShip(wctx, e, ox, oy);
        // 玩家
        if (!B.player.dead) drawShip(wctx, B.player, ox, oy);

        // 子弹
        for (const b of B.bullets) {
            const sx = b.x + ox, sy = b.y + oy;
            if (b.type === 'laser') {
                const len = b.hitDist !== undefined ? b.hitDist : b.range;
                const ex = sx + Math.cos(b.ang) * len, ey = sy + Math.sin(b.ang) * len;
                wctx.strokeStyle = 'rgba(255,80,80,.15)'; wctx.lineWidth = 7;
                wctx.beginPath(); wctx.moveTo(sx, sy); wctx.lineTo(ex, ey); wctx.stroke();
                wctx.strokeStyle = 'rgba(255,120,120,.5)'; wctx.lineWidth = 3;
                wctx.beginPath(); wctx.moveTo(sx, sy); wctx.lineTo(ex, ey); wctx.stroke();
                wctx.strokeStyle = '#fff'; wctx.lineWidth = 1;
                wctx.beginPath(); wctx.moveTo(sx, sy); wctx.lineTo(ex, ey); wctx.stroke();
            } else if (b.type === 'missile') {
                wctx.save();
                wctx.translate(sx, sy); wctx.rotate(b.ang);
                wctx.fillStyle = '#b388ff';
                wctx.fillRect(-4, -2, 8, 4);
                wctx.fillStyle = '#ff9e40';
                wctx.fillRect(-5, -1, 2, 2);
                wctx.restore();
            } else {
                wctx.fillStyle = '#ff9e40';
                wctx.fillRect(sx - 2, sy - 2, 4, 4);
            }
        }

        // 粒子
        for (const pt of B.particles) {
            const a = Math.max(0, pt.life / pt.maxLife);
            if (pt.ring) {
                pt.r = (pt.r || 0) + 160 * (1 / 60);
                wctx.strokeStyle = `rgba(64,196,255,${a})`;
                wctx.lineWidth = 2;
                wctx.beginPath(); wctx.arc(pt.x + ox, pt.y + oy, pt.r, 0, Math.PI * 2); wctx.stroke();
            } else {
                wctx.fillStyle = pt.color;
                wctx.globalAlpha = a;
                wctx.fillRect(pt.x + ox - pt.size / 2, pt.y + oy - pt.size / 2, pt.size, pt.size);
                wctx.globalAlpha = 1;
            }
        }

        // 结果横幅
        if (B.result) {
            wctx.fillStyle = 'rgba(0,0,0,.55)';
            wctx.fillRect(0, BATTLE_H / 2 - 44, BATTLE_W, 96);
            wctx.font = 'bold 34px monospace';
            wctx.textAlign = 'center';
            wctx.fillStyle = B.result === 'win' ? '#69f0ae' : '#ff5252';
            wctx.fillText(B.result === 'win' ? '🏆 胜利!' : '💥 战舰被摧毁', BATTLE_W / 2, BATTLE_H / 2 + 8);
            wctx.font = '15px monospace';
            wctx.fillStyle = '#cfe8ff';
            wctx.fillText('R 再来一局 · B 返回建造', BATTLE_W / 2, BATTLE_H / 2 + 34);
            // 可点击按钮
            const bw = 150, bh = 34, by = BATTLE_H / 2 + 44;
            drawBtn(BATTLE_W / 2 - bw - 10, by, bw, bh, '🔄 再来一局', () => startBattle());
            drawBtn(BATTLE_W / 2 + 10, by, bw, bh, '🛠️ 返回建造', () => switchMode('build'));
        }

        // HUD
        const p = B.player;
        hud.innerHTML = `
            <span>❤️ <b style="color:#69f0ae">${p.mods.filter(m => m.hp > 0).length}</b>/${p.mods.length} 模块</span>
            <span>🛡️ <b style="color:#40c4ff">${Math.round(p.shield)}</b>/${p.shieldMax}</span>
            <span>⚡ <b style="color:#ffeb3b">${p.energy.toFixed(0)}</b></span>
            <span>🔋 产 ${p.power}/s</span>
            <span>🚀 推力 ${p.thrust}</span>
            <span>⚔️ 敌舰 <b style="color:#ff5252">${B.enemies.filter(e => !e.dead).length}</b></span>`;
    }

    function drawShip(ctx, ship, ox, oy) {
        ctx.save();
        ctx.translate(ship.x + ox, ship.y + oy);
        ctx.rotate(ship.ang);
        // 护盾泡
        if (ship.shield > 0) {
            const r = Math.max(30, ship.mods.length * 3 + 14);
            ctx.strokeStyle = `rgba(64,196,255,${.25 + .15 * Math.sin(battle.time * 3)})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(64,196,255,.05)';
            ctx.fill();
        }
        // 模块
        for (const m of ship.mods) {
            if (m.hp <= 0) continue;
            ctx.drawImage(textures[m.key], m.wx, m.wy, CELL, CELL);
            // 受损闪烁
            if (m.hp < m.maxHp * .4) {
                ctx.fillStyle = 'rgba(255,60,60,.4)';
                ctx.fillRect(m.wx, m.wy, CELL, CELL);
            }
        }
        // 推进器火焰
        for (const m of ship.mods) {
            if (m.key !== 'thruster' || m.hp <= 0) continue;
            const flick = 4 + Math.random() * 6;
            ctx.fillStyle = 'rgba(255,158,64,.7)';
            ctx.fillRect(m.wx + 3, m.wy + CELL / 2 - 2, flick, 4);
            ctx.fillStyle = 'rgba(255,235,59,.8)';
            ctx.fillRect(m.wx + 3, m.wy + CELL / 2 - 1, flick * .5, 2);
        }
        ctx.restore();
    }

    // ===== 输入 =====
    const keys = {};
    function onKey(e, down) {
        const k = e.key.toLowerCase();
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
        // 方向键映射到 WASD
        if (k === 'arrowup') keys.w = down;
        else if (k === 'arrowdown') keys.s = down;
        else if (k === 'arrowleft') keys.a = down;
        else if (k === 'arrowright') keys.d = down;
        else keys[k] = down;
        if (down && mode === 'battle' && battle) {
            if (k === 'r' && battle.result) startBattle();
            if (k === 'b' && battle.result) switchMode('build');
        }
    }
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup', e => onKey(e, false));
    window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

    // ===== 模式切换 =====
    function switchMode(m) {
        mode = m;
        bcv.style.display = m === 'build' ? 'block' : 'none';
        wcv.style.display = m === 'battle' ? 'block' : 'none';
        hud.style.display = m === 'battle' ? 'flex' : 'none';
        modeLabel.textContent = m === 'build' ? '建造模式' : '战斗模式';
        container.querySelector('#sf-panel').style.display = m === 'build' ? 'flex' : 'none';
        if (m === 'build') drawBuild();
    }
    container.querySelector('#sf-build').onclick = () => switchMode('build');
    container.querySelector('#sf-battle').onclick = startBattle;

    // ===== 主循环 =====
    function frame(ts) {
        raf = requestAnimationFrame(frame);
        const dt = Math.min(.05, (ts - lastTs) / 1000 || .016);
        lastTs = ts;
        if (mode === 'battle' && battle) {
            updateBattle(dt);
            drawBattle();
        } else {
            drawBuild();
        }
    }

    // ===== 清理 =====
    function cleanup() {
        cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('keyup', onKey);
        window.removeEventListener('blur', onKey);
        bcv.removeEventListener('mousemove', drawBuild);
        bcv.removeEventListener('mousedown', drawBuild);
        bcv.removeEventListener('contextmenu', drawBuild);
        // 移除面板按钮事件
        const btns = container.querySelectorAll('button');
        for (const b of btns) b.onclick = null;
    }

    // ===== 启动 =====
    switchMode('build');
    drawBuild();
    lastTs = performance.now();
    raf = requestAnimationFrame(frame);

    return { cleanup };
}
