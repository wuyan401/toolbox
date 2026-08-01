export const id = 'image-obfuscator';
export const name = '小番茄图片混淆';
export const icon = '🍅';
export const description = '空间填充曲线可逆混淆/解混淆，多算法多轮操作，本地保护隐私';
export const category = '生成美化';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;gap:8px;align-items:center">
                <select id="mode" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                    <option value="obf">🎭 混淆 (原图→乱图)</option>
                    <option value="deobf">🔄 解混淆 (乱图→原图)</option>
                </select>
                <span style="font-size:13px;color:var(--color-text-secondary)">算法:</span>
                <select id="algo" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                    <option value="random" selected>🌪️ 雪花随机 (完全打乱)</option>
                    <option value="hilbert">🧬 Hilbert曲线</option>
                    <option value="zorder">🔀 Z-order曲线</option>
                    <option value="peano">🌀 Peano曲线</option>
                </select>
                <span style="font-size:13px;color:var(--color-text-secondary)">轮数:</span>
                <select id="rounds" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                    <option value="1">1轮</option>
                    <option value="2" selected>2轮</option>
                    <option value="4">4轮</option>
                    <option value="8">8轮</option>
                    <option value="16">16轮</option>
                </select>
            </div>
            <div style="padding:16px;border:2px dashed var(--color-border);border-radius:12px;text-align:center;cursor:pointer" id="drop">
                <div style="font-size:36px">🍅</div>
                <div style="color:var(--color-text-secondary);font-size:13px;margin-top:6px">${'点击选择图片 / 拖拽到此处'} (自动缩放为 512×512)</div>
                <input type="file" id="file" accept="image/*" style="display:none">
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-primary" id="go" style="flex:1">⚡ 执行</button>
                <button class="btn" id="dl">💾 下载结果</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div style="text-align:center">
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px" id="labelL">原图</div>
                    <canvas id="src" width="256" height="256" style="max-width:100%;border-radius:8px;background:#000;image-rendering:pixelated"></canvas>
                </div>
                <div style="text-align:center">
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px" id="labelR">结果</div>
                    <canvas id="out" width="256" height="256" style="max-width:100%;border-radius:8px;background:#000;image-rendering:pixelated"></canvas>
                </div>
            </div>
        </div>`;

    const mode = container.querySelector('#mode');
    const algo = container.querySelector('#algo');
    const rounds = container.querySelector('#rounds');
    const drop = container.querySelector('#drop');
    const fileInput = container.querySelector('#file');
    const srcCv = container.querySelector('#src');
    const outCv = container.querySelector('#out');
    const labelL = container.querySelector('#labelL');
    const labelR = container.querySelector('#labelR');
    let img = null;
    const N = 256; // 2^8

    drop.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => load(e.target.files[0]));
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.borderColor = 'var(--color-accent)'; });
    drop.addEventListener('dragleave', () => { drop.style.borderColor = 'var(--color-border)'; });
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.style.borderColor = 'var(--color-border)'; load(e.dataTransfer.files[0]); });

    function load(f) {
        if (!f || !f.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            const i = new Image();
            i.onload = () => {
                img = i;
                srcCv.width = N; srcCv.height = N;
                const ctx = srcCv.getContext('2d');
                const scale = Math.max(N / i.width, N / i.height);
                ctx.drawImage(i, (N - i.width * scale) / 2, (N - i.height * scale) / 2, i.width * scale, i.height * scale);
                exec();
            };
            i.src = reader.result;
        };
        reader.readAsDataURL(f);
    }

    // ===== 空间填充曲线 =====

    // Hilbert 曲线: d (曲线序号) <-> (x, y)
    function hilbertRot(n, x, y, rx, ry) {
        if (ry === 0) {
            if (rx === 1) { x = n - 1 - x; y = n - 1 - y; }
            return [y, x];
        }
        return [x, y];
    }
    function hilbertD2XY(n, d) {
        let x = 0, y = 0;
        for (let s = 1; s < n; s *= 2) {
            const rx = 1 & (d / 2 | 0);
            const ry = 1 & (d ^ rx);
            [x, y] = hilbertRot(s, x, y, rx, ry);
            x += s * rx; y += s * ry;
            d = d / 4 | 0;
        }
        return [x, y];
    }
    function hilbertXY2D(n, x, y) {
        let d = 0;
        for (let s = n / 2 | 0; s > 0; s = s / 2 | 0) {
            const rx = (x & s) > 0 ? 1 : 0;
            const ry = (y & s) > 0 ? 1 : 0;
            d += s * s * ((3 * rx) ^ ry);
            [x, y] = hilbertRot(s, x, y, rx, ry);
        }
        return d;
    }

    // Z-order (Morton): 位交错
    function zXY2D(x, y) {
        let d = 0;
        for (let i = 0; i < 8; i++) {
            d |= ((x >> i) & 1) << (2 * i);
            d |= ((y >> i) & 1) << (2 * i + 1);
        }
        return d;
    }
    function zD2XY(d) {
        let x = 0, y = 0;
        for (let i = 0; i < 8; i++) {
            x |= ((d >> (2 * i)) & 1) << i;
            y |= ((d >> (2 * i + 1)) & 1) << i;
        }
        return [x, y];
    }

    // Peano: 3进制交错, 覆盖 243×243 区域(3^5), 超出部分像素不动
    function peanoD2XY(d) {
        if (d >= 243 * 243) return null;
        let x = 0, y = 0, pow = 1;
        for (let i = 0; i < 5; i++) {
            const t = d % 9;
            d = d / 9 | 0;
            const gx = t % 3, gy = t / 3 | 0;
            x += gx * pow; y += gy * pow;
            pow *= 3;
        }
        return [x, y];
    }
    function peanoXY2D(x, y) {
        if (x >= 243 || y >= 243) return null;
        let d = 0, pow = 1;
        for (let i = 0; i < 5; i++) {
            const gx = x % 3, gy = y % 3;
            x = x / 3 | 0; y = y / 3 | 0;
            d += (gy * 3 + gx) * pow;
            pow *= 9;
        }
        return d;
    }

    function getCurve(name) {
        if (name === 'hilbert') return { xy2d: (x,y) => hilbertXY2D(N, x, y), d2xy: d => hilbertD2XY(N, d), size: N*N };
        if (name === 'zorder') return { xy2d: zXY2D, d2xy: zD2XY, size: N*N };
        return { xy2d: peanoXY2D, d2xy: peanoD2XY, size: 243*243 };
    }

    // 自逆变换 T: (x,y) -> 曲线序号翻转后的位置
    // T(T(p)) = p, 所以混淆N轮 + 解混淆N轮必然还原
    function makeTransform(curve) {
        const total = curve.size;
        return function(x, y) {
            const d = curve.xy2d(x, y);
            if (d === null) return [x, y]; // 曲线未覆盖区域不动
            const inv = total - 1 - d;
            const pos = curve.d2xy(inv);
            return pos || [x, y];
        };
    }

    // 整数90°旋转(精确无损失)
    function rotCW(p) { return [p[1], N - 1 - p[0]]; }   // 顺时针90°
    function rotCCW(p) { return [N - 1 - p[1], p[0]]; }  // 逆时针90°
    function rot180(p) { return [N - 1 - p[0], N - 1 - p[1]]; }

    // 种子随机数 (mulberry32) - 生成可重复的伪随机置换
    function mulberry32(a) {
        return function() {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // 种子随机置换: 完全打乱像素位置 (雪花效果), 同种子可逆
    function buildRandomPerm(seed) {
        const perm = new Int32Array(N * N);
        for (let i = 0; i < N * N; i++) perm[i] = i;
        const rng = mulberry32(seed);
        for (let i = N * N - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
        }
        return perm;
    }

    function exec() {
        if (!img) return;
        const r = +rounds.value;
        const isObf = mode.value === 'obf';
        const useRandom = algo.value === 'random';

        if (outCv.width !== N) { outCv.width = N; outCv.height = N; }
        const ctx = outCv.getContext('2d');
        // 混淆从原图开始; 解混淆作用于当前画布内容(混淆后的图)
        if (isObf) ctx.drawImage(img, 0, 0, N, N);
        const imgData = ctx.getImageData(0, 0, N, N);
        const d = imgData.data;

        // 每轮: 生成置换 perm (随机雪花 或 曲线翻转+递增90°旋转)
        // 多曲线交替(hilbert→zorder→peano)打破单曲线对称巧合, 轮数再多也不塌缩
        const curves = ['hilbert', 'zorder', 'peano'];
        const perms = [];
        for (let round = 0; round < r; round++) {
            if (useRandom) {
                // 雪花随机: 每轮不同种子
                perms.push(buildRandomPerm(10007 + round * 7919));
            } else {
                const curve2 = getCurve(curves[round % 3]);
                const T2 = makeTransform(curve2);
                const ang = ((round + 1) * 90) % 360;
                const perm = new Int32Array(N * N);
                for (let y = 0; y < N; y++) {
                    for (let x = 0; x < N; x++) {
                        let [nx, ny] = T2(x, y);
                        if (ang === 90) { const t = nx; nx = ny; ny = N - 1 - t; }
                        else if (ang === 180) { nx = N - 1 - nx; ny = N - 1 - ny; }
                        else if (ang === 270) { const t = nx; nx = N - 1 - ny; ny = t; }
                        perm[y * N + x] = ny * N + nx;
                    }
                }
                perms.push(perm);
            }
        }

        if (isObf) {
            // 混淆: 逐轮 nd[perm[p]] = d[p]
            for (const perm of perms) {
                const nd = new Uint8ClampedArray(d);
                for (let p = 0; p < N * N; p++) {
                    const dst = perm[p] * 4, src = p * 4;
                    nd[dst] = d[src]; nd[dst+1] = d[src+1]; nd[dst+2] = d[src+2]; nd[dst+3] = 255;
                }
                d.set(nd);
            }
        } else {
            // 解混淆: 逆序 + 逆置换 (严格互逆)
            for (let i = perms.length - 1; i >= 0; i--) {
                const perm = perms[i];
                const nd = new Uint8ClampedArray(d);
                for (let p = 0; p < N * N; p++) {
                    const src = perm[p] * 4, dst = p * 4;
                    nd[dst] = d[src]; nd[dst+1] = d[src+1]; nd[dst+2] = d[src+2]; nd[dst+3] = 255;
                }
                d.set(nd);
            }
        }
        ctx.putImageData(imgData, 0, 0);
        labelL.textContent = mode.value === 'obf' ? '原图' : '混淆图';
        labelR.textContent = mode.value === 'obf' ? '混淆结果' : '还原结果';
    }

    mode.addEventListener('change', exec);
    algo.addEventListener('change', exec);
    rounds.addEventListener('change', exec);
    container.querySelector('#go').addEventListener('click', exec);
    container.querySelector('#dl').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = outCv.toDataURL('image/png');
        a.download = mode.value === 'obf' ? 'obfuscated.png' : 'restored.png';
        a.click();
    });

    return { cleanup() {} };
}
