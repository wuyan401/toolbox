/* ============================================
   Markdown 预览 - 实时 Markdown 渲染，GitHub 风格
   ============================================ */

export const id = 'markdown-preview';
export const name = 'Markdown 预览';
export const icon = '📄';
export const description = 'Markdown 实时预览，GitHub 风格渲染';
export const category = '格式化';
export const enabled = true;

export function init(container) {
    // 渲染 UI
    container.innerHTML = `
        <div class="md-container">
            <div class="md-pane md-editor-pane">
                <span class="tool-col-title">编辑</span>
                <textarea class="textarea md-editor" id="md-editor" placeholder="# 标题
输入 Markdown 文本...

## 二级标题
**加粗文本** *斜体文本*

\`\`\`js
console.log('代码块');
\`\`\`

- 列表项 1
- 列表项 2

> 引用文字

[链接](https://example.com)

| 表头1 | 表头2 |
|------|------|
| 内容  | 内容  |
"></textarea>
            </div>
            <div class="md-pane md-preview-pane">
                <div class="md-preview-header">
                    <span class="tool-col-title">预览</span>
                    <button class="btn btn-sm" id="md-export">📋 复制 HTML</button>
                </div>
                <div class="md-preview" id="md-preview"></div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .md-container {
            display: flex;
            gap: var(--spacing-md);
            height: calc(100vh - 200px);
            min-height: 500px;
        }
        .md-pane {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
        }
        .md-editor {
            flex: 1;
            resize: none;
            font-family: "Cascadia Code", "Fira Code", monospace;
            font-size: var(--font-size-sm);
            border-radius: var(--radius-md);
        }
        .md-preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-xs);
        }
        .md-preview {
            flex: 1;
            background: var(--color-bg-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: var(--spacing-lg) var(--spacing-xl);
            overflow-y: auto;
            font-size: var(--font-size-md);
            line-height: 1.7;
            color: var(--color-text-primary);
        }
        /* GitHub 风格 Markdown */
        .md-preview h1, .md-preview h2, .md-preview h3,
        .md-preview h4, .md-preview h5, .md-preview h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
            border-bottom: 1px solid var(--color-border);
            padding-bottom: 0.3em;
        }
        .md-preview h1 { font-size: 2em; }
        .md-preview h2 { font-size: 1.5em; }
        .md-preview h3 { font-size: 1.25em; }
        .md-preview h4 { font-size: 1em; }
        .md-preview h5 { font-size: 0.875em; }
        .md-preview h6 { font-size: 0.85em; color: var(--color-text-secondary); }
        .md-preview p { margin-bottom: 16px; }
        .md-preview strong { font-weight: 600; }
        .md-preview em { font-style: italic; }
        .md-preview code {
            background: var(--color-bg-secondary);
            padding: 0.2em 0.4em;
            border-radius: 4px;
            font-family: "Cascadia Code", "Fira Code", monospace;
            font-size: 0.875em;
        }
        .md-preview pre {
            background: var(--color-bg-sidebar);
            padding: var(--spacing-md);
            border-radius: var(--radius-md);
            overflow-x: auto;
            margin-bottom: 16px;
        }
        .md-preview pre code {
            background: none;
            padding: 0;
            color: #e6edf3;
        }
        .md-preview a {
            color: var(--color-accent);
            text-decoration: none;
        }
        .md-preview a:hover {
            text-decoration: underline;
        }
        .md-preview img {
            max-width: 100%;
            border-radius: var(--radius-sm);
        }
        .md-preview ul, .md-preview ol {
            padding-left: 2em;
            margin-bottom: 16px;
        }
        .md-preview li { margin-bottom: 4px; }
        .md-preview blockquote {
            border-left: 4px solid var(--color-accent);
            padding: 0 1em;
            color: var(--color-text-secondary);
            margin-bottom: 16px;
        }
        .md-preview hr {
            border: none;
            border-top: 2px solid var(--color-border);
            margin: 24px 0;
        }
        .md-preview table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 16px;
        }
        .md-preview th, .md-preview td {
            border: 1px solid var(--color-border);
            padding: 8px 13px;
            text-align: left;
        }
        .md-preview th {
            background: var(--color-bg-secondary);
            font-weight: 600;
        }
        .md-preview tr:nth-child(even) {
            background: var(--color-bg-secondary);
        }
        @media (max-width: 768px) {
            .md-container {
                flex-direction: column;
                height: auto;
            }
            .md-pane {
                min-height: 300px;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const editor = container.querySelector('#md-editor');
    const preview = container.querySelector('#md-preview');
    const exportBtn = container.querySelector('#md-export');

    /**
     * 行内解析：加粗、斜体、行内代码、链接、图片
     * @param {string} text
     * @returns {string}
     */
    function parseInline(text) {
        // 转义 HTML
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        // 行内代码 `...`（必须在加粗/斜体之前处理）
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 图片 ![alt](url)
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

        // 链接 [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // 加粗 **text**
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // 斜体 *text*（不匹配 **）
        text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

        return text;
    }

    /**
     * 渲染 Markdown 为 HTML
     * @param {string} md
     * @returns {string}
     */
    function renderMarkdown(md) {
        if (!md.trim()) return '';

        const lines = md.split('\n');
        let html = '';
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];

            // 代码块 ```
            if (line.trim().startsWith('```')) {
                i++;
                let code = '';
                while (i < lines.length && !lines[i].trim().startsWith('```')) {
                    code += (code ? '\n' : '') + lines[i];
                    i++;
                }
                code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                html += `<pre><code>${code}</code></pre>\n`;
                i++; // 跳过结束的 ```
                continue;
            }

            // 水平分割线 --- / *** / ___
            if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
                html += '<hr />\n';
                i++;
                continue;
            }

            // 标题 # ~ ######
            const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
            if (headingMatch) {
                const level = headingMatch[1].length;
                html += `<h${level}>${parseInline(headingMatch[2])}</h${level}>\n`;
                i++;
                continue;
            }

            // 无序列表 - / *
            const ulMatch = line.match(/^(\s*)[-*]\s+(.+)/);
            if (ulMatch) {
                html += '<ul>\n';
                while (i < lines.length) {
                    const li = lines[i].match(/^(\s*)[-*]\s+(.+)/);
                    if (!li) break;
                    html += `<li>${parseInline(li[2])}</li>\n`;
                    i++;
                }
                html += '</ul>\n';
                continue;
            }

            // 有序列表 1. / 2.
            const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
            if (olMatch) {
                html += '<ol>\n';
                while (i < lines.length) {
                    const li = lines[i].match(/^(\s*)\d+\.\s+(.+)/);
                    if (!li) break;
                    html += `<li>${parseInline(li[2])}</li>\n`;
                    i++;
                }
                html += '</ol>\n';
                continue;
            }

            // 引用 >
            if (line.trim().startsWith('>')) {
                html += '<blockquote>\n';
                while (i < lines.length) {
                    const ql = lines[i];
                    if (!ql.trim().startsWith('>')) break;
                    html += `<p>${parseInline(ql.replace(/^>\s?/, ''))}</p>\n`;
                    i++;
                }
                html += '</blockquote>\n';
                continue;
            }

            // 表格 |
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
                const headerCells = line.split('|').filter(c => c.trim() !== '' || c === '');
                // 实际有效的单元格
                const hdrs = [];
                for (let ci = 1; ci < line.split('|').length - 1; ci++) {
                    hdrs.push(line.split('|')[ci].trim());
                }

                i++;
                // 分隔行
                if (i < lines.length && /^\|[\s\-:|]+\|$/.test(lines[i].trim())) {
                    i++;
                }

                html += '<table>\n<thead>\n<tr>\n';
                for (const h of hdrs) {
                    html += `<th>${parseInline(h)}</th>\n`;
                }
                html += '</tr>\n</thead>\n<tbody>\n';

                while (i < lines.length && lines[i].trim().startsWith('|')) {
                    const cells = lines[i].split('|').filter(c => c !== undefined);
                    const vals = [];
                    for (let ci = 1; ci < cells.length - 1; ci++) {
                        vals.push((cells[ci] || '').trim());
                    }
                    html += '<tr>\n';
                    for (const v of vals) {
                        html += `<td>${parseInline(v)}</td>\n`;
                    }
                    html += '</tr>\n';
                    i++;
                }
                html += '</tbody>\n</table>\n';
                continue;
            }

            // 空行
            if (line.trim() === '') {
                html += '\n';
                i++;
                continue;
            }

            // 普通段落
            html += `<p>${parseInline(line)}</p>\n`;
            i++;
        }

        return html;
    }

    /** 实时渲染 */
    function updatePreview() {
        preview.innerHTML = renderMarkdown(editor.value);
    }

    /** 导出 HTML */
    async function exportHtml() {
        const html = preview.innerHTML;
        if (!html) return;

        try {
            await navigator.clipboard.writeText(html);
            const orig = exportBtn.textContent;
            exportBtn.textContent = '✅ 已复制';
            setTimeout(() => { exportBtn.textContent = orig; }, 1500);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = html;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    }

    // 防抖处理
    let debounceTimer;
    editor.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updatePreview, 300);
    });

    // 导出按钮
    exportBtn.addEventListener('click', exportHtml);

    // 初始渲染
    updatePreview();

    return {
        cleanup() {
            clearTimeout(debounceTimer);
        }
    };
}
