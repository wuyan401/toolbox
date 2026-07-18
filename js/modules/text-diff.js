/* ============================================
   文本对比工具 - 逐行比较差异，高亮显示变更
   使用 LCS (最长公共子序列) 算法进行行级对比
   ============================================ */

export const id = 'text-diff';
export const name = '文本对比';
export const icon = '📝';
export const description = '逐行比较文本差异，高亮显示变更';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    // 渲染 UI
    container.innerHTML = `
        <div class="tool-row">
            <div class="tool-col">
                <span class="tool-col-title">原始文本</span>
                <textarea class="textarea" id="diff-left" placeholder="粘贴原始文本..."></textarea>
            </div>
            <div class="tool-col">
                <span class="tool-col-title">修改后文本</span>
                <textarea class="textarea" id="diff-right" placeholder="粘贴修改后的文本..."></textarea>
            </div>
        </div>
        <div class="tool-actions">
            <button class="btn btn-primary" id="diff-compare">🔍 对比</button>
            <button class="btn" id="diff-swap">🔄 互换</button>
            <button class="btn" id="diff-clear">🗑 清空</button>
            <button class="btn" id="diff-sample">📄 示例</button>
        </div>
        <div class="diff-result" id="diff-result" style="display:none;">
            <div class="diff-stats" id="diff-stats"></div>
            <div class="diff-output" id="diff-output"></div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .diff-result {
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            overflow: hidden;
        }
        .diff-stats {
            display: flex;
            gap: var(--spacing-xl);
            padding: var(--spacing-md) var(--spacing-lg);
            background: var(--color-bg-card);
            border-bottom: 1px solid var(--color-border);
            font-size: var(--font-size-md);
        }
        .diff-stat-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
        }
        .diff-stat-num {
            font-weight: 700;
            font-size: 18px;
        }
        .diff-stat-add { color: var(--color-diff-add-text); }
        .diff-stat-del { color: var(--color-diff-remove-text); }
        .diff-stat-mod { color: var(--color-diff-change-text); }
        .diff-output {
            max-height: 400px;
            overflow-y: auto;
            font-family: "Cascadia Code", "Fira Code", "Consolas", monospace;
            font-size: 13px;
            line-height: 1.8;
            background: var(--color-bg-secondary);
        }
        .diff-line {
            display: flex;
            padding: 0 var(--spacing-md);
            min-height: 24px;
        }
        .diff-line-num {
            width: 40px;
            text-align: right;
            padding-right: var(--spacing-md);
            color: var(--color-text-muted);
            flex-shrink: 0;
            user-select: none;
        }
        .diff-line-content {
            flex: 1;
            white-space: pre-wrap;
            word-break: break-all;
        }
        .diff-line.add {
            background: var(--color-diff-add);
            color: var(--color-diff-add-text);
        }
        .diff-line.add .diff-line-num::before { content: '+'; }
        .diff-line.remove {
            background: var(--color-diff-remove);
            color: var(--color-diff-remove-text);
        }
        .diff-line.remove .diff-line-num::before { content: '-'; }
        .diff-line.same { color: var(--color-text-secondary); }
    `;
    container.appendChild(style);

    // DOM 引用
    const leftEl = container.querySelector('#diff-left');
    const rightEl = container.querySelector('#diff-right');
    const statsEl = container.querySelector('#diff-stats');
    const outputEl = container.querySelector('#diff-output');
    const resultEl = container.querySelector('#diff-result');

    /**
     * LCS 算法计算两个数组的最长公共子序列
     * @param {string[]} a - 数组 A
     * @param {string[]} b - 数组 B
     * @returns {number[][]} DP 表
     */
    function lcs(a, b) {
        const m = a.length;
        const n = b.length;
        const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        return dp;
    }

    /**
     * 回溯 LCS 表生成差异
     * @param {string[]} a - 原始行
     * @param {string[]} b - 修改后行
     * @param {number[][]} dp - LCS DP 表
     * @returns {Array<{ type: string, leftLine?: number, rightLine?: number, content: string }>}
     */
    function backtrack(a, b, dp) {
        const result = [];
        let i = a.length;
        let j = b.length;

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
                result.unshift({ type: 'same', leftLine: i, rightLine: j, content: a[i - 1] });
                i--;
                j--;
            } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                result.unshift({ type: 'add', rightLine: j, content: b[j - 1] });
                j--;
            } else if (i > 0) {
                result.unshift({ type: 'remove', leftLine: i, content: a[i - 1] });
                i--;
            }
        }
        return result;
    }

    /**
     * 合并相邻的删除和新增行为修改
     * @param {Array} diffs
     * @returns {Array}
     */
    function mergeChanges(diffs) {
        const merged = [];
        let i = 0;

        while (i < diffs.length) {
            // 检测删除→新增的模式，可能是修改
            if (diffs[i].type === 'remove' && i + 1 < diffs.length && diffs[i + 1].type === 'add') {
                merged.push({
                    type: 'change',
                    oldContent: diffs[i].content,
                    newContent: diffs[i + 1].content,
                    leftLine: diffs[i].leftLine,
                    rightLine: diffs[i + 1].rightLine
                });
                i += 2;
            } else {
                merged.push(diffs[i]);
                i++;
            }
        }
        return merged;
    }

    /**
     * 执行对比
     */
    function compare() {
        const leftText = leftEl.value;
        const rightText = rightEl.value;

        if (!leftText && !rightText) {
            resultEl.style.display = 'none';
            return;
        }

        const leftLines = leftText.split('\n');
        const rightLines = rightText.split('\n');

        const dp = lcs(leftLines, rightLines);
        const diffs = backtrack(leftLines, rightLines, dp);
        const merged = mergeChanges(diffs);

        // 统计
        const stats = { add: 0, remove: 0, change: 0 };
        merged.forEach(d => {
            if (stats.hasOwnProperty(d.type)) stats[d.type]++;
        });

        // 渲染统计
        statsEl.innerHTML = `
            <span class="diff-stat-item">
                <span class="diff-stat-num diff-stat-add">+${stats.add}</span> 新增行
            </span>
            <span class="diff-stat-item">
                <span class="diff-stat-num diff-stat-del">-${stats.remove}</span> 删除行
            </span>
            <span class="diff-stat-item">
                <span class="diff-stat-num diff-stat-mod">~${stats.change}</span> 修改行
            </span>
        `;

        // 渲染差异内容
        let html = '';
        merged.forEach(d => {
            switch (d.type) {
                case 'same':
                    html += `<div class="diff-line same"><span class="diff-line-num">${d.leftLine}</span><span class="diff-line-content">${escapeHtml(d.content)}</span></div>`;
                    break;
                case 'add':
                    html += `<div class="diff-line add"><span class="diff-line-num"></span><span class="diff-line-content">${escapeHtml(d.content)}</span></div>`;
                    break;
                case 'remove':
                    html += `<div class="diff-line remove"><span class="diff-line-num">${d.leftLine}</span><span class="diff-line-content">${escapeHtml(d.content)}</span></div>`;
                    break;
                case 'change':
                    html += `<div class="diff-line remove"><span class="diff-line-num">${d.leftLine}</span><span class="diff-line-content">${escapeHtml(d.oldContent)}</span></div>`;
                    html += `<div class="diff-line add"><span class="diff-line-num"></span><span class="diff-line-content">${escapeHtml(d.newContent)}</span></div>`;
                    break;
            }
        });
        outputEl.innerHTML = html;
        resultEl.style.display = 'block';
    }

    /**
     * HTML 转义
     * @param {string} str
     * @returns {string}
     */
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 示例文本
    const sample = {
        left: `function hello() {
    console.log("Hello World");
    return true;
}

const x = 1;
const y = 2;
console.log(x + y);`,
        right: `function hello() {
    console.log("你好，世界！");
    console.log("新增一行");
    return false;
}

const x = 10;
const y = 20;
const z = 30;
console.log(x + y + z);`
    };

    // 按钮事件
    container.querySelector('#diff-compare').addEventListener('click', compare);
    container.querySelector('#diff-swap').addEventListener('click', () => {
        const temp = leftEl.value;
        leftEl.value = rightEl.value;
        rightEl.value = temp;
        compare();
    });
    container.querySelector('#diff-clear').addEventListener('click', () => {
        leftEl.value = '';
        rightEl.value = '';
        resultEl.style.display = 'none';
        leftEl.focus();
    });
    container.querySelector('#diff-sample').addEventListener('click', () => {
        leftEl.value = sample.left;
        rightEl.value = sample.right;
        compare();
    });

    return {
        cleanup() {}
    };
}
