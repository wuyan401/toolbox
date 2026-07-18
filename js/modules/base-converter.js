/* ============================================
   进制转换 - 二进制/八进制/十进制/十六进制/三十二进制/三十六进制
   自动识别输入前缀，实时转换，每个结果可复制
   ============================================ */

export const id = 'base-converter';
export const name = '进制转换';
export const icon = '🔢';
export const description = '2/8/10/16/32/36 进制一键转换，支持前缀自动识别';
export const category = '开发工具';
export const enabled = true;

/** 各进制基础定义 */
const BASES = [
    { name: '二进制 (Base 2)', base: 2, prefix: '0b', color: '#22c55e' },
    { name: '八进制 (Base 8)', base: 8, prefix: '0o', color: '#f59e0b' },
    { name: '十进制 (Base 10)', base: 10, prefix: '', color: '#0071E3' },
    { name: '十六进制 (Base 16)', base: 16, prefix: '0x', color: '#8B5CF6' },
    { name: '三十二进制 (Base 32)', base: 32, prefix: '', color: '#EC4899' },
    { name: '三十六进制 (Base 36)', base: 36, prefix: '', color: '#14b8a6' }
];

/** 自动识别输入进制 */
function detectBase(raw) {
    raw = raw.trim();
    if (!raw) return null;
    if (raw.startsWith('0b') || raw.startsWith('0B')) return { base: 2, value: raw.slice(2) };
    if (raw.startsWith('0o') || raw.startsWith('0O')) return { base: 8, value: raw.slice(2) };
    if (raw.startsWith('0x') || raw.startsWith('0X')) return { base: 16, value: raw.slice(2) };
    // 检查是否合法十进制数字
    if (/^[0-9]+$/.test(raw)) return { base: 10, value: raw };
    // 尝试按不同进制解析
    // 检测是否全为合法的二进制
    if (/^[01]+$/.test(raw) && raw.length >= 4) return { base: 2, value: raw };
    // 检测是否全为合法的八进制数字
    if (/^[0-7]+$/.test(raw) && raw.length >= 2) return { base: 8, value: raw };
    // 默认尝试十进制，失败则16进制
    if (/^[0-9A-Fa-f]+$/.test(raw)) return { base: 16, value: raw };
    if (/^[0-9A-Za-z]+$/.test(raw)) return { base: 36, value: raw };
    return null;
}

