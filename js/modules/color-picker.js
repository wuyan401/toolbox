/* ============================================
   颜色选择器 - 拾色器 + 预设色板 + 多格式显示
   ============================================ */

export const id = 'color-picker';
export const name = '颜色选择器';
export const icon = '🎨';
export const description = '颜色选择和多种格式转换';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    let currentColor = '#4A90D9';

    // Material Design 20 色预设色板
    const presetColors = [
        '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
        '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
        '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000'
    ];

    // 渲染 UI
    container.innerHTML = `
        <div class="cp-layout">
            <div class="cp-left">
                <!-- 原生颜色选择器 -->
                <div class="cp-section">
                    <span class="tool-col-title">拾色器</span>
                    <input type="color" id="cp-picker" class="cp-picker-input" value="${currentColor}">
                </div>

                <!-- 预设色板 -->
                <div class="cp-section">
                    <span class="tool-col-title">预设色板</span>
                    <div class="cp-presets" id="cp-presets">
                        ${presetColors.map(c => `
                            <button class="cp-swatch" data-color="${c}" style="background:${c}" title="${c}"></button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="cp-right">
                <!-- 颜色格式 -->
                <div class="cp-section">
                    <span class="tool-col-title">颜色值（点击复制）</span>
                    <div class="cp-formats" id="cp-formats">
                        <div class="cp-format-item" data-format="hex" data-value="${currentColor}">
                            <span class="cp-format-label">HEX</span>
                            <span class="cp-format-value">${currentColor}</span>
                        </div>
                        <div class="cp-format-item" data-format="rgb" data-value="${hexToRgbStr(currentColor)}">
                            <span class="cp-format-label">RGB</span>
                            <span class="cp-format-value">${hexToRgbStr(currentColor)}</span>
                        </div>
                        <div class="cp-format-item" data-format="hsl" data-value="${hexToHslStr(currentColor)}">
                            <span class="cp-format-label">HSL</span>
                            <span class="cp-format-value">${hexToHslStr(currentColor)}</span>
                        </div>
                    </div>
                </div>

                <!-- 大色块预览 -->
                <div class="cp-section">
                    <span class="tool-col-title">预览</span>
                    <div class="cp-preview" id="cp-preview" style="background:${currentColor};">
                        <span class="cp-preview-text">${currentColor}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 复制反馈 -->
        <div class="cp-toast" id="cp-toast" style="display:none;">✅ 已复制</div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .cp-layout {
            display: flex;
            gap: var(--spacing-xxl);
            flex-wrap: wrap;
        }
        .cp-left {
            flex: 0 0 280px;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xl);
        }
        .cp-right {
            flex: 1;
            min-width: 260px;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xl);
        }
        .cp-section {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .cp-picker-input {
            width: 100%;
            height: 48px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            cursor: pointer;
            background: var(--color-bg-card);
            padding: 4px;
        }
        .cp-picker-input::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        .cp-picker-input::-webkit-color-swatch {
            border: none;
            border-radius: var(--radius-sm);
        }
        .cp-presets {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            gap: var(--spacing-xs);
        }
        .cp-swatch {
            width: 100%;
            aspect-ratio: 1;
            border: 2px solid transparent;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all var(--transition-fast);
            position: relative;
        }
        .cp-swatch:hover {
            transform: scale(1.2);
            z-index: 2;
            box-shadow: var(--shadow-md);
        }
        .cp-swatch.active {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 2px var(--color-accent-light);
        }
        .cp-formats {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .cp-format-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            padding: var(--spacing-md) var(--spacing-lg);
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all var(--transition-fast);
            user-select: none;
        }
        .cp-format-item:hover {
            border-color: var(--color-accent);
            background: var(--color-bg-hover);
        }
        .cp-format-label {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
            min-width: 36px;
            text-transform: uppercase;
        }
        .cp-format-value {
            font-family: "Cascadia Code", "Fira Code", monospace;
            font-size: var(--font-size-lg);
            color: var(--color-text-primary);
        }
        .cp-preview {
            height: 200px;
            border-radius: var(--radius-lg);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background var(--transition-fast);
            box-shadow: var(--shadow-md);
        }
        .cp-preview-text {
            font-family: "Cascadia Code", "Fira Code", monospace;
            font-size: 24px;
            font-weight: 700;
            color: #fff;
            text-shadow: 0 1px 4px rgba(0,0,0,0.4);
            padding: var(--spacing-sm) var(--spacing-lg);
            background: rgba(0,0,0,0.2);
            border-radius: var(--radius-sm);
        }
        .cp-toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--color-bg-sidebar);
            color: #fff;
            padding: var(--spacing-sm) var(--spacing-xl);
            border-radius: var(--radius-md);
            font-size: var(--font-size-md);
            z-index: 1000;
            box-shadow: var(--shadow-lg);
            transition: opacity var(--transition-fast);
            pointer-events: none;
        }

        @media (max-width: 768px) {
            .cp-layout {
                flex-direction: column;
            }
            .cp-left {
                flex: none;
            }
            .cp-presets {
                grid-template-columns: repeat(10, 1fr);
            }
            .cp-preview {
                height: 150px;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const pickerEl = container.querySelector('#cp-picker');
    const presetsEl = container.querySelector('#cp-presets');
    const formatsEl = container.querySelector('#cp-formats');
    const previewEl = container.querySelector('#cp-preview');
    const toastEl = container.querySelector('#cp-toast');
    let toastTimer = null;

    /**
     * 十六进制转 RGB 字符串
     * @param {string} hex
     * @returns {string} "rgb(r, g, b)"
     */
    function hexToRgbStr(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '';
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * 十六进制转 HSL 字符串
     * @param {string} hex
     * @returns {string} "hsl(h, s%, l%)"
     */
    function hexToHslStr(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return '';

        let r = parseInt(result[1], 16) / 255;
        let g = parseInt(result[2], 16) / 255;
        let b = parseInt(result[3], 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;

        let h = 0;
        let s = 0;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        h = Math.round(h * 360);
        s = Math.round(s * 100);
        const lp = Math.round(l * 100);

        return `hsl(${h}, ${s}%, ${lp}%)`;
    }

    /**
     * 显示复制反馈
     */
    function showToast() {
        if (toastTimer) clearTimeout(toastTimer);
        toastEl.style.display = 'block';
        toastEl.style.opacity = '1';
        toastTimer = setTimeout(() => {
            toastEl.style.opacity = '0';
            setTimeout(() => {
                toastEl.style.display = 'none';
            }, 300);
        }, 1500);
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast();
        } catch {
            // 降级方案
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast();
        }
    }

    /**
     * 更新所有颜色显示
     * @param {string} hexColor
     */
    function updateColor(hexColor) {
        currentColor = hexColor;

        // 更新颜色选择器
        pickerEl.value = hexColor;

        // 更新预览
        previewEl.style.background = hexColor;
        const previewText = previewEl.querySelector('.cp-preview-text');
        previewText.textContent = hexColor;

        // 更新格式值
        const rgb = hexToRgbStr(hexColor);
        const hsl = hexToHslStr(hexColor);

        const formatItems = formatsEl.querySelectorAll('.cp-format-item');
        formatItems[0].dataset.value = hexColor;
        formatItems[0].querySelector('.cp-format-value').textContent = hexColor;
        formatItems[1].dataset.value = rgb;
        formatItems[1].querySelector('.cp-format-value').textContent = rgb;
        formatItems[2].dataset.value = hsl;
        formatItems[2].querySelector('.cp-format-value').textContent = hsl;

        // 更新预设色板选中状态
        presetsEl.querySelectorAll('.cp-swatch').forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.color.toUpperCase() === hexColor.toUpperCase());
        });
    }

    // 颜色选择器事件
    pickerEl.addEventListener('input', () => {
        updateColor(pickerEl.value);
    });

    // 预设色板点击
    presetsEl.addEventListener('click', (e) => {
        const swatch = e.target.closest('.cp-swatch');
        if (!swatch) return;
        updateColor(swatch.dataset.color);
    });

    // 格式项点击复制
    formatsEl.addEventListener('click', (e) => {
        const item = e.target.closest('.cp-format-item');
        if (!item) return;
        copyToClipboard(item.dataset.value);
    });

    return {
        cleanup() {
            if (toastTimer) clearTimeout(toastTimer);
        }
    };
}
