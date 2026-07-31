export const id = 'text-encrypt';
export const name = '文本加密';
export const icon = '🔐';
export const description = '凯撒密码/AES加密解密，保护敏感文本';
export const category = '生成工具';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;gap:8px;align-items:center">
                <span style="font-size:13px;color:var(--color-text-secondary)">算法:</span>
                <select id="alg" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
                    <option value="aes">AES-GCM (推荐)</option>
                    <option value="caesar">凯撒密码</option>
                </select>
                <span style="font-size:13px;color:var(--color-text-secondary);margin-left:12px">密钥:</span>
                <input id="key" type="text" placeholder="输入密钥(凯撒时填位移数)" style="flex:1;padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text)">
            </div>
            <div style="display:flex;gap:8px">
                <button class="btn btn-primary" id="enc" style="flex:1">🔒 加密</button>
                <button class="btn" id="dec" style="flex:1">🔓 解密</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">原文</div>
                    <textarea id="pt" style="width:100%;height:200px;font-family:var(--font-family-mono);font-size:12px;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:8px;padding:10px;color:var(--color-text)"></textarea>
                </div>
                <div>
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">密文</div>
                    <textarea id="ct" style="width:100%;height:200px;font-family:var(--font-family-mono);font-size:12px;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:8px;padding:10px;color:var(--color-text)"></textarea>
                </div>
            </div>
            <div style="font-size:11px;color:var(--color-text-tertiary)" id="status">AES-GCM 需要密钥；凯撒位移默认3</div>
        </div>`;

    const alg = container.querySelector('#alg');
    const keyEl = container.querySelector('#key');
    const pt = container.querySelector('#pt');
    const ct = container.querySelector('#ct');
    const status = container.querySelector('#status');

    function getKeyMaterial() {
        const k = keyEl.value || 'default-key-2048';
        return crypto.subtle.importKey('raw', new TextEncoder().encode(k), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    }

    function caesar(text, shift) {
        return text.split('').map(ch => {
            const code = ch.charCodeAt(0);
            if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
            if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97);
            return ch;
        }).join('');
    }

    async function encrypt() {
        try {
            const text = pt.value;
            if (!text) { status.textContent = '请输入原文'; return; }
            if (alg.value === 'caesar') {
                const shift = parseInt(keyEl.value) || 3;
                ct.value = caesar(text, shift);
                status.textContent = '✅ 凯撒加密完成 (位移 ' + shift + ')';
            } else {
                const key = await getKeyMaterial();
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const data = new TextEncoder().encode(text);
                const enc = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
                const combined = new Uint8Array(iv.length + enc.byteLength);
                combined.set(iv); combined.set(new Uint8Array(enc), iv.length);
                ct.value = btoa(String.fromCharCode(...combined));
                status.textContent = '✅ AES-GCM 加密完成';
            }
        } catch (e) { status.textContent = '❌ ' + e.message; }
    }

    async function decrypt() {
        try {
            const text = ct.value.trim();
            if (!text) { status.textContent = '请输入密文'; return; }
            if (alg.value === 'caesar') {
                const shift = parseInt(keyEl.value) || 3;
                pt.value = caesar(text, -shift);
                status.textContent = '✅ 凯撒解密完成';
            } else {
                const key = await getKeyMaterial();
                const raw = Uint8Array.from(atob(text), c => c.charCodeAt(0));
                const iv = raw.slice(0, 12);
                const data = raw.slice(12);
                const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
                pt.value = new TextDecoder().decode(dec);
                status.textContent = '✅ AES-GCM 解密完成';
            }
        } catch (e) { status.textContent = '❌ 解密失败(密钥错误或密文损坏)'; }
    }

    container.querySelector('#enc').addEventListener('click', encrypt);
    container.querySelector('#dec').addEventListener('click', decrypt);

    return { cleanup() {} };
}
