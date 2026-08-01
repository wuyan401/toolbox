export const id = 'element-lab';
export const name = '元素沙盒';
export const icon = '🧪';
export const description = '像素物理沙盒实验室：沙子/水/岩浆/蒸汽/酸/火药/种子/黑洞实时交互演算';
export const category = '趣味游戏';
export const enabled = true;

export function init(container) {
    // ===== 网格常量 =====
    const W = 240, H = 180;

    // ===== 元素定义 =====
    const E = {
        EMPTY: 0, SAND: 1, WATER: 2, STONE: 3, WOOD: 4, FIRE: 5, OIL: 6,
        LAVA: 7, STEAM: 8, ACID: 9, GUNPOWDER: 10, SEED: 11, PLANT: 12,
        ICE: 13, GLASS: 14, HOLE: 15, ASH: 16,
 };
    const ELEMS = [
        { id: E.SAND, name: '沙子', icon: '🏜️', color: [238, 201, 111], desc: '黄色颗粒，堆积成山' },
        { id: E.WATER, name: '水', icon: '💧', color: [64, 156, 255], desc: '流动液体，能灭火' },
        { id: E.STONE, name: '石头', icon: '🪨', color: [136, 140, 153], desc: '坚固固体，不可燃' },
        { id: E.WOOD, name: '木材', icon: '🪵', color: [139, 90, 43], desc: '可燃固体，烧成灰烬' },
        { id: E.FIRE, name: '火焰', icon: '🔥', color: [255, 120, 20], desc: '上升燃烧，点燃可燃物' },
        { id: E.OIL, name: '油', icon: '🛢️', color: [64, 42, 90], desc: '液体，极易燃烧' },
        { id: E.LAVA, name: '岩浆', icon: '🌋', color: [255, 66, 20], desc: '高温熔岩，遇水成石' },
        { id: E.STEAM, name: '蒸汽', icon: '♨️', color: [220, 228, 235], desc: '上升气体，冷凝成水' },
        { id: E.ACID, name: '酸', icon: '🧫', color: [120, 255, 80], desc: '强腐蚀，溶穿万物' },
        { id: E.GUNPOWDER, name: '火药', icon: '💥', color: [70, 62, 58], desc: '遇火剧烈爆炸' },
        { id: E.SEED, name: '种子', icon: '🌱', color: [110, 190, 60], desc: '遇水生长成植物' },
        { id: E.PLANT, name: '植物', icon: '🌿', color: [60, 160, 45], desc: '可燃植被' },
        { id: E.ICE, name: '冰', icon: '🧊', color: [170, 220, 245], desc: '遇热融化成水' },
        { id: E.GLASS, name: '玻璃', icon: '🔮', color: [200, 230, 255], desc: '坚固透明固体' },
        { id: E.HOLE, name: '黑洞', icon: '🕳️', color: [15, 10, 35], desc: '吞噬一切物质' },
        { id: E.ASH, name: '灰烬', icon: '🌑', color: [58, 54, 50], desc: '燃烧残留，轻如尘埃' },
    ];
    const elemMap = {};
    for (const e of ELEMS) elemMap[e.id] = e;

    // 元素分类辅助
    function isLiquid(id) { return id === E.WATER || id === E.OIL || id === E.LAVA || id === E.ACID; }
    function isGas(id) { return id === E.FIRE || id === E.STEAM; }
    function isSolid(id) { return !isLiquid(id) && !isGas(id) && id !== E.EMPTY; }
    function isFlammable(id) { return id === E.WOOD || id === E.PLANT || id === E.OIL || id === E.GUNPOWDER; }

    // ===== DOM =====
    container.innerHTML = `
    <div style="max-width:1100px;margin:0 auto;display:flex;gap:12px;font-family:'Consolas','Courier New',monospace">
      <div style="flex:0 0 200px;display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:14px;background:linear-gradient(180deg,rgba(14,22,55,.92),rgba(28,12,50,.92));border:1px solid rgba(120,200,255,.3);box-shadow:0 0 20px rgba(120,200,255,.08)">
        <div style="font-size:13px;font-weight:700;color:#9ad1ff;letter-spacing:3px">▚ 元素库</div>
        <div id="el-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:4px"></div>
        <div style="font-size:11px;color:#5c7fa3;line-height:1.8">
          🖱️ 左键绘制 / 右键擦除<br>
          ⏱️ 速度 0.5×~3×<br>
          🧲 重力可反转<br>
          💡 试试: 岩浆+水、<br>
          火药+火、种子+水
        </div>
      </div>
      <div style="flex:1;min-width:600px;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 12px;border-radius:12px;background:linear-gradient(135deg,rgba(14,22,55,.9),rgba(28,12,50,.9));border:1px solid rgba(120,200,255,.25)">
          <span id="el-name" style="font-size:14px;font-weight:700;color:#ffd54a">🏜️ 沙子</span>
          <span style="margin-left:auto"></span>
          <span style="font-size:11px;color:#9ad1ff">笔刷</span>
          <input id="el-pen" type="range" min="1" max="12" value="3" style="width:90px;accent-color:#40c4ff">
          <span style="font-size:11px;color:#5c7fa3">速度</span>
          <input id="el-speed" type="range" min="1" max="6" value="2" style="width:70px;accent-color:#69f0ae">
          <button id="el-gravity" style="padding:5px 12px;border-radius:8px;border:1px solid #40c4ff;background:rgba(64,196,255,.12);color:#80d8ff;cursor:pointer;font-size:12px;font-family:inherit">🧲 重力↓</button>
          <button id="el-pause" style="padding:5px 12px;border-radius:8px;border:1px solid #ffd54a;background:rgba(255,213,74,.12);color:#ffe082;cursor:pointer;font-size:12px;font-family:inherit">⏸️ 暂停</button>
          <button id="el-clear" style="padding:5px 12px;border-radius:8px;border:1px solid #ff5252;background:rgba(255,82,82,.12);color:#ff8a80;cursor:pointer;font-size:12px;font-family:inherit">🗑️ 清空</button>
        </div>
        <div style="position:relative;border-radius:14px;overflow:hidden;border:1px solid rgba(120,200,255,.35);box-shadow:0 0 26px rgba(120,200,255,.1)">
          <canvas id="el-cv" width="240" height="180" style="display:block;width:100%;image-rendering:pixelated;background:#0a0d1f;cursor:crosshair;transition:transform .12s"></canvas>
          <div id="el-zoom" style="position:absolute;top:8px;right:10px;font-size:11px;color:#9ad1ff;background:rgba(0,15,45,.7);padding:2px 8px;border-radius:6px;border:1px solid rgba(120,200,255,.3)">100%</div>
        </div>
        <div style="display:flex;gap:10px;font-size:11px;color:#5c7fa3;padding:4px 4px;flex-wrap:wrap">
          <span>颗粒: <b id="el-count" style="color:#9ad1ff">0</b></span>
          <span>帧率: <b id="el-fps" style="color:#69f0ae">0</b></span>
          <span style="margin-left:auto">元素沙盒 · 像素物理引擎 v1.0</span>
        </div>
      </div>
    </div>`;

    const cv = container.querySelector('#el-cv');
    const ctx = cv.getContext('2d');
    const grid = new Uint8Array(W * H);
    const life = new Int16Array(W * H); // 火焰/蒸汽寿命, 燃烧耐久
    const burn = new Uint8Array(W * H); // 燃烧标记 (点燃后自持燃烧, 火源离开也继续)

    // ===== 状态 =====
    let curElem = E.SAND;
    let pen = 3;
    let speed = 2;
    let paused = false;
    let gravityUp = false;
    let drawing = false;
    let erasing = false;
    let raf = 0;
    let lastTs = 0;
    let fps = 0;

    // ===== 元素面板 =====
    const elGrid = container.querySelector('#el-grid');
    const nameEl = container.querySelector('#el-name');
    const btns = [];
    for (const e of ELEMS) {
        const b = document.createElement('button');
        b.style.cssText = `display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 2px;border-radius:9px;border:1px solid rgba(120,200,255,.25);background:rgba(10,22,50,.6);cursor:pointer;font-size:10px;color:#cfe8ff;font-family:inherit;transition:all .15s;opacity:.55`;
        b.innerHTML = `<span style="font-size:17px">${e.icon}</span><span>${e.name}</span>`;
        b.onclick = () => {
            curElem = e.id;
            btns.forEach(x => { x.style.opacity = .55; x.style.boxShadow = 'none'; x.style.borderColor = 'rgba(120,200,255,.25)'; });
            b.style.opacity = 1;
            b.style.boxShadow = `0 0 12px rgba(120,200,255,.35)`;
            b.style.borderColor = '#40c4ff';
            nameEl.textContent = `${e.icon} ${e.name}`;
            nameEl.style.color = `rgb(${e.color[0]},${e.color[1]},${e.color[2]})`;
        };
        elGrid.appendChild(b);
        btns.push(b);
    }
    btns[0].click();

    // ===== 绘制交互 =====
    function paintAt(cx, cy) {
        const r = cv.getBoundingClientRect();
        const px = Math.floor((cx - r.left) / r.width * W);
        const py = Math.floor((cy - r.top) / r.height * H);
        const rad = Math.max(0, pen - 1);
        for (let dy = -rad; dy <= rad; dy++) {
            for (let dx = -rad; dx <= rad; dx++) {
                const x = px + dx, y = py + dy;
                if (x < 0 || y < 0 || x >= W || y >= H) continue;
                if (dx * dx + dy * dy > rad * rad + 1) continue;
                const i = y * W + x;
                if (erasing) {
                    grid[i] = E.EMPTY;
                    life[i] = 0;
                } else {
                    grid[i] = curElem;
                    // 元素寿命: 火焰/蒸汽=燃烧寿命, 植物=生长能量, 木头/种子=燃烧耐久
                    if (curElem === E.FIRE || curElem === E.STEAM) life[i] = 50 + (Math.random() * 40 | 0);
                    else if (curElem === E.PLANT) life[i] = 600;
                    else if (curElem === E.WOOD) life[i] = 140;
                    else if (curElem === E.SEED) life[i] = 80;
                    else life[i] = 0;
                }
            }
        }
    }
    cv.addEventListener('mousedown', e => {
        if (e.button === 0) { drawing = true; paintAt(e.clientX, e.clientY); }
        if (e.button === 2) { erasing = true; paintAt(e.clientX, e.clientY); }
    });
    window.addEventListener('mousemove', e => {
        if (drawing) paintAt(e.clientX, e.clientY);
        if (erasing) paintAt(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => { drawing = false; erasing = false; });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    // 滚轮缩放画布 (像素级查看)
    let zoom = 1;
    const zoomLabel = container.querySelector('#el-zoom');
    cv.addEventListener('wheel', e => {
        e.preventDefault();
        zoom = Math.max(.5, Math.min(3, zoom * (e.deltaY < 0 ? 1.12 : .89)));
        cv.style.transform = `scale(${zoom})`;
        cv.style.transformOrigin = 'center center';
        zoomLabel.textContent = Math.round(zoom * 100) + '%';
    }, { passive: false });

    // ===== 物理更新 (每步2格, 性能与效果平衡) =====
    function step() {
        // 从重力方向的反向扫描: 正常重力从底部(y=H-1)往上; 反转从顶部往下
        const yStart = gravityUp ? 0 : H - 1;
        const yEnd = gravityUp ? H - 1 : 0;
        const dyStep = gravityUp ? 1 : -1;
        const down = gravityUp ? -1 : 1; // 重力方向位移: 正常=向下(+y), 反转=向上(-y)

        for (let y = yStart; y !== yEnd + dyStep; y += dyStep) {
            for (let x = 0; x < W; x++) {
                const i = y * W + x;
                const id = grid[i];
                if (id === E.EMPTY) continue;

                const ny = y + down;
                const inB = ny >= 0 && ny < H;

                if (id === E.FIRE) {
                    // 火焰: 上升 + 点燃 + 寿命
                    life[i]--;
                    if (life[i] <= 0) { grid[i] = E.EMPTY; continue; }
                    // 点燃相邻可燃物 (油/火药快燃直接点燃; 木头/植物/种子慢燃由燃烧进度处理)
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx, ny2 = y + dy;
                            if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                            const ni = ny2 * W + nx;
                            const nid = grid[ni];
                            if (nid === E.OIL || nid === E.GUNPOWDER) {
                                if (nid === E.GUNPOWDER) {
                                    // 火药爆炸
                                    explode(nx, ny2);
                                } else {
                                    grid[ni] = E.FIRE;
                                    life[ni] = 60 + (Math.random() * 40 | 0);
                                }
                            } else if (nid === E.ICE) {
                                grid[ni] = E.WATER; // 冰融化
                            }
                        }
                    }
                    // 向上飘 + 随机横向
                    const upY = y - down;
                    if (upY >= 0 && upY < H && grid[upY * W + x] === E.EMPTY) {
                        const tx = x + (Math.random() < .3 ? (Math.random() < .5 ? -1 : 1) : 0);
                        if (tx >= 0 && tx < W && grid[upY * W + tx] === E.EMPTY) {
                            grid[upY * W + tx] = E.FIRE;
                            life[upY * W + tx] = life[i];
                            grid[i] = E.EMPTY;
                        }
                    }
                    continue;
                }

                if (id === E.STEAM) {
                    life[i]--;
                    if (life[i] <= 0) { grid[i] = E.WATER; continue; } // 冷凝
                    // 遇冰/水加速冷凝
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx, ny2 = y + dy;
                            if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                            const nid = grid[ny2 * W + nx];
                            if (nid === E.ICE || nid === E.WATER) {
                                grid[i] = E.WATER;
                                life[i] = 0;
                                break;
                            }
                        }
                        if (grid[i] === E.WATER) break;
                    }
                    if (grid[i] === E.WATER) continue;
                    const upY = y - down;
                    if (upY >= 0 && upY < H && grid[upY * W + x] === E.EMPTY) {
                        const tx = x + (Math.random() < .4 ? (Math.random() < .5 ? -1 : 1) : 0);
                        if (tx >= 0 && tx < W && grid[upY * W + tx] === E.EMPTY) {
                            grid[upY * W + tx] = E.STEAM;
                            life[upY * W + tx] = life[i];
                            grid[i] = E.EMPTY;
                        }
                    }
                    continue;
                }

                // 木头: 点燃后自持燃烧 (火源离开也继续烧, 烧完变灰烬)
                if (id === E.WOOD) {
                    if (!burn[i]) {
                        // 未点燃: 检测邻域火
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny2 = y + dy;
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                const nid = grid[ny2 * W + nx];
                                if (nid === E.FIRE || nid === E.LAVA) {
                                    burn[i] = 1;
                                    // 冒火苗
                                    if (Math.random() < .5) {
                                        const fx = x + (Math.random() < .5 ? -1 : 1);
                                        if (fx >= 0 && fx < W && grid[y * W + fx] === E.EMPTY) {
                                            grid[y * W + fx] = E.FIRE;
                                            life[y * W + fx] = 20 + (Math.random() * 20 | 0);
                                        }
                                    }
                                    break;
                                }
                            }
                            if (burn[i]) break;
                        }
                    }
                    if (burn[i]) {
                        life[i]--;
                        // 燃烧视觉: 冒火苗
                        if (Math.random() < .08) {
                            const fx = x + (Math.random() < .5 ? -1 : 1);
                            const fy = y + (Math.random() < .3 ? -1 : 0);
                            if (fx >= 0 && fy >= 0 && fx < W && fy < H && grid[fy * W + fx] === E.EMPTY) {
                                grid[fy * W + fx] = E.FIRE;
                                life[fy * W + fx] = 15 + (Math.random() * 15 | 0);
                            }
                        }
                        // 波浪式蔓延: 点燃相邻未燃木头
                        if (Math.random() < .1) {
                            for (let dy = -1; dy <= 1; dy++) {
                                for (let dx = -1; dx <= 1; dx++) {
                                    const nx = x + dx, ny2 = y + dy;
                                    if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                    const ni = ny2 * W + nx;
                                    if (grid[ni] === E.WOOD && !burn[ni]) {
                                        burn[ni] = 1;
                                        life[ni] = 140;
                                        break;
                                    }
                                }
                                if (life[i] <= 0) break;
                            }
                        }
                        if (life[i] <= 0) {
                            grid[i] = E.ASH;
                            life[i] = 0;
                            burn[i] = 0;
                        }
                    }
                    continue;
                }

                // 植物: 生命周期 (蔓延生长, 缺水枯萎, 点燃后自持燃烧)
                if (id === E.PLANT) {
                    if (!burn[i]) {
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny2 = y + dy;
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                const nid = grid[ny2 * W + nx];
                                if (nid === E.FIRE || nid === E.LAVA) { burn[i] = 1; break; }
                            }
                            if (burn[i]) break;
                        }
                    }
                    if (burn[i]) {
                        // 燃烧: 快速消耗 → 灰烬
                        life[i] -= 3;
                        if (Math.random() < .02) {
                            const fx = x + (Math.random() < .5 ? -1 : 1);
                            if (fx >= 0 && fx < W && grid[y * W + fx] === E.EMPTY) {
                                grid[y * W + fx] = E.FIRE;
                                life[y * W + fx] = 15 + (Math.random() * 15 | 0);
                            }
                        }
                        if (life[i] <= 0) { grid[i] = E.ASH; life[i] = 0; burn[i] = 0; continue; }
                    } else {
                        life[i]--;
                        if (life[i] <= 0) { grid[i] = E.EMPTY; continue; } // 自然枯萎
                        // 遇水恢复生长能量
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny2 = y + dy;
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                if (grid[ny2 * W + nx] === E.WATER) { life[i] = 600; break; }
                            }
                            if (life[i] === 600) break;
                        }
                        // 缓慢蔓延 (藤蔓式)
                        if (life[i] > 200 && Math.random() < .01) {
                            const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
                            const d0 = dirs[Math.random() * 4 | 0];
                            for (const dd of [d0, dirs[Math.random() * 4 | 0]]) {
                                const nx = x + dd[0], ny2 = y + dd[1];
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                if (grid[ny2 * W + nx] === E.EMPTY) {
                                    grid[ny2 * W + nx] = E.PLANT;
                                    life[ny2 * W + nx] = 300;
                                    burn[ny2 * W + nx] = 0;
                                    life[i] -= 60;
                                    break;
                                }
                            }
                        }
                    }
                    continue;
                }

                if (id === E.HOLE) {
                    // 黑洞: 吞噬周围一格内的物质
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx, ny2 = y + dy;
                            if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                            const ni = ny2 * W + nx;
                            if (grid[ni] !== E.EMPTY && grid[ni] !== E.HOLE) {
                                grid[ni] = E.EMPTY;
                                life[ni] = 0;
                            }
                        }
                    }
                    continue;
                }

                if (isLiquid(id)) {
                    // 液体: 下落 + 侧向流动
                    // 水: 灭火 (相邻火焰 → 蒸汽)
                    if (id === E.WATER) {
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny2 = y + dy;
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                const ni = ny2 * W + nx;
                                if (grid[ni] === E.FIRE) {
                                    grid[ni] = E.STEAM;
                                    life[ni] = 50;
                                }
                            }
                        }
                    }
                    // 岩浆: 点燃可燃物 + 熔融固体
                    if (id === E.LAVA) {
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny2 = y + dy;
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                const ni = ny2 * W + nx;
                                const nid = grid[ni];
                                if (nid === E.GUNPOWDER) {
                                    explode(nx, ny2);
                                } else if (nid === E.OIL) {
                                    grid[ni] = E.FIRE;
                                    life[ni] = 60 + (Math.random() * 40 | 0);
                                }
                            }
                        }
                        // 熔融: 石头/玻璃慢慢熔穿成岩浆; 沙子熔成玻璃
                        if (Math.random() < .02) {
                            for (let dy = -1; dy <= 1; dy++) {
                                for (let dx = -1; dx <= 1; dx++) {
                                    const nx = x + dx, ny2 = y + dy;
                                    if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                    const ni = ny2 * W + nx;
                                    const nid = grid[ni];
                                    if (nid === E.STONE || nid === E.GLASS) {
                                        grid[ni] = E.LAVA;
                                        life[ni] = 0;
                                        break;
                                    }
                                    if (nid === E.SAND) {
                                        grid[ni] = E.GLASS; // 沙子熔成玻璃!
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    if (inB) {
                        const below = grid[ny * W + x];
                        if (below === E.EMPTY) {
                            swap(i, ny * W + x);
                            continue;
                        }
                        if (isGas(below)) {
                            swap(i, ny * W + x);
                            continue;
                        }
                        // 与密度: 油浮在水上, 岩浆沉底
                        if (id === E.OIL && below === E.WATER) { swap(i, ny * W + x); continue; }
                        if (id === E.WATER && below === E.OIL) { continue; }
                    }
                    // 侧向流动
                    const dir = Math.random() < .5 ? 1 : -1;
                    for (const d of [dir, -dir]) {
                        const nx = x + d;
                        if (nx < 0 || nx >= W) continue;
                        if (grid[y * W + nx] === E.EMPTY) {
                            // 斜向下优先
                            if (inB && grid[ny * W + nx] === E.EMPTY && Math.random() < .6) {
                                swap(i, ny * W + nx);
                            } else {
                                swap(i, y * W + nx);
                            }
                            break;
                        }
                    }
                    // 岩浆反应: 遇水变石头
                    if (id === E.LAVA) {
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny2 = y + dy;
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                const ni = ny2 * W + nx;
                                if (grid[ni] === E.WATER) {
                                    grid[i] = E.STONE;
                                    grid[ni] = E.STEAM;
                                    life[ni] = 40;
                                    break;
                                }
                            }
                        }
                    }
                    // 酸: 腐蚀相邻固体
                    if (id === E.ACID) {
                        const targets = [];
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny2 = y + dy;
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                const ni = ny2 * W + nx;
                                const nid = grid[ni];
                                if (nid === E.STONE || nid === E.GLASS || nid === E.WOOD || nid === E.PLANT || nid === E.SAND || nid === E.GUNPOWDER) {
                                    targets.push(ni);
                                }
                            }
                        }
                        if (targets.length && Math.random() < .25) {
                            grid[targets[Math.random() * targets.length | 0]] = E.EMPTY;
                            if (Math.random() < .3) grid[i] = E.EMPTY; // 酸也会消耗
                        }
                    }
                    continue;
                }

                // 固体 (沙子/火药/种子/冰/灰烬)
                if (id === E.SAND || id === E.GUNPOWDER || id === E.SEED || id === E.ICE || id === E.ASH) {
                    if (inB) {
                        const below = grid[ny * W + x];
                        if (below === E.EMPTY) { swap(i, ny * W + x); continue; }
                        if (isLiquid(below) || isGas(below)) { swap(i, ny * W + x); continue; }
                    }
                    // 侧滑
                    const dir = Math.random() < .5 ? 1 : -1;
                    for (const d of [dir, -dir]) {
                        const nx = x + d;
                        if (nx < 0 || nx >= W) continue;
                        if (!inB) continue;
                        if (grid[ny * W + nx] === E.EMPTY) {
                            swap(i, ny * W + nx);
                            break;
                        }
                        if (isLiquid(grid[ny * W + nx])) {
                            swap(i, ny * W + nx);
                            break;
                        }
                    }
                    // 种子: 遇水生长; 点燃后自持燃烧变灰烬
                    if (id === E.SEED) {
                        if (!burn[i]) {
                            for (let dy = -1; dy <= 1; dy++) {
                                for (let dx = -1; dx <= 1; dx++) {
                                    const nx = x + dx, ny2 = y + dy;
                                    if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                    const nid = grid[ny2 * W + nx];
                                    if (nid === E.FIRE || nid === E.LAVA) { burn[i] = 1; break; }
                                }
                                if (burn[i]) break;
                            }
                        }
                        if (burn[i]) {
                            life[i]--;
                            if (life[i] <= 0) { grid[i] = E.ASH; life[i] = 0; burn[i] = 0; continue; }
                        }
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nx = x + dx, ny2 = y + dy;
                                if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                                if (grid[ny2 * W + nx] === E.WATER) {
                                    if (Math.random() < .08) {
                                        grid[i] = E.PLANT;
                                        life[i] = 600; // 植物生长能量
                                        // 向上生长一截
                                        let gy = y - down;
                                        let guard = 0;
                                        while (gy >= 0 && gy < H && guard < 6 && grid[gy * W + x] === E.EMPTY) {
                                            grid[gy * W + x] = E.PLANT;
                                            life[gy * W + x] = 400;
                                            gy -= down;
                                            guard++;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    continue;
                }
                // 冰遇热融化
                if (id === E.ICE) {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = x + dx, ny2 = y + dy;
                            if (nx < 0 || ny2 < 0 || nx >= W || ny2 >= H) continue;
                            const nid = grid[ny2 * W + nx];
                            if (nid === E.FIRE || nid === E.LAVA) {
                                grid[i] = E.WATER;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    function swap(i, j) {
        const t = grid[i];
        grid[i] = grid[j];
        grid[j] = t;
        const tl = life[i];
        life[i] = life[j];
        life[j] = tl;
    }

    function explode(cx, cy) {
        const R = 4;
        for (let dy = -R; dy <= R; dy++) {
            for (let dx = -R; dx <= R; dx++) {
                const x = cx + dx, y = cy + dy;
                if (x < 0 || y < 0 || x >= W || y >= H) continue;
                if (dx * dx + dy * dy > R * R) continue;
                const i = y * W + x;
                const id = grid[i];
                if (id === E.EMPTY || id === E.HOLE) continue;
                // 摧毁 + 火焰
                grid[i] = E.FIRE;
                life[i] = 30 + (Math.random() * 30 | 0);
                // 引爆相邻火药 (链式)
                if (id === E.GUNPOWDER && Math.random() < .5) {
                    // 延迟引爆 (简化: 直接变火)
                }
            }
        }
        // 冲击波粒子
        for (let k = 0; k < 14; k++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 30 + Math.random() * 60;
            sparks.push({ x: cx * 4, y: cy * 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .4, maxLife: .4 });
        }
    }

    // 爆炸火花粒子 (叠加渲染)
    let sparks = [];

    // ===== 渲染 =====
    const imgData = ctx.createImageData(W, H);
    const buf = imgData.data;

    function render() {
        let count = 0;
        for (let i = 0; i < W * H; i++) {
            const id = grid[i];
            if (id === E.EMPTY) {
                // 深空底
                buf[i * 4] = 8 + ((i * 7) % 5);
                buf[i * 4 + 1] = 10 + ((i * 13) % 6);
                buf[i * 4 + 2] = 26 + ((i * 17) % 8);
            } else {
                count++;
                const c = elemMap[id].color;
                let r = c[0], g = c[1], b = c[2];
                // 火焰动态
                if (id === E.FIRE) {
                    const f = Math.random();
                    r = 255; g = 120 + f * 100 | 0; b = 20 + f * 40 | 0;
                } else if (id === E.LAVA) {
                    const f = Math.random();
                    r = 255; g = 60 + f * 60 | 0; b = 20;
                } else if ((id === E.WOOD || id === E.PLANT || id === E.SEED) && life[i] > 0 && life[i] < 45) {
                    // 燃烧中: 变暗发红
                    const t = 1 - life[i] / 45;
                    r = Math.max(60, c[0] * (1 - t * .7)) | 0;
                    g = Math.max(30, c[1] * (1 - t * .7)) | 0;
                    b = Math.max(20, c[2] * (1 - t * .7)) | 0;
                } else {
                    // 微抖动 (像素质感)
                    const j = (Math.random() - .5) * 18;
                    r += j; g += j; b += j;
                }
                buf[i * 4] = r;
                buf[i * 4 + 1] = g;
                buf[i * 4 + 2] = b;
            }
            buf[i * 4 + 3] = 255;
        }
        // 火花粒子叠加
        for (const s of sparks) {
            const px = s.x / 4 | 0, py = s.y / 4 | 0;
            if (px >= 0 && py >= 0 && px < W && py < H) {
                const i = (py * W + px) * 4;
                const a = s.life / s.maxLife;
                buf[i] = Math.min(255, buf[i] + 200 * a);
                buf[i + 1] = Math.min(255, buf[i + 1] + 160 * a);
                buf[i + 2] = Math.min(255, buf[i + 2] + 60 * a);
            }
        }
        ctx.putImageData(imgData, 0, 0);
        container.querySelector('#el-count').textContent = count.toLocaleString();
    }

    // ===== 主循环 =====
    function frame(ts) {
        raf = requestAnimationFrame(frame);
        const dt = (ts - lastTs) / 1000 || .016;
        lastTs = ts;
        fps = Math.round(1 / dt);
        container.querySelector('#el-fps').textContent = fps;

        if (!paused) {
            // 每帧按速度跑多步
            const steps = speed;
            for (let s = 0; s < steps; s++) step();
            // 火花更新
            for (let i = sparks.length - 1; i >= 0; i--) {
                const sp = sparks[i];
                sp.life -= dt;
                if (sp.life <= 0) { sparks.splice(i, 1); continue; }
                sp.x += sp.vx * dt;
                sp.y += sp.vy * dt;
                sp.vx *= .92;
                sp.vy *= .92;
            }
        }
        render();
    }

    // ===== 控件 =====
    container.querySelector('#el-pen').addEventListener('input', e => { pen = +e.target.value; });
    container.querySelector('#el-speed').addEventListener('input', e => { speed = +e.target.value; });
    const gBtn = container.querySelector('#el-gravity');
    gBtn.onclick = () => {
        gravityUp = !gravityUp;
        gBtn.textContent = gravityUp ? '🧲 重力↑' : '🧲 重力↓';
        gBtn.style.color = gravityUp ? '#69f0ae' : '#80d8ff';
    };
    const pBtn = container.querySelector('#el-pause');
    pBtn.onclick = () => {
        paused = !paused;
        pBtn.textContent = paused ? '▶️ 继续' : '⏸️ 暂停';
    };
    container.querySelector('#el-clear').onclick = () => {
        grid.fill(E.EMPTY);
        life.fill(0);
        burn.fill(0);
        sparks = [];
    };

    // 初始示例: 一撮沙子 + 一滩水
    for (let i = 0; i < 60; i++) {
        const x = (Math.random() * 40 | 0) + 100;
        const y = (Math.random() * 8 | 0) + 40;
        grid[y * W + x] = E.SAND;
    }
    for (let i = 0; i < 120; i++) {
        const x = (Math.random() * 60 | 0) + 90;
        const y = (Math.random() * 10 | 0) + 130;
        grid[y * W + x] = E.WATER;
    }

    // ===== 清理 =====
    function cleanup() {
        cancelAnimationFrame(raf);
        window.removeEventListener('mousemove', paintAt);
        window.removeEventListener('mouseup', paintAt);
        for (const b of btns) b.onclick = null;
        for (const id2 of ['el-pen', 'el-speed']) {
            const el = container.querySelector('#' + id2);
            if (el) el.oninput = null;
        }
        for (const id2 of ['el-gravity', 'el-pause', 'el-clear']) {
            const el = container.querySelector('#' + id2);
            if (el) el.onclick = null;
        }
    }

    // ===== 启动 =====
    lastTs = performance.now();
    raf = requestAnimationFrame(frame);
    render();

    return { cleanup };
}
