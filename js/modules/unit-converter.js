/* ============================================
   全能单位换算 - 长度/重量/温度/面积/体积/速度/数据存储
   输入任意单位自动联动所有输出
   ============================================ */

export const id = 'unit-converter';
export const name = '单位换算';
export const icon = '📐';
export const description = '长度/重量/温度/面积/体积/速度/数据存储 一键换算';
export const category = '日常工具';
export const enabled = true;

/** 分类定义 */
const CATEGORIES = {
    length: {
        name: '长度',
        icon: '📏',
        units: [
            { name: '毫米', code: 'mm', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            { name: '厘米', code: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
            { name: '米', code: 'm', toBase: (v) => v, fromBase: (v) => v },
            { name: '千米', code: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            { name: '英寸', code: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
            { name: '英尺', code: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
            { name: '码', code: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
            { name: '英里', code: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 }
        ]
    },
    weight: {
        name: '重量',
        icon: '⚖️',
        units: [
            { name: '毫克', code: 'mg', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
            { name: '克', code: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            { name: '千克', code: 'kg', toBase: (v) => v, fromBase: (v) => v },
            { name: '吨', code: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            { name: '盎司', code: 'oz', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
            { name: '磅', code: 'lb', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 }
        ]
    },
    temperature: {
        name: '温度',
        icon: '🌡️',
        units: [
            {
                name: '摄氏度', code: 'C', toBase: (v) => v, fromBase: (v) => v,
                // 温度特殊处理
                toCelsius: (v) => v,
                fromCelsius: (v) => v
            },
            {
                name: '华氏度', code: 'F', toBase: null, fromBase: null,
                toCelsius: (v) => (v - 32) * 5 / 9,
                fromCelsius: (v) => v * 9 / 5 + 32
            },
            {
                name: '开尔文', code: 'K', toBase: null, fromBase: null,
                toCelsius: (v) => v - 273.15,
                fromCelsius: (v) => v + 273.15
            }
        ]
    },
    area: {
        name: '面积',
        icon: '📐',
        units: [
            { name: '平方毫米', code: 'mm²', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
            { name: '平方厘米', code: 'cm²', toBase: (v) => v / 1e4, fromBase: (v) => v * 1e4 },
            { name: '平方米', code: 'm²', toBase: (v) => v, fromBase: (v) => v },
            { name: '公顷', code: 'ha', toBase: (v) => v * 1e4, fromBase: (v) => v / 1e4 },
            { name: '平方千米', code: 'km²', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
            { name: '英亩', code: 'ac', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 }
        ]
    },
    volume: {
        name: '体积',
        icon: '🧪',
        units: [
            { name: '毫升', code: 'mL', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
            { name: '升', code: 'L', toBase: (v) => v, fromBase: (v) => v },
            { name: '立方米', code: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
            { name: '美制加仑', code: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
            { name: '美制液盎司', code: 'fl oz', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 }
        ]
    },
    speed: {
        name: '速度',
        icon: '🚀',
        units: [
            { name: '米/秒', code: 'm/s', toBase: (v) => v, fromBase: (v) => v },
            { name: '千米/时', code: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
            { name: '英里/时', code: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
            { name: '节', code: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 }
        ]
    },
    data: {
        name: '数据存储',
        icon: '💾',
        units: [
            { name: '字节', code: 'B', toBase: (v) => v, fromBase: (v) => v },
            { name: 'KB', code: 'KB', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
            { name: 'MB', code: 'MB', toBase: (v) => v * 1024 ** 2, fromBase: (v) => v / 1024 ** 2 },
            { name: 'GB', code: 'GB', toBase: (v) => v * 1024 ** 3, fromBase: (v) => v / 1024 ** 3 },
            { name: 'TB', code: 'TB', toBase: (v) => v * 1024 ** 4, fromBase: (v) => v / 1024 ** 4 }
        ]
    }
};

export function init(container) {
    const catKeys = Object.keys(CATEGORIES);
    let currentCat = 'length';
    let _timers = [];

    // 生成分类标签按钮
    const tabsHtml = catKeys.map(k => {
        const c = CATEGORIES[k];
        return `<button class="uc-cat-btn" data-cat="${k}">${c.icon} ${c.name}</button>`;
    }).join('');

    container.innerHTML = `
        <div class="uc-layout">
            <div class="uc-categories">${tabsHtml}</div>
            <div class="uc-card">
                <div class="uc-card-title" id="uc-card-title">📏 长度</div>
                <div class="uc-units-list" id="uc-units-list"></div>
            </div>
            <div class="uc-footer">
                <button class="btn btn-sm" id="uc-clear">🗑️ 清空</button>
                <button class="btn btn-sm" id="uc-swap" title="反转换算方向">🔄 互换</button>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .uc-layout {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
            max-width: 700px;
            margin: 0 auto;
        }
        .uc-categories {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
        }
        .uc-cat-btn {
            padding: 6px 14px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-pill);
            background: var(--color-bg-secondary);
            color: var(--color-text-secondary);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: all var(--transition-fast);
            white-space: nowrap;
        }
        .uc-cat-btn:hover {
            border-color: var(--color-accent);
            color: var(--color-accent);
        }
        .uc-cat-btn.active {
            background: var(--color-accent);
            color: #fff;
            border-color: var(--color-accent);
        }
        .uc-card-title {
            font-size: var(--font-size-lg);
            font-weight: 600;
            margin-bottom: var(--spacing-md);
            color: var(--color-text-primary);
        }
        .uc-units-list {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .uc-unit-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
        }
        .uc-unit-label {
            flex: 0 0 100px;
            font-size: var(--font-size-md);
            font-weight: 600;
            color: var(--color-text-secondary);
            font-family: var(--font-family-mono);
        }
        .uc-unit-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-bg-input);
            color: var(--color-text-primary);
            font-family: var(--font-family-mono);
            font-size: var(--font-size-md);
            outline: none;
            transition: border-color var(--transition-fast);
        }
        .uc-unit-input:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 2px var(--color-accent-light);
        }
        .uc-unit-input.active {
            border-color: var(--color-accent);
            background: var(--color-accent-light);
        }
        .uc-copy-btn {
            flex: 0 0 32px;
            width: 32px;
            height: 32px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-bg-secondary);
            cursor: pointer;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--transition-fast);
        }
        .uc-copy-btn:hover {
            border-color: var(--color-accent);
            color: var(--color-accent);
        }
        .uc-footer {
            display: flex;
            gap: var(--spacing-sm);
            justify-content: center;
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const titleEl = container.querySelector('#uc-card-title');
    const listEl = container.querySelector('#uc-units-list');
    const catBtns = container.querySelectorAll('.uc-cat-btn');

    /**
     * 格式化数值
     */
    function fmt(v) {
        if (v === 0) return '0';
        if (Math.abs(v) < 1e-9) return '0';
        if (Math.abs(v) >= 1e9 || Math.abs(v) < 1e-6) return v.toExponential(6);
        // 智能小数位
        const absV = Math.abs(v);
        if (absV < 0.001) return v.toFixed(9);
        if (absV < 0.01) return v.toFixed(6);
        if (absV < 1) return v.toFixed(4);
        return v.toLocaleString('en-US', { maximumFractionDigits: 6, useGrouping: false });
    }

    /**
     * 渲染当前分类的单位输入
     */
    function renderUnits() {
        const cat = CATEGORIES[currentCat];
        titleEl.textContent = cat.icon + ' ' + cat.name;

        let html = '';
        cat.units.forEach((u, i) => {
            html += `
                <div class="uc-unit-row">
                    <span class="uc-unit-label">${u.code}</span>
                    <input class="uc-unit-input" data-idx="${i}" type="text" inputmode="decimal" placeholder="0" />
                    <button class="uc-copy-btn" data-idx="${i}" title="复制">📋</button>
                </div>
            `;
        });
        listEl.innerHTML = html;
    }

    /**
     * 从输入框联动所有值
     * @param {number} srcIdx - 来源单位索引
     * @param {number} srcValue - 来源数值
     */
    function convertFrom(srcIdx, srcValue) {
        const cat = CATEGORIES[currentCat];
        const inputs = listEl.querySelectorAll('.uc-unit-input');

        let baseValue;
        if (currentCat === 'temperature') {
            baseValue = cat.units[srcIdx].toCelsius(srcValue);
            inputs.forEach((inp, i) => {
                if (i === srcIdx) {
                    inp.classList.add('active');
                    return;
                }
                inp.classList.remove('active');
                const result = cat.units[i].fromCelsius(baseValue);
                inp.value = fmt(result);
            });
        } else {
            baseValue = cat.units[srcIdx].toBase(srcValue);
            inputs.forEach((inp, i) => {
                if (i === srcIdx) {
                    inp.classList.add('active');
                    return;
                }
                inp.classList.remove('active');
                const result = cat.units[i].fromBase(baseValue);
                inp.value = fmt(result);
            });
        }
    }

    /**
     * 清空所有输入
     */
    function clearAll() {
        catBtns.forEach(b => b.classList.remove('active'));
        listEl.querySelectorAll('.uc-unit-input').forEach(inp => {
            inp.value = '';
            inp.classList.remove('active');
        });
    }

    /**
     * 互换：用第一个有值单位的值交换到第二个
     */
    function swap() {
        const inputs = listEl.querySelectorAll('.uc-unit-input');
        const vals = [];
        inputs.forEach(inp => vals.push(inp.value));
        const nonEmpty = vals.map((v, i) => ({ v, i })).filter(x => x.v !== '');
        if (nonEmpty.length < 1) return;
        // 把值放到最后一个单位
        const lastIdx = inputs.length - 1;
        inputs[lastIdx].value = nonEmpty[0].v;
        inputs[lastIdx].focus();
        inputs[lastIdx].select();
        const num = parseFloat(nonEmpty[0].v);
        if (!isNaN(num)) convertFrom(lastIdx, num);
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

    // 事件：分类切换
    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentCat = btn.dataset.cat;
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderUnits();
        });
    });

    // 事件：输入变化（委托）
    listEl.addEventListener('input', (e) => {
        const inp = e.target.closest('.uc-unit-input');
        if (!inp) return;
        const idx = parseInt(inp.dataset.idx, 10);
        const raw = inp.value.trim();
        if (raw === '') {
            clearAll();
            return;
        }
        const num = parseFloat(raw);
        if (isNaN(num)) return;
        convertFrom(idx, num);
    });

    // 事件：复制按钮（委托）
    listEl.addEventListener('click', async (e) => {
        const btn = e.target.closest('.uc-copy-btn');
        if (!btn) return;
        const idx = parseInt(btn.dataset.idx, 10);
        const inp = listEl.querySelector(`.uc-unit-input[data-idx="${idx}"]`);
        if (!inp || !inp.value) return;
        const ok = await copyText(inp.value);
        const orig = btn.textContent;
        btn.textContent = ok ? '✅' : '❌';
        _timers.push(setTimeout(() => { btn.textContent = orig; }, 1000));
    });

    // 事件：清空
    container.querySelector('#uc-clear').addEventListener('click', clearAll);

    // 事件：互换
    container.querySelector('#uc-swap').addEventListener('click', swap);

    // 默认选中第一个分类
    catBtns[0].classList.add('active');
    renderUnits();

    return {
        cleanup() {
            _timers.forEach(t => clearTimeout(t));
        }
    };
}
