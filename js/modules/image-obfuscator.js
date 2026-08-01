export const id = 'image-obfuscator';
export const name = '图片混淆器';
export const icon = '🎭';
export const description = '马赛克/像素块/噪点混淆打码，保护图片隐私';
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
                <span style="font-size:13px;color:var(--color-text-secondary)">混淆方式:</span>
                <select id="mode" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                    <option value="mosaic">🔲 马赛克</option>
                    <option value="pixel">🟦 像素化</option>
                    <option value="noise">🌫️ 噪点覆盖</option>
                    <option value="blur">💨 高斯模糊</option>
                    <option value="shuffle">🔀 色块打乱</option>
                    <option value="strip">📶 干扰条纹</option>
                </select>
                <span style="font-size:13px;color:var(--color-text-secondary)">强度:</span>
                <input type="range" id="power" min="1" max="100" value="40" style="flex:1">
                <button class="btn btn-primary" id="go">⚡ 混淆</button>
                <button class="btn" id="dl">💾 下载</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div style="text-align:center">
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">原图</div>
                    <canvas id="src" style="max-width:100%;border-radius:8px;background:#000"></canvas>
                </div>
                <div style="text-align:center">
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">混淆输出</div>
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
        const p = +power.value;
        const m = mode.value;

        if (m === 'mosaic') {
            // 马赛克: 方块取平均色
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const size = Math.max(4, Math.round(p / 100 * 40));
            for (let y = 0; y < h; y += size) {
                for (let x = 0; x < w; x += size) {
                    let r = 0, g = 0, b = 0, n = 0;
                    for (let yy = y; yy < Math.min(y + size, h); yy++)
                        for (let xx = x; xx < Math.min(x + size, w); xx++) {
                            const i = (yy * w + xx) * 4;
                            r += d[i]; g += d[i+1]; b += d[i+2]; n++;
                        }
                    r = r/n|0; g = g/n|0; b = b/n|0;
                    for (let yy = y; yy < Math.min(y + size, h); yy++)
                        for (let xx = x; xx < Math.min(x + size, w); xx++) {
                            const i = (yy * w + xx) * 4;
                            d[i] = r; d[i+1] = g; d[i+2] = b;
                        }
                }
            }
            ctx.putImageData(imgData, 0, 0);
        } else if (m === 'pixel') {
            // 像素化: 采样最近邻放大
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const size = Math.max(2, Math.round(p / 100 * 30));
            const nd = new Uint8ClampedArray(d);
            for (let y = 0; y < h; y += size) {
                for (let x = 0; x < w; x += size) {
                    const i = (y * w + x) * 4;
                    const r = nd[i], g = nd[i+1], b = nd[i+2];
                    for (let yy = y; yy < Math.min(y + size, h); yy++)
                        for (let xx = x; xx < Math.min(x + size, w); xx++) {
                            const j = (yy * w + xx) * 4;
                            d[j] = r; d[j+1] = g; d[j+2] = b;
                        }
                }
            }
            ctx.putImageData(imgData, 0, 0);
        } else if (m === 'noise') {
            // 噪点: 随机像素覆盖
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const density = p / 100;
            for (let i = 0; i < d.length; i += 4) {
                if (Math.random() < density) {
                    d[i] = Math.random() * 255;
                    d[i+1] = Math.random() * 255;
                    d[i+2] = Math.random() * 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);
        } else if (m === 'blur') {
            // 简单盒式模糊
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const r = Math.max(1, Math.round(p / 100 * 12));
            const nd = new Uint8ClampedArray(d);
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let rr = 0, gg = 0, bb = 0, n = 0;
                    for (let dy = -r; dy <= r; dy++)
                        for (let dx = -r; dx <= r; dx++) {
                            const xx = x + dx, yy = y + dy;
                            if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
                            const i = (yy * w + xx) * 4;
                            rr += nd[i]; gg += nd[i+1]; bb += nd[i+2]; n++;
                        }
                    const i = (y * w + x) * 4;
                    d[i] = rr/n; d[i+1] = gg/n; d[i+2] = bb/n;
                }
            }
            ctx.putImageData(imgData, 0, 0);
        } else if (m === 'shuffle') {
            // 色块打乱: 块级随机重排
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const size = Math.max(8, Math.round(p / 100 * 40));
            const blocks = [];
            for (let y = 0; y < h; y += size)
                for (let x = 0; x < w; x += size)
                    blocks.push({x, y, w: Math.min(size, w-x), h: Math.min(size, h-y)});
            // Fisher-Yates 打乱
            for (let i = blocks.length - 1; i > 0; i--) {
                const j = Math.random() * (i + 1) | 0;
                [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
            }
            const nd = new Uint8ClampedArray(d);
            let bi = 0;
            for (let y = 0; y < h; y += size)
                for (let x = 0; x < w; x += size) {
                    const b = blocks[bi++];
                    for (let yy = 0; yy < Math.min(size, h-y); yy++)
                        for (let xx = 0; xx < Math.min(size, w-x); xx++) {
                            const srcI = ((b.y + yy) * w + b.x + xx) * 4;
                            const dstI = ((y + yy) * w + x + xx) * 4;
                            d[dstI] = nd[srcI]; d[dstI+1] = nd[srcI+1]; d[dstI+2] = nd[srcI+2];
                        }
                }
            ctx.putImageData(imgData, 0, 0);
        } else {
            // 干扰条纹: 水平半透明条纹
            const imgData = ctx.getImageData(0, 0, w, h);
            const d = imgData.data;
            const thickness = Math.max(2, Math.round(p / 100 * 24));
            const gap = Math.max(4, Math.round(p / 100 * 48));
            for (let y = 0; y < h; y++) {
                const inStrip = (y % (thickness + gap)) < thickness;
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    if (inStrip) {
                        const v = ((y / (thickness + gap)) | 0) % 2 ? 255 : 0;
                        d[i] = v; d[i+1] = v; d[i+2] = v;
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }
    }

    mode.addEventListener('change', render);
    power.addEventListener('input', render);
    container.querySelector('#go').addEventListener('click', render);
    container.querySelector('#dl').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = outCv.toDataURL('image/png');
        a.download = 'obfuscated.png';
        a.click();
    });

    return { cleanup() {} };
}
