/* ============================================
   Token 估算器 - 估算文本的 token 数量及费用
   支持多模型预设价格，实时显示上下文窗口占比
   ============================================ */

export const id = 'token-counter';
export const name = 'Token 估算器';
export const icon = '🧮';
export const description = '估算文本的 Token 数量，支持多模型费用预估';
export const category = 'AI 工具';
export const enabled = true;

export function init(container) {
    // 模型预设（2025-2026 最新模型，价格单位：$/百万 tokens）
    const MODELS = [
        { id: 'gpt-4o',        name: 'GPT-4o',         inputPrice: 2.50,  outputPrice: 10.00,  context: 128000,  color: '#10a37f' },
        { id: 'gpt-4o-mini',   name: 'GPT-4o mini',    inputPrice: 0.15,  outputPrice: 0.60,   context: 128000,  color: '#10a37f' },
        { id: 'gpt-4.1',       name: 'GPT-4.1',        inputPrice: 2.00,  outputPrice: 8.00,    context: 1000000, color: '#10a37f' },
        { id: 'gpt-5',         name: 'GPT-5',           inputPrice: 3.75,  outputPrice: 15.00,   context: 128000,  color: '#10a37f' },
        { id: 'claude-opus-4', name: 'Claude Opus 4',   inputPrice: 15.00, outputPrice: 75.00,   context: 200000,  color: '#d97706' },
        { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', inputPrice: 3.00, outputPrice: 15.00, context: 200000,  color: '#d97706' },
        { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', inputPrice: 0.80, outputPrice: 4.00, context: 200000, color: '#d97706' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', inputPrice: 1.25,  outputPrice: 10.00,   context: 1000000, color: '#4285f4' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', inputPrice: 0.15, outputPrice: 0.60, context: 1000000, color: '#4285f4' },
        { id: 'deepseek-v3',   name: 'DeepSeek V3',     inputPrice: 0.27,  outputPrice: 1.10,    context: 128000,  color: '#4F46E5' },
    ];

    let selectedModel = MODELS[0];

    // 渲染 UI
    container.innerHTML = `
        <div class="tc-layout">
            <!-- 模型选择 -->
            <div class="tc-model-bar">
                <span class="tool-col-title">选择模型</span>
                <div class="tc-model-options" id="tc-models">
                    ${MODELS.map((m, i) => `
                        <button class="tc-model-btn${i === 0 ? ' active' : ''}" data-model="${m.id}"
                            style="--model-color:${m.color}">
                            ${m.name}
                        </button>
                    `).join('')}
                </div>
            </div>
            <!-- 输入区 -->
            <div class="tool-col" style="flex:1;min-height:0;">
                <span class="tool-col-title">输入文本</span>
                <textarea class="textarea" id="tc-input" placeholder="输入或粘贴文本，自动估算 Token 数..." style="flex:1;min-height:200px;"></textarea>
            </div>
            <!-- 统计区 -->
            <div class="tc-stats" id="tc-stats">
                <div class="tc-stat-row">
                    <div class="tc-stat-card">
                        <div class="tc-stat-value" id="tc-tokens">0</div>
                        <div class="tc-stat-label">Token 数</div>
                    </div>
                    <div class="tc-stat-card">
                        <div class="tc-stat-value" id="tc-chars">0</div>
                        <div class="tc-stat-label">字符数</div>
                    </div>
                    <div class="tc-stat-card">
                        <div class="tc-stat-value" id="tc-cost">$0.0000</div>
                        <div class="tc-stat-label">预估费用 (输入)</div>
                    </div>
                </div>
                <!-- 上下文占比条 -->
                <div class="tc-bar-wrap">
                    <div class="tc-bar-fill" id="tc-bar-fill" style="width:0%;"></div>
                    <div class="tc-bar-text" id="tc-bar-text">0 / ${selectedModel.context.toLocaleString()} tokens (0%)</div>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .tc-layout {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
            height: 100%;
        }
        .tc-model-bar {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        .tc-model-options {
            display: flex;
            gap: var(--spacing-sm);
            flex-wrap: wrap;
        }
        .tc-model-btn {
            padding: var(--spacing-xs) var(--spacing-lg);
            border: 2px solid var(--color-border);
            border-radius: 20px;
            background: var(--color-bg-card);
            color: var(--color-text-primary);
            cursor: pointer;
            font-size: var(--font-size-md);
            font-family: inherit;
            transition: all var(--transition-fast);
        }
        .tc-model-btn:hover {
            border-color: var(--model-color, var(--color-accent));
        }
        .tc-model-btn.active {
            border-color: var(--model-color, var(--color-accent));
            background: var(--model-color, var(--color-accent));
            color: #fff;
        }
        .tc-stats {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
            padding: var(--spacing-lg);
            background: var(--color-bg-card);
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
        }
        .tc-stat-row {
            display: flex;
            gap: var(--spacing-lg);
        }
        .tc-stat-card {
            flex: 1;
            text-align: center;
        }
        .tc-stat-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--color-text-primary);
            font-family: "Cascadia Code", "Fira Code", monospace;
        }
        .tc-stat-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            margin-top: 2px;
        }
        .tc-bar-wrap {
            position: relative;
            height: 24px;
            background: var(--color-bg-input);
            border-radius: var(--radius-sm);
            overflow: hidden;
        }
        .tc-bar-fill {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            border-radius: var(--radius-sm);
            transition: width 0.3s ease, background 0.3s ease;
            min-width: 0;
        }
        .tc-bar-text {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-primary);
            text-shadow: 0 0 4px var(--color-bg-card);
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#tc-input');
    const tokensEl = container.querySelector('#tc-tokens');
    const charsEl = container.querySelector('#tc-chars');
    const costEl = container.querySelector('#tc-cost');
    const barFill = container.querySelector('#tc-bar-fill');
    const barText = container.querySelector('#tc-bar-text');

    /**
     * 估算 token 数（简单算法）
     * 英文约字符数/4，中文约字符数*1.5，混合按比例
     * @param {string} text
     * @returns {number}
     */
    function estimateTokens(text) {
        if (!text) return 0;
        // 统计中文字符数
        const chineseChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
        const otherChars = text.length - chineseChars;
        // 中文≈1.5 token/字，英文≈0.25 token/字符
        const tokens = Math.ceil(chineseChars * 1.5 + otherChars * 0.25);
        return Math.max(0, tokens);
    }

    /**
     * 更新统计
     */
    function updateStats() {
        const text = inputEl.value;
        const chars = text.length;
        const tokens = estimateTokens(text);
        const cost = (tokens / 1_000_000) * selectedModel.inputPrice;

        tokensEl.textContent = tokens.toLocaleString();
        charsEl.textContent = chars.toLocaleString();
        costEl.textContent = '$' + cost.toFixed(4);

        // 更新上下文占比条
        const pct = Math.min(100, (tokens / selectedModel.context) * 100);
        barFill.style.width = pct + '%';

        // 颜色：<50% 绿色，50-80% 黄色，>80% 红色
        let barColor = 'var(--color-success)';
        if (pct > 80) barColor = 'var(--color-danger)';
        else if (pct > 50) barColor = 'var(--color-warning)';
        barFill.style.background = barColor;

        barText.textContent = `${tokens.toLocaleString()} / ${selectedModel.context.toLocaleString()} tokens (${pct.toFixed(1)}%)`;
    }

    // 事件：输入
    inputEl.addEventListener('input', updateStats);

    // 事件：切换模型（委托）
    function onModelClick(e) {
        const btn = e.target.closest('.tc-model-btn');
        if (!btn) return;
        container.querySelectorAll('.tc-model-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedModel = MODELS.find(m => m.id === btn.dataset.model) || MODELS[0];
        updateStats();
    }
    container.querySelector('#tc-models').addEventListener('click', onModelClick);

    return {
        cleanup() {
            inputEl.removeEventListener('input', updateStats);
            container.querySelector('#tc-models').removeEventListener('click', onModelClick);
        }
    };
}
