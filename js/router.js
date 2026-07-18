/* ============================================
   路由模块 - 基于 hash 的简单路由
   v4: 彩色卡片 + 分类标签筛选 + 页脚
   ============================================ */

/**
 * 初始化路由系统
 * @param {import('./app.js').ToolModule[]} tools - 工具模块列表
 * @returns {{ navigate: Function, getCurrentId: Function }}
 */
export function initRouter(tools) {
    let currentToolId = null;
    let currentCleanup = null;
    let activeCategory = null;           // v4: 当前筛选分类
    let cardColorCounter = 0;            // v4: 卡片颜色循环计数器

    const toolHeader = document.getElementById('tool-header');
    const toolTitle = document.getElementById('tool-title');
    const toolDesc = document.getElementById('tool-desc');
    const toolBody = document.getElementById('tool-body');

    /* ========================================
       v4: 分类定义 — 图标 + 颜色点
       ======================================== */
    const CATEGORIES = [
        { id: '日常工具', label: '日常工具', dotClass: 'dot-blue' },
        { id: '开发工具', label: '开发工具', dotClass: 'dot-indigo' },
        { id: '格式化',   label: '格式化',   dotClass: 'dot-green' },
        { id: '编码转换', label: '编码转换', dotClass: 'dot-purple' },
        { id: '办公工具', label: '办公工具', dotClass: 'dot-teal' },
        { id: '生成工具', label: '生成工具', dotClass: 'dot-cyan' },
        { id: 'AI 工具',  label: 'AI 工具',  dotClass: 'dot-orange' },
        { id: '构建工具', label: '构建工具', dotClass: 'dot-red' }
    ];

    /**
     * v4: 渲染分类筛选标签栏
     * @returns {string} HTML
     */
    function renderCategoryFilters() {
        const pills = CATEGORIES.map(cat => `
            <button class="category-pill${activeCategory === cat.id ? ' active' : ''}"
                    data-category="${cat.id}">
                <span class="category-dot ${cat.dotClass}"></span>
                ${cat.label}
            </button>`).join('');

        return `<div class="category-filters" id="category-filters">
            <button class="category-pill${activeCategory === null ? ' active' : ''}"
                    data-category="">
                <span class="category-dot" style="background:#999"></span>
                全部
            </button>
            ${pills}
        </div>`;
    }

    /**
     * v4: 渲染工具卡片网格
     * 每个卡片带 data-color-index (0~11) 实现 12 色循环
     * @param {string|null} filter - 搜索过滤词，null 显示全部
     * @param {string|null} category - 分类过滤，null 显示全部
     */
    function renderToolGrid(filter, category) {
        const grid = document.getElementById('tool-grid');
        if (!grid) return;

        // 重置颜色计数器，确保每次渲染颜色一致
        const q = (filter || '').toLowerCase();
        let colorIdx = 0;

        grid.innerHTML = tools
            .filter(t => {
                // 分类筛选
                if (category && t.category !== category) return false;
                // 搜索筛选
                if (q && !t.name.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
                return true;
            })
            .map(t => {
                const idx = colorIdx % 12;
                colorIdx++;
                return `
                <div class="tool-card"
                     data-tool-id="${t.id}"
                     data-color-index="${idx}">
                    <span class="tool-card-icon">${t.icon}</span>
                    <span class="tool-card-name">${t.name}</span>
                    <span class="tool-card-desc">${t.description}</span>
                </div>`;
            })
            .join('');

        // 更新分类标签激活状态
        updateCategoryPills();
    }

    /**
     * v4: 更新分类标签的激活状态（不重新渲染整个列表）
     */
    function updateCategoryPills() {
        const filters = document.getElementById('category-filters');
        if (!filters) return;
        filters.querySelectorAll('.category-pill').forEach(pill => {
            const cat = pill.dataset.category;
            if (cat === '') {
                pill.classList.toggle('active', activeCategory === null);
            } else {
                pill.classList.toggle('active', activeCategory === cat);
            }
        });
    }

    /**
     * v4: 渲染页脚
     * @returns {string} HTML
     */
    function renderFooter() {
        return `
            <footer class="toolbox-footer">
                开发工具箱 · ${tools.length} 个工具 · 随时可用
            </footer>`;
    }

    /**
     * 渲染欢迎页
     */
    function renderWelcome() {
        toolBody.innerHTML = `
            <div class="welcome-screen">
                <div class="welcome-search-wrap">
                    <svg class="welcome-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input class="welcome-search-input" type="text" placeholder="搜索工具..." id="welcome-search-input" autofocus>
                </div>
                ${renderCategoryFilters()}
                <div class="tool-grid" id="tool-grid">
                    <!-- 由 renderToolGrid 填充 -->
                </div>
                ${renderFooter()}
            </div>`;

        // 渲染卡片
        setTimeout(() => renderToolGrid(null, activeCategory), 0);

        // 绑定分类标签点击事件
        const catFilters = document.getElementById('category-filters');
        if (catFilters) {
            catFilters.addEventListener('click', (e) => {
                const pill = e.target.closest('.category-pill');
                if (!pill) return;
                const cat = pill.dataset.category;
                activeCategory = cat || null;
                // 重新渲染卡片（保留当前搜索词）
                const searchInput = document.getElementById('welcome-search-input');
                const q = searchInput ? searchInput.value : '';
                renderToolGrid(q || null, activeCategory);
            });
        }

        // 绑定搜索输入事件
        const searchInput = document.getElementById('welcome-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value;
                renderToolGrid(q || null, activeCategory);
            });
        }
    }

    /**
     * 导航到指定工具
     * @param {string} toolId - 工具 ID
     */
    async function navigate(toolId) {
        if (currentToolId === toolId && currentCleanup) {
            return;
        }

        const tool = tools.find(t => t.id === toolId);
        if (!tool || !tool.enabled) {
            navigateToWelcome();
            return;
        }

        // 清理旧工具
        if (currentCleanup) {
            try { currentCleanup(); } catch (err) { console.error('工具清理失败:', err); }
            currentCleanup = null;
        }

        // 更新 hash
        window.location.hash = toolId;

        // 显示标题栏
        toolHeader.style.display = 'flex';
        toolTitle.textContent = `${tool.icon} ${tool.name}`;
        toolDesc.textContent = tool.description;

        // 创建工具容器
        toolBody.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'tool-container';
        toolBody.appendChild(container);

        // 隐藏快捷键提示
        const shortcutHint = document.getElementById('shortcut-hint');
        if (shortcutHint) shortcutHint.style.display = 'none';

        // 初始化工具
        try {
            const result = await tool.init(container);
            if (result && typeof result.cleanup === 'function') {
                currentCleanup = result.cleanup;
            }
            currentToolId = toolId;
        } catch (err) {
            console.error('工具初始化失败:', err);
            toolBody.innerHTML = `
                <div class="welcome-screen" style="align-items:center;justify-content:center;height:100%;">
                    <h3 style="color:var(--color-danger);font-family:var(--font-display);">工具加载失败</h3>
                    <p style="color:var(--color-text-secondary);">${err.message}</p>
                </div>`;
            currentToolId = null;
            currentCleanup = null;
        }
    }

    /**
     * 回到欢迎页
     */
    function navigateToWelcome() {
        if (currentCleanup) {
            try { currentCleanup(); } catch (err) {}
            currentCleanup = null;
        }
        currentToolId = null;
        window.location.hash = '';

        // 隐藏标题栏
        toolHeader.style.display = 'none';

        // 显示快捷键提示
        const shortcutHint = document.getElementById('shortcut-hint');
        if (shortcutHint) shortcutHint.style.display = '';

        // 渲染欢迎页
        renderWelcome();
    }

    /**
     * Hash 变化处理
     */
    function handleHashChange() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            navigate(hash);
        } else {
            navigateToWelcome();
        }
    }

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange);

    // 初始加载
    handleHashChange();

    return {
        navigate,
        getCurrentId: () => currentToolId
    };
}
