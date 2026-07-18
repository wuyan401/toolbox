/* ============================================
   Base64 编解码工具 - 上下排列，支持编解码切换
   ============================================ */

export const id = 'base64';
export const name = 'Base64 编解码';
export const icon = '🔐';
export const description = 'Base64 编码与解码转换';
export const category = '编码转换';
export const enabled = true;

export function init(container) {
    let mode = 'encode'; // 'encode' | 'decode'

    // 渲染 UI
    container.innerHTML = `
        <div class="tool-col" style="flex:1;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span class="tool-col-title" id="b64-input-label">原文</span>
                <span class="tool-col-title" style="font-weight:400;font-size:11px;" id="b64-char-count">0 字符</span>
            </div>
            <textarea class="textarea" id="b64-input" placeholder="输入要编码的文本..." style="flex:1;min-height:150px;"></textarea>
        </div>

        <div class="tool-actions" style="justify-content:center;padding:8px 0;">
            <button class="btn" id="b64-swap" title="互换编解码方向">🔄 切换方向</button>
            <button class="btn btn-primary" id="b64-execute">🔐 执行编解码</button>
            <button class="btn" id="b64-copy-input">📋 复制输入</button>
            <button class="btn" id="b64-copy-output">📋 复制输出</button>
            <button class="btn" id="b64-clear">🗑 清空</button>
        </div>

        <div class="tool-col" style="flex:1;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span class="tool-col-title" id="b64-output-label">编码结果</span>
                <span class="tool-col-title" style="font-weight:400;font-size:11px;" id="b64-output-count">0 字符</span>
            </div>
            <textarea class="textarea" id="b64-output" placeholder="结果将显示在这里..." readonly style="flex:1;min-height:150px;"></textarea>
        </div>

        <div id="b64-error" style="display:none;padding:8px 12px;background:var(--color-diff-remove);color:var(--color-danger);border-radius:var(--radius-sm);font-size:var(--font-size-sm);"></div>
    `;

    // DOM 引用
    const inputEl = container.querySelector('#b64-input');
    const outputEl = container.querySelector('#b64-output');
    const inputLabel = container.querySelector('#b64-input-label');
    const outputLabel = container.querySelector('#b64-output-label');
    const inputCount = container.querySelector('#b64-char-count');
    const outputCount = container.querySelector('#b64-output-count');
    const errorEl = container.querySelector('#b64-error');

    /**
     * 更新标签和占位符
     */
    function updateLabels() {
        if (mode === 'encode') {
            inputLabel.textContent = '原文';
            outputLabel.textContent = '编码结果 (Base64)';
            inputEl.placeholder = '输入要编码的文本...';
            outputEl.placeholder = '编码结果将显示在这里...';
        } else {
            inputLabel.textContent = 'Base64 字符串';
            outputLabel.textContent = '解码结果';
            inputEl.placeholder = '输入 Base64 编码的字符串...';
            outputEl.placeholder = '解码结果将显示在这里...';
        }
    }

    /**
     * 执行编解码
     */
    function execute() {
        const raw = inputEl.value;
        errorEl.style.display = 'none';

        if (!raw) {
            outputEl.value = '';
            outputCount.textContent = '0 字符';
            return;
        }

        try {
            if (mode === 'encode') {
                // 编码：文本 → Base64（支持中文）
                const encoded = btoa(unescape(encodeURIComponent(raw)));
                outputEl.value = encoded;
            } else {
                // 解码：Base64 → 文本
                const decoded = decodeURIComponent(escape(atob(raw.trim())));
                outputEl.value = decoded;
            }
            outputCount.textContent = `${outputEl.value.length.toLocaleString()} 字符`;
        } catch (err) {
            if (mode === 'decode') {
                errorEl.textContent = '❌ 解码失败：输入的字符串不是有效的 Base64 编码';
                errorEl.style.display = 'block';
            } else {
                errorEl.textContent = `❌ 编码失败：${err.message}`;
                errorEl.style.display = 'block';
            }
            outputEl.value = '';
            outputCount.textContent = '0 字符';
        }
    }

    /**
     * 复制文本到剪贴板
     * @param {HTMLTextAreaElement} sourceEl
     * @param {HTMLButtonElement} btnEl
     */
    async function copyText(sourceEl, btnEl) {
        const text = sourceEl.value;
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            const original = btnEl.textContent;
            btnEl.textContent = '✅ 已复制';
            btnEl.classList.add('copy-success');
            setTimeout(() => {
                btnEl.textContent = original;
                btnEl.classList.remove('copy-success');
            }, 1500);
        } catch {
            sourceEl.select();
            document.execCommand('copy');
        }
    }

    // 输入框字数统计
    inputEl.addEventListener('input', () => {
        inputCount.textContent = `${inputEl.value.length.toLocaleString()} 字符`;
        // 300ms 防抖自动执行
        clearTimeout(inputEl._debounce);
        inputEl._debounce = setTimeout(execute, 300);
    });

    // 按钮事件
    container.querySelector('#b64-swap').addEventListener('click', () => {
        // 交换方向和内容
        mode = mode === 'encode' ? 'decode' : 'encode';
        inputEl.value = outputEl.value;
        outputEl.value = '';
        errorEl.style.display = 'none';
        inputCount.textContent = `${inputEl.value.length.toLocaleString()} 字符`;
        outputCount.textContent = '0 字符';
        updateLabels();
        inputEl.focus();
    });

    container.querySelector('#b64-execute').addEventListener('click', execute);
    container.querySelector('#b64-copy-input').addEventListener('click', () => {
        copyText(inputEl, container.querySelector('#b64-copy-input'));
    });
    container.querySelector('#b64-copy-output').addEventListener('click', () => {
        copyText(outputEl, container.querySelector('#b64-copy-output'));
    });
    container.querySelector('#b64-clear').addEventListener('click', () => {
        inputEl.value = '';
        outputEl.value = '';
        errorEl.style.display = 'none';
        inputCount.textContent = '0 字符';
        outputCount.textContent = '0 字符';
        inputEl.focus();
    });

    updateLabels();
    inputEl.focus();

    return {
        cleanup() {
            clearTimeout(inputEl._debounce);
        }
    };
}
