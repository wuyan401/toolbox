/* ============================================
   时间戳转换 - 时间戳与日期互转，快捷时间选择
   ============================================ */

export const id = 'timestamp-converter';
export const name = '时间戳转换';
export const icon = '🕐';
export const description = '时间戳与日期互转，支持秒/毫秒切换';
export const category = '编码转换';
export const enabled = true;

export function init(container) {
    // 状态
    let isMilliseconds = true; // 默认毫秒模式

    // 渲染 UI
    container.innerHTML = `
        <div class="tsc-current">
            <div class="tsc-current-label">当前时间戳</div>
            <div class="tsc-current-value" id="tsc-current-value">--</div>
            <div class="tsc-current-actions">
                <button class="btn btn-sm" id="tsc-toggle-unit">切换为秒</button>
                <button class="btn btn-sm" id="tsc-copy-current">📋 复制</button>
            </div>
        </div>

        <div class="tool-row" style="margin-top:var(--spacing-lg)">
            <div class="tool-col">
                <span class="tool-col-title">时间戳 → 日期</span>
                <div class="tsc-input-row">
                    <input class="input" id="tsc-ts-input" placeholder="输入时间戳，例如: 1700000000000" />
                    <button class="btn btn-primary btn-sm" id="tsc-ts-convert">转换</button>
                </div>
                <div class="tsc-result" id="tsc-ts-result"></div>
            </div>
            <div class="tool-col">
                <span class="tool-col-title">日期 → 时间戳</span>
                <div class="tsc-input-row">
                    <input class="input" type="datetime-local" id="tsc-date-input" />
                    <button class="btn btn-primary btn-sm" id="tsc-date-convert">转换</button>
                </div>
                <div class="tsc-result" id="tsc-date-result"></div>
            </div>
        </div>

        <div class="tool-actions" style="margin-top:var(--spacing-md)">
            <span class="tsc-label">快捷：</span>
            <button class="btn btn-sm" id="tsc-quick-now">🕐 现在</button>
            <button class="btn btn-sm" id="tsc-quick-1h">⏪ 1小时前</button>
            <button class="btn btn-sm" id="tsc-quick-1d">📅 1天前</button>
            <button class="btn btn-sm" id="tsc-quick-1w">📆 1周前</button>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .tsc-current {
            text-align: center;
            padding: var(--spacing-xl);
            background: var(--color-bg-card);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
        }
        .tsc-current-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-sm);
        }
        .tsc-current-value {
            font-size: 48px;
            font-weight: 600;
            color: var(--color-accent);
            font-family: "Cascadia Code", "Fira Code", monospace;
            word-break: break-all;
            line-height: 1.2;
        }
        .tsc-current-actions {
            margin-top: var(--spacing-md);
            display: flex;
            gap: var(--spacing-sm);
            justify-content: center;
        }
        .tsc-input-row {
            display: flex;
            gap: var(--spacing-sm);
            margin-bottom: var(--spacing-sm);
        }
        .tsc-input-row .input {
            flex: 1;
        }
        .tsc-result {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            padding: var(--spacing-sm);
            background: var(--color-bg-secondary);
            border-radius: var(--radius-sm);
            min-height: 32px;
            word-break: break-all;
        }
        .tsc-result strong {
            color: var(--color-accent);
        }
        .tsc-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            margin-right: var(--spacing-xs);
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const currentValueEl = container.querySelector('#tsc-current-value');
    const toggleBtn = container.querySelector('#tsc-toggle-unit');
    const copyCurrentBtn = container.querySelector('#tsc-copy-current');
    const tsInput = container.querySelector('#tsc-ts-input');
    const tsConvertBtn = container.querySelector('#tsc-ts-convert');
    const tsResultEl = container.querySelector('#tsc-ts-result');
    const dateInput = container.querySelector('#tsc-date-input');
    const dateConvertBtn = container.querySelector('#tsc-date-convert');
    const dateResultEl = container.querySelector('#tsc-date-result');

    /**
     * 格式化日期
     * @param {Date} d
     * @returns {string}
     */
    function formatDate(d) {
        const pad = (n) => String(n).padStart(2, '0');
        const y = d.getFullYear();
        const mo = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const h = pad(d.getHours());
        const mi = pad(d.getMinutes());
        const s = pad(d.getSeconds());
        const ms = String(d.getMilliseconds()).padStart(3, '0');
        const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
        return `${y}-${mo}-${day} ${h}:${mi}:${s}.${ms} 星期${week}`;
    }

    /** 更新当前时间戳显示 */
    function updateCurrent() {
        const now = Date.now();
        if (isMilliseconds) {
            currentValueEl.textContent = now.toLocaleString();
        } else {
            currentValueEl.textContent = Math.floor(now / 1000).toLocaleString();
        }
    }

    /** 切换秒/毫秒 */
    function toggleUnit() {
        isMilliseconds = !isMilliseconds;
        toggleBtn.textContent = isMilliseconds ? '切换为秒' : '切换为毫秒';
        updateCurrent();
    }

    /** 复制当前时间戳 */
    async function copyCurrent() {
        const text = currentValueEl.textContent.replace(/,/g, '');
        try {
            await navigator.clipboard.writeText(text);
            const orig = copyCurrentBtn.textContent;
            copyCurrentBtn.textContent = '✅ 已复制';
            setTimeout(() => { copyCurrentBtn.textContent = orig; }, 1500);
        } catch {
            // 降级
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    }

    /** 时间戳 → 日期 */
    function tsToDate() {
        const raw = tsInput.value.trim();
        if (!raw) {
            tsResultEl.innerHTML = '<span style="color:var(--color-text-secondary)">请输入时间戳</span>';
            return;
        }
        let ts = parseInt(raw, 10);
        if (isNaN(ts)) {
            tsResultEl.innerHTML = '<span style="color:var(--color-danger)">无效的时间戳</span>';
            return;
        }
        // 自动判断：如果值小于 1e12 且当前是毫秒模式，可能用户输入的是秒
        // 但这里简单处理：按当前模式解析
        if (!isMilliseconds || ts < 1000000000000) {
            ts = ts * 1000; // 当作秒处理
        }
        const d = new Date(ts);
        if (isNaN(d.getTime())) {
            tsResultEl.innerHTML = '<span style="color:var(--color-danger)">无效的时间戳</span>';
            return;
        }
        tsResultEl.innerHTML = `
            <div><strong>本地时间：</strong>${formatDate(d)}</div>
            <div><strong>UTC 时间：</strong>${d.toISOString()}</div>
            <div style="margin-top:4px;color:var(--color-text-secondary)">
                毫秒: ${d.getTime().toLocaleString()}&nbsp;&nbsp;秒: ${Math.floor(d.getTime() / 1000).toLocaleString()}
            </div>
        `;
    }

    /** 日期 → 时间戳 */
    function dateToTs() {
        const val = dateInput.value;
        if (!val) {
            dateResultEl.innerHTML = '<span style="color:var(--color-text-secondary)">请选择日期时间</span>';
            return;
        }
        const d = new Date(val);
        const ms = d.getTime();
        const sec = Math.floor(ms / 1000);
        dateResultEl.innerHTML = `
            <div><strong>毫秒：</strong>${ms.toLocaleString()}</div>
            <div><strong>秒：</strong>${sec.toLocaleString()}</div>
        `;
    }

    /** 快捷设置日期为相对时间 */
    function setRelative(hours) {
        const d = new Date(Date.now() - hours * 3600 * 1000);
        // 格式化为 datetime-local 格式
        const pad = (n) => String(n).padStart(2, '0');
        const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        dateInput.value = local;
        // 同时设置时间戳输入
        if (isMilliseconds) {
            tsInput.value = d.getTime();
        } else {
            tsInput.value = Math.floor(d.getTime() / 1000);
        }
    }

    // 初始化当前时间
    updateCurrent();
    // 设置默认日期为现在
    setRelative(0);

    // 每秒更新
    const timerId = setInterval(updateCurrent, 1000);

    // 事件绑定
    toggleBtn.addEventListener('click', toggleUnit);
    copyCurrentBtn.addEventListener('click', copyCurrent);
    tsConvertBtn.addEventListener('click', tsToDate);
    tsInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tsToDate(); });
    dateConvertBtn.addEventListener('click', dateToTs);
    container.querySelector('#tsc-quick-now').addEventListener('click', () => setRelative(0));
    container.querySelector('#tsc-quick-1h').addEventListener('click', () => setRelative(1));
    container.querySelector('#tsc-quick-1d').addEventListener('click', () => setRelative(24));
    container.querySelector('#tsc-quick-1w').addEventListener('click', () => setRelative(24 * 7));

    return {
        cleanup() {
            clearInterval(timerId);
        }
    };
}