export function init(container) {
    let _timers = [];
    let currentNumber = null;

    container.innerHTML = `
        <div class="bc-layout">
            <div class="bc-input-section">
                <label class="bc-label">输入数值</label>
                <div class="bc-input-row">
                    <input type="text" class="bc-input" id="bc-input" placeholder="输入任意进制数值…" autofocus />
                    <span class="bc-hint" id="bc-hint">支持前缀：0b / 0o / 0x</span>
                </div>
                <div class="bc-error" id="bc-error" style="display:none"></div>
            </div>
            <div class="bc-results" id="bc-results"></div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .bc-layout {
            max-width: 700px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xl);
        }
        .bc-input-section {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .bc-label {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
        }
        .bc-input-row {
            position: relative;
        }
        .bc-input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-bg-input);
            color: var(--color-text-primary);
            font-family: var(--font-family-mono);
            font-size: 20px;
            outline: none;
            transition: border-color var(--transition-fast);
        }
        .bc-input:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 3px var(--color-accent-light);
        }
        .bc-hint {
            display: block;
            margin-top: 6px;
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
        }
        .bc-error {
            color: var(--color-danger);
            font-size: var(--font-size-sm);
            padding: 6px 12px;
            background: rgba(255,59,48,0.08);
            border-radius: var(--radius-sm);
        }
        .bc-results {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .bc-result-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: 12px 16px;
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            transition: background var(--transition-fast);
        }
        .bc-result-row:hover {
            background: var(--color-bg-hover);
        }
        .bc-base-badge {
            flex: 0 0 auto;
            padding: 3px 10px;
            border-radius: var(--radius-pill);
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: #fff;
            white-space: nowrap;
        }
        .bc-result-value {
            flex: 1;
            font-family: var(--font-family-mono);
            font-size: var(--font-size-md);
            color: var(--color-text-primary);
            word-break: break-all;
            overflow-wrap: anywhere;
        }
        .bc-result-value.placeholder {
            color: var(--color-text-muted);
        }
        .bc-copy-btn {
            flex: 0 0 auto;
            padding: 4px 10px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-bg-input);
            cursor: pointer;
            font-size: 14px;
            transition: all var(--transition-fast);
        }
        .bc-copy-btn:hover {
            border-color: var(--color-accent);
            background: var(--color-accent-light);
        }
    `;
    container.appendChild(style);

    const inputEl = container.querySelector('#bc-input');
    const hintEl = container.querySelector('#bc-hint');
    const errorEl = container.querySelector('#bc-error');
    const resultsEl = container.querySelector('#bc-results');

    /**
     * 渲染结果行
     */
    function renderResults(bigValue) {
        let html = '';
        BASES.forEach(({ name, base, prefix, color }) => {
            try {
                const converted = bigValue.toString(base).toUpperCase();
                html += `
                    <div class="bc-result-row">
                        <span class="bc-base-badge" style="background:${color}">${name}</span>
                        <span class="bc-result-value">${escapeHtml(converted)}</span>
                        <button class="bc-copy-btn" data-value="${escapeAttr(converted)}" title="复制">📋</button>
                    </div>
                `;
            } catch {
                html += `
                    <div class="bc-result-row">
                        <span class="bc-base-badge" style="background:${color}">${name}</span>
                        <span class="bc-result-value" style="color:var(--color-text-muted)">超出范围</span>
                        <span></span>
                    </div>
                `;
            }
        });
        resultsEl.innerHTML = html;
    }

    function renderEmpty() {
        let html = '';
        BASES.forEach(({ name, color }) => {
            html += `
                <div class="bc-result-row">
                    <span class="bc-base-badge" style="background:${color}">${name}</span>
                    <span class="bc-result-value placeholder">--</span>
                    <span></span>
                </div>
            `;
        });
        resultsEl.innerHTML = html;
    }

    /**
     * 处理输入
     */
    function handleInput() {
        const raw = inputEl.value.trim();
        if (!raw) {
            errorEl.style.display = 'none';
            hintEl.style.color = '';
            renderEmpty();
            currentNumber = null;
            return;
        }

        const detected = detectBase(raw);
        if (!detected) {
            errorEl.style.display = 'block';
            errorEl.textContent = '无法识别输入格式';
            hintEl.style.color = '';
            renderEmpty();
            currentNumber = null;
            return;
        }

        try {
            let num;
            switch (detected.base) {
                case 2:  num = BigInt('0b' + detected.value); break;
                case 8:  num = BigInt('0o' + detected.value); break;
                case 10: num = BigInt(detected.value); break;
                case 16: num = BigInt('0x' + detected.value); break;
                default: {
                    // base 32/36 → parseInt 转 BigInt（仅限安全整数范围）
                    const parsed = parseInt(detected.value, detected.base);
                    if (isNaN(parsed)) throw new Error('无效输入');
                    num = BigInt(parsed);
                }
            }

            errorEl.style.display = 'none';
            hintEl.textContent = `已识别：${detected.base} 进制 | 十进制值: ${num.toString()}`;
            hintEl.style.color = 'var(--color-accent)';
            currentNumber = num;
            renderResults(num);
        } catch (e) {
            errorEl.style.display = 'block';
            errorEl.textContent = '解析出错: ' + e.message;
            renderEmpty();
            currentNumber = null;
        }
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

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeAttr(str) {
        return str.replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    // 事件：输入
    inputEl.addEventListener('input', handleInput);

    // 事件：复制（委托）
    resultsEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('.bc-copy-btn');
        if (!btn) return;
        const value = btn.dataset.value;
        if (!value) return;
        const ok = await copyText(value);
        const orig = btn.textContent;
        btn.textContent = ok ? '✅' : '❌';
        _timers.push(setTimeout(() => { btn.textContent = orig; }, 1000));
    });

    // 初始渲染
    renderEmpty();

    return {
        cleanup() {
            _timers.forEach(t => clearTimeout(t));
        }
    };
}
