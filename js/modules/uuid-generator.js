/* ============================================
   ID生成器 - UUID v4 / ULID / nanoid风格短ID，批量生成
   ============================================ */

export const id = 'uuid-generator';
export const name = 'ID 生成器';
export const icon = '🆔';
export const description = '批量生成 UUID v4 / ULID / 短ID，支持去重和导出';
export const category = '开发工具';
export const enabled = true;

export function init(container) {
    // 状态
    let generatedIds = [];
    let _timer1, _timer2, _timer3;

    container.innerHTML = `
        <div class="uid-layout">
            <!-- 设置面板 -->
            <div class="uid-settings">
                <span class="tool-col-title">生成设置</span>

                <div class="uid-setting-item">
                    <label class="uid-label">ID 格式</label>
                    <select class="input uid-select" id="uid-format">
                        <option value="uuid">UUID v4 (标准)</option>
                        <option value="ulid">ULID (时间排序)</option>
                        <option value="nanoid">短 ID (nanoid风格)</option>
                    </select>
                </div>

                <div class="uid-setting-item" id="uid-length-group" style="display:none">
                    <label class="uid-label">短 ID 长度: <span id="uid-length-val">12</span></label>
                    <input type="range" class="pg-slider" id="uid-length" min="8" max="21" value="12" />
                </div>

                <div class="uid-setting-item">
                    <label class="uid-label">生成数量</label>
                    <input type="number" class="input" id="uid-count" min="1" max="100" value="10" />
                </div>

                <label class="pg-check-label">
                    <input type="checkbox" id="uid-unique" checked /> 去重
                </label>

                <button class="btn btn-primary uid-gen-btn" id="uid-generate">
                    🎲 生成 ID
                </button>
            </div>

            <!-- 结果面板 -->
            <div class="uid-results">
                <div class="uid-results-header">
                    <span class="tool-col-title">生成结果 (<span id="uid-result-count">0</span>)</span>
                    <div class="uid-results-actions">
                        <button class="btn btn-sm" id="uid-copy-all">📋 全部复制</button>
                        <button class="btn btn-sm" id="uid-copy-one">📋 复制选中</button>
                        <button class="btn btn-sm" id="uid-export-json">📥 JSON</button>
                        <button class="btn btn-sm" id="uid-export-csv">📥 CSV</button>
                    </div>
                </div>
                <div class="uid-list" id="uid-list">
                    <div class="uid-empty">点击「生成 ID」按钮开始</div>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .uid-layout {
            display: flex;
            gap: var(--spacing-xxl);
            min-height: 0;
        }
        .uid-settings {
            flex: 0 0 260px;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        }
        .uid-setting-item {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }
        .uid-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        }
        .uid-select {
            width: 100%;
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--color-bg-input);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-size: var(--font-size-md);
            font-family: var(--font-family);
        }
        .uid-gen-btn {
            width: 100%;
            padding: var(--spacing-md);
            font-size: var(--font-size-lg);
            font-weight: 600;
        }
        .uid-results {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
            min-width: 0;
        }
        .uid-results-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: var(--spacing-sm);
        }
        .uid-results-actions {
            display: flex;
            gap: var(--spacing-xs);
            flex-wrap: wrap;
        }
        .uid-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
            max-height: 500px;
            overflow-y: auto;
            padding: var(--spacing-sm);
            background: var(--color-bg-input);
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
        }
        .uid-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--color-bg-card);
            border-radius: var(--radius-sm);
            font-family: var(--font-family-mono);
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            word-break: break-all;
            cursor: pointer;
            transition: background var(--transition-fast);
            border: 1px solid transparent;
        }
        .uid-item:hover {
            background: var(--color-bg-hover);
        }
        .uid-item.selected {
            border-color: var(--color-accent);
            background: var(--color-accent-light);
        }
        .uid-item-num {
            flex-shrink: 0;
            color: var(--color-text-muted);
            font-size: 11px;
            min-width: 24px;
        }
        .uid-item-text {
            flex: 1;
        }
        .uid-item-copy {
            flex-shrink: 0;
            font-size: 12px;
            color: var(--color-text-secondary);
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
            border: none;
            background: transparent;
            font-family: var(--font-family);
        }
        .uid-item-copy:hover {
            color: var(--color-accent);
        }
        .uid-empty {
            text-align: center;
            color: var(--color-text-muted);
            padding: var(--spacing-xl);
            font-size: var(--font-size-md);
        }
        @media (max-width: 768px) {
            .uid-layout {
                flex-direction: column;
            }
            .uid-settings {
                flex: none;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const formatSel = container.querySelector('#uid-format');
    const lengthGroup = container.querySelector('#uid-length-group');
    const lengthSlider = container.querySelector('#uid-length');
    const lengthVal = container.querySelector('#uid-length-val');
    const countInput = container.querySelector('#uid-count');
    const uniqueCb = container.querySelector('#uid-unique');
    const generateBtn = container.querySelector('#uid-generate');
    const listEl = container.querySelector('#uid-list');
    const resultCountEl = container.querySelector('#uid-result-count');

    // ULID 字符表 (Crockford Base32)
    const ULID_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    // nanoid 字符表
    const NANOID_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-';

    /**
     * 生成 UUID v4
     */
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 0);
            return c === 'x' ? r.toString(16) : ((r & 0x3) | 0x8).toString(16);
        });
    }

    /**
     * 生成 ULID
     */
    function generateULID() {
        const now = Date.now();
        let ts = '';
        for (let i = 9; i >= 0; i--) {
            ts = ULID_CHARS[now % 32] + ts;
            now = Math.floor(now / 32);
        }
        const randValues = crypto.getRandomValues(new Uint8Array(16));
        let rand = '';
        for (let i = 0; i < 16; i++) {
            rand += ULID_CHARS[randValues[i] % 32];
        }
        return ts + rand;
    }

    /**
     * 生成短 ID (nanoid风格)
     */
    function generateNanoId(len) {
        const arr = crypto.getRandomValues(new Uint8Array(len));
        let id = '';
        for (let i = 0; i < len; i++) {
            id += NANOID_CHARS[arr[i] % NANOID_CHARS.length];
        }
        return id;
    }

    /**
     * 渲染 ID 列表
     */
    function renderList() {
        if (generatedIds.length === 0) {
            listEl.innerHTML = '<div class="uid-empty">点击「生成 ID」按钮开始</div>';
        } else {
            listEl.innerHTML = generatedIds.map((id, i) => `
                <div class="uid-item" data-idx="${i}">
                    <span class="uid-item-num">${i + 1}.</span>
                    <span class="uid-item-text">${escapeHtml(id)}</span>
                    <button class="uid-item-copy" data-idx="${i}" title="复制">📋</button>
                </div>
            `).join('');
        }
        resultCountEl.textContent = generatedIds.length;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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

    /**
     * 导出为文件下载
     */
    function downloadFile(content, filename, mime) {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 格式切换显示/隐藏长度设置
    formatSel.addEventListener('change', () => {
        lengthGroup.style.display = formatSel.value === 'nanoid' ? 'flex' : 'none';
    });

    lengthSlider.addEventListener('input', () => {
        lengthVal.textContent = lengthSlider.value;
    });

    // 生成按钮
    generateBtn.addEventListener('click', () => {
        const format = formatSel.value;
        const count = Math.max(1, Math.min(100, parseInt(countInput.value, 10) || 10));
        const unique = uniqueCb.checked;
        const nanoLen = parseInt(lengthSlider.value, 10);

        const ids = [];
        const seen = new Set();
        let attempts = 0;
        const maxAttempts = unique ? count * 100 : count;

        while (ids.length < count && attempts < maxAttempts) {
            attempts++;
            let id;
            switch (format) {
                case 'uuid': id = generateUUID(); break;
                case 'ulid': id = generateULID(); break;
                case 'nanoid': id = generateNanoId(nanoLen); break;
                default: id = generateUUID();
            }
            if (unique && seen.has(id)) continue;
            if (unique) seen.add(id);
            ids.push(id);
        }

        generatedIds = ids;
        countInput.value = String(count);
        renderList();
    });

    // 列表点击事件委托
    listEl.addEventListener('click', async (e) => {
        // 选中
        const item = e.target.closest('.uid-item');
        if (item) {
            item.classList.toggle('selected');
        }
        // 复制单个
        const copyBtn = e.target.closest('.uid-item-copy');
        if (copyBtn) {
            e.stopPropagation();
            const idx = parseInt(copyBtn.dataset.idx, 10);
            if (generatedIds[idx]) {
                const ok = await copyText(generatedIds[idx]);
                const orig = copyBtn.textContent;
                copyBtn.textContent = ok ? '✅' : '❌';
                _timer1 = setTimeout(() => { copyBtn.textContent = orig; }, 1000);
            }
        }
    });

    // 全部复制
    container.querySelector('#uid-copy-all').addEventListener('click', async () => {
        if (generatedIds.length === 0) return;
        const text = generatedIds.join('\n');
        const btn = container.querySelector('#uid-copy-all');
        const ok = await copyText(text);
        const orig = btn.textContent;
        btn.textContent = ok ? '✅ 已复制' : '❌ 失败';
        _timer2 = setTimeout(() => { btn.textContent = orig; }, 1500);
    });

    // 复制选中
    container.querySelector('#uid-copy-one').addEventListener('click', async () => {
        const selected = listEl.querySelectorAll('.uid-item.selected');
        if (selected.length === 0) {
            alert('请先点击列表项选中要复制的 ID');
            return;
        }
        const ids = [];
        selected.forEach(el => {
            const idx = parseInt(el.dataset.idx, 10);
            if (generatedIds[idx]) ids.push(generatedIds[idx]);
        });
        const btn = container.querySelector('#uid-copy-one');
        const ok = await copyText(ids.join('\n'));
        const orig = btn.textContent;
        btn.textContent = ok ? `✅ 已复制 ${ids.length} 个` : '❌ 失败';
        _timer3 = setTimeout(() => { btn.textContent = orig; }, 1500);
    });

    // 导出 JSON
    container.querySelector('#uid-export-json').addEventListener('click', () => {
        if (generatedIds.length === 0) return;
        downloadFile(
            JSON.stringify(generatedIds, null, 2),
            'ids-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.json',
            'application/json'
        );
    });

    // 导出 CSV
    container.querySelector('#uid-export-csv').addEventListener('click', () => {
        if (generatedIds.length === 0) return;
        const csv = 'index,id\n' + generatedIds.map((id, i) => `${i + 1},"${id}"`).join('\n');
        downloadFile(
            csv,
            'ids-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.csv',
            'text/csv'
        );
    });

    return {
        cleanup() {
            clearTimeout(_timer1);
            clearTimeout(_timer2);
            clearTimeout(_timer3);
        }
    };
}
