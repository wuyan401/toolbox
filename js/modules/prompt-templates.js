/* ============================================
   Prompt 模板库 - 预置常用 prompt 模板，分类展示、搜索过滤、一键复制
   模板中的变量用 [xxx] 标注，提示用户自行替换
   ============================================ */

export const id = 'prompt-templates';
export const name = 'Prompt 模板库';
export const icon = '📚';
export const description = '预置常用 Prompt 模板，分类浏览、搜索、一键复制';
export const category = 'AI 工具';
export const enabled = true;

export function init(container) {
    // 模板数据
    const TEMPLATES = [
        // === 代码类 ===
        {
            id: 'code-review',
            category: '代码类',
            title: '代码审查',
            preview: '请帮我审查以下代码，从正确性、性能、可维护性等角度分析...',
            content: `请帮我审查以下代码，从以下几个维度进行详细分析：

1. **正确性**：逻辑是否无误，边界条件是否处理得当
2. **性能**：是否存在性能瓶颈或不必要的开销
3. **可维护性**：代码结构是否清晰，命名是否合理
4. **安全性**：是否存在潜在的安全风险

代码：
\`\`\`
[在此粘贴代码]
\`\`\`

请给出具体的改进建议和修改后的代码。`
        },
        {
            id: 'bug-analysis',
            category: '代码类',
            title: 'Bug 分析',
            preview: '我遇到了一个 Bug，现象是...请帮我分析可能的原因...',
            content: `我遇到了一个 Bug，需要你的帮助分析：

**现象描述**：
[描述 Bug 的具体表现]

**期望行为**：
[描述正确的行为应该是什么]

**复现步骤**：
1. [步骤 1]
2. [步骤 2]
3. [步骤 3]

**环境信息**：
- 系统：[Windows/macOS/Linux]
- 版本：[版本号]
- 相关依赖：[依赖名称和版本]

**相关代码**：
\`\`\`
[粘贴相关代码]
\`\`\`

请分析可能的原因，并给出修复方案。`
        },
        {
            id: 'refactor-suggest',
            category: '代码类',
            title: '重构建议',
            preview: '请帮我重构以下代码，目标是提高可读性和可维护性...',
            content: `请帮我重构以下代码，目标：

1. 提高代码可读性
2. 增强可维护性
3. 遵循最佳实践（如 SOLID 原则）
4. 保持原有功能不变

原代码：
\`\`\`[语言]
[在此粘贴代码]
\`\`\`

请给出：
- 现有代码的问题分析
- 重构后的代码
- 重构带来的改进说明`
        },
        {
            id: 'write-unit-tests',
            category: '代码类',
            title: '写单元测试',
            preview: '请为以下 [函数/类/模块] 编写单元测试...',
            content: `请为以下代码编写全面的单元测试：

**测试框架**：[Jest / pytest / JUnit / 其他]

**被测代码**：
\`\`\`[语言]
[在此粘贴代码]
\`\`\`

**要求**：
- 覆盖正常路径和异常路径
- 覆盖边界条件
- 每个测试用例有清晰的描述
- 使用合理的 mock/stub（如需要）

请提供完整的测试代码。`
        },
        // === 写作类 ===
        {
            id: 'polish-text',
            category: '写作类',
            title: '文章润色',
            preview: '请帮我润色以下文字，改善表达、修正语法错误...',
            content: `请帮我润色以下文字：

**要求**：
- 改善表达，使语言更流畅自然
- 修正语法错误和拼写错误
- 保持原意不变
- 风格：[正式 / 轻松 / 技术文档]

原文：
[在此粘贴需要润色的文字]

请同时给出修改说明。`
        },
        {
            id: 'translation',
            category: '写作类',
            title: '翻译助手',
            preview: '请将以下文本翻译为 [目标语言]，注意专业术语的准确翻译...',
            content: `请将以下文本翻译为 [目标语言]：

**翻译要求**：
- 准确传达原文含义
- 专业术语翻译要准确
- 符合目标语言的表达习惯
- 保持格式（标题、列表等）

原文：
[在此粘贴需要翻译的文字]

请同时提供关键术语的翻译对照表。`
        },
        {
            id: 'summarize',
            category: '写作类',
            title: '摘要生成',
            preview: '请为以下内容生成摘要，控制在 [字数] 字以内...',
            content: `请为以下内容生成摘要：

**要求**：
- 摘要长度：约 [200] 字
- 保留关键信息和核心观点
- 语言简洁有力
- 使用 [中文/英文]

原文：
[在此粘贴需要总结的内容]`
        },
        // === 创意类 ===
        {
            id: 'brainstorm',
            category: '创意类',
            title: '头脑风暴',
            preview: '我想解决 [问题]，请帮我头脑风暴，列出至少 10 个可能的方案...',
            content: `请帮我针对以下问题/主题进行头脑风暴：

**主题**：[描述你的主题或问题]

**要求**：
- 列出至少 10 个创意想法
- 不限制可行性，鼓励发散思维
- 对每个想法做简短说明
- 最后选出 3 个最有潜力的想法并说明理由`
        },
        {
            id: 'naming',
            category: '创意类',
            title: '起名助手',
            preview: '我需要为 [产品/项目/品牌] 起名，请提供 20 个候选名称...',
            content: `请帮我为以下项目起名：

**项目类型**：[产品 / 品牌 / 开源项目 / App / 其他]
**行业领域**：[描述领域]
**目标受众**：[描述目标用户]
**风格偏好**：[简洁 / 国际范 / 中式 / 有趣 / 专业]
**希望传达的感觉**：[描述]

**要求**：
- 提供 20 个候选名称
- 每个名称附简短解释
- 标注域名的可用性（如适用）
- 给出你的 Top 3 推荐`
        },
        {
            id: 'slogan',
            category: '创意类',
            title: 'Slogan 生成',
            preview: '请为 [品牌/产品] 生成 10 条 slogan，要求简短有力、易于传播...',
            content: `请为以下品牌/产品生成 slogan：

**品牌/产品名**：[名称]
**一句话介绍**：[描述]
**目标用户**：[描述]
**品牌调性**：[专业 / 年轻 / 高端 / 亲民 / 科技感]

**要求**：
- 生成 10 条候选 slogan
- 每条简短有力（15 字以内为佳）
- 易于记忆和传播
- 标注每条 slogan 的风格特点`
        },
        // === 角色类 ===
        {
            id: 'interviewer',
            category: '角色类',
            title: '面试官模拟',
            preview: '请作为 [岗位] 的面试官，对我进行一场技术面试...',
            content: `请你担任一名资深面试官，对我进行一场模拟面试：

**岗位**：[前端开发 / 后端开发 / 产品经理 / 其他]
**技术栈**：[描述技术栈]
**难度**：[初级 / 中级 / 高级]
**面试轮次**：[技术面 / 系统设计 / 行为面]

**流程要求**：
1. 每次只问一个问题，等我回答后再问下一个
2. 涵盖基础知识和项目经验
3. 在结束时给出总体评价和改进建议

开始吧！`
        },
        {
            id: 'tech-advisor',
            category: '角色类',
            title: '技术顾问',
            preview: '我需要做一个技术选型决策，请帮我对比分析各方案的优劣...',
            content: `请你作为技术顾问，帮我做以下技术决策分析：

**背景**：
[描述项目背景和需求]

**候选方案**：
1. [方案 A]
2. [方案 B]
3. [方案 C]

**评估维度**：
- 性能
- 开发效率
- 社区生态
- 学习成本
- 长期维护

请给出详细对比分析和最终推荐。`
        },
    ];

    // 所有分类（保持顺序）
    const CATEGORIES = ['代码类', '写作类', '创意类', '角色类'];

    let searchQuery = '';
    let activeCategory = null; // null 表示全部

    /**
     * 过滤模板
     * @returns {Array}
     */
    function getFiltered() {
        return TEMPLATES.filter(t => {
            const matchCat = !activeCategory || t.category === activeCategory;
            const q = searchQuery.toLowerCase();
            const matchSearch = !q || t.title.toLowerCase().includes(q) ||
                t.preview.toLowerCase().includes(q) || t.content.toLowerCase().includes(q);
            return matchCat && matchSearch;
        });
    }

    // 渲染 UI
    container.innerHTML = `
        <div class="pt-layout">
            <!-- 搜索和分类过滤 -->
            <div class="pt-toolbar">
                <div class="pt-search-wrap">
                    <span class="pt-search-icon">🔍</span>
                    <input class="input pt-search-input" id="pt-search" placeholder="搜索模板..." />
                </div>
                <div class="pt-categories" id="pt-categories">
                    <button class="pt-cat-btn active" data-cat="">全部</button>
                    ${CATEGORIES.map(c => `<button class="pt-cat-btn" data-cat="${c}">${c}</button>`).join('')}
                </div>
            </div>
            <!-- 模板网格 -->
            <div class="pt-grid" id="pt-grid"></div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .pt-layout {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        .pt-toolbar {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .pt-search-wrap {
            position: relative;
        }
        .pt-search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 16px;
            color: var(--color-text-muted);
            pointer-events: none;
        }
        .pt-search-input {
            padding-left: 36px !important;
        }
        .pt-categories {
            display: flex;
            gap: var(--spacing-xs);
            flex-wrap: wrap;
        }
        .pt-cat-btn {
            padding: var(--spacing-xs) var(--spacing-md);
            border: 1px solid var(--color-border);
            border-radius: 16px;
            background: var(--color-bg-card);
            color: var(--color-text-secondary);
            cursor: pointer;
            font-size: var(--font-size-sm);
            font-family: inherit;
            transition: all var(--transition-fast);
        }
        .pt-cat-btn:hover {
            border-color: var(--color-accent);
            color: var(--color-text-primary);
        }
        .pt-cat-btn.active {
            background: var(--color-accent);
            color: #fff;
            border-color: var(--color-accent);
        }
        .pt-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: var(--spacing-md);
        }
        .pt-card {
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: var(--spacing-lg);
            transition: all var(--transition-fast);
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .pt-card:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--color-accent);
            transform: translateY(-1px);
        }
        .pt-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .pt-card-tag {
            font-size: var(--font-size-xs);
            padding: 1px 8px;
            border-radius: 10px;
            background: var(--color-accent-light);
            color: var(--color-accent);
            font-weight: 500;
        }
        .pt-card-title {
            font-size: var(--font-size-lg);
            font-weight: 600;
            color: var(--color-text-primary);
        }
        .pt-card-preview {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            line-height: 1.5;
            flex: 1;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .pt-card-footer {
            display: flex;
            justify-content: flex-end;
        }
        .pt-copy-btn {
            display: inline-flex;
            align-items: center;
            gap: var(--spacing-xs);
            padding: var(--spacing-xs) var(--spacing-md);
            border: 1px solid var(--color-accent);
            border-radius: var(--radius-sm);
            background: transparent;
            color: var(--color-accent);
            cursor: pointer;
            font-size: var(--font-size-sm);
            font-family: inherit;
            transition: all var(--transition-fast);
        }
        .pt-copy-btn:hover {
            background: var(--color-accent);
            color: #fff;
        }
        .pt-copy-btn:active {
            transform: scale(0.96);
        }
        .pt-empty {
            text-align: center;
            padding: var(--spacing-xxl);
            color: var(--color-text-muted);
            grid-column: 1 / -1;
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const gridEl = container.querySelector('#pt-grid');
    const searchInput = container.querySelector('#pt-search');
    const catContainer = container.querySelector('#pt-categories');

    /**
     * 渲染模板网格
     */
    function render() {
        const filtered = getFiltered();
        if (filtered.length === 0) {
            gridEl.innerHTML = '<div class="pt-empty">没有找到匹配的模板</div>';
            return;
        }
        gridEl.innerHTML = filtered.map(t => `
            <div class="pt-card">
                <div class="pt-card-header">
                    <span class="pt-card-tag">${t.category}</span>
                </div>
                <div class="pt-card-title">${t.title}</div>
                <div class="pt-card-preview">${t.preview}</div>
                <div class="pt-card-footer">
                    <button class="pt-copy-btn" data-id="${t.id}">📋 复制模板</button>
                </div>
            </div>
        `).join('');

        // 绑定复制事件
        gridEl.querySelectorAll('.pt-copy-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const tpl = TEMPLATES.find(t => t.id === btn.dataset.id);
                if (!tpl) return;
                try {
                    await navigator.clipboard.writeText(tpl.content);
                } catch {
                    const ta = document.createElement('textarea');
                    ta.value = tpl.content;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                const original = btn.textContent;
                btn.textContent = '✅ 已复制';
                btn.style.background = 'var(--color-success)';
                btn.style.borderColor = 'var(--color-success)';
                btn.style.color = '#fff';
                setTimeout(() => {
                    btn.textContent = original;
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    btn.style.color = '';
                }, 1500);
            });
        });
    }

    // 搜索
    function onSearch() {
        searchQuery = searchInput.value;
        render();
    }
    searchInput.addEventListener('input', onSearch);

    // 分类切换
    function onCatClick(e) {
        const btn = e.target.closest('.pt-cat-btn');
        if (!btn) return;
        catContainer.querySelectorAll('.pt-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat || null;
        render();
    }
    catContainer.addEventListener('click', onCatClick);

    // 初始渲染
    render();

    return {
        cleanup() {
            searchInput.removeEventListener('input', onSearch);
            catContainer.removeEventListener('click', onCatClick);
        }
    };
}
