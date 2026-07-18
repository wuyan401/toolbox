/* ============================================
   JSON 格式化工具 - 格式化/压缩 JSON，语法错误检测
   ============================================ */

export const id = 'json-formatter';
export const name = 'JSON 格式化';
export const icon = '📋';
export const description = 'JSON 格式化/压缩，语法错误检测';
export const category = '格式化';
export const enabled = true;

export function init(container) {
    // 渲染 UI
    container.innerHTML = `
        <div class="tool-row">
            <div class="tool-col">
                <span class="tool-col-title">输入</span>
                <textarea class="textarea" id="json-input" placeholder='粘贴 JSON 到这里，例如: {"name":"hello"}'></textarea>
                <div class="json-error" id="json-error" style="display:none;"></div>
            </div>
            <div class="tool-col">
                <span class="tool-col-title">输出</span>
                <textarea class="textarea" id="json-output" placeholder="格式化结果将显示在这里..." readonly></textarea>
            </div>
        </div>
        <div class="tool-actions">
            <button class="btn btn-primary" id="json-beautify">✨ 美化</button>
            <button class="btn" id="json-compress">📦 压缩</button>
            <button class="btn" id="json-copy">📋 复制结果</button>
            <button class="btn" id="json-clear">🗑 清空</button>
            <span class="json-status" id="json-status"></span>
        </div>
    `;

    // 注入额外样式
    const style = document.createElement('style');
    style.textContent = `
        .json-error {
            font-size: var(--font-size-sm);
            color: var(--color-danger);
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--color-diff-remove);
            border-radius: var(--radius-sm);
            white-space: pre-wrap;
            font-family: "Cascadia Code", "Fira Code", monospace;
            margin-top: var(--spacing-xs);
        }
        .json-status {
            font-size: var(--font-size-sm);
            color: var(--color-success);
            margin-left: auto;
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#json-input');
    const outputEl = container.querySelector('#json-output');
    const errorEl = container.querySelector('#json-error');
    const statusEl = container.querySelector('#json-status');

    /**
     * 在错误位置下方显示指示符
     * @param {string} text - 原始文本
     * @param {number} pos - 错误位置
     * @returns {string} 指示符字符串
     */
    function errorPointer(text, pos) {
        const lines = text.slice(0, pos).split('\n');
        const lineNum = lines.length;
        const colNum = lines[lines.length - 1].length + 1;

        // 找到出错的那一行
        const allLines = text.split('\n');
        const errorLine = allLines[lineNum - 1] || '';
        const pointer = ' '.repeat(colNum - 1) + '^';

        return `第 ${lineNum} 行, 第 ${colNum} 列\n${errorLine}\n${pointer}`;
    }

    /**
     * 格式化 JSON
     * @param {boolean} compress - 是否压缩（true=压缩, false=美化）
     */
    function formatJSON(compress = false) {
        const raw = inputEl.value.trim();
        errorEl.style.display = 'none';
        statusEl.textContent = '';

        if (!raw) {
            outputEl.value = '';
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            const result = compress
                ? JSON.stringify(parsed)
                : JSON.stringify(parsed, null, 2);
            outputEl.value = result;

            // 计算大小
            const originalSize = new Blob([raw]).size;
            const resultSize = new Blob([result]).size;
            const ratio = originalSize > 0 ? ((resultSize / originalSize) * 100).toFixed(0) : 100;
            statusEl.textContent = `${resultSize.toLocaleString()} 字节 (${ratio}%)`;
            statusEl.style.color = 'var(--color-success)';

        } catch (err) {
            outputEl.value = '';
            const msg = err.message;

            // 尝试从错误信息提取位置
            const posMatch = msg.match(/position\s+(\d+)/i);
            let detail = msg;
            if (posMatch) {
                const pos = parseInt(posMatch[1]);
                detail = errorPointer(raw, pos);
            }

            errorEl.textContent = `❌ JSON 语法错误: ${detail}`;
            errorEl.style.display = 'block';
            inputEl.classList.add('error-highlight');
            statusEl.textContent = '解析失败';
            statusEl.style.color = 'var(--color-danger)';
        }
    }

    /**
     * 复制结果到剪贴板
     */
    async function copyResult() {
        const result = outputEl.value;
        if (!result) return;

        try {
            await navigator.clipboard.writeText(result);
            const btn = container.querySelector('#json-copy');
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制';
            btn.classList.add('copy-success');
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copy-success');
            }, 1500);
        } catch {
            // 降级方案
            outputEl.select();
            document.execCommand('copy');
        }
    }

    // 自动格式化（300ms 防抖）
    let debounceTimer;
    inputEl.addEventListener('input', () => {
        inputEl.classList.remove('error-highlight');
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => formatJSON(false), 300);
    });

    // 按钮事件
    container.querySelector('#json-beautify').addEventListener('click', () => formatJSON(false));
    container.querySelector('#json-compress').addEventListener('click', () => formatJSON(true));
    container.querySelector('#json-copy').addEventListener('click', copyResult);
    container.querySelector('#json-clear').addEventListener('click', () => {
        inputEl.value = '';
        outputEl.value = '';
        errorEl.style.display = 'none';
        statusEl.textContent = '';
        inputEl.classList.remove('error-highlight');
        inputEl.focus();
    });

    // 初始化时聚焦输入框
    inputEl.focus();

    return {
        cleanup() {
            clearTimeout(debounceTimer);
        }
    };
}
