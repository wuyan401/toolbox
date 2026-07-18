/* ============================================
   主题管理模块 - v3 适配顶部导航
   管理主题切换、强调色和字体大小
   ============================================ */

/**
 * 根据当前主题更新强调色相关 CSS 变量
 * @param {string} accentColor - 强调色十六进制值
 */
function applyAccentColor(accentColor) {
    const root = document.documentElement;
    root.style.setProperty('--color-accent', accentColor);

    const hoverColor = darkenColor(accentColor, 0.1);
    root.style.setProperty('--color-accent-hover', hoverColor);

    const lightColor = hexToRgba(accentColor, 0.1);
    root.style.setProperty('--color-accent-light', lightColor);
}

function darkenColor(hex, factor) {
    const rgb = hexToRgb(hex);
    const r = Math.round(rgb.r * (1 - factor));
    const g = Math.round(rgb.g * (1 - factor));
    const b = Math.round(rgb.b * (1 - factor));
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    };
}

function hexToRgba(hex, alpha) {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * 初始化主题系统
 * @returns {{ getTheme: Function, getAccent: Function, getFontSize: Function }}
 */
export function initTheme() {
    const STORAGE_KEY_THEME = 'toolbox-theme';
    const STORAGE_KEY_ACCENT = 'toolbox-accent';
    const STORAGE_KEY_FONT_SIZE = 'toolbox-font-size';

    function safeGet(k, def) { try { return localStorage.getItem(k) || def; } catch(e) { return def; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); } catch(e) {} }

    let currentTheme = safeGet(STORAGE_KEY_THEME, 'light');
    let currentAccent = safeGet(STORAGE_KEY_ACCENT, '#0071E3');
    let currentFontSize = safeGet(STORAGE_KEY_FONT_SIZE, 'medium');

    const themeStyle = document.getElementById('theme-style');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeText = themeToggle.querySelector('.theme-text');

    function setTheme(theme, save = true) {
        currentTheme = theme;
        themeStyle.href = `css/themes/${theme}.css`;

        // v4: 设置 data-theme 属性供 CSS 暗色覆盖使用
        document.documentElement.setAttribute('data-theme', theme);

        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            if (themeText) themeText.textContent = '亮色模式';
        } else {
            themeIcon.textContent = '🌙';
            if (themeText) themeText.textContent = '暗色模式';
        }

        if (save) {
            safeSet(STORAGE_KEY_THEME, theme);
        }

        applyAccentColor(currentAccent);
    }

    function toggleTheme() {
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
    }

    function setAccent(color, save = true) {
        currentAccent = color;
        applyAccentColor(color);

        if (save) {
            safeSet(STORAGE_KEY_ACCENT, color);
        }

        document.querySelectorAll('.accent-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.accent === color);
        });
    }

    function setFontSize(size, save = true) {
        currentFontSize = size;
        const root = document.documentElement;

        root.classList.remove('font-size-small', 'font-size-large');
        if (size === 'small') {
            root.classList.add('font-size-small');
        } else if (size === 'large') {
            root.classList.add('font-size-large');
        }

        if (save) {
            safeSet(STORAGE_KEY_FONT_SIZE, size);
        }

        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
    }

    // 主题切换
    themeToggle.addEventListener('click', toggleTheme);

    // 强调色按钮
    document.getElementById('accent-options').addEventListener('click', (e) => {
        const btn = e.target.closest('.accent-btn');
        if (btn) {
            setAccent(btn.dataset.accent);
        }
    });

    // 字体大小按钮
    document.getElementById('font-size-options').addEventListener('click', (e) => {
        const btn = e.target.closest('.size-btn');
        if (btn) {
            setFontSize(btn.dataset.size);
        }
    });

    // 设置面板展开/折叠（v3: 下拉菜单）
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsDropdown = document.getElementById('settings-dropdown');

    const settingsOpen = safeGet('toolbox-settings-open', 'false') === 'true';
    if (settingsOpen) {
        settingsDropdown.classList.add('open');
    }

    settingsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('open');
        safeSet('toolbox-settings-open', settingsDropdown.classList.contains('open'));
    });

    // 点击外部关闭设置菜单
    document.addEventListener('click', (e) => {
        if (!settingsDropdown.contains(e.target)) {
            settingsDropdown.classList.remove('open');
            safeSet('toolbox-settings-open', 'false');
        }
    });

    // 初始化设置
    setTheme(currentTheme, false);
    setAccent(currentAccent, false);
    setFontSize(currentFontSize, false);

    return {
        getTheme: () => currentTheme,
        getAccent: () => currentAccent,
        getFontSize: () => currentFontSize
    };
}
