/* ============================================
   随机数选择器 - 输入候选项，随机抽取一个或多个
   支持去重、历史记录、快捷填充
   ============================================ */

export const id = 'random-picker';
export const name = '随机选择器';
export const icon = '🎲';
export const description = '输入候选项，随机抽取结果，支持去重和历史记录';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    // 历史记录（最近5次）
    const MAX_HISTORY = 5;
    let history = [];

    // 渲染 UI
    container.innerHTML = `
        <div class="rp-layout">
            <!-- 左侧输入区 -->
            <div class="rp-input-section">
                <span class="tool-col-title">候选项（每行一个）</span>
                <textarea class="textarea rp-textarea" id="rp-input" placeholder="每行输入一个候选项，例如：&#10;选项A&#10;选项B&#10;选项C"></textarea>
                <div class="rp-quick-fill">
                    <span class="rp-quick-label">快捷填充：</span>
                    <button class="btn btn-sm rp-quick-btn" data-preset="dice">🎯 骰子(1-6)</button>
                    <button class="btn btn-sm rp-quick-btn" data-preset="coin">🪙 硬币(正/反)</button>
                    <button class="btn btn-sm rp-quick-btn" data-preset="poker">🃏 扑克(52张)</button>
                    <button class="btn btn-sm rp-quick-btn" id="rp-range-btn">🔢 数字范围</button>
                    <button class="btn btn-sm" id="rp-add-preset-btn" title="添加自定义预设">＋</button>
                </div>
                <div class="rp-custom-presets" id="rp-custom-presets"></div>
            </div>
            <!-- 右侧设置与结果 -->
            <div class="rp-result-section">
                <div class="rp-settings">
                    <div class="rp-setting-item">
                        <label class="rp-setting-label">抽取数量</label>
                        <input class="input rp-count-input" id="rp-count" type="number" min="1" max="100" value="1" />
                    </div>
                    <div class="rp-setting-item">
                        <label class="rp-check-label">
                            <input type="checkbox" id="rp-unique" checked /> 去重
                        </label>
                    </div>
                </div>
                <button class="btn btn-primary rp-pick-btn" id="rp-pick-btn">
                    <span class="rp-pick-icon">🎲</span> 随机抽取
                </button>
                <div class="rp-results" id="rp-results"></div>
                <div class="rp-history" id="rp-history" style="display:none;">
                    <div class="rp-history-title">📋 最近记录</div>
                    <div class="rp-history-list" id="rp-history-list"></div>
                </div>
            </div>
        </div>

        <!-- 自定义 Preset 弹窗 -->
        <div class="rp-dialog-overlay" id="rp-dialog-overlay" style="display:none;">
            <div class="rp-dialog-card">
                <div class="rp-dialog-title">添加自定义预设</div>
                <input class="input" id="rp-dialog-name" placeholder="预设名称（如：水果）" />
                <textarea class="textarea" id="rp-dialog-content" placeholder="内容（每行一个）" style="min-height:150px;"></textarea>
                <div class="rp-dialog-actions">
                    <button class="btn btn-sm" id="rp-dialog-cancel">取消</button>
                    <button class="btn btn-primary btn-sm" id="rp-dialog-save">保存</button>
                </div>
            </div>
        </div>

        <!-- 数字范围弹窗 -->
        <div class="rp-dialog-overlay" id="rp-range-overlay" style="display:none;">
            <div class="rp-dialog-card">
                <div class="rp-dialog-title">数字范围填充</div>
                <div class="rp-range-inputs">
                    <div class="rp-range-field">
                        <label class="rp-setting-label">起始数字</label>
                        <input class="input" id="rp-range-start" type="number" value="1" />
                    </div>
                    <div class="rp-range-field">
                        <label class="rp-setting-label">结束数字</label>
                        <input class="input" id="rp-range-end" type="number" value="100" />
                    </div>
                </div>
                <div class="rp-dialog-actions">
                    <button class="btn btn-sm" id="rp-range-cancel">取消</button>
                    <button class="btn btn-primary btn-sm" id="rp-range-generate">生成</button>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .rp-layout {
            display: flex;
            gap: var(--spacing-xl);
            min-height: 0;
        }
        .rp-input-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
            min-width: 0;
        }
        .rp-textarea {
            flex: 1;
            min-height: 250px;
        }
        .rp-quick-fill {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            flex-wrap: wrap;
        }
        .rp-quick-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        }
        .rp-result-section {
            flex: 0 0 280px;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        .rp-settings {
            display: flex;
            align-items: center;
            gap: var(--spacing-lg);
            padding: var(--spacing-md);
            background: var(--color-bg-card);
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
        }
        .rp-setting-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
        }
        .rp-setting-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        }
        .rp-count-input {
            width: 70px;
            text-align: center;
        }
        .rp-check-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            cursor: pointer;
            user-select: none;
        }
        .rp-check-label input {
            accent-color: var(--color-accent);
        }
        .rp-pick-btn {
            padding: var(--spacing-md) var(--spacing-lg);
            font-size: var(--font-size-lg);
            font-weight: 600;
            width: 100%;
        }
        .rp-pick-btn.rolling .rp-pick-icon {
            display: inline-block;
            animation: rp-roll 0.4s ease;
        }
        @keyframes rp-roll {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }
        .rp-results {
            min-height: 60px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .rp-result-item {
            font-size: 28px;
            font-weight: 700;
            color: var(--color-danger);
            text-align: center;
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--color-diff-remove);
            border-radius: var(--radius-md);
            margin-bottom: var(--spacing-xs);
            word-break: break-all;
        }
        .rp-result-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            text-align: center;
        }
        .rp-history {
            border-top: 1px solid var(--color-border);
            padding-top: var(--spacing-md);
        }
        .rp-history-title {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-sm);
        }
        .rp-history-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }
        .rp-history-item {
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            padding: var(--spacing-xs) var(--spacing-sm);
            background: var(--color-bg-input);
            border-radius: var(--radius-sm);
            word-break: break-all;
        }
        /* 自定义 preset */
        .rp-custom-presets {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            flex-wrap: wrap;
        }
        .rp-custom-preset-item {
            display: inline-flex;
            align-items: center;
            gap: 0;
        }
        .rp-custom-del {
            cursor: pointer;
            font-size: 14px;
            color: var(--color-text-secondary);
            padding: 0 4px;
            line-height: 1;
            user-select: none;
        }
        .rp-custom-del:hover {
            color: var(--color-danger);
        }
        /* 弹窗 */
        .rp-dialog-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: var(--color-bg-overlay);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .rp-dialog-card {
            background: var(--color-bg-card);
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
            padding: var(--spacing-xl);
            width: 400px;
            max-width: 90vw;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
            box-shadow: var(--shadow-lg);
        }
        .rp-dialog-title {
            font-size: var(--font-size-lg);
            font-weight: 600;
            color: var(--color-text-primary);
        }
        .rp-dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-sm);
        }
        .rp-range-inputs {
            display: flex;
            gap: var(--spacing-md);
        }
        .rp-range-field {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }
        @media (max-width: 768px) {
            .rp-layout {
                flex-direction: column;
            }
            .rp-result-section {
                flex: none;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#rp-input');
    const countEl = container.querySelector('#rp-count');
    const uniqueEl = container.querySelector('#rp-unique');
    const pickBtn = container.querySelector('#rp-pick-btn');
    const resultsEl = container.querySelector('#rp-results');
    const historyEl = container.querySelector('#rp-history');
    const historyListEl = container.querySelector('#rp-history-list');

    // 快捷填充数据
    const PRESETS = {
        dice: Array.from({ length: 6 }, (_, i) => String(i + 1)).join('\n'),
        coin: '正面\n反面',
        poker: (() => {
            const suits = ['♠', '♥', '♦', '♣'];
            const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
            return suits.flatMap(s => ranks.map(r => `${s}${r}`)).join('\n');
        })()
    };

    /**
     * 随机抽取
     */
    function pick() {
        const text = inputEl.value.trim();
        if (!text) {
            resultsEl.innerHTML = '<div class="rp-result-label">请先输入候选项</div>';
            return;
        }

        const items = text.split('\n').map(s => s.trim()).filter(Boolean);
        if (items.length === 0) {
            resultsEl.innerHTML = '<div class="rp-result-label">没有可选的候选项</div>';
            return;
        }

        let count = parseInt(countEl.value, 10);
        if (isNaN(count) || count < 1) count = 1;
        if (count > items.length && uniqueEl.checked) {
            count = items.length;
            countEl.value = count;
        }

        const isUnique = uniqueEl.checked;
        let picked;

        if (isUnique) {
            // Fisher-Yates 洗牌后取前 count 个
            const shuffled = items.slice();
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            picked = shuffled.slice(0, Math.min(count, items.length));
        } else {
            picked = Array.from({ length: count }, () =>
                items[Math.floor(Math.random() * items.length)]
            );
        }

        // 显示结果
        if (picked.length === 1) {
            resultsEl.innerHTML = `<div class="rp-result-item">${escapeHtml(picked[0])}</div>`;
        } else {
            resultsEl.innerHTML = picked.map((item, i) =>
                `<div class="rp-result-item">${i + 1}. ${escapeHtml(item)}</div>`
            ).join('');
        }

        // 添加到历史记录
        history.unshift({
            time: new Date().toLocaleTimeString('zh-CN'),
            items: picked.slice()
        });
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
        renderHistory();
    }

    /**
     * 渲染历史记录
     */
    function renderHistory() {
        if (history.length === 0) {
            historyEl.style.display = 'none';
            return;
        }
        historyEl.style.display = 'block';
        historyListEl.innerHTML = history.map(h =>
            `<div class="rp-history-item">🕐 ${h.time} — ${h.items.map(escapeHtml).join('、')}</div>`
        ).join('');
    }

    // HTML 转义
    /**
     * HTML 转义
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // === 自定义 Preset ===
    const CUSTOM_PRESETS_KEY = 'rp-custom-presets';

    /** 读取自定义 preset */
    function loadCustomPresets() {
        try { return JSON.parse(localStorage.getItem(CUSTOM_PRESETS_KEY) || '[]'); } catch(e) { return []; }
    }

    /** 保存自定义 preset */
    function saveCustomPresets(presets) {
        try { localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets)); } catch(e) {}
    }

    let customPresets = loadCustomPresets();

    /**
     * 渲染自定义 preset 按钮
     */
    function renderCustomPresets() {
        const presetBar = container.querySelector('#rp-custom-presets');
        if (!presetBar) return;
        presetBar.innerHTML = customPresets.map((p, i) => `
            <span class="rp-custom-preset-item">
                <button class="btn btn-sm rp-quick-btn" data-custom-preset="${i}">📌 ${escapeHtml(p.name)}</button>
                <span class="rp-custom-del" data-custom-del="${i}" title="删除">×</span>
            </span>
        `).join('');
    }

    /**
     * 显示添加自定义 preset 弹窗
     */
    function showCustomPresetDialog() {
        const overlay = container.querySelector('#rp-dialog-overlay');
        const nameInput = container.querySelector('#rp-dialog-name');
        const contentInput = container.querySelector('#rp-dialog-content');
        nameInput.value = '';
        contentInput.value = '';
        overlay.style.display = 'flex';
        nameInput.focus();
    }

    /**
     * 显示数字范围弹窗
     */
    function showRangeDialog() {
        const overlay = container.querySelector('#rp-range-overlay');
        const startInput = container.querySelector('#rp-range-start');
        const endInput = container.querySelector('#rp-range-end');
        startInput.value = '1';
        endInput.value = '100';
        overlay.style.display = 'flex';
        startInput.focus();
    }

    // 事件绑定
    let _rollTimer = null;
    pickBtn.addEventListener('click', () => {
        pickBtn.classList.add('rolling');
        _rollTimer = setTimeout(() => pickBtn.classList.remove('rolling'), 400);
        pick();
    });

    // 快捷填充
    container.querySelectorAll('.rp-quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (PRESETS[preset]) {
                inputEl.value = PRESETS[preset];
            }
        });
    });

    // "+" 添加自定义 preset 按钮
    container.querySelector('#rp-add-preset-btn').addEventListener('click', showCustomPresetDialog);

    // "数字范围" 按钮
    container.querySelector('#rp-range-btn').addEventListener('click', showRangeDialog);

    // 自定义 preset 按钮（委托）
    container.querySelector('#rp-custom-presets').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-custom-preset]');
        if (btn) {
            const idx = parseInt(btn.dataset.customPreset, 10);
            if (customPresets[idx]) {
                inputEl.value = customPresets[idx].content;
            }
            return;
        }
        const delBtn = e.target.closest('[data-custom-del]');
        if (delBtn) {
            const idx = parseInt(delBtn.dataset.customDel, 10);
            customPresets.splice(idx, 1);
            saveCustomPresets(customPresets);
            renderCustomPresets();
        }
    });

    // === 自定义 Preset 弹窗事件 ===
    container.querySelector('#rp-dialog-save').addEventListener('click', () => {
        const name = container.querySelector('#rp-dialog-name').value.trim();
        const content = container.querySelector('#rp-dialog-content').value.trim();
        if (!name) { alert('请输入 preset 名称'); return; }
        if (!content) { alert('请输入内容'); return; }
        customPresets.push({ name, content });
        saveCustomPresets(customPresets);
        renderCustomPresets();
        container.querySelector('#rp-dialog-overlay').style.display = 'none';
    });
    container.querySelector('#rp-dialog-cancel').addEventListener('click', () => {
        container.querySelector('#rp-dialog-overlay').style.display = 'none';
    });
    container.querySelector('#rp-dialog-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            container.querySelector('#rp-dialog-overlay').style.display = 'none';
        }
    });

    // === 数字范围弹窗事件 ===
    container.querySelector('#rp-range-generate').addEventListener('click', () => {
        const start = parseInt(container.querySelector('#rp-range-start').value, 10);
        const end = parseInt(container.querySelector('#rp-range-end').value, 10);
        if (isNaN(start) || isNaN(end)) { alert('请输入有效数字'); return; }
        if (start > end) { alert('起始数字不能大于结束数字'); return; }
        const count = end - start + 1;
        if (count > 10000) { alert('范围太大（最多 10000 个）'); return; }
        inputEl.value = Array.from({ length: count }, (_, i) => String(start + i)).join('\n');
        container.querySelector('#rp-range-overlay').style.display = 'none';
    });
    container.querySelector('#rp-range-cancel').addEventListener('click', () => {
        container.querySelector('#rp-range-overlay').style.display = 'none';
    });
    container.querySelector('#rp-range-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            container.querySelector('#rp-range-overlay').style.display = 'none';
        }
    });

    // 初始化自定义 preset 按钮
    renderCustomPresets();

    return {
        cleanup() {
            if (_rollTimer) clearTimeout(_rollTimer);
        }
    };
}
