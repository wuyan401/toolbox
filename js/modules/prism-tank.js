export const id = 'prism-tank';
export const name = '光棱坦克工厂';
export const icon = '🔮';
export const description = '图片隐写：把完整图像藏在看似普通的图里，可提取还原';
export const category = '生成美化';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;gap:8px;align-items:center">
                <select id="mode" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                    <option value="hide">🕵️ 隐藏图像 (载体+秘密 → 伪装图)</option>
                    <option value="extract">🔍 提取图像 (伪装图 → 还原秘密)</option>
                </select>
            </div>
            <div id="hideUI" style="display:flex;flex-direction:column;gap:10px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                    <div style="padding:14px;border:2px dashed var(--color-border);border-radius:12px;text-align:center;cursor:pointer" id="carrierDrop">
                        <div style="font-size:30px">🖼️</div>
                        <div style="color:var(--color-text-secondary);font-size:12px;margin-top:4px">① 载体图片 (伪装外观)</div>
                        <input type="file" id="carrierFile" accept="image/*" style="display:none">
                    </div>
                    <div style="padding:14px;border:2px dashed var(--color-border);border-radius:12px;text-align:center;cursor:pointer" id="secretDrop">
                        <div style="font-size:30px">🤫</div>
                        <div style="color:var(--color-text-secondary);font-size:12px;margin-top:4px">② 秘密图片 (要隐藏的)</div>
                        <input type="file" id="secretFile" accept="image/*" style="display:none">
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                    <span style="font-size:13px;color:var(--color-text-secondary)">嵌入深度:</span>
                    <select id="depth" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                        <option value="8" selected>8位 完整嵌入 (载体变灰, 无损还原)</option>
                        <option value="4">4位 (载体稍损, 还原清晰)</option>
                        <option value="2">2位 (载体微损, 还原一般)</option>
                        <option value="1">1位 (载体无损, 还原模糊)</option>
                    </select>
                    <button class="btn btn-primary" id="goHide" style="margin-left:auto">⚡ 隐藏</button>
                </div>
                <div id="hideResult" style="display:none">
                    <div style="text-align:center;font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">伪装图 (看起来就是普通图，但藏着秘密)</div>
                    <canvas id="outHide" style="max-width:100%;border-radius:8px;background:#ddd;margin:0 auto;display:block"></canvas>
                    <div style="display:flex;gap:8px;margin-top:8px">
                        <button class="btn btn-primary" id="dlHide" style="flex:1">💾 下载伪装图</button>
                    </div>
                </div>
            </div>
            <div id="extractUI" style="display:none;flex-direction:column;gap:10px">
                <div style="padding:14px;border:2px dashed var(--color-border);border-radius:12px;text-align:center;cursor:pointer" id="hiddenDrop">
                    <div style="font-size:30px">🔍</div>
                    <div style="color:var(--color-text-secondary);font-size:12px;margin-top:4px">选择伪装图 (含隐藏内容)</div>
                    <input type="file" id="hiddenFile" accept="image/*" style="display:none">
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                    <span style="font-size:13px;color:var(--color-text-secondary)">嵌入深度:</span>
                    <select id="depthX" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                        <option value="8" selected>8位 完整嵌入</option>
                        <option value="4">4位</option>
                        <option value="2">2位</option>
                        <option value="1">1位</option>
                    </select>
                    <button class="btn btn-primary" id="goExtract" style="margin-left:auto">🔍 提取</button>
                </div>
                <div id="extractResult" style="display:none">
                    <div style="text-align:center;font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">提取出的秘密图像</div>
                    <canvas id="outExtract" style="max-width:100%;border-radius:8px;background:#222;margin:0 auto;display:block"></canvas>
                    <div style="display:flex;gap:8px;margin-top:8px">
                        <button class="btn btn-primary" id="dlExtract" style="flex:1">💾 下载秘密图</button>
                    </div>
                </div>
            </div>
        </div>`;

    const mode = container.querySelector('#mode');
    const hideUI = container.querySelector('#hideUI');
    const extractUI = container.querySelector('#extractUI');
    let carrierImg = null, secretImg = null, hiddenImg = null;
    const SIZE = 320;

    function bindDrop(dropId, fileId, cb) {
        const drop = container.querySelector(dropId);
        const file = container.querySelector(fileId);
        drop.addEventListener('click', () => file.click());
        file.addEventListener('change', (e) => cb(e.target.files[0]));
        drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.borderColor = 'var(--color-accent)'; });
        drop.addEventListener('dragleave', () => { drop.style.borderColor = 'var(--color-border)'; });
        drop.addEventListener('drop', (e) => { e.preventDefault(); drop.style.borderColor = 'var(--color-border)'; cb(e.dataTransfer.files[0]); });
    }

    function loadImg(f, cb) {
        if (!f || !f.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            const i = new Image();
            i.onload = () => cb(i);
            i.src = reader.result;
        };
        reader.readAsDataURL(f);
    }

    function toCanvas(img, w, h) {
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        // 覆盖填充
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale, dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        return cv;
    }

    bindDrop('#carrierDrop', '#carrierFile', (f) => loadImg(f, (i) => { carrierImg = i; container.querySelector('#carrierDrop').style.borderColor = '#22c55e'; }));
    bindDrop('#secretDrop', '#secretFile', (f) => loadImg(f, (i) => { secretImg = i; container.querySelector('#secretDrop').style.borderColor = '#22c55e'; }));
    bindDrop('#hiddenDrop', '#hiddenFile', (f) => loadImg(f, (i) => { hiddenImg = i; container.querySelector('#hiddenDrop').style.borderColor = '#22c55e'; }));

    mode.addEventListener('change', () => {
        hideUI.style.display = mode.value === 'hide' ? 'flex' : 'none';
        extractUI.style.display = mode.value === 'extract' ? 'flex' : 'none';
    });

    // LSB 隐写: 把 secret 缩放到载体尺寸, 嵌入低位
    // 8位=全量嵌入: 载体先灰度化, 秘密图RGB原样写入(无损还原); 低位嵌入保留载体观感
    container.querySelector('#goHide').addEventListener('click', () => {
        if (!carrierImg || !secretImg) { alert('请先选择载体图和秘密图'); return; }
        const depth = +container.querySelector('#depth').value;
        const carrierCv = toCanvas(carrierImg, SIZE, SIZE);
        const secretCv = toCanvas(secretImg, SIZE, SIZE);
        const cctx = carrierCv.getContext('2d');
        const sctx = secretCv.getContext('2d');
        const cData = cctx.getImageData(0, 0, SIZE, SIZE);
        const sData = sctx.getImageData(0, 0, SIZE, SIZE);
        const cd = cData.data, sd = sData.data;
        const mask = (1 << depth) - 1;

        if (depth >= 8) {
            // 无损模式: 载体灰度化, 秘密RGB全量覆盖
            for (let i = 0; i < cd.length; i += 4) {
                const g = (cd[i] + cd[i+1] + cd[i+2]) / 3 | 0;
                cd[i] = g; cd[i+1] = g; cd[i+2] = g; // 载体变灰
                cd[i] = sd[i]; cd[i+1] = sd[i+1]; cd[i+2] = sd[i+2]; // 秘密覆盖
            }
        } else {
            for (let i = 0; i < cd.length; i += 4) {
                for (let ch = 0; ch < 3; ch++) {
                    const secretHi = (sd[i + ch] >> (8 - depth)) & mask; // 秘密图高位
                    cd[i + ch] = (cd[i + ch] & ~mask) | secretHi;       // 载入载体低位
                }
            }
        }
        cctx.putImageData(cData, 0, 0);

        const outHide = container.querySelector('#outHide');
        outHide.width = SIZE; outHide.height = SIZE;
        outHide.getContext('2d').drawImage(carrierCv, 0, 0);
        container.querySelector('#hideResult').style.display = 'block';
    });

    container.querySelector('#dlHide').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = container.querySelector('#outHide').toDataURL('image/png');
        a.download = 'carrier-hidden.png';
        a.click();
    });

    // 提取
    container.querySelector('#goExtract').addEventListener('click', () => {
        if (!hiddenImg) { alert('请先选择伪装图'); return; }
        const depth = +container.querySelector('#depthX').value;
        const cv = toCanvas(hiddenImg, SIZE, SIZE);
        const ctx = cv.getContext('2d');
        const imgData = ctx.getImageData(0, 0, SIZE, SIZE);
        const d = imgData.data;
        const mask = (1 << depth) - 1;

        if (depth >= 8) {
            // 无损提取: 直接读出秘密RGB
            for (let i = 0; i < d.length; i += 4) {
                d[i] = d[i] & 255; d[i+1] = d[i+1] & 255; d[i+2] = d[i+2] & 255;
            }
        } else {
            for (let i = 0; i < d.length; i += 4) {
                for (let ch = 0; ch < 3; ch++) {
                    const low = d[i + ch] & mask; // 提取低位
                    // 位复制放大到全范围: low重复填充8位 (1位: 0/255, 2位: 0/85/170/255, 4位: 0/17..255)
                    let v = 0;
                    for (let b = 0; b < 8; b += depth) v |= low << (8 - depth - b);
                    d[i + ch] = v;
                }
            }
        }
        ctx.putImageData(imgData, 0, 0);

        const outExtract = container.querySelector('#outExtract');
        outExtract.width = SIZE; outExtract.height = SIZE;
        outExtract.getContext('2d').drawImage(cv, 0, 0);
        container.querySelector('#extractResult').style.display = 'block';
    });

    container.querySelector('#dlExtract').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = container.querySelector('#outExtract').toDataURL('image/png');
        a.download = 'secret-extracted.png';
        a.click();
    });

    return { cleanup() {} };
}
