/* ============================================
   哈希生成器 - MD5/SHA-1/SHA-256/SHA-512
   使用 Web Crypto API (SubtleCrypto)，大写/小写切换，HMAC 支持
   ============================================ */

export const id = 'hash-generator';
export const name = '哈希生成器';
export const icon = '🔐';
export const description = 'MD5/SHA-1/SHA-256/SHA-512 哈希计算，支持 HMAC';
export const category = '开发工具';
export const enabled = true;

const ALGOS = [
    { id: 'SHA-256', name: 'SHA-256', default: true },
    { id: 'SHA-512', name: 'SHA-512' },
    { id: 'SHA-1', name: 'SHA-1' },
    { id: 'MD5', name: 'MD5 (模拟)' }
];

/**
 * MD5 实现（纯 JS，Web Crypto 不支持 MD5）
 * 来自 js-md5 开源实现
 */
function md5(string) {
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
        const lX8 = (lX & 0x80000000);
        const lY8 = (lY & 0x80000000);
        const lX4 = (lX & 0x40000000);
        const lY4 = (lY & 0x40000000);
        const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
            else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
        } else return lResult ^ lX8 ^ lY8;
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }
    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function convertToWordArray(string) {
        const lWordCount = ((string.length + 8 - ((string.length + 8) % 64)) / 64 + 1) * 16;
        const lWordArray = Array(lWordCount - 1);
        let lBytePosition = 0;
        let lByteCount = 0;
        while (lByteCount < string.length) {
            lWordPosition = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordPosition] = (lWordArray[lWordPosition] | (string.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordPosition = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordPosition] = lWordArray[lWordPosition] | (0x80 << lBytePosition);
        lWordArray[lWordCount - 2] = string.length << 3;
        lWordArray[lWordCount - 1] = string.length >>> 29;
        return lWordArray;
    }
    function wordToHex(lValue) {
        let WordToHexValue = '';
        for (let lCount = 0; lCount <= 3; lCount++) {
            const lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue += ('0' + lByte.toString(16)).slice(-2);
        }
        return WordToHexValue;
    }
    let x = convertToWordArray(string);
    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    for (let k = 0; k < x.length; k += 16) {
        const AA = a, BB = b, CC = c, DD = d;
        a = FF(a, b, c, d, x[k + 0], 7, 0xD76AA478);
        d = FF(d, a, b, c, x[k + 1], 12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k + 2], 17, 0x242070DB);
        b = FF(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k + 4], 7, 0xF57C0FAF);
        d = FF(d, a, b, c, x[k + 5], 12, 0x4787C62A);
        c = FF(c, d, a, b, x[k + 6], 17, 0xA8304613);
        b = FF(b, c, d, a, x[k + 7], 22, 0xFD469501);
        a = FF(a, b, c, d, x[k + 8], 7, 0x698098D8);
        d = FF(d, a, b, c, x[k + 9], 12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1);
        b = FF(b, c, d, a, x[k + 11], 22, 0x895CD7BE);
        a = FF(a, b, c, d, x[k + 12], 7, 0x6B901122);
        d = FF(d, a, b, c, x[k + 13], 12, 0xFD987193);
        c = FF(c, d, a, b, x[k + 14], 17, 0xA679438E);
        b = FF(b, c, d, a, x[k + 15], 22, 0x49B40821);
        a = GG(a, b, c, d, x[k + 1], 5, 0xF61E2562);
        d = GG(d, a, b, c, x[k + 6], 9, 0xC040B340);
        c = GG(c, d, a, b, x[k + 11], 14, 0x265E5A51);
        b = GG(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k + 5], 5, 0xD62F105D);
        d = GG(d, a, b, c, x[k + 10], 9, 0x2441453);
        c = GG(c, d, a, b, x[k + 15], 14, 0xD8A1E681);
        b = GG(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k + 9], 5, 0x21E1CDE6);
        d = GG(d, a, b, c, x[k + 14], 9, 0xC33707D6);
        c = GG(c, d, a, b, x[k + 3], 14, 0xF4D50D87);
        b = GG(b, c, d, a, x[k + 8], 20, 0x455A14ED);
        a = GG(a, b, c, d, x[k + 13], 5, 0xA9E3E905);
        d = GG(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k + 7], 14, 0x676F02D9);
        b = GG(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k + 5], 4, 0xFFFA3942);
        d = HH(d, a, b, c, x[k + 8], 11, 0x8771F681);
        c = HH(c, d, a, b, x[k + 11], 16, 0x6D9D6122);
        b = HH(b, c, d, a, x[k + 14], 23, 0xFDE5380C);
        a = HH(a, b, c, d, x[k + 1], 4, 0xA4BEEA44);
        d = HH(d, a, b, c, x[k + 4], 11, 0x4BDECFA9);
        c = HH(c, d, a, b, x[k + 7], 16, 0xF6BB4B60);
        b = HH(b, c, d, a, x[k + 10], 23, 0xBEBFBC70);
        a = HH(a, b, c, d, x[k + 13], 4, 0x289B7EC6);
        d = HH(d, a, b, c, x[k + 0], 11, 0xEAA127FA);
        c = HH(c, d, a, b, x[k + 3], 16, 0xD4EF3085);
        b = HH(b, c, d, a, x[k + 6], 23, 0x4881D05);
        a = HH(a, b, c, d, x[k + 9], 4, 0xD9D4D039);
        d = HH(d, a, b, c, x[k + 12], 11, 0xE6DB99E5);
        c = HH(c, d, a, b, x[k + 15], 16, 0x1FA27CF8);
        b = HH(b, c, d, a, x[k + 2], 23, 0xC4AC5665);
        a = II(a, b, c, d, x[k + 0], 6, 0xF4292244);
        d = II(d, a, b, c, x[k + 7], 10, 0x432AFF97);
        c = II(c, d, a, b, x[k + 14], 15, 0xAB9423A7);
        b = II(b, c, d, a, x[k + 5], 21, 0xFC93A039);
        a = II(a, b, c, d, x[k + 12], 6, 0x655B59C3);
        d = II(d, a, b, c, x[k + 3], 10, 0x8F0CCC92);
        c = II(c, d, a, b, x[k + 10], 15, 0xFFEFF47D);
        b = II(b, c, d, a, x[k + 1], 21, 0x85845DD1);
        a = II(a, b, c, d, x[k + 8], 6, 0x6FA87E4F);
        d = II(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0);
        c = II(c, d, a, b, x[k + 6], 15, 0xA3014314);
        b = II(b, c, d, a, x[k + 13], 21, 0x4E0811A1);
        a = II(a, b, c, d, x[k + 4], 6, 0xF7537E82);
        d = II(d, a, b, c, x[k + 11], 10, 0xBD3AF235);
        c = II(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB);
        b = II(b, c, d, a, x[k + 9], 21, 0xEB86D391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

export function init(container) {
    let _timers = [];
    let uppercase = false;

    container.innerHTML = `
        <div class="hg-layout">
            <div class="hg-input-section">
                <label class="hg-label">输入文本</label>
                <textarea class="hg-textarea" id="hg-input" rows="5" placeholder="输入要计算哈希值的文本…"></textarea>
            </div>

            <div class="hg-options">
                <div class="hg-option-group">
                    <span class="hg-option-label">算法</span>
                    <div class="hg-algo-btns" id="hg-algo-btns">
                        ${ALGOS.map((a, i) => `
                            <button class="hg-algo-btn${a.default ? ' active' : ''}" data-algo="${a.id}">${a.name}</button>
                        `).join('')}
                    </div>
                </div>

                <div class="hg-option-row">
                    <div class="hg-option-group">
                        <span class="hg-option-label">大小写</span>
                        <button class="btn btn-sm" id="hg-case-toggle">大写</button>
                    </div>
                    <div class="hg-option-group" id="hg-hmac-group" style="display:none">
                        <span class="hg-option-label">HMAC 密钥</span>
                        <input type="text" class="input hg-hmac-input" id="hg-hmac-key" placeholder="可选：输入HMAC密钥" />
                    </div>
                </div>
            </div>

            <div class="hg-result-section" id="hg-result-section">
                <div class="hg-algo-name" id="hg-algo-name">SHA-256</div>
                <div class="hg-hash-display" id="hg-hash-display">
                    <span class="hg-hash-value" id="hg-hash-value">等待输入…</span>
                    <button class="btn btn-sm" id="hg-copy" title="复制">📋</button>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .hg-layout {
            max-width: 750px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xl);
        }
        .hg-input-section {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }
        .hg-label {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
        }
        .hg-textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-bg-input);
            color: var(--color-text-primary);
            font-family: var(--font-family-mono);
            font-size: var(--font-size-md);
            outline: none;
            resize: vertical;
            transition: border-color var(--transition-fast);
        }
        .hg-textarea:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 3px var(--color-accent-light);
        }
        .hg-options {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        }
        .hg-option-row {
            display: flex;
            align-items: flex-end;
            gap: var(--spacing-xl);
            flex-wrap: wrap;
        }
        .hg-option-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }
        .hg-option-label {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
        }
        .hg-algo-btns {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
        }
        .hg-algo-btn {
            padding: 5px 14px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-pill);
            background: var(--color-bg-secondary);
            color: var(--color-text-secondary);
            font-size: var(--font-size-sm);
            font-family: var(--font-family-mono);
            cursor: pointer;
            transition: all var(--transition-fast);
        }
        .hg-algo-btn:hover {
            border-color: var(--color-accent);
            color: var(--color-accent);
        }
        .hg-algo-btn.active {
            background: var(--color-accent);
            color: #fff;
            border-color: var(--color-accent);
        }
        .hg-hmac-input {
            font-family: var(--font-family-mono);
            font-size: var(--font-size-sm);
            width: 200px;
        }
        .hg-result-section {
            border-top: 1px solid var(--color-border);
            padding-top: var(--spacing-lg);
        }
        .hg-algo-name {
            font-size: var(--font-size-md);
            font-weight: 600;
            color: var(--color-accent);
            font-family: var(--font-family-mono);
            margin-bottom: var(--spacing-sm);
        }
        .hg-hash-display {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-lg);
            background: var(--color-bg-secondary);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            min-height: 56px;
        }
        .hg-hash-value {
            flex: 1;
            font-family: var(--font-family-mono);
            font-size: var(--font-size-md);
            color: var(--color-text-primary);
            word-break: break-all;
            line-height: 1.6;
        }
        .hg-hash-value.placeholder {
            color: var(--color-text-muted);
            font-size: var(--font-size-sm);
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#hg-input');
    const algoBtns = container.querySelector('#hg-algo-btns');
    const caseToggle = container.querySelector('#hg-case-toggle');
    const hmacKeyEl = container.querySelector('#hg-hmac-key');
    const hmacGroup = container.querySelector('#hg-hmac-group');
    const algoNameEl = container.querySelector('#hg-algo-name');
    const hashValueEl = container.querySelector('#hg-hash-value');
    const copyBtn = container.querySelector('#hg-copy');

    let currentAlgo = 'SHA-256';

    /**
     * arrayBuffer → hex 字符串
     */
    function bufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * 获取密钥导入后的 CryptoKey
     */
    async function getHmacKey(keyStr, algo) {
        const enc = new TextEncoder();
        const keyData = enc.encode(keyStr);
        const hashName = algo === 'SHA-1' ? 'SHA-1' : algo === 'SHA-512' ? 'SHA-512' : 'SHA-256';
        return crypto.subtle.importKey(
            'raw', keyData,
            { name: 'HMAC', hash: hashName },
            false, ['sign']
        );
    }

    /**
     * 计算哈希
     */
    async function computeHash() {
        const text = inputEl.value;
        const hmacKey = hmacKeyEl.value.trim();

        if (!text) {
            hashValueEl.textContent = '等待输入…';
            hashValueEl.classList.add('placeholder');
            return;
        }

        hashValueEl.textContent = '计算中…';
        hashValueEl.classList.remove('placeholder');

        try {
            let hash;
            const enc = new TextEncoder();
            const data = enc.encode(text);

            if (currentAlgo === 'MD5') {
                // MD5 用纯 JS 实现
                hash = md5(text);
                if (hmacKey) {
                    // HMAC-MD5 模拟
                    const blockSize = 64;
                    let key = enc.encode(hmacKey);
                    if (key.length > blockSize) {
                        // 先对key做MD5
                        const kHash = md5(hmacKey);
                        const kBytes = new Uint8Array(16);
                        for (let i = 0; i < 32; i += 2) {
                            kBytes[i / 2] = parseInt(kHash.substring(i, i + 2), 16);
                        }
                        key = kBytes;
                    }
                    const iPad = new Uint8Array(blockSize);
                    const oPad = new Uint8Array(blockSize);
                    for (let i = 0; i < blockSize; i++) {
                        iPad[i] = (key[i] || 0) ^ 0x36;
                        oPad[i] = (key[i] || 0) ^ 0x5C;
                    }
                    const iPadStr = new TextDecoder().decode(iPad);
                    const oPadStr = new TextDecoder().decode(oPad);
                    hash = md5(oPadStr + String.fromCharCode.apply(null,
                        (() => {
                            const innerHash = md5(iPadStr + text);
                            const bytes = new Uint8Array(16);
                            for (let i = 0; i < 32; i += 2) {
                                bytes[i / 2] = parseInt(innerHash.substring(i, i + 2), 16);
                            }
                            return bytes;
                        })()
                    ));
                }
            } else {
                // Web Crypto API
                if (hmacKey) {
                    const key = await getHmacKey(hmacKey, currentAlgo);
                    const sig = await crypto.subtle.sign('HMAC', key, data);
                    hash = bufferToHex(sig);
                } else {
                    const hashBuffer = await crypto.subtle.digest(currentAlgo, data);
                    hash = bufferToHex(hashBuffer);
                }
            }

            hash = uppercase ? hash.toUpperCase() : hash.toLowerCase();
            hashValueEl.textContent = hash;
        } catch (err) {
            hashValueEl.textContent = '计算失败: ' + err.message;
        }
    }

    /**
     * 更新算法显示
     */
    function updateAlgoDisplay() {
        const hmacSuffix = hmacKeyEl.value.trim() ? ' (HMAC)' : '';
        algoNameEl.textContent = (currentAlgo === 'MD5' ? 'MD5' : currentAlgo) + hmacSuffix;

        // HMAC 不支持 SHA-512 以外的显示控制（全部支持）
    }

    /**
     * 复制文本
     */
    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch { return false; }
    }

    // 事件：输入防抖
    let debounceTimer;
    inputEl.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(computeHash, 300);
    });

    // 事件：算法切换
    algoBtns.addEventListener('click', (e) => {
        const btn = e.target.closest('.hg-algo-btn');
        if (!btn) return;
        currentAlgo = btn.dataset.algo;
        algoBtns.querySelectorAll('.hg-algo-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateAlgoDisplay();
        computeHash();
    });

    // 事件：大小写切换
    caseToggle.addEventListener('click', () => {
        uppercase = !uppercase;
        caseToggle.textContent = uppercase ? '小写' : '大写';
        computeHash();
    });

    // 事件：HMAC 密钥变更
    hmacKeyEl.addEventListener('input', () => {
        updateAlgoDisplay();
        computeHash();
    });

    // 事件：复制
    copyBtn.addEventListener('click', async () => {
        const text = hashValueEl.textContent;
        if (!text || text === '等待输入…' || text.startsWith('计算')) return;
        const ok = await copyText(text);
        const orig = copyBtn.textContent;
        copyBtn.textContent = ok ? '✅' : '❌';
        _timers.push(setTimeout(() => { copyBtn.textContent = orig; }, 1500));
    });

    return {
        cleanup() {
            _timers.forEach(t => clearTimeout(t));
            clearTimeout(debounceTimer);
        }
    };
}
