/* ============================================
   字数统计 - 字符/汉字/单词/行/段落/标点实时统计
   大数字卡片展示，可设目标字数达标提示
   ============================================ */

export const id = 'word-counter';
export const name = '字数统计';
export const icon = '📊';
export const description = '实时统计字符/汉字/单词/行/段落/标点数';
export const category = '办公工具';
export const enabled = true;

export function init(container) {
    let targetCount = 0;
    let _timers = [];

    container.innerHTML = `
        <div class="wc-layout">
            <!-- 上方：统计卡片 -->
            <div class="wc-stats-grid" id="wc-stats-grid">
                <div class="wc-stat-card" data-stat="charsWS">
                    <div class="wc-stat-value" id="wc-chars-ws">0</div>
                    <div class="wc-stat-label">字符数 (含空格)</div>
                </div>
                <div class="wc-stat-card" data-stat="charsNS">
                    <div class="wc-stat-value" id="wc-chars-ns">0</div>
                    <div class="wc-stat-label">字符数 (不含空格)</div>
                </div>
                <div class="wc-stat-card highlight" data-stat="hanzi">
                    <div class="wc-stat-value" id="wc-hanzi">0</div>
                    <div class="wc-stat-label">汉字数</div>
                </div>
                <div class="wc-stat-card" data-stat="words">
                    <div class="wc-stat-value" id="wc-words">0</div>
                    <div class="wc-stat-label">英文单词数</div>
                </div>
                <div class="wc-stat-card" data-stat="lines">
                    <div class="wc-stat-value" id="wc-lines">0</div>
                    <div class="wc-stat-label">行数</div>
                </div>
                <div class="wc-stat-card" data-stat="paragraphs">
                    <div class="wc-stat-value" id="wc-paras">0</div>
                    <div class="wc-stat-label">段落数</div>
                </div>
                <div class="wc-stat-card" data-stat="punctuation">
                    <div class="wc-stat-value" id="wc-punct">0</div>
                    <div class="wc-stat-label">标点数</div>
                </div>
            </div>

            <!-- 目标设置 -->
            <div class="wc-target-section">
                <span class="wc-target-label">🎯 字数目标</span>
                <input type="number" class="input wc-target-input" id="wc-target" placeholder="设置目标字数…" min="0" />
                <span class="wc-target-status" id="wc-target-status"></span>
            </div>

            <!-- 输入区 -->
            <textarea class="wc-textarea" id="wc-textarea" placeholder="在此输入或粘贴文本…&#10;实时统计将自动更新。"></textarea>

            <!-- 操作按钮 -->
            <div class="wc-actions">
                <button class="btn btn-sm" id="wc-clear">🗑️ 清空</button>
                <button class="btn btn-sm" id="wc-paste">📋 粘贴</button>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .wc-layout {
            max-width: 800px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        .wc-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: var(--spacing-sm);
        }
        .wc-stat-card {
            padding: var(--spacing-lg);
            background: var(--color-bg-secondary);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            text-align: center;
            transition: all var(--transition-fast);
        }
        .wc-stat-card.highlight {
            border-color: var(--color-accent);
            background: var(--color-accent-light);
        }
        .wc-stat-value {
            font-size: 32px;
            font-weight: 700;
            color: var(--color-accent);
            font-family: var(--font-family-mono);
            line-height: 1.2;
        }
        .wc-stat-card.highlight .wc-stat-value {
            color: var(--color-accent);
        }
        .wc-stat-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
            margin-top: 4px;
        }
        .wc-target-section {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
        }
        .wc-target-label {
            font-size: var(--font-size-md);
            font-weight: 600;
            color: var(--color-text-secondary);
            white-space: nowrap;
        }
        .wc-target-input {
            width: 100px;
            font-family: var(--font-family-mono);
        }
        .wc-target-status {
            font-size: var(--font-size-sm);
            font-weight: 600;
        }
        .wc-target-status.reached {
            color: var(--color-success);
        }
        .wc-target-status.not-reached {
            color: var(--color-warning);
        }
        .wc-textarea {
            width: 100%;
            min-height: 200px;
            padding: var(--spacing-lg);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-bg-input);
            color: var(--color-text-primary);
            font-size: var(--font-size-md);
            font-family: var(--font-family);
            outline: none;
            resize: vertical;
            line-height: 1.8;
            transition: border-color var(--transition-fast);
        }
        .wc-textarea:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 3px var(--color-accent-light);
        }
        .wc-actions {
            display: flex;
            gap: var(--spacing-sm);
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const statsGrid = container.querySelector('#wc-stats-grid');
    const textarea = container.querySelector('#wc-textarea');
    const targetInput = container.querySelector('#wc-target');
    const targetStatus = container.querySelector('#wc-target-status');

    const statEls = {
        charsWS: container.querySelector('#wc-chars-ws'),
        charsNS: container.querySelector('#wc-chars-ns'),
        hanzi:   container.querySelector('#wc-hanzi'),
        words:   container.querySelector('#wc-words'),
        lines:   container.querySelector('#wc-lines'),
        paras:   container.querySelector('#wc-paras'),
        punct:   container.querySelector('#wc-punct')
    };

    /**
     * 统计文本
     */
    function countStats(text) {
        // 字符数 (含空格)
        const charsWS = text.length;
        // 字符数 (不含空格)
        const charsNS = text.replace(/\s/g, '').length;
        // 汉字数
        const hanzi = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
        // 英文单词数
        const words = (text.match(/[a-zA-Z]+/g) || []).length;
        // 行数
        const lines = text === '' ? 0 : text.split(/\n/).length;
        // 段落数 (按空行分隔)
        const paras = text === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length || (text.trim() ? 1 : 0);
        // 标点数
        const punct = (text.match(/[，。！？、；：""''【】《》（）…—·,\.!\?;:"'\(\)\[\]{}…\-–—]/g) || []).length;

        return { charsWS, charsNS, hanzi, words, lines, paras, punct };
    }

    /**
     * 更新显示
     */
    function update() {
        const text = textarea.value;
        const stats = countStats(text);

        statEls.charsWS.textContent = stats.charsWS.toLocaleString();
        statEls.charsNS.textContent = stats.charsNS.toLocaleString();
        statEls.hanzi.textContent = stats.hanzi.toLocaleString();
        statEls.words.textContent = stats.words.toLocaleString();
        statEls.lines.textContent = stats.lines.toLocaleString();
        statEls.paras.textContent = stats.paras.toLocaleString();
        statEls.punct.textContent = stats.punct.toLocaleString();

        // 目标检查
        const total = stats.charsWS;
        const target = parseInt(targetInput.value, 10);
        if (target > 0) {
            if (total >= target) {
                targetStatus.textContent = `✅ 已达到目标！(${total.toLocaleString()} / ${target.toLocaleString()})`;
                targetStatus.className = 'wc-target-status reached';
            } else {
                const remaining = target - total;
                targetStatus.textContent = `还差 ${remaining.toLocaleString()} 字 (${total.toLocaleString()} / ${target.toLocaleString()})`;
                targetStatus.className = 'wc-target-status not-reached';
            }
        } else {
            targetStatus.textContent = '';
        }
    }

    /**
     * 粘贴剪贴板
     */
    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            textarea.value = text;
            update();
        } catch {
            // 无剪贴板权限
        }
    }

    // 事件：输入
    textarea.addEventListener('input', update);

    // 事件：粘贴增强
    textarea.addEventListener('paste', () => {
        // 延迟执行确保粘贴内容已更新
        setTimeout(update, 50);
    });

    // 事件：目标变更
    targetInput.addEventListener('input', update);

    // 事件：清空
    container.querySelector('#wc-clear').addEventListener('click', () => {
        textarea.value = '';
        update();
        textarea.focus();
    });

    // 事件：粘贴
    container.querySelector('#wc-paste').addEventListener('click', async () => {
        await pasteFromClipboard();
        update();
        textarea.focus();
    });

    // 统计卡片点击高亮对应数据（无操作，仅装饰）
    statsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.wc-stat-card');
        if (!card) return;
        // 复制对应统计值
        const statKey = card.dataset.stat;
        if (!statKey || !statEls[statKey]) return;
        const value = statEls[statKey].textContent;
        navigator.clipboard.writeText(value).catch(() => {});
    });

    // 初始更新
    update();

    return {
        cleanup() {
            _timers.forEach(t => clearTimeout(t));
        }
    };
}
