/* ============================================
   .gitignore 生成器 - 多选技术栈标签，实时生成合并内容
   ============================================ */

export const id = 'gitignore-generator';
export const name = '.gitignore 生成器';
export const icon = '📝';
export const description = '多选技术栈标签，实时生成合并 .gitignore 文件，支持搜索和下载';
export const category = '构建工具';
export const enabled = true;

export function init(container) {
    // 预设模板
    const TEMPLATES = {
        'Node': { group: '语言/运行时', content: `# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
package-lock.json` },
        'React': { group: '前端框架', content: `# React / CRA
# dependencies
node_modules/
/.pnp
.pnp.*
# testing
/coverage
# production
/build
/dist
# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*` },
        'Vue': { group: '前端框架', content: `# Vue.js
node_modules/
/dist
# local env files
.env.local
.env.*.local
# Log files
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
# Editor directories and files
.idea
.vscode
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?` },
        'Python': { group: '语言/运行时', content: `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
# virtualenv
venv/
ENV/
env/
.venv
# IDE
.idea/
.vscode/
*.swp
*.swo` },
        'Java': { group: '语言/运行时', content: `# Java
*.class
*.jar
*.war
*.ear
# Maven
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
# Gradle
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
# IDE
.idea/
*.iml
*.iws
*.ipr
# Misc
*.log
*.tmp` },
        'Go': { group: '语言/运行时', content: `# Go
# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib
# Test binary
*.test
# Output
/tmp
/vendor
# IDE
.idea/
.vscode/
*.swp
*.swo
# Go workspace
go.work` },
        'Flutter': { group: '框架/平台', content: `# Flutter / Dart
.dart_tool/
.packages
build/
pubspec.lock
# Android
*.iml
.idea/
.gradle/
local.properties
# iOS
ios/Pods/
ios/.symlinks/
# Web
build/web/
# Misc
*.log
*.tmp` },
        'Unity': { group: '框架/平台', content: `# Unity
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/
# Asset meta data
*.pidb.meta
*.pdb.meta
*.mdb.meta
# Unity3D generated
sysinfo.txt
*.apk
*.aab
*.unitypackage
# Crashlytics
crashlytics-build.properties` },
        'VS Code': { group: '编辑器/IDE', content: `# VS Code
.vscode/
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
!.vscode/*.code-snippets
# History
.history/
*.vsix` },
        'JetBrains': { group: '编辑器/IDE', content: `# JetBrains IDE
.idea/
*.iml
*.iws
*.ipr
out/
# Fleet
.fleet/` },
        'macOS': { group: '操作系统', content: `# macOS
.DS_Store
.AppleDouble
.LSOverride
# Icon
Icon
# Thumbnails
._*
# Files that might appear in the root of a volume
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk` },
        'Windows': { group: '操作系统', content: `# Windows
Thumbs.db
Thumbs.db:encryptable
ehthumbs.db
ehthumbs_vista.db
*.stackdump
[Dd]esktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msix
*.msm
*.msp
*.lnk` },
        'Linux': { group: '操作系统', content: `# Linux
*~
# KDE
.directory
# Trash
.Trash-*
# temporary files
*.swp
*.swo
*.swn
*.bak
*.orig` }
    };

    let selected = new Set();

    // 按分组整理模板
    const groups = {};
    for (const [name, info] of Object.entries(TEMPLATES)) {
        if (!groups[info.group]) groups[info.group] = [];
        groups[info.group].push(name);
    }

    container.innerHTML = `
        <div class="gi-layout">
            <!-- 左侧：模板选择 -->
            <div class="gi-select-section">
                <div class="gi-search-wrap">
                    <input class="input gi-search" id="gi-search" placeholder="🔍 搜索模板..." />
                </div>
                <div class="gi-groups" id="gi-groups">
                    ${Object.entries(groups).map(([group, names]) => `
                        <div class="gi-group" data-group="${group}">
                            <div class="gi-group-title">${group}</div>
                            <div class="gi-group-tags">
                                ${names.map(name => `
                                    <button class="gi-tag" data-template="${name}">
                                        ${name}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 右侧：已选 + 预览 -->
            <div class="gi-preview-section">
                <div class="gi-selected-bar">
                    <span class="tool-col-title">已选模板：</span>
                    <div class="gi-selected-tags" id="gi-selected-tags">
                        <span class="gi-hint">请从左侧选择模板</span>
                    </div>
                    <button class="btn btn-sm" id="gi-clear-all" style="display:none">清空全部</button>
                </div>

                <div class="gi-preview-header">
                    <span class="tool-col-title">.gitignore 预览</span>
                    <div style="display:flex;gap:var(--spacing-xs);">
                        <button class="btn btn-sm" id="gi-copy">📋 复制</button>
                        <button class="btn btn-sm" id="gi-download">📥 下载</button>
                    </div>
                </div>
                <textarea class="textarea gi-preview" id="gi-preview" readonly placeholder="选择模板后，此处将实时显示合并的 .gitignore 内容..."></textarea>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .gi-layout {
            display: flex;
            gap: var(--spacing-xl);
            min-height: 0;
        }
        .gi-select-section {
            flex: 0 0 340px;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
            min-width: 0;
        }
        .gi-search-wrap {
            margin-bottom: 0;
        }
        .gi-search {
            width: 100%;
        }
        .gi-groups {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
            max-height: 500px;
            overflow-y: auto;
        }
        .gi-group {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-xs);
        }
        .gi-group-title {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .gi-group-tags {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
        }
        .gi-tag {
            padding: 4px 12px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-pill);
            background: var(--color-bg-card);
            color: var(--color-text-primary);
            font-size: var(--font-size-sm);
            cursor: pointer;
            transition: all var(--transition-fast);
            font-family: var(--font-family);
            white-space: nowrap;
        }
        .gi-tag:hover {
            border-color: var(--color-accent);
            background: var(--color-accent-light);
        }
        .gi-tag.active {
            background: var(--color-accent);
            color: #fff;
            border-color: var(--color-accent);
        }
        .gi-preview-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
            min-width: 0;
        }
        .gi-selected-bar {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            flex-wrap: wrap;
        }
        .gi-selected-tags {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
            flex: 1;
        }
        .gi-selected-tag {
            display: inline-flex;
            align-items: center;
            gap: 2px;
            padding: 2px 10px;
            background: var(--color-accent-light);
            border: 1px solid var(--color-accent);
            border-radius: var(--radius-pill);
            font-size: var(--font-size-sm);
            color: var(--color-accent);
            cursor: pointer;
            white-space: nowrap;
        }
        .gi-selected-tag:hover {
            background: var(--color-accent);
            color: #fff;
        }
        .gi-hint {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
        }
        .gi-preview-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .gi-preview {
            flex: 1;
            min-height: 350px;
            font-family: var(--font-family-mono);
            font-size: var(--font-size-sm);
            line-height: 1.6;
        }
        @media (max-width: 768px) {
            .gi-layout {
                flex-direction: column;
            }
            .gi-select-section {
                flex: none;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const searchInput = container.querySelector('#gi-search');
    const groupsEl = container.querySelector('#gi-groups');
    const selectedTagsEl = container.querySelector('#gi-selected-tags');
    const clearAllBtn = container.querySelector('#gi-clear-all');
    const previewEl = container.querySelector('#gi-preview');

    /**
     * 更新预览
     */
    function updatePreview() {
        if (selected.size === 0) {
            previewEl.value = '';
            selectedTagsEl.innerHTML = '<span class="gi-hint">请从左侧选择模板</span>';
            clearAllBtn.style.display = 'none';
            return;
        }
        const parts = [];
        selected.forEach(name => {
            if (TEMPLATES[name]) {
                parts.push(`# ---- ${name} ----\n${TEMPLATES[name].content}\n`);
            }
        });
        // 去重行
        const lines = parts.join('\n').split('\n');
        const seen = new Set();
        const merged = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('#') || trimmed === '') {
                merged.push(line);
            } else if (!seen.has(trimmed)) {
                seen.add(trimmed);
                merged.push(line);
            }
        }
        previewEl.value = merged.join('\n').replace(/\n{3,}/g, '\n\n');

        // 更新已选标签
        selectedTagsEl.innerHTML = [...selected].map(name =>
            `<span class="gi-selected-tag" data-template="${name}" title="点击移除">${name} ×</span>`
        ).join('');
        clearAllBtn.style.display = 'inline-block';
    }

    /**
     * 切换选择
     */
    function toggleTemplate(name) {
        if (selected.has(name)) {
            selected.delete(name);
        } else {
            selected.add(name);
        }
        // 更新标签激活状态
        groupsEl.querySelectorAll('.gi-tag').forEach(tag => {
            tag.classList.toggle('active', selected.has(tag.dataset.template));
        });
        updatePreview();
    }

    /**
     * 复制文本
     */
    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch { return false; }
    }

    // 标签点击
    groupsEl.addEventListener('click', (e) => {
        const tag = e.target.closest('.gi-tag');
        if (!tag) return;
        toggleTemplate(tag.dataset.template);
    });

    // 已选标签点击移除
    selectedTagsEl.addEventListener('click', (e) => {
        const tag = e.target.closest('.gi-selected-tag');
        if (!tag) return;
        toggleTemplate(tag.dataset.template);
    });

    // 搜索过滤
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        groupsEl.querySelectorAll('.gi-tag').forEach(tag => {
            const name = tag.dataset.template;
            tag.style.display = q && !name.toLowerCase().includes(q) ? 'none' : '';
        });
        groupsEl.querySelectorAll('.gi-group').forEach(group => {
            const visible = group.querySelectorAll('.gi-tag[style*="display: none"]').length <
                group.querySelectorAll('.gi-tag').length;
            group.style.display = visible ? '' : 'none';
        });
    });

    // 清空全部
    clearAllBtn.addEventListener('click', () => {
        selected.clear();
        groupsEl.querySelectorAll('.gi-tag').forEach(tag => tag.classList.remove('active'));
        updatePreview();
    });

    // 复制
    container.querySelector('#gi-copy').addEventListener('click', async () => {
        const text = previewEl.value;
        if (!text) return;
        const btn = container.querySelector('#gi-copy');
        const ok = await copyText(text);
        const orig = btn.textContent;
        btn.textContent = ok ? '✅ 已复制' : '❌';
        _timer = setTimeout(() => { btn.textContent = orig; }, 1500);
    });

    // 下载
    container.querySelector('#gi-download').addEventListener('click', () => {
        const text = previewEl.value;
        if (!text) return;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '.gitignore';
        a.click();
        URL.revokeObjectURL(url);
    });

    let _timer = null;

    return {
        cleanup() {
            if (_timer) clearTimeout(_timer);
        }
    };
}
