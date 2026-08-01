export const id = 'prism-tank';
export const name = '光棱坦克工厂';
export const icon = '🔮';
export const description = '棱镜光束图片特效，红警光棱坦克风格色散分解';
export const category = '生成美化';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:620px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
            <div style="padding:16px;border:2px dashed var(--color-border);border-radius:12px;text-align:center;cursor:pointer;transition:all .2s" id="drop">
                <div style="font-size:36px">🖼️</div>
                <div style="color:var(--color-text-secondary);font-size:13px;margin-top:6px">点击选择图片 / 拖拽到此处</div>
                <input type="file" id="file" accept="image/*" style="display:none">
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap" id="controls" style="display:none">
                <span style="font-size:13px;color:var(--color-text-secondary)">模式:</span>
                <select id="mode" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                    <option value="prism">🔮 棱镜色散</option>
                    <option value="tri">🔺 三角分解</option>
                    <option value="beam">⚡ 光束爆裂</option>
                    <option value="aura">🌈 彩虹光环</option>
                </select>
                <span style="font-size:13px;color:var(--color-text-secondary)">强度:</span>
                <input type="range" id="power" min="5" max="60" value="24" style="flex:1">
                <button class="btn btn-primary" id="go">⚡ 生成</button>
                <button class="btn" id="dl">💾 下载</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div style="text-align:center">
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">原图</div>
                    <canvas id="src" style="max-width:100%;border-radius:8px;background:#000"></canvas>
                </div>
                <div style="text-align:center">
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">光棱输出</div>
                    <canvas id="out" style="max-width:100%;border-radius:8px;background:#000"></canvas>
                </div>
            </div>
        </div>`;

    const drop = container.querySelector('#drop');
    const fileInput = container.querySelector('#file');
    const controls = container.querySelector('#controls');
    const mode = container.querySelector('#mode');
    const power = container.querySelector('#power');
    const srcCv = container.querySelector('#src');
    const outCv = container.querySelector('#out');
    let img = null;

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
                const w = 320, h = Math.round(i.height * w / i.width);
                srcCv.width = w; srcCv.height = h;
                srcCv.getContext('2d').drawImage(i, 0, 0, w, h);
                controls.style.display = 'flex';
                render();
            };
            i.src = reader.result;
        };
        reader.readAsDataURL(f);
    }

    function render() {
        if (!img) return;
        const w = 320, h = Math.round(img.height * w / img.width);
        outCv.width = w; outCv.height = h;
        const ctx = outCv.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const p = +power.value;
        const m = mode.value;

        if (m === 'prism') {
            // 棱镜色散: 按列位移RGB通道
            const offset = ctx.createImageData(w, h);
            const od = offset.data;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    const dx = Math.sin((x / w) * Math.PI) * p;
                    for (let ch = 0; ch < 3; ch++) {
                        const sx = Math.max(0, Math.min(w - 1, Math.round(x + dx * (ch - 1))));
                        const si = (y * w + sx) * 4;
                        od[i + ch] = data[si + ch];
                    }
                    od[i + 3] = 255;
                }
            }
            ctx.putImageData(offset, 0, 0);
        } else if (m === 'tri') {
            // 三角分解: 左上角三角形位移
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            ctx.globalCompositeOperation = 'screen';
            const off = p * 1.2;
            ctx.globalAlpha = 0.55;
            ctx.drawImage(outCv, -off, 0);  // 红偏移
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        } else if (m === 'beam') {
            // 光束爆裂: 径向色散
            const offset = ctx.createImageData(w, h);
            const od = offset.data;
            const cx = w / 2, cy = h / 2;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    const ang = Math.atan2(y - cy, x - cx);
                    for (let ch = 0; ch < 3; ch++) {
                        const dist = p * (ch - 1) * 0.8;
                        const sx = Math.max(0, Math.min(w - 1, Math.round(x + Math.cos(ang) * dist)));
                        const sy = Math.max(0, Math.min(h - 1, Math.round(y + Math.sin(ang) * dist)));
                        const si = (sy * w + sx) * 4;
                        od[i + ch] = data[si + ch];
                    }
                    od[i + 3] = 255;
                }
            }
            ctx.putImageData(offset, 0, 0);
        } else {
            // 彩虹光环: 边缘霓虹描边
            const offset = ctx.createImageData(w, h);
            const od = offset.data;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    const cx = w / 2, cy = h / 2;
                    const dist = Math.hypot(x - cx, y - cy);
                    const maxD = Math.hypot(cx, cy);
                    const ring = Math.abs(dist - maxD * 0.7);
                    if (ring < p * 1.5) {
                        const hue = (dist / maxD) * 360;
                        const r = hsl2rgb(hue, 1, 0.55);
                        od[i] = r[0] * 0.6 + data[i] * 0.4;
                        od[i+1] = r[1] * 0.6 + data[i+1] * 0.4;
                        od[i+2] = r[2] * 0.6 + data[i+2] * 0.4;
                    } else {
                        od[i] = data[i]; od[i+1] = data[i+1]; od[i+2] = data[i+2];
                    }
                    od[i+3] = 255;
                }
            }
            ctx.putImageData(offset, 0, 0);
        }
    }

    function hsl2rgb(h, s, l) {
        h /= 360;
        let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [r * 255, g * 255, b * 255];
    }
    function hue2rgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    mode.addEventListener('change', render);
    power.addEventListener('input', render);
    container.querySelector('#go').addEventListener('click', render);
    container.querySelector('#dl').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = outCv.toDataURL('image/png');
        a.download = 'prism-output.png';
        a.click();
    });

    return { cleanup() {} };
}
