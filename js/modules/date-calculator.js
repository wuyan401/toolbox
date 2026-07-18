/* ============================================
   日期计算器 - 日期差计算 / 日期推算 / 星期显示 / 快捷按钮
   ============================================ */

export const id = 'date-calculator';
export const name = '日期计算器';
export const icon = '📅';
export const description = '日期差计算、日期推算、星期显示、快捷按钮';
export const category = '日常工具';
export const enabled = true;

/** 星期名称 */
const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

/**
 * 格式化日期为 YYYY-MM-DD
 */
function fmtDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function init(container) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    container.innerHTML = `
        <div class="dc-layout">
            <!-- 模式选择 -->
            <div class="dc-mode-bar">
                <button class="dc-mode-btn active" data-mode="diff">📏 日期差计算</button>
                <button class="dc-mode-btn" data-mode="calc">🧮 日期推算</button>
            </div>

            <!-- 日期差计算面板 -->
            <div class="dc-panel" id="dc-panel-diff">
                <div class="dc-date-row">
                    <div class="dc-date-group">
                        <label class="dc-label">起始日期</label>
                        <input type="date" class="input dc-date-input" id="dc-start" value="${fmtDate(today)}" />
                        <span class="dc-weekday" id="dc-start-weekday"></span>
                    </div>
                    <div class="dc-arrow-big">→</div>
                    <div class="dc-date-group">
                        <label class="dc-label">结束日期</label>
                        <input type="date" class="input dc-date-input" id="dc-end" value="${fmtDate(today)}" />
                        <span class="dc-weekday" id="dc-end-weekday"></span>
                    </div>
                </div>
                <div class="dc-quick-btns" id="dc-shortcuts-diff">
                    <span class="dc-quick-label">快捷：</span>
                    <button class="btn btn-sm" data-set="start-today">今天为起始</button>
                    <button class="btn btn-sm" data-set="end-today">今天为结束</button>
                    <button class="btn btn-sm" data-set="start-7days">7天前为起始</button>
                    <button class="btn btn-sm" data-set="end-30days">30天后为结束</button>
                </div>
                <div class="dc-result-cards" id="dc-diff-results">
                    <div class="dc-card"><div class="dc-card-num" id="dc-days">0</div><div class="dc-card-label">相差天数</div></div>
                    <div class="dc-card"><div class="dc-card-num" id="dc-weeks">0</div><div class="dc-card-label">相差周数</div></div>
                    <div class="dc-card"><div class="dc-card-num" id="dc-months">0</div><div class="dc-card-label">相差月数</div></div>
                    <div class="dc-card"><div class="dc-card-num" id="dc-years">0</div><div class="dc-card-label">相差年数</div></div>
                </div>
            </div>

            <!-- 日期推算面板 -->
            <div class="dc-panel" id="dc-panel-calc" style="display:none">
                <div class="dc-date-row">
                    <div class="dc-date-group">
                        <label class="dc-label">基准日期</label>
                        <input type="date" class="input dc-date-input" id="dc-base" value="${fmtDate(today)}" />
                        <span class="dc-weekday" id="dc-base-weekday"></span>
                    </div>
                </div>
                <div class="dc-calc-inputs">
                    <div class="dc-calc-group">
                        <label class="dc-label">偏移天数</label>
                        <input type="number" class="input dc-number-input" id="dc-offset-days" value="0" />
                    </div>
                    <div class="dc-calc-group">
                        <label class="dc-label">偏移月数</label>
                        <input type="number" class="input dc-number-input" id="dc-offset-months" value="0" />
                    </div>
                    <div class="dc-calc-group">
                        <label class="dc-label">偏移年数</label>
                        <input type="number" class="input dc-number-input" id="dc-offset-years" value="0" />
                    </div>
                </div>
                <div class="dc-quick-btns" id="dc-shortcuts-calc">
                    <span class="dc-quick-label">快捷：</span>
                    <button class="btn btn-sm" data-offset="7">+7天</button>
                    <button class="btn btn-sm" data-offset="-7">-7天</button>
                    <button class="btn btn-sm" data-offset="30">+30天</button>
                    <button class="btn btn-sm" data-offset="-30">-30天</button>
                    <button class="btn btn-sm" data-offset="365">+365天</button>
                </div>
                <div class="dc-result-highlight" id="dc-calc-result">
                    <div class="dc-big-date" id="dc-result-date">--</div>
                    <div class="dc-big-weekday" id="dc-result-weekday">--</div>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .dc-layout {
            max-width: 750px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xl);
        }
        .dc-mode-bar {
            display: flex;
            gap: var(--spacing-sm);
        }
        .dc-mode-btn {
            padding: 8px 20px;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-pill);
            background: var(--color-bg-secondary);
            color: var(--color-text-secondary);
            font-size: var(--font-size-md);
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-fast);
        }
        .dc-mode-btn:hover {
            border-color: var(--color-accent);
        }
        .dc-mode-btn.active {
            background: var(--color-accent);
            color: #fff;
            border-color: var(--color-accent);
        }
        .dc-panel {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        .dc-date-row {
            display: flex;
            align-items: flex-start;
            gap: var(--spacing-xl);
            flex-wrap: wrap;
        }
        .dc-date-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
            flex: 1;
            min-width: 200px;
        }
        .dc-label {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
        }
        .dc-weekday {
            font-size: var(--font-size-sm);
            color: var(--color-accent);
            font-weight: 600;
        }
        .dc-arrow-big {
            font-size: 24px;
            color: var(--color-text-muted);
            display: flex;
            align-items: center;
            padding-top: 28px;
        }
        .dc-quick-btns {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            flex-wrap: wrap;
        }
        .dc-quick-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
        }
        .dc-result-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: var(--spacing-sm);
        }
        .dc-card {
            padding: var(--spacing-xl) var(--spacing-lg);
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            text-align: center;
        }
        .dc-card-num {
            font-size: 32px;
            font-weight: 700;
            color: var(--color-accent);
            font-family: var(--font-family-mono);
        }
        .dc-card-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
            margin-top: 4px;
        }
        .dc-calc-inputs {
            display: flex;
            gap: var(--spacing-md);
            flex-wrap: wrap;
        }
        .dc-calc-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
            flex: 1;
            min-width: 120px;
        }
        .dc-number-input {
            font-family: var(--font-family-mono);
            width: 100%;
        }
        .dc-result-highlight {
            padding: var(--spacing-xxl);
            background: var(--color-accent-light);
            border: 2px solid var(--color-accent);
            border-radius: var(--radius-xl);
            text-align: center;
        }
        .dc-big-date {
            font-size: 36px;
            font-weight: 700;
            color: var(--color-accent);
            font-family: var(--font-family-mono);
        }
        .dc-big-weekday {
            font-size: var(--font-size-lg);
            color: var(--color-text-secondary);
            margin-top: var(--spacing-sm);
        }
    `;
    container.appendChild(style);

    // --- 日期差计算 ---
    const panelDiff = container.querySelector('#dc-panel-diff');
    const panelCalc = container.querySelector('#dc-panel-calc');
    const modeBtns = container.querySelectorAll('.dc-mode-btn');
    const startEl = container.querySelector('#dc-start');
    const endEl = container.querySelector('#dc-end');
    const startWd = container.querySelector('#dc-start-weekday');
    const endWd = container.querySelector('#dc-end-weekday');
    const daysEl = container.querySelector('#dc-days');
    const weeksEl = container.querySelector('#dc-weeks');
    const monthsEl = container.querySelector('#dc-months');
    const yearsEl = container.querySelector('#dc-years');

    // --- 日期推算 ---
    const baseEl = container.querySelector('#dc-base');
    const baseWd = container.querySelector('#dc-base-weekday');
    const offsetDays = container.querySelector('#dc-offset-days');
    const offsetMonths = container.querySelector('#dc-offset-months');
    const offsetYears = container.querySelector('#dc-offset-years');
    const resultDate = container.querySelector('#dc-result-date');
    const resultWeekday = container.querySelector('#dc-result-weekday');

    /**
     * 获取星期文本
     */
    function weekdayText(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr + 'T00:00:00');
        if (isNaN(d.getTime())) return '';
        return WEEKDAYS[d.getDay()];
    }

    /**
     * 计算日期间相差数据
     */
    function calcDiff(startStr, endStr) {
        const s = new Date(startStr + 'T00:00:00');
        const e = new Date(endStr + 'T00:00:00');
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return;

        const msDiff = e.getTime() - s.getTime();
        const days = Math.round(msDiff / (24 * 60 * 60 * 1000));
        const absDays = Math.abs(days);

        daysEl.textContent = days;
        weeksEl.textContent = (days / 7).toFixed(1);

        // 月数（近似，按30.44天）
        monthsEl.textContent = (days / 30.44).toFixed(1);

        // 年数（近似）
        yearsEl.textContent = (days / 365.25).toFixed(2);
    }

    /**
     * 日期推算
     */
    function calcDate() {
        const base = new Date(baseEl.value + 'T00:00:00');
        if (isNaN(base.getTime())) {
            resultDate.textContent = '--';
            resultWeekday.textContent = '请选择有效日期';
            return;
        }

        const days = parseInt(offsetDays.value, 10) || 0;
        const months = parseInt(offsetMonths.value, 10) || 0;
        const years = parseInt(offsetYears.value, 10) || 0;

        const result = new Date(base);
        result.setFullYear(result.getFullYear() + years);
        result.setMonth(result.getMonth() + months);
        result.setDate(result.getDate() + days);

        resultDate.textContent = fmtDate(result);
        resultWeekday.textContent = WEEKDAYS[result.getDay()];
    }

    /**
     * 更新差计算面板
     */
    function updateDiff() {
        startWd.textContent = weekdayText(startEl.value);
        endWd.textContent = weekdayText(endEl.value);
        calcDiff(startEl.value, endEl.value);
    }

    // 事件：模式切换
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            panelDiff.style.display = mode === 'diff' ? '' : 'none';
            panelCalc.style.display = mode === 'calc' ? '' : 'none';
            if (mode === 'calc') calcDate();
        });
    });

    // 事件：日期变更
    startEl.addEventListener('change', updateDiff);
    endEl.addEventListener('change', updateDiff);

    // 事件：快捷按钮（差计算）
    container.querySelector('#dc-shortcuts-diff').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-set]');
        if (!btn) return;
        const action = btn.dataset.set;
        const t = new Date();
        t.setHours(0, 0, 0, 0);

        switch (action) {
            case 'start-today': startEl.value = fmtDate(t); break;
            case 'end-today': endEl.value = fmtDate(t); break;
            case 'start-7days': {
                t.setDate(t.getDate() - 7);
                startEl.value = fmtDate(t);
                break;
            }
            case 'end-30days': {
                t.setDate(t.getDate() + 30);
                endEl.value = fmtDate(t);
                break;
            }
        }
        updateDiff();
    });

    // 事件：基准日期变更
    baseEl.addEventListener('change', () => {
        baseWd.textContent = weekdayText(baseEl.value);
        calcDate();
    });

    // 事件：偏移值变更
    offsetDays.addEventListener('input', calcDate);
    offsetMonths.addEventListener('input', calcDate);
    offsetYears.addEventListener('input', calcDate);

    // 事件：快捷按钮（推算）
    container.querySelector('#dc-shortcuts-calc').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-offset]');
        if (!btn) return;
        const offset = parseInt(btn.dataset.offset, 10);
        offsetDays.value = offset;
        offsetMonths.value = 0;
        offsetYears.value = 0;
        calcDate();
    });

    // 初始渲染
    updateDiff();
    baseWd.textContent = weekdayText(baseEl.value);
    calcDate();

    return {
        cleanup() {}
    };
}
