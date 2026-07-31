export const id = 'barcode-maker';
export const name = '条形码生成';
export const icon = '📊';
export const description = '生成Code128条形码，支持下载PNG';
export const category = '生成工具';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:500px;margin:0 auto;display:flex;flex-direction:column;gap:12px;align-items:center">
            <input id="txt" type="text" placeholder="输入条形码内容..." style="width:100%;padding:10px 14px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text);font-size:15px;text-align:center">
            <canvas id="cv" width="400" height="140" style="background:#fff;border-radius:8px;border:1px solid var(--color-border)"></canvas>
            <div style="display:flex;gap:8px">
                <button class="btn btn-primary" id="gen">⚡ 生成</button>
                <button class="btn" id="dl">💾 下载PNG</button>
            </div>
            <div style="font-size:11px;color:var(--color-text-tertiary" id="status">支持字母数字和常用符号</div>
        </div>`;

    const txt = container.querySelector('#txt');
    const cv = container.querySelector('#cv');
    const status = container.querySelector('#status');

    // 简单 Code128B 编码
    function encode128(str) {
        const weights = [212222,222122,222221,121223,121322,131222,122213,122312,132212,221213,
            221312,231212,112232,122132,122231,113222,123122,123221,223211,221132,
            221231,213212,223112,312131,311222,321122,321221,312212,322112,322211,
            212123,212321,232121,111323,131123,131321,112313,132113,132311,211313,
            231113,231311,112133,112331,132131,113123,113321,133121,313121,211331,
            231131,213113,213311,213131,311123,311321,331121,312113,312311,332111,
            314111,221411,431111,111224,111422,121124,121421,141122,141221,112214,
            112412,122114,122411,142112,142211,241211,221114,413111,241112,134111,
            111242,121142,121241,114212,124112,124211,411212,421112,421211,212141,
            214121,412121,111143,111341,131141,114113,114311,411113,411311,113141,
            114131,311141,411131,211412,211214,211232,2331112];
        // ASCII 32-126 -> Code128B index 0-94
        let total = 104, code = [104];
        for (const ch of str) {
            const v = ch.charCodeAt(0) - 32;
            if (v < 0 || v > 94) return null;
            total += v * code.length;
            code.push(v);
        }
        code.push(total % 103);
        code.push(106); // stop
        const parts = [];
        for (const v of code) {
            const w = weights[v];
            const ws = String(w).split('').map(Number);
            let isBar = true;
            for (const ww of ws) { parts.push({bar: isBar, w: ww}); isBar = !isBar; }
        }
        return parts;
    }

    function generate() {
        const str = txt.value.trim();
        if (!str) { status.textContent = '请输入内容'; return; }
        const parts = encode128(str);
        if (!parts) { status.textContent = '❌ 含不支持的字符'; return; }

        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
        const totalW = parts.reduce((s, p) => s + p.w, 0);
        const scale = 330 / totalW;
        let x = 35;
        ctx.fillStyle = '#000';
        for (const p of parts) {
            const w = Math.max(1, p.w * scale);
            if (p.bar) ctx.fillRect(x, 20, w, 95);
            x += w;
        }
        ctx.font = '13px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(str, cv.width / 2, 130);
        status.textContent = '✅ 已生成';
    }

    container.querySelector('#gen').addEventListener('click', generate);
    txt.addEventListener('keydown', (e) => { if (e.key === 'Enter') generate(); });
    container.querySelector('#dl').addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = cv.toDataURL('image/png');
        a.download = 'barcode.png';
        a.click();
    });

    generate();

    return { cleanup() {} };
}
