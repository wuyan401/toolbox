/* ============================================
   颜色格式转换 - HEX/RGB/HSL/HSV 互转，调色板快速选择
   ============================================ */

export const id = 'color-converter';
export const name = '颜色格式转换';
export const icon = '🎨';
export const description = 'HEX/RGB/HSL/HSV 互转，实时预览，Material Design 调色板';
export const category = '开发工具';
export const enabled = true;

export function init(container) {
    // Material Design 50 色
    const PALETTE = [
        '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
        '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
        '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000',
        '#FFFFFF', '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9',
        '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB',
        '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFF9C4', '#FFECB3',
        '#FFE0B2', '#FFCCBC', '#D7CCC8', '#F5F5F5', '#CFD8DC',
        '#FF8A80', '#FF80AB', '#EA80FC', '#B388FF', '#8C9EFF',
        '#82B1FF', '#80D8FF', '#84FFFF', '#A7FFEB', '#B9F6CA'
    ];

    // 当前颜色
    let currentColor = { r: 0, g: 113, b: 227 }; // 默认蓝色

    container.innerHTML = `
        <div class="cc-layout">
            <!-- 左侧：色块预览 + 选择器 -->
            <div class="cc-preview-section">
                <div class="cc-preview-swatch" id="cc-swatch"></div>
                <div class="cc-color-input-wrap">
                    <input type="color" class="cc-color-input" id="cc-color-picker" value="#0071E3" />
                </div>
            </div>

            <!-- 中间：格式转换 -->
            <div class="cc-formats-section">
                <span class="tool-col-title" style="margin-bottom:var(--spacing-md);display:block;">格式转换</span>

                <div class="cc-format-row">
                    <span class="cc-format-label">HEX</span>
                    <input class="input cc-format-input" id="cc-hex" placeholder="#000000" />
                    <button class="btn btn-sm cc-copy-btn" data-target="cc-hex">📋</button>
                </div>
                <div class="cc-format-row">
                    <span class="cc-format-label">RGB</span>
                    <input class="input cc-format-input" id="cc-rgb" placeholder="rgb(0, 0, 0)" />
                    <button class="btn btn-sm cc-copy-btn" data-target="cc-rgb">📋</button>
                </div>
                <div class="cc-format-row">
                    <span class="cc-format-label">HSL</span>
                    <input class="input cc-format-input" id="cc-hsl" placeholder="hsl(0, 0%, 0%)" />
                    <button class="btn btn-sm cc-copy-btn" data-target="cc-hsl">📋</button>
                </div>
                <div class="cc-format-row">
                    <span class="cc-format-label">HSV</span>
                    <input class="input cc-format-input" id="cc-hsv" placeholder="hsv(0, 0, 0)" />
                    <button class="btn btn-sm cc-copy-btn" data-target="cc-hsv">📋</button>
                </div>
            </div>

            <!-- 右侧：调色板 -->
            <div class="cc-palette-section">
                <span class="tool-col-title" style="margin-bottom:var(--spacing-sm);display:block;">Material Design 调色板</span>
                <div class="cc-palette" id="cc-palette">
                    ${PALETTE.map(c => `
                        <div class="cc-palette-swatch" data-color="${c}" style="background:${c};" title="${c}"></div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .cc-layout {
            display: flex;
            gap: var(--spacing-xxl);
            min-height: 0;
            align-items: flex-start;
        }
        .cc-preview-section {
            flex: 0 0 180px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-lg);
        }
        .cc-preview-swatch {
            width: 160px;
            height: 160px;
            border-radius: var(--radius-xl);
            border: 2px solid var(--color-border);
            box-shadow: var(--shadow-md);
            transition: background 0.2s ease;
        }
        .cc-color-input-wrap {
            display: flex;
            justify-content: center;
        }
        .cc-color-input {
            width: 60px;
            height: 40px;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-md);
            cursor: pointer;
            padding: 2px;
        }
        .cc-formats-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
            min-width: 0;
        }
        .cc-format-row {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
        }
        .cc-format-label {
            flex: 0 0 36px;
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
            font-family: var(--font-family-mono);
        }
        .cc-format-input {
            flex: 1;
            font-family: var(--font-family-mono);
            font-size: var(--font-size-md);
        }
        .cc-copy-btn {
            flex-shrink: 0;
        }
        .cc-palette-section {
            flex: 0 0 320px;
        }
        .cc-palette {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            max-height: 400px;
            overflow-y: auto;
        }
        .cc-palette-swatch {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 1px solid var(--color-border-light);
            cursor: pointer;
            transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .cc-palette-swatch:hover {
            transform: scale(1.3);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 2;
            position: relative;
        }
        @media (max-width: 900px) {
            .cc-layout {
                flex-direction: column;
                align-items: center;
            }
            .cc-preview-section {
                flex: none;
            }
            .cc-formats-section {
                width: 100%;
            }
            .cc-palette-section {
                flex: none;
                width: 100%;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const swatch = container.querySelector('#cc-swatch');
    const colorPicker = container.querySelector('#cc-color-picker');
    const hexInput = container.querySelector('#cc-hex');
    const rgbInput = container.querySelector('#cc-rgb');
    const hslInput = container.querySelector('#cc-hsl');
    const hsvInput = container.querySelector('#cc-hsv');

    /**
     * RGB → HEX
     */
    function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('');
    }

    /**
     * RGB → HSL
     */
    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    /**
     * RGB → HSV
     */
    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = max === 0 ? 0 : (max - min) / max, v = max;
        if (max !== min) {
            const d = max - min;
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            v: Math.round(v * 100)
        };
    }

    /**
     * HEX → RGB
     */
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    /**
     * RGB 字符串解析
     */
    function parseRgb(str) {
        const m = str.match(/rgb\w*\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*\)?/i);
        if (!m) return null;
        return { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]) };
    }

    /**
     * HSL 字符串解析
     */
    function parseHsl(str) {
        const m = str.match(/hsl\w*\(\s*(\d+)\s*[, ]\s*(\d+)%\s*[, ]\s*(\d+)%\s*\)?/i);
        if (!m) return null;
        return hslToRgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
    }

    /**
     * HSV 字符串解析
     */
    function parseHsv(str) {
        const m = str.match(/hsv\w*\(\s*(\d+)\s*[, ]\s*(\d+)%\s*[, ]\s*(\d+)%\s*\)?/i);
        if (!m) return null;
        return hsvToRgb(parseInt(m[1]), parseInt(m[2]), parseInt(m[3]));
    }

    /**
     * HSL → RGB
     */
    function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    /**
     * HSV → RGB
     */
    function hsvToRgb(h, s, v) {
        h /= 360; s /= 100; v /= 100;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        let r, g, b;
        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }

    /**
     * 设置当前颜色并刷新所有显示
     */
    function setColor(r, g, b) {
        // 校验范围
        r = Math.max(0, Math.min(255, Math.round(r)));
        g = Math.max(0, Math.min(255, Math.round(g)));
        b = Math.max(0, Math.min(255, Math.round(b)));

        currentColor = { r, g, b };

        const hex = rgbToHex(r, g, b);
        const hsl = rgbToHsl(r, g, b);
        const hsv = rgbToHsv(r, g, b);

        // 更新显示
        swatch.style.background = hex;
        colorPicker.value = hex;
        hexInput.value = hex;
        rgbInput.value = `rgb(${r}, ${g}, ${b})`;
        hslInput.value = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        hsvInput.value = `hsv(${hsv.h}%, ${hsv.s}%, ${hsv.v}%)`;
    }

    /**
     * 解析任意输入并设置颜色
     */
    function parseAndSet(value) {
        value = value.trim();
        if (!value) return;

        // HEX
        if (/^#?[0-9A-Fa-f]{3,8}$/.test(value)) {
            const rgb = hexToRgb(value);
            if (!isNaN(rgb.r)) {
                setColor(rgb.r, rgb.g, rgb.b);
                return;
            }
        }

        // HSV (先尝试，因为 hsv 也可能匹配 rgb 之类的模式)
        const hsv = parseHsv(value);
        if (hsv) { setColor(hsv.r, hsv.g, hsv.b); return; }

        // HSL
        const hsl = parseHsl(value);
        if (hsl) { setColor(hsl.r, hsl.g, hsl.b); return; }

        // RGB
        const rgb = parseRgb(value);
        if (rgb) { setColor(rgb.r, rgb.g, rgb.b); return; }
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

    // 颜色选择器变化
    colorPicker.addEventListener('input', () => {
        const rgb = hexToRgb(colorPicker.value);
        setColor(rgb.r, rgb.g, rgb.b);
    });

    // 手动输入 HEX
    hexInput.addEventListener('input', () => {
        const val = hexInput.value.trim();
        if (/^#?[0-9A-Fa-f]{6}$/.test(val)) {
            parseAndSet(val);
        }
    });

    // 手动输入 RGB/HSL/HSV
    [rgbInput, hslInput, hsvInput].forEach(input => {
        input.addEventListener('input', () => {
            parseAndSet(input.value);
        });
    });

    // 复制按钮
    container.querySelectorAll('.cc-copy-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetId = btn.dataset.target;
            const input = container.querySelector('#' + targetId);
            if (!input) return;
            const text = input.value;
            if (!text) return;
            const ok = await copyText(text);
            const orig = btn.textContent;
            btn.textContent = ok ? '✅' : '❌';
            _timers.push(setTimeout(() => { btn.textContent = orig; }, 1000));
        });
    });

    // 格式行点击复制
    container.querySelectorAll('.cc-format-input').forEach(input => {
        input.addEventListener('click', async () => {
            const text = input.value;
            if (!text) return;
            const ok = await copyText(text);
            if (ok) {
                const orig = input.style.borderColor;
                input.style.borderColor = 'var(--color-success)';
                _timers.push(setTimeout(() => { input.style.borderColor = orig; }, 800));
            }
        });
    });

    // 调色板点击
    container.querySelector('#cc-palette').addEventListener('click', (e) => {
        const swatch = e.target.closest('.cc-palette-swatch');
        if (!swatch) return;
        const hex = swatch.dataset.color;
        const rgb = hexToRgb(hex);
        setColor(rgb.r, rgb.g, rgb.b);
    });

    // 初始化颜色
    setColor(0, 113, 227);

    const _timers = [];

    return {
        cleanup() {
            _timers.forEach(t => clearTimeout(t));
        }
    };
}
