export const id = 'gradient-maker';
export const name = '渐变生成器';
export const icon = '🎨';
export const description = '生成CSS渐变背景，实时预览，一键复制';
export const category = '生成工具';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:620px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
            <div id="preview" style="height:160px;border-radius:12px;border:1px solid var(--color-border);transition:background .3s"></div>
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                <input type="color" id="c1" value="#ff6b9d" style="width:50px;height:36px;border:none;border-radius:8px;cursor:pointer;background:none">
                <span style="color:var(--color-text-secondary)">→</span>
                <input type="color" id="c2" value="#4facfe" style="width:50px;height:36px;border:none;border-radius:8px;cursor:pointer;background:none">
                <select id="dir" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                    <option value="to right">→ 水平</option>
                    <option value="to bottom">↓ 垂直</option>
                    <option value="to bottom right">↘ 对角</option>
                    <option value="135deg">↗ 135°</option>
                    <option value="circle">◎ 圆形</option>
                </select>
                <span style="font-size:13px;color:var(--color-text-secondary)">随机:</span>
                <button class="btn" id="rand" style="padding:6px 14px">🎲</button>
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-primary" id="copy" style="flex:1">📋 复制CSS</button>
                <button class="btn" id="sw" style="flex:1">⇅ 交换颜色</button>
            </div>
            <textarea id="css" readonly style="height:70px;font-family:var(--font-family-mono);font-size:12px;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:8px;padding:10px;color:var(--color-text-secondary)"></textarea>
            <div style="font-size:11px;color:var(--color-text-tertiary)">支持多层渐变: 点击"随机"生成惊艳组合</div>
        </div>`;

    const preview = container.querySelector('#preview');
    const c1 = container.querySelector('#c1'), c2 = container.querySelector('#c2');
    const dir = container.querySelector('#dir');
    const cssEl = container.querySelector('#css');

    function randColor() {
        const h = Math.random() * 360;
        const s = 60 + Math.random() * 40;
        const l = 45 + Math.random() * 25;
        return `hsl(${h|0},${s|0}%,${l|0}%)`;
    }

    function update() {
        const d = dir.value;
        const grad = d === 'circle'
            ? `radial-gradient(circle at center, ${c1.value}, ${c2.value})`
            : `linear-gradient(${d}, ${c1.value}, ${c2.value})`;
        preview.style.background = grad;
        cssEl.value = `background: ${grad};`;
    }

    c1.addEventListener('input', update);
    c2.addEventListener('input', update);
    dir.addEventListener('change', update);

    container.querySelector('#rand').addEventListener('click', () => {
        c1.value = randColor(); c2.value = randColor();
        const dirs = ['to right','to bottom','to bottom right','135deg','circle'];
        dir.value = dirs[Math.random() * dirs.length | 0];
        update();
    });

    container.querySelector('#sw').addEventListener('click', () => {
        const t = c1.value; c1.value = c2.value; c2.value = t; update();
    });

    container.querySelector('#copy').addEventListener('click', async () => {
        const btn = container.querySelector('#copy');
        try { await navigator.clipboard.writeText(cssEl.value); btn.textContent = '✅ 已复制'; setTimeout(() => btn.textContent = '📋 复制CSS', 1500); }
        catch (e) { cssEl.select(); document.execCommand('copy'); }
    });

    update();

    return { cleanup() {} };
}
