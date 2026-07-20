/* ============================================
   应用入口 - v3 网格布局
   加载工具配置、构建卡片网格、初始化路由和主题
   ============================================ */

import { initRouter } from './router.js';
import { initTheme } from './theme.js';

/**
 * 全局搜索覆盖层 (Ctrl+K)
 * @param {Array} tools - 已加载的工具列表
 * @param {Object} router - 路由实例
 */
function initSearch(tools, router) {
    let overlay = null;
    let input = null;
    let resultsEl = null;
    let selectedIdx = -1;
    let filtered = [];

    function open() {
        if (overlay) return;
        overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-modal">
                <div class="search-input-wrap">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" placeholder="搜索工具..." autofocus>
                    <span class="search-hint">Esc</span>
                </div>
                <div class="search-results"></div>
            </div>`;
        document.body.appendChild(overlay);
        input = overlay.querySelector('input');
        resultsEl = overlay.querySelector('.search-results');
        selectedIdx = -1;
        filtered = tools;
        renderResults();
        input.addEventListener('input', onInput);
        input.addEventListener('keydown', onKey);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        setTimeout(() => input.focus(), 50);
    }

    function close() {
        if (!overlay) return;
        overlay.remove();
        overlay = null;
        input = null;
        resultsEl = null;
        selectedIdx = -1;
    }

    function onInput() {
        const q = input.value.toLowerCase();
        filtered = tools.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q)
        );
        selectedIdx = filtered.length > 0 ? 0 : -1;
        renderResults();
    }

    function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, filtered.length - 1); renderResults(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); renderResults(); }
        else if (e.key === 'Enter' && selectedIdx >= 0 && filtered[selectedIdx]) {
            e.preventDefault();
            const tool = filtered[selectedIdx];
            close();
            router.navigate(tool.id);
        }
    }

    function renderResults() {
        if (filtered.length === 0) {
            resultsEl.innerHTML = `
                <div class="search-empty">
                    <div>没有匹配的工具</div>
                    <div class="shortcuts-help">
                        <div><kbd>Ctrl+K</kbd> 打开搜索</div>
                        <div><kbd>↑↓</kbd> 选择工具</div>
                        <div><kbd>Enter</kbd> 打开</div>
                        <div><kbd>Esc</kbd> 关闭</div>
                    </div>
                </div>`;
            return;
        }
        resultsEl.innerHTML = filtered.map((t, i) => `
            <div class="search-result-item${i === selectedIdx ? ' active' : ''}" data-idx="${i}">
                <span class="sr-icon">${t.icon}</span>
                <div class="sr-info">
                    <div class="sr-name">${t.name}</div>
                    <div class="sr-desc">${t.description}</div>
                </div>
            </div>`).join('');
        resultsEl.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('click', () => {
                const t = filtered[parseInt(el.dataset.idx)];
                if (t) { close(); router.navigate(t.id); }
            });
        });
    }

    // 全局 Ctrl+K 快捷键
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            overlay ? close() : open();
        }
    });

    // 导航栏搜索 chip 点击
    const searchChip = document.getElementById('search-chip');
    if (searchChip) {
        searchChip.addEventListener('click', () => open());
    }
}

/**
 * 加载工具配置并初始化应用
 */
async function loadTools() {
    const toolBody = document.getElementById('tool-body');

    try {
        // 1. 加载工具配置
        const resp = await fetch(`./tools.json?_=${Date.now()}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        const config = await resp.json();

        // 2. 动态导入每个启用的工具模块
        const tools = [];
        const importPromises = config.tools.map(async (toolConfig) => {
            if (!toolConfig.enabled) return null;
            try {
                const module = await import(`./modules/${toolConfig.id}.js?v=${Date.now()}`);
                const tool = Object.assign({}, toolConfig, {
                    id: module.id,
                    name: module.name,
                    icon: module.icon,
                    description: module.description,
                    category: module.category,
                    enabled: module.enabled,
                    init: module.init
                });
                return tool;
            } catch (err) {
                console.error(`加载工具 "${toolConfig.name}" 失败:`, err);
                return null;
            }
        });

        const results = await Promise.all(importPromises);
        for (const tool of results) {
            if (tool) tools.push(tool);
        }

        // 3. 初始化路由（会渲染 welcome 页面 + 工具网格）
        const router = initRouter(tools);

        // 4. 初始化主题
        initTheme();

        // 5. 全局搜索 (Ctrl+K)
        initSearch(tools, router);

        // 6. 工具卡片点击事件（事件代理）
        toolBody.addEventListener('click', (e) => {
            const card = e.target.closest('.tool-card');
            if (!card) return;
            const toolId = card.dataset.toolId;
            if (toolId) {
                router.navigate(toolId);
            }
        });

        // 7. 返回按钮
        const backBtn = document.getElementById('back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.location.hash = '';
            });
        }

        // 8. ESC 返回欢迎页
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && router.getCurrentId()) {
                e.preventDefault();
                window.location.hash = '';
            }
        });

    } catch (err) {
        console.error('应用初始化失败:', err);
        toolBody.innerHTML = `
            <div class="welcome-screen" style="align-items:center;justify-content:center;height:100%;">
                <h3 style="color:var(--color-danger);font-family:var(--font-display);">❌ 加载失败</h3>
                <p style="color:var(--color-text-secondary);">${err.message}</p>
            </div>`;
    }
}

// 启动应用
loadTools();
