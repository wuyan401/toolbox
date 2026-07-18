/* ============================================
   科学计算器 - 双模式（基础 / 科学）
   基础模式 4 列，科学模式 8 列
   支持三角函数、对数、阶乘等，DEG/RAD 切换
   安全求值：Function + Math 对象
   ============================================ */

export const id = 'calculator';
export const name = '计算器';
export const icon = '🔢';
export const description = '高级科学计算器，支持三角函数、对数、阶乘';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    // ============================================================
    // 状态
    // ============================================================
    /** @type {'basic'|'scientific'} */
    let mode = 'basic';
    /** @type {'deg'|'rad'} */
    let angleUnit = 'deg';
    /** 完整表达式（含显示运算符 × ÷ − 和函数名） */
    let expression = '';
    /** 等号求值后的结果缓存 */
    let lastResult = '';
    /** 是否刚刚按了等号 */
    let justEvaluated = false;

    // ============================================================
    // 渲染 HTML
    // ============================================================
    container.innerHTML = `
    <div class="calc-wrapper">
      <div class="calc-mode-bar">
        <button class="calc-mode-btn active" data-cmode="basic">基础</button>
        <button class="calc-mode-btn" data-cmode="scientific">科学</button>
      </div>
      <div class="calc-display">
        <div class="calc-expression"></div>
        <div class="calc-result">0</div>
      </div>
      <div class="calc-keypad-wrap">
        <!-- 基础键盘 4×5 -->
        <div class="calc-grid calc-grid-main">
          <button class="calc-key key-clear"  data-action="clear">C</button>
          <button class="calc-key key-func"   data-action="backspace">⌫</button>
          <button class="calc-key key-func"   data-action="percent">%</button>
          <button class="calc-key key-op"     data-action="op" data-v="÷">÷</button>

          <button class="calc-key key-num"    data-action="digit" data-v="7">7</button>
          <button class="calc-key key-num"    data-action="digit" data-v="8">8</button>
          <button class="calc-key key-num"    data-action="digit" data-v="9">9</button>
          <button class="calc-key key-op"     data-action="op" data-v="×">×</button>

          <button class="calc-key key-num"    data-action="digit" data-v="4">4</button>
          <button class="calc-key key-num"    data-action="digit" data-v="5">5</button>
          <button class="calc-key key-num"    data-action="digit" data-v="6">6</button>
          <button class="calc-key key-op"     data-action="op" data-v="−">−</button>

          <button class="calc-key key-num"    data-action="digit" data-v="1">1</button>
          <button class="calc-key key-num"    data-action="digit" data-v="2">2</button>
          <button class="calc-key key-num"    data-action="digit" data-v="3">3</button>
          <button class="calc-key key-op"     data-action="op" data-v="+">+</button>

          <button class="calc-key key-num"    data-action="digit" data-v="0">0</button>
          <button class="calc-key key-num"    data-action="decimal">.</button>
          <button class="calc-key key-eq"     data-action="calc">=</button>
          <span><!-- 占位，保持 4 列对齐 --></span>
        </div>
        <!-- 科学键盘 4×5 -->
        <div class="calc-grid calc-grid-sci">
          <button class="calc-key key-sci"    data-action="sci" data-v="sin">sin</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="cos">cos</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="tan">tan</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="π">π</button>

          <button class="calc-key key-sci"    data-action="sci" data-v="ln">ln</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="log">log</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="√">√</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="e">e</button>

          <button class="calc-key key-sci"    data-action="sci" data-v="x²">x²</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="xʸ">xʸ</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="n!">n!</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="|x|">|x|</button>

          <button class="calc-key key-sci"    data-action="sci" data-v="1/x">1/x</button>
          <button class="calc-key key-sci"    data-action="paren" data-v="(">(</button>
          <button class="calc-key key-sci"    data-action="paren" data-v=")">)</button>
          <button class="calc-key key-sci key-angle" data-action="angle">DEG</button>

          <button class="calc-key key-sci"    data-action="sci" data-v="log₂">log₂</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="sinh">sinh</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="cosh">cosh</button>
          <button class="calc-key key-sci"    data-action="sci" data-v="tanh">tanh</button>
        </div>
      </div>
    </div>`;

    // ============================================================
    // 注入样式
    // ============================================================
    const css = document.createElement('style');
    css.textContent = `
    .calc-wrapper {
      max-width: 440px;
      margin: 20px auto 0;
      background: var(--color-bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
    }
    /* 模式切换栏 */
    .calc-mode-bar {
      display: flex;
      background: var(--color-bg-sidebar);
      padding: 5px 6px;
      gap: 4px;
    }
    .calc-mode-btn {
      flex: 1;
      padding: 6px 0;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: rgba(255,255,255,0.45);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }
    .calc-mode-btn.active {
      background: rgba(255,255,255,0.14);
      color: #fff;
      font-weight: 600;
    }
    .calc-mode-btn:hover:not(.active) {
      color: rgba(255,255,255,0.75);
    }
    /* 显示区 */
    .calc-display {
      padding: 12px 16px;
      background: var(--color-bg-sidebar);
      color: #fff;
      text-align: right;
      min-height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    .calc-expression {
      font-size: 14px;
      color: rgba(255,255,255,0.5);
      min-height: 20px;
      word-break: break-all;
      margin-bottom: 4px;
      overflow-y: auto;
      max-height: 48px;
      scrollbar-width: thin;
      line-height: 1.4;
    }
    .calc-result {
      font-size: 28px;
      font-weight: 300;
      word-break: break-all;
      line-height: 1.2;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: nowrap;
      scrollbar-width: thin;
    }
    /* 双网格容器 */
    .calc-keypad-wrap {
      display: flex;
      background: var(--color-border);
      gap: 1px;
    }
    .calc-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      flex: 1 1 0;
      min-width: 0;
    }
    /* 科学网格默认隐藏 */
    .calc-grid-sci { display: none; }
    .calc-keypad-wrap.sci-mode .calc-grid-sci { display: grid; }
    /* 基础模式：主网格拉满 */
    .calc-keypad-wrap:not(.sci-mode) .calc-grid-main { flex: 1; }
    /* 科学模式：各占一半 */
    .calc-keypad-wrap.sci-mode .calc-grid-main,
    .calc-keypad-wrap.sci-mode .calc-grid-sci {
      flex: 1 1 0;
    }
    /* 按键通用 */
    .calc-key {
      aspect-ratio: 1 / 1;
      min-height: 44px;
      padding: 0;
      border: none;
      background: var(--color-bg-secondary);
      color: var(--color-text-primary);
      font-size: 18px;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.1s;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .calc-key:hover { background: var(--color-bg-hover); }
    .calc-key:active {
      transform: scale(0.93);
      filter: brightness(0.85);
    }
    /* 数字键 */
    .key-num { background: var(--color-bg-secondary); font-weight: 500; font-size: 20px; }
    /* 功能键 */
    .key-func { color: var(--color-text-secondary); font-size: 15px; background: var(--color-bg-input); }
    .key-clear { color: #e74c3c; font-size: 15px; font-weight: 600; background: var(--color-bg-input); }
    /* 运算符 */
    .key-op { color: var(--color-accent); font-weight: 600; font-size: 20px; background: var(--color-accent-light); }
    .key-op:active { background: var(--color-accent); color: #fff; }
    /* 等号 */
    .key-eq { background: var(--color-accent); color: #fff; font-weight: 600; font-size: 22px; }
    .key-eq:hover { background: var(--color-accent-hover); }
    /* 科学键 */
    .key-sci { font-size: 13px; color: var(--color-accent); background: var(--color-bg-input); }
    .key-sci:hover { background: var(--color-accent); color: #fff; }
    .key-angle { font-weight: 600; font-size: 11px; }
    .key-angle.rad { color: #f39c12; }
    `;
    container.appendChild(css);

    // ============================================================
    // DOM 引用
    // ============================================================
    const wrapper = container.querySelector('.calc-wrapper');
    const exprEl = container.querySelector('.calc-expression');
    const resultEl = container.querySelector('.calc-result');
    const keypadWrap = container.querySelector('.calc-keypad-wrap');
    const modeBtns = container.querySelectorAll('.calc-mode-btn');
    const angleBtn = container.querySelector('.key-angle');

    // ============================================================
    // 求值引擎
    // ============================================================

    /** 阶乘（非负整数，>170 返回 NaN 防溢出） */
    function factorial(n) {
        if (n < 0 || !Number.isInteger(n) || n > 170) return NaN;
        if (n === 0 || n === 1) return 1;
        let r = 1;
        for (let i = 2; i <= n; i++) r *= i;
        return r;
    }

    /**
     * 安全求值表达式
     * @param {string} raw 原始表达式（含 sin/π/× 等）
     * @param {boolean} autoClose 自动补全括号
     * @returns {string|null} 结果字符串，错误返回 null
     */
    function evaluate(raw, autoClose = true) {
        if (!raw) return null;
        let s = raw;

        // ---- 第 1 步：标准化显示运算符 ----
        s = s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

        // ---- 第 2 步：后缀运算 ----
        // x² → **(2)
        s = s.replace(/²/g, '**(2)');
        // n! → _fact(N)
        s = s.replace(/(\d+(?:\.\d+)?)!/g, '_fact($1)');

        // ---- 第 3 步：三角函数（DEG/RAD） ----
        const trigMap = angleUnit === 'deg'
            ? { sin: '_dsin', cos: '_dcos', tan: '_dtan',
                asin: '_dasin', acos: '_dacos', atan: '_datan',
                sinh: 'Math.sinh', cosh: 'Math.cosh', tanh: 'Math.tanh' }
            : { sin: 'Math.sin', cos: 'Math.cos', tan: 'Math.tan',
                asin: 'Math.asin', acos: 'Math.acos', atan: 'Math.atan',
                sinh: 'Math.sinh', cosh: 'Math.cosh', tanh: 'Math.tanh' };
        for (const [from, to] of Object.entries(trigMap)) {
            s = s.replaceAll(from + '(', to + '(');
        }

        // ---- 第 4 步：其他函数 ----
        s = s.replaceAll('ln(',   'Math.log(');
        s = s.replaceAll('log₂(', 'Math.log2(');
        s = s.replaceAll('log(',  'Math.log10(');
        s = s.replaceAll('√(',    'Math.sqrt(');
        s = s.replaceAll('abs(',  'Math.abs(');

        // ---- 第 5 步：π 常量 ----
        s = s.replace(/π/g, 'Math.PI');

        // ---- 第 6 步：e 常量（独立字母，排除科学记数法 1e5） ----
        // 先处理 "2e" → "2*e" 的隐式乘法
        s = s.replace(/(\d)(e)(?![+\-*\d])/g, '$1*e');
        // 再替换独立 e
        s = s.replace(/(?<![\d.])e(?![\d])/g, 'Math.E');

        // ---- 第 7 步：隐式乘法 ----
        // 数字后接 ( → 数字*(
        s = s.replace(/(\d)\(/g, '$1*(');
        // ) 后接数字 → )*数字
        s = s.replace(/\)(\d)/g, ')*$1');
        // 数字后接 Math. → 数字*Math.
        s = s.replace(/(\d)(Math\.)/g, '$1*$2');

        // ---- 第 8 步：自动补全括号 ----
        if (autoClose) {
            let open = 0, close = 0;
            for (const ch of s) {
                if (ch === '(') open++;
                if (ch === ')') close++;
            }
            if (close < open) s += ')'.repeat(open - close);
        }

        // ---- 第 9 步：安全校验 ----
        if (!/^[\d+\-*/().%\s\w]+$/.test(s)) return null;

        // ---- 第 10 步：构建求值环境 ----
        try {
            // 收集所需标识符
            const ids = ['PI', 'E', 'abs', 'sqrt', 'cbrt', 'pow',
                'sin', 'cos', 'tan', 'asin', 'acos', 'atan',
                'sinh', 'cosh', 'tanh',
                'log', 'log10', 'log2', 'log1p',
                'exp', 'expm1',
                'floor', 'ceil', 'round', 'trunc',
                'sign', 'min', 'max',
                '_fact', '_dsin', '_dcos', '_dtan', '_dasin', '_dacos', '_datan'];

            const scope = Object.create(null);
            for (const id of ids) {
                if (id.startsWith('_')) continue; // 自定义函数另外注入
                if (id in Math) scope[id] = Math[id];
            }
            scope._fact = factorial;
            if (angleUnit === 'deg') {
                const D = Math.PI / 180;
                scope._dsin  = x => Math.sin(x * D);
                scope._dcos  = x => Math.cos(x * D);
                scope._dtan  = x => Math.tan(x * D);
                scope._dasin = x => Math.asin(x) / D;
                scope._dacos = x => Math.acos(x) / D;
                scope._datan = x => Math.atan(x) / D;
            }

            const fnBody = `"use strict";
                const {${ids.join(',')}} = scope;
                return (${s});`;
            const result = new Function('scope', fnBody)(scope);

            if (!isFinite(result)) return null;

            // 格式化
            if (Math.abs(result) < 1e-14 && result !== 0) return '0';
            const str = parseFloat(result.toPrecision(12)).toString();
            return str.length > 15 ? result.toExponential(6) : str;
        } catch {
            return null;
        }
    }

    /** 无异常的求值包装 */
    function tryEval(expr) {
        return evaluate(expr, true);
    }

    // ============================================================
    // 显示更新
    // ============================================================
    function updateDisplay() {
        exprEl.textContent = expression;

        if (justEvaluated) {
            resultEl.textContent = lastResult;
        } else if (!expression) {
            resultEl.textContent = '0';
        } else {
            const live = tryEval(expression);
            resultEl.textContent = live !== null ? live : '…';
        }

        // 滚动到末尾
        exprEl.scrollLeft = exprEl.scrollWidth;
        resultEl.scrollLeft = resultEl.scrollWidth;
    }

    // ============================================================
    // 输入处理
    // ============================================================

    /** 向表达式追加文本 */
    function appendText(text) {
        if (justEvaluated) {
            // 刚计算完：数字/函数→新表达式；运算符→从结果继续
            if (/^[\d.(]/.test(text) || /^[a-z]$/i.test(text)) {
                expression = text;
            } else if (/^[+\-×÷^]/.test(text)) {
                expression = (lastResult || '0') + text;
            } else {
                expression = text;
            }
            justEvaluated = false;
            lastResult = '';
        } else {
            expression += text;
        }
        updateDisplay();
    }

    /** 科学函数键 */
    function sciFunc(name) {
        switch (name) {
            case 'sin': case 'cos': case 'tan':
            case 'ln': case 'log': case 'log₂':
            case 'sinh': case 'cosh': case 'tanh':
            case '√':
                appendText(name + '(');
                break;
            case 'π':
                appendText('π');
                break;
            case 'e':
                appendText('e');
                break;
            case 'x²':
                appendText('²');
                break;
            case 'xʸ':
                appendText('^(');
                break;
            case 'n!':
                appendText('!');
                break;
            case '|x|':
                appendText('abs(');
                break;
            case '1/x':
                appendText('1/(');
                break;
        }
    }

    /** 等号求值 */
    function calc() {
        if (!expression) return;
        const orig = expression;
        const result = tryEval(expression);
        if (result !== null) {
            expression = orig + ' = ';
            lastResult = result;
        } else {
            expression = orig + ' = ';
            lastResult = '数学错误';
        }
        justEvaluated = true;
        updateDisplay();
    }

    /** 清空 */
    function clearAll() {
        expression = '';
        justEvaluated = false;
        lastResult = '';
        updateDisplay();
    }

    /** 智能退格：多字符函数名整体删除 */
    function backspace() {
        if (justEvaluated) { clearAll(); return; }
        if (!expression) return;

        const multi = [
            'sinh(', 'cosh(', 'tanh(', 'log₂(',
            'asin(', 'acos(', 'atan(',
            'sin(', 'cos(', 'tan(',
            'abs(', '1/(', '^(', 'ln(',
            'log(', '√(',
        ];
        for (const suffix of multi) {
            if (expression.endsWith(suffix)) {
                expression = expression.slice(0, -suffix.length);
                updateDisplay();
                return;
            }
        }
        expression = expression.slice(0, -1);
        updateDisplay();
    }

    /** 设置模式 */
    function setMode(m) {
        mode = m;
        modeBtns.forEach(b => b.classList.toggle('active', b.dataset.cmode === m));
        if (m === 'scientific') {
            keypadWrap.classList.add('sci-mode');
        } else {
            keypadWrap.classList.remove('sci-mode');
        }
    }

    /** DEG/RAD 切换 */
    function toggleAngle() {
        angleUnit = angleUnit === 'deg' ? 'rad' : 'deg';
        angleBtn.textContent = angleUnit === 'deg' ? 'DEG' : 'RAD';
        angleBtn.classList.toggle('rad', angleUnit === 'rad');
        // 重新计算实时预览
        if (!justEvaluated && expression) updateDisplay();
    }

    // ============================================================
    // 事件绑定
    // ============================================================
    wrapper.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.dataset.action;
        const v = btn.dataset.v;

        switch (action) {
            case 'digit':
                appendText(v);
                break;
            case 'decimal':
                appendText('.');
                break;
            case 'op':
                appendText(v);
                break;
            case 'calc':
                calc();
                break;
            case 'clear':
                clearAll();
                break;
            case 'backspace':
                backspace();
                break;
            case 'percent':
                if (justEvaluated) {
                    const val = parseFloat(lastResult);
                    if (!isNaN(val)) {
                        expression = (val / 100).toString();
                        lastResult = '';
                    }
                    justEvaluated = false;
                } else {
                    appendText('%');
                }
                break;
            case 'sci':
                sciFunc(v);
                break;
            case 'paren':
                appendText(v);
                break;
            case 'angle':
                toggleAngle();
                break;
        }
    });

    // 模式切换
    modeBtns.forEach(b => {
        b.addEventListener('click', () => setMode(b.dataset.cmode));
    });

    // ============================================================
    // 键盘支持
    // ============================================================
    function handleKeydown(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const key = e.key;

        if (/^[0-9]$/.test(key)) {
            appendText(key);
        } else if (key === '.') {
            appendText('.');
        } else if (key === '+') {
            appendText('+');
        } else if (key === '-') {
            appendText('−');
        } else if (key === '*') {
            appendText('×');
        } else if (key === '/') {
            e.preventDefault();
            appendText('÷');
        } else if (key === '%') {
            if (justEvaluated) {
                const val = parseFloat(lastResult);
                if (!isNaN(val)) {
                    expression = (val / 100).toString();
                    lastResult = '';
                }
                justEvaluated = false;
            } else {
                appendText('%');
            }
        } else if (key === '(' || key === ')') {
            appendText(key);
        } else if (key === '^') {
            appendText('^(');
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            calc();
        } else if (key === 'Backspace') {
            e.preventDefault();
            backspace();
        } else if (key === 'Escape') {
            clearAll();
        }
    }
    document.addEventListener('keydown', handleKeydown);

    // ============================================================
    // 初始状态
    // ============================================================
    setMode('basic');
    updateDisplay();

    return {
        cleanup() {
            document.removeEventListener('keydown', handleKeydown);
        },
    };
}
