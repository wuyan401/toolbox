/* ============================================
   密码生成器 - 自定义长度/字符集，强度指示，历史记录
   ============================================ */

export const id = 'password-generator';
export const name = '密码生成器';
export const icon = '🔑';
export const description = '随机生成强密码，自定义长度和字符集，强度评估';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    const MAX_HISTORY = 5;
    let history = [];
    let _timer1, _timer2;

    container.innerHTML = `
        <div class="pg-layout">
            <!-- 左侧：设置 -->
            <div class="pg-settings">
                <span class="tool-col-title">密码设置</span>

                <div class="pg-slider-group">
                    <div class="pg-slider-header">
                        <label class="pg-label">密码长度</label>
                        <span class="pg-length-display" id="pg-length-val">16</span>
                    </div>
                    <input type="range" class="pg-slider" id="pg-length" min="6" max="64" value="16" />
                    <div class="pg-range-labels">
                        <span>6</span><span>64</span>
                    </div>
                </div>

                <div class="pg-checkboxes">
                    <label class="pg-check-label">
                        <input type="checkbox" id="pg-upper" checked /> 大写字母 (A-Z)
                    </label>
                    <label class="pg-check-label">
                        <input type="checkbox" id="pg-lower" checked /> 小写字母 (a-z)
                    </label>
                    <label class="pg-check-label">
                        <input type="checkbox" id="pg-digits" checked /> 数字 (0-9)
                    </label>
                    <label class="pg-check-label">
                        <input type="checkbox" id="pg-symbols" checked /> 符号 (!@#$...)
                    </label>
                </div>

                <button class="btn btn-primary pg-generate-btn" id="pg-generate">
                    🔄 生成密码
                </button>
            </div>

            <!-- 右侧：结果显示 + 历史 -->
            <div class="pg-result-section">
                <div class="pg-password-display" id="pg-password-display">
                    <span class="pg-password-text" id="pg-password-text">点击生成</span>
                    <button class="btn btn-sm" id="pg-copy" title="复制密码">📋</button>
                </div>

                <!-- 强度指示条 -->
                <div class="pg-strength" id="pg-strength">
                    <div class="pg-strength-bar" id="pg-strength-bar"></div>
                </div>
                <div class="pg-strength-label" id="pg-strength-label">--</div>

                <!-- 历史记录 -->
                <div class="pg-history" id="pg-history" style="display:none">
                    <div class="pg-history-title">📋 最近生成</div>
                    <div class="pg-history-list" id="pg-history-list"></div>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .pg-layout {
            display: flex;
            gap: var(--spacing-xxl);
            min-height: 0;
        }
        .pg-settings {
            flex: 0 0 300px;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        .pg-slider-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }
        .pg-slider-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .pg-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        }
        .pg-length-display {
            font-size: 28px;
            font-weight: 700;
            color: var(--color-accent);
            font-family: var(--font-family-mono);
        }
        .pg-slider {
            width: 100%;
            accent-color: var(--color-accent);
            height: 6px;
        }
        .pg-range-labels {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: var(--color-text-muted);
        }
        .pg-checkboxes {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .pg-check-label {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            font-size: var(--font-size-md);
            color: var(--color-text-primary);
            cursor: pointer;
            user-select: none;
        }
        .pg-check-label input {
            accent-color: var(--color-accent);
            width: 16px;
            height: 16px;
        }
        .pg-generate-btn {
            width: 100%;
            padding: var(--spacing-md);
            font-size: var(--font-size-lg);
            font-weight: 600;
        }
        .pg-result-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
            min-width: 0;
        }
        .pg-password-display {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-lg) var(--spacing-xl);
            background: var(--color-bg-input);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            min-height: 64px;
        }
        .pg-password-text {
            flex: 1;
            font-family: var(--font-family-mono);
            font-size: 22px;
            font-weight: 600;
            color: var(--color-text-primary);
            word-break: break-all;
            letter-spacing: 1px;
        }
        .pg-password-text.placeholder {
            color: var(--color-text-muted);
            font-size: 14px;
            font-weight: 400;
            letter-spacing: 0;
        }
        .pg-strength {
            height: 8px;
            background: var(--color-bg-input);
            border-radius: 4px;
            overflow: hidden;
        }
        .pg-strength-bar {
            height: 100%;
            width: 0;
            border-radius: 4px;
            transition: width 0.3s ease, background 0.3s ease;
        }
        .pg-strength-label {
            font-size: var(--font-size-sm);
            font-weight: 600;
            text-align: center;
        }
        .pg-history {
            border-top: 1px solid var(--color-border);
            padding-top: var(--spacing-md);
        }
        .pg-history-title {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
            margin-bottom: var(--spacing-sm);
        }
        .pg-history-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }
        .pg-history-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            font-size: var(--font-size-sm);
            font-family: var(--font-family-mono);
            color: var(--color-text-primary);
            padding: var(--spacing-xs) var(--spacing-sm);
            background: var(--color-bg-input);
            border-radius: var(--radius-sm);
            cursor: pointer;
        }
        .pg-history-item:hover {
            background: var(--color-bg-hover);
        }
        .pg-history-copy {
            margin-left: auto;
            font-size: 12px;
            color: var(--color-text-secondary);
            cursor: pointer;
            padding: 2px 6px;
            border-radius: 4px;
            border: none;
            background: transparent;
        }
        .pg-history-copy:hover {
            color: var(--color-accent);
        }
        @media (max-width: 768px) {
            .pg-layout {
                flex-direction: column;
            }
            .pg-settings {
                flex: none;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const lengthSlider = container.querySelector('#pg-length');
    const lengthVal = container.querySelector('#pg-length-val');
    const upperCb = container.querySelector('#pg-upper');
    const lowerCb = container.querySelector('#pg-lower');
    const digitsCb = container.querySelector('#pg-digits');
    const symbolsCb = container.querySelector('#pg-symbols');
    const generateBtn = container.querySelector('#pg-generate');
    const passwordText = container.querySelector('#pg-password-text');
    const copyBtn = container.querySelector('#pg-copy');
    const strengthBar = container.querySelector('#pg-strength-bar');
    const strengthLabel = container.querySelector('#pg-strength-label');
    const historyEl = container.querySelector('#pg-history');
    const historyListEl = container.querySelector('#pg-history-list');

    const CHAR_SETS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        digits: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    /**
     * 计算密码强度
     * @param {string} pwd
     * @returns {{ score: number, label: string, color: string }}
     */
    function calcStrength(pwd) {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (pwd.length >= 16) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score: 25, label: '弱', color: '#ef4444' };
        if (score <= 4) return { score: 50, label: '中', color: '#f59e0b' };
        if (score <= 5) return { score: 75, label: '强', color: '#3b82f6' };
        return { score: 100, label: '极强', color: '#22c55e' };
    }

    /**
     * 生成密码
     */
    function generate() {
        let charset = '';
        if (upperCb.checked) charset += CHAR_SETS.upper;
        if (lowerCb.checked) charset += CHAR_SETS.lower;
        if (digitsCb.checked) charset += CHAR_SETS.digits;
        if (symbolsCb.checked) charset += CHAR_SETS.symbols;

        if (!charset) {
            passwordText.textContent = '请至少选择一个字符类型';
            passwordText.classList.add('placeholder');
            strengthBar.style.width = '0';
            strengthLabel.textContent = '--';
            return;
        }

        const length = parseInt(lengthSlider.value, 10);
        // 使用 crypto 获取安全随机数
        const arr = new Uint32Array(length);
        crypto.getRandomValues(arr);
        let pwd = '';
        for (let i = 0; i < length; i++) {
            pwd += charset[arr[i] % charset.length];
        }

        passwordText.textContent = pwd;
        passwordText.classList.remove('placeholder');

        // 更新强度
        const s = calcStrength(pwd);
        strengthBar.style.width = s.score + '%';
        strengthBar.style.background = s.color;
        strengthLabel.textContent = s.label;
        strengthLabel.style.color = s.color;

        // 添加到历史
        addHistory(pwd);
    }

    /**
     * 添加到历史记录
     */
    function addHistory(pwd) {
        // 去重
        history = history.filter(h => h !== pwd);
        history.unshift(pwd);
        if (history.length > MAX_HISTORY) history.pop();
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
        historyListEl.innerHTML = history.map((h, i) => `
            <div class="pg-history-item" data-pwd="${escapeHtml(h)}">
                <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(h)}</span>
                <button class="pg-history-copy" data-idx="${i}" title="复制">📋</button>
            </div>
        `).join('');
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
        } catch {
            return false;
        }
    }

    // 事件绑定
    lengthSlider.addEventListener('input', () => {
        lengthVal.textContent = lengthSlider.value;
    });

    // 复选框变更时确保至少选一个
    [upperCb, lowerCb, digitsCb, symbolsCb].forEach(cb => {
        cb.addEventListener('change', () => {
            const any = upperCb.checked || lowerCb.checked || digitsCb.checked || symbolsCb.checked;
            if (!any) {
                cb.checked = true;
            }
        });
    });

    generateBtn.addEventListener('click', generate);

    copyBtn.addEventListener('click', async () => {
        const text = passwordText.textContent;
        if (text === '点击生成' || text === '请至少选择一个字符类型') return;
        const ok = await copyText(text);
        const orig = copyBtn.textContent;
        copyBtn.textContent = ok ? '✅' : '❌';
        _timer1 = setTimeout(() => { copyBtn.textContent = orig; }, 1500);
    });

    // 历史记录点击复制
    historyListEl.addEventListener('click', async (e) => {
        const copyBtnEl = e.target.closest('.pg-history-copy');
        const item = e.target.closest('.pg-history-item');
        if (!copyBtnEl && !item) return;
        const pwd = (copyBtnEl ? copyBtnEl.closest('.pg-history-item') : item).dataset.pwd;
        if (!pwd) return;
        const ok = await copyText(pwd);
        if (copyBtnEl) {
            const orig = copyBtnEl.textContent;
            copyBtnEl.textContent = ok ? '✅' : '❌';
            _timer2 = setTimeout(() => { copyBtnEl.textContent = orig; }, 1500);
        }
    });

    return {
        cleanup() {
            clearTimeout(_timer1);
            clearTimeout(_timer2);
        }
    };
}
