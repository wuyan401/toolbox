/* ============================================
   正则测试 - 正则表达式在线测试，实时匹配高亮
   ============================================ */

export const id = 'regex-tester';
export const name = '正则测试';
export const icon = '🔍';
export const description = '正则表达式在线测试，支持标志位和常用正则';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    // 常用正则快捷
    const PRESETS = [
        { label: '邮箱', pattern: '[\\w.-]+@[\\w.-]+\\.\\w+' },
        { label: '手机号', pattern: '1[3-9]\\d{9}' },
        { label: 'URL', pattern: 'https?://[\\w.-]+(:\\d+)?(/[\\w./?%&=\\-#]*)?' },
        { label: 'IP 地址', pattern: '(\\d{1,3}\\.){3}\\d{1,3}' },
        { label: '中文', pattern: '[\\u4e00-\\u9fa5]+' },
        { label: '身份证', pattern: '\\d{17}[\\dXx]' },
    ];

    // 渲染 UI
    container.innerHTML = `
        <div class="re-row">
            <div class="re-input-group">
                <span class="tool-col-title">正则表达式</span>
                <div class="re-regex-row">
                    <span class="re-delimiter">/</span>
                    <input class="input re-regex-input" id="re-pattern" placeholder="输入正则，例如: \\d+" />
                    <span class="re-delimiter">/</span>
                    <span class="re-flags">
                        <label class="re-flag"><input type="checkbox" id="re-flag-g" checked /> g</label>
                        <label class="re-flag"><input type="checkbox" id="re-flag-i" /> i</label>
                        <label class="re-flag"><input type="checkbox" id="re-flag-m" /> m</label>
                        <label class="re-flag"><input type="checkbox" id="re-flag-s" /> s</label>
                        <label class="re-flag"><input type="checkbox" id="re-flag-u" /> u</label>
                    </span>
                </div>
                <div class="re-presets">
                    <span class="re-preset-label">快捷：</span>
                    ${PRESETS.map(p => `<button class="btn btn-sm re-preset-btn" data-pattern="${p.pattern.replace(/"/g, '&quot;')}">${p.label}</button>`).join('')}
                </div>
            </div>
        </div>

        <div class="tool-row" style="margin-top:var(--spacing-md)">
            <div class="tool-col">
                <span class="tool-col-title">测试文本</span>
                <textarea class="textarea" id="re-text" placeholder="输入要匹配的文本..."></textarea>
            </div>
            <div class="tool-col">
                <span class="tool-col-title">
                    匹配结果
                    <span id="re-count" style="color:var(--color-text-secondary);font-weight:400;"></span>
                </span>
                <div class="re-results" id="re-results">
                    <div class="re-placeholder">输入正则和测试文本查看匹配结果</div>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .re-regex-row {
            display: flex;
            align-items: center;
            gap: 2px;
            background: var(--color-bg-card);
            border-radius: var(--radius-sm);
            padding: var(--spacing-xs) var(--spacing-sm);
        }
        .re-regex-input {
            flex: 1;
            background: transparent;
            border: none !important;
            box-shadow: none !important;
            font-family: "Cascadia Code", "Fira Code", monospace;
            font-size: var(--font-size-md) !important;
        }
        .re-delimiter {
            color: var(--color-accent);
            font-weight: 600;
            font-size: var(--font-size-lg);
            font-family: "Cascadia Code", "Fira Code", monospace;
            user-select: none;
        }
        .re-flags {
            display: flex;
            gap: 2px;
        }
        .re-flag {
            display: flex;
            align-items: center;
            gap: 1px;
            font-size: var(--font-size-xs);
            color: var(--color-text-secondary);
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 3px;
            transition: all 0.15s;
        }
        .re-flag:hover {
            background: var(--color-bg-hover);
            color: var(--color-text-primary);
        }
        .re-flag input[type="checkbox"] {
            accent-color: var(--color-accent);
        }
        .re-flag input[type="checkbox"]:checked + * {
            color: var(--color-accent);
        }
        .re-presets {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            flex-wrap: wrap;
            margin-top: var(--spacing-sm);
        }
        .re-preset-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        }
        .re-results {
            background: var(--color-bg-secondary);
            border-radius: var(--radius-sm);
            padding: var(--spacing-sm);
            min-height: 120px;
            max-height: 350px;
            overflow-y: auto;
            font-family: "Cascadia Code", "Fira Code", monospace;
            font-size: var(--font-size-sm);
        }
        .re-placeholder {
            color: var(--color-text-secondary);
            text-align: center;
            padding: var(--spacing-xl) 0;
        }
        .re-match-item {
            padding: var(--spacing-xs) var(--spacing-sm);
            margin-bottom: 2px;
            border-radius: 3px;
            background: var(--color-bg-card);
            border-left: 3px solid var(--color-accent);
        }
        .re-match-text {
            color: var(--color-text-primary);
            font-weight: 600;
        }
        .re-match-pos {
            color: var(--color-text-secondary);
            font-size: var(--font-size-xs);
        }
        .re-match-groups {
            color: var(--color-text-secondary);
            font-size: var(--font-size-xs);
            margin-top: 2px;
        }
        .re-match-groups span {
            color: var(--color-accent);
        }
        .re-error {
            color: var(--color-danger);
            padding: var(--spacing-sm);
            background: var(--color-diff-remove);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const patternInput = container.querySelector('#re-pattern');
    const textInput = container.querySelector('#re-text');
    const resultsEl = container.querySelector('#re-results');
    const countEl = container.querySelector('#re-count');
    const flagCheckboxes = container.querySelectorAll('.re-flags input[type="checkbox"]');

    /**
     * 获取当前标志位字符串
     * @returns {string}
     */
    function getFlags() {
        let flags = '';
        if (container.querySelector('#re-flag-g').checked) flags += 'g';
        if (container.querySelector('#re-flag-i').checked) flags += 'i';
        if (container.querySelector('#re-flag-m').checked) flags += 'm';
        if (container.querySelector('#re-flag-s').checked) flags += 's';
        if (container.querySelector('#re-flag-u').checked) flags += 'u';
        return flags;
    }

    /** 执行匹配 */
    function doMatch() {
        const pattern = patternInput.value;
        const text = textInput.value;
        resultsEl.innerHTML = '';
        countEl.textContent = '';

        if (!pattern) {
            resultsEl.innerHTML = '<div class="re-placeholder">请输入正则表达式</div>';
            return;
        }
        if (!text) {
            resultsEl.innerHTML = '<div class="re-placeholder">请输入测试文本</div>';
            return;
        }

        let regex;
        try {
            regex = new RegExp(pattern, getFlags());
        } catch (err) {
            resultsEl.innerHTML = `<div class="re-error">❌ 正则语法错误: ${err.message}</div>`;
            return;
        }

        const matches = [];
        let match;
        const isGlobal = getFlags().includes('g');

        if (isGlobal) {
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    groups: match.length > 1 ? Array.from(match).slice(1) : []
                });
                // 防止空匹配死循环
                if (match[0] === '') {
                    regex.lastIndex++;
                    if (regex.lastIndex > text.length) break;
                }
            }
        } else {
            match = regex.exec(text);
            if (match) {
                matches.push({
                    text: match[0],
                    index: match.index,
                    groups: match.length > 1 ? Array.from(match).slice(1) : []
                });
            }
        }

        countEl.textContent = matches.length > 0 ? `（${matches.length} 个匹配）` : '（无匹配）';

        if (matches.length === 0) {
            resultsEl.innerHTML = '<div class="re-placeholder">没有匹配结果</div>';
            return;
        }

        resultsEl.innerHTML = matches.map((m, i) => `
            <div class="re-match-item">
                <div class="re-match-text">"${escapeHtml(m.text)}"</div>
                <div class="re-match-pos">位置: ${m.index} ~ ${m.index + m.text.length}</div>
                ${m.groups.length > 0 ? `<div class="re-match-groups">分组: ${m.groups.map((g, gi) => `<span>$${gi + 1}="${escapeHtml(g || '')}"</span>`).join(', ')}</div>` : ''}
            </div>
        `).join('');
    }

    /** HTML 转义 */
    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // 防抖处理
    let debounceTimer;
    function debouncedMatch() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doMatch, 300);
    }

    // 事件绑定
    patternInput.addEventListener('input', debouncedMatch);
    textInput.addEventListener('input', debouncedMatch);
    flagCheckboxes.forEach(cb => cb.addEventListener('change', debouncedMatch));

    // 快捷正则按钮
    container.querySelectorAll('.re-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            patternInput.value = btn.dataset.pattern;
            doMatch();
        });
    });

    return {
        cleanup() {
            clearTimeout(debounceTimer);
        }
    };
}
