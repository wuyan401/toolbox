export const id = 'image-to-base64';
export const name = '图片转Base64';
export const icon = '📷';
export const description = '图片文件转Base64编码，支持预览和复制';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:14px">
            <div style="padding:20px;border:2px dashed var(--color-border);border-radius:12px;text-align:center;cursor:pointer;transition:all .2s" id="drop">
                <div style="font-size:40px">📁</div>
                <div style="color:var(--color-text-secondary);font-size:13px;margin-top:8px">点击选择图片 / 拖拽到此处</div>
                <input type="file" id="file" accept="image/*" style="display:none">
            </div>
            <div id="preview" style="display:none;text-align:center">
                <img id="pimg" style="max-width:200px;max-height:150px;border-radius:8px;border:1px solid var(--color-border)">
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-primary" id="copy" style="flex:1">📋 复制Base64</button>
                <button class="btn" id="dl" style="flex:1">💾 下载.txt</button>
            </div>
            <textarea id="out" readonly style="height:120px;font-family:var(--font-family-mono);font-size:11px;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:8px;padding:10px;color:var(--color-text-secondary)" placeholder="Base64 输出..."></textarea>
        </div>`;

    const drop = container.querySelector('#drop');
    const fileInput = container.querySelector('#file');
    const out = container.querySelector('#out');
    const preview = container.querySelector('#preview');
    const pimg = container.querySelector('#pimg');
    const copyBtn = container.querySelector('#copy');
    const dlBtn = container.querySelector('#dl');

    function handleFile(f) {
        if (!f || !f.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            out.value = reader.result;
            pimg.src = reader.result;
            preview.style.display = '';
        };
        reader.readAsDataURL(f);
    }

    drop.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.style.borderColor = 'var(--color-accent)'; });
    drop.addEventListener('dragleave', () => { drop.style.borderColor = 'var(--color-border)'; });
    drop.addEventListener('drop', (e) => {
        e.preventDefault();
        drop.style.borderColor = 'var(--color-border)';
        handleFile(e.dataTransfer.files[0]);
    });

    copyBtn.addEventListener('click', async () => {
        if (!out.value) return;
        try { await navigator.clipboard.writeText(out.value); copyBtn.textContent = '✅ 已复制'; setTimeout(() => copyBtn.textContent = '📋 复制Base64', 1500); }
        catch (e) { out.select(); document.execCommand('copy'); }
    });

    dlBtn.addEventListener('click', () => {
        if (!out.value) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([out.value], { type: 'text/plain' }));
        a.download = 'base64.txt';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    return { cleanup() { /* 无全局监听 */ } };
}
