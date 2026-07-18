/* ============================================
   URL 编解码 - encodeURIComponent / decodeURIComponent
   ============================================ */

export const id = 'url-encoder';
export const name = 'URL 编解码';
export const icon = '🔗';
export const description = 'URL 编码与解码，支持 encodeURIComponent/decodeURIComponent';
export const category = '开发工具';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div class="tool-col" style="flex:1;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span class="tool-col-title">原文</span>
                <div style="display:flex;gap:var(--spacing-xs);">
                    <button class="btn btn-sm" id="ue-sample-query">🔍 查询参数示例</button>
                    <button class="btn btn-sm" id="ue-sample-url">🌐 URL 示例</button>
                    <button class="btn btn-sm" id="ue-sample-json">📦 JSON 示例</button>
                </div>
            </div>
            <textarea class="textarea" id="ue-input" placeholder="输入要编码的文本或 URL..." style="flex:1;min-height:150px;"></textarea>
        </div>

        <div class="tool-actions" style="justify-content:center;padding:8px 0;">
            <button class="btn btn-primary" id="ue-encode">🔐 编码全部</button>
            <button class="btn" id="ue-decode">🔓 解码全部</button>
            <button class="btn" id="ue-copy-result">📋 复制结果</button>
            <button class="btn" id="ue-swap">🔄 互换</button>
            <button class="btn" id="ue-clear">🗑 清空</button>
        </div>

        <div class="tool-col" style="flex:1;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span class="tool-col-title">结果</span>
                <span class="tool-col-title" style="font-weight:400;font-size:11px;" id="ue-char-count">0 字符</span>
            </div>
            <textarea class="textarea" id="ue-output" placeholder="结果将显示在这里..." readonly style="flex:1;min-height:150px;"></textarea>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#ue-input');
    const outputEl = container.querySelector('#ue-output');
    const charCountEl = container.querySelector('#ue-char-count');

    // 示例数据
    const SAMPLES = {
        'ue-sample-query': 'q=你好世界&lang=zh&page=1',
        'ue-sample-url': 'https://example.com/搜索?q=你好世界&lang=zh-CN',
        'ue-sample-json': JSON.stringify({ name: '张三', message: '你好世界！', tags: ['前端', '开发'] }, null, 2)
    };

    /**
     * 更新字符计数
     */
    function updateCount() {
        charCountEl.textContent = `${outputEl.value.length.toLocaleString()} 字符`;
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

    // 编码
    container.querySelector('#ue-encode').addEventListener('click', () => {
        const raw = inputEl.value;
        if (!raw) return;
        try {
            outputEl.value = encodeURIComponent(raw);
            updateCount();
        } catch (err) {
            outputEl.value = '编码失败: ' + err.message;
        }
    });

    // 解码
    container.querySelector('#ue-decode').addEventListener('click', () => {
        const raw = inputEl.value;
        if (!raw) return;
        try {
            outputEl.value = decodeURIComponent(raw);
            updateCount();
        } catch (err) {
            outputEl.value = '解码失败: ' + err.message + '\n请确保输入是有效的 URL 编码字符串';
        }
    });

    // 复制结果
    container.querySelector('#ue-copy-result').addEventListener('click', async () => {
        const text = outputEl.value;
        if (!text) return;
        const btn = container.querySelector('#ue-copy-result');
        const ok = await copyText(text);
        const orig = btn.textContent;
        btn.textContent = ok ? '✅ 已复制' : '❌ 失败';
        _timer = setTimeout(() => { btn.textContent = orig; }, 1500);
    });

    // 互换
    container.querySelector('#ue-swap').addEventListener('click', () => {
        const tmp = inputEl.value;
        inputEl.value = outputEl.value;
        outputEl.value = tmp;
        updateCount();
        inputEl.focus();
    });

    // 清空
    container.querySelector('#ue-clear').addEventListener('click', () => {
        inputEl.value = '';
        outputEl.value = '';
        updateCount();
        inputEl.focus();
    });

    // 示例按钮
    Object.entries(SAMPLES).forEach(([btnId, text]) => {
        container.querySelector('#' + btnId).addEventListener('click', () => {
            inputEl.value = text;
            inputEl.focus();
        });
    });

    let _timer = null;

    return {
        cleanup() {
            if (_timer) clearTimeout(_timer);
        }
    };
}
