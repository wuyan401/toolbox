/* ============================================
   文本去重排序 - 去重/排序/统计，办公常用
   ============================================ */

export const id = 'text-dedupe';
export const name = '文本去重排序';
export const icon = '📑';
export const description = '文本去重（保留首次/末次）、排序、去除空行，办公必备';
export const category = '办公工具';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div class="tool-col" style="flex:1;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span class="tool-col-title">输入（每行一个）</span>
                <span style="font-size:var(--font-size-sm);color:var(--color-text-muted);" id="td-input-count">0 行</span>
            </div>
            <textarea class="textarea" id="td-input" placeholder="每行输入一个条目，例如：&#10;张三&#10;李四&#10;张三&#10;王五&#10;李四" style="flex:1;min-height:180px;"></textarea>
        </div>

        <div class="tool-actions" style="justify-content:center;padding:8px 0;flex-wrap:wrap;gap:var(--spacing-sm);">
            <button class="btn btn-primary" id="td-dedupe">🔄 去重</button>
            <div style="border-left:1px solid var(--color-border);height:24px;margin:0 4px;"></div>
            <button class="btn btn-sm" id="td-sort-az">A → Z</button>
            <button class="btn btn-sm" id="td-sort-za">Z → A</button>
            <button class="btn btn-sm" id="td-sort-random">🎲 随机</button>
            <div style="border-left:1px solid var(--color-border);height:24px;margin:0 4px;"></div>
            <button class="btn btn-sm" id="td-trim">✂ 去空格</button>
            <button class="btn btn-sm" id="td-remove-empty">🚫 去空行</button>
        </div>

        <div class="tool-col" style="flex:1;display:flex;flex-direction:column;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                <span class="tool-col-title">结果</span>
                <div style="display:flex;gap:var(--spacing-md);align-items:center;">
                    <span style="font-size:var(--font-size-sm);color:var(--color-text-muted);" id="td-result-count">0 行</span>
                    <button class="btn btn-sm" id="td-copy">📋 复制</button>
                    <button class="btn btn-sm" id="td-swap">🔄 移到输入</button>
                </div>
            </div>
            <textarea class="textarea" id="td-output" placeholder="结果将显示在这里..." readonly style="flex:1;min-height:180px;"></textarea>
        </div>

        <!-- 统计栏 -->
        <div class="td-stats" id="td-stats" style="display:none;">
            <div class="td-stat-item">
                <span class="td-stat-value" id="td-stat-total">0</span>
                <span class="td-stat-label">原始总数</span>
            </div>
            <div class="td-stat-item">
                <span class="td-stat-value" id="td-stat-unique">0</span>
                <span class="td-stat-label">去重后</span>
            </div>
            <div class="td-stat-item">
                <span class="td-stat-value" id="td-stat-dups">0</span>
                <span class="td-stat-label">重复项</span>
            </div>
        </div>

        <div class="td-options" style="display:flex;gap:var(--spacing-md);justify-content:center;padding-top:var(--spacing-sm);">
            <label class="pg-check-label">
                <input type="radio" name="td-dedupe-mode" id="td-mode-first" checked /> 保留首次出现
            </label>
            <label class="pg-check-label">
                <input type="radio" name="td-dedupe-mode" id="td-mode-last" /> 保留末次出现
            </label>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .td-stats {
            display: flex;
            gap: var(--spacing-lg);
            justify-content: center;
            padding: var(--spacing-md);
        }
        .td-stat-item {
            text-align: center;
            padding: var(--spacing-sm) var(--spacing-xl);
            background: var(--color-bg-card);
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
        }
        .td-stat-value {
            display: block;
            font-size: 24px;
            font-weight: 700;
            color: var(--color-accent);
            font-family: var(--font-display);
        }
        .td-stat-label {
            display: block;
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            margin-top: 2px;
        }
        .td-options {
            padding: var(--spacing-sm);
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#td-input');
    const outputEl = container.querySelector('#td-output');
    const inputCountEl = container.querySelector('#td-input-count');
    const resultCountEl = container.querySelector('#td-result-count');
    const statsEl = container.querySelector('#td-stats');
    const statTotal = container.querySelector('#td-stat-total');
    const statUnique = container.querySelector('#td-stat-unique');
    const statDups = container.querySelector('#td-stat-dups');

    /**
     * 获取输入行
     */
    function getLines() {
        return inputEl.value.split('\n');
    }

    /**
     * 获取去重模式：'first' 或 'last'
     */
    function getDedupeMode() {
        return container.querySelector('#td-mode-first').checked ? 'first' : 'last';
    }

    /**
     * 设置输出并更新统计
     * @param {string[]} lines
     * @param {number} originalCount
     */
    function setOutput(lines, originalCount) {
        outputEl.value = lines.join('\n');
        resultCountEl.textContent = `${lines.length} 行`;
        updateStats(originalCount, lines.length);
    }

    /**
     * 更新统计
     */
    function updateStats(total, unique) {
        statsEl.style.display = 'flex';
        statTotal.textContent = total;
        statUnique.textContent = unique;
        statDups.textContent = Math.max(0, total - unique);
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

    // 输入计数
    inputEl.addEventListener('input', () => {
        const lines = getLines().filter(Boolean);
        inputCountEl.textContent = `${lines.length} 行`;
    });

    // 去重
    container.querySelector('#td-dedupe').addEventListener('click', () => {
        const lines = getLines();
        const original = lines.filter(l => l.trim() !== '');
        const mode = getDedupeMode();

        let result;
        if (mode === 'first') {
            const seen = new Set();
            result = lines.filter(line => {
                if (seen.has(line)) return false;
                seen.add(line);
                return true;
            });
        } else {
            const seen = new Map();
            lines.forEach((line, i) => {
                seen.set(line, i);
            });
            result = lines.filter((line, i) => seen.get(line) === i);
        }
        setOutput(result, lines.length);
    });

    // 排序 A-Z
    container.querySelector('#td-sort-az').addEventListener('click', () => {
        const lines = getLines();
        const sorted = [...lines].sort((a, b) => a.localeCompare(b, 'zh-CN', { sensitivity: 'base' }));
        outputEl.value = sorted.join('\n');
        resultCountEl.textContent = `${sorted.length} 行`;
        inputCountEl.textContent = `${lines.length} 行`;
    });

    // 排序 Z-A
    container.querySelector('#td-sort-za').addEventListener('click', () => {
        const lines = getLines();
        const sorted = [...lines].sort((a, b) => b.localeCompare(a, 'zh-CN', { sensitivity: 'base' }));
        outputEl.value = sorted.join('\n');
        resultCountEl.textContent = `${sorted.length} 行`;
        inputCountEl.textContent = `${lines.length} 行`;
    });

    // 随机排序
    container.querySelector('#td-sort-random').addEventListener('click', () => {
        const lines = getLines();
        const arr = [...lines];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        outputEl.value = arr.join('\n');
        resultCountEl.textContent = `${arr.length} 行`;
        inputCountEl.textContent = `${lines.length} 行`;
    });

    // 去除首尾空格
    container.querySelector('#td-trim').addEventListener('click', () => {
        const lines = getLines();
        const trimmed = lines.map(l => l.trim());
        setOutput(trimmed, lines.length);
    });

    // 去除空行
    container.querySelector('#td-remove-empty').addEventListener('click', () => {
        const lines = getLines();
        const filtered = lines.filter(l => l.trim() !== '');
        setOutput(filtered, lines.length);
    });

    // 复制结果
    container.querySelector('#td-copy').addEventListener('click', async () => {
        const text = outputEl.value;
        if (!text) return;
        const btn = container.querySelector('#td-copy');
        const ok = await copyText(text);
        const orig = btn.textContent;
        btn.textContent = ok ? '✅ 已复制' : '❌';
        _timer = setTimeout(() => { btn.textContent = orig; }, 1500);
    });

    // 移到输入
    container.querySelector('#td-swap').addEventListener('click', () => {
        inputEl.value = outputEl.value;
        inputCountEl.textContent = `${outputEl.value.split('\n').filter(l => l.trim()).length} 行`;
        outputEl.value = '';
        resultCountEl.textContent = '0 行';
        statsEl.style.display = 'none';
        inputEl.focus();
    });

    let _timer = null;

    return {
        cleanup() {
            if (_timer) clearTimeout(_timer);
        }
    };
}
