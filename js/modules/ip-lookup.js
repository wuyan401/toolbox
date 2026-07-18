/* ============================================
   IP 查询工具 - 自动获取当前公网 IP，支持手动查询
   使用 ip-api.com 免费 API（HTTP，支持国内网络 CORS）
   ============================================ */

export const id = 'ip-lookup';
export const name = 'IP 查询';
export const icon = '🌐';
export const description = '查询 IP 地址详情，包含国家、城市、ISP、时区等信息';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    // 渲染 UI
    container.innerHTML = `
        <div class="ip-layout">
            <!-- 查询栏 -->
            <div class="ip-search-row">
                <input class="input ip-search-input" id="ip-input" placeholder="输入 IP 地址查询（留空则查询当前 IP）" />
                <button class="btn btn-primary" id="ip-lookup-btn">🔍 查询</button>
            </div>
            <!-- 加载状态 -->
            <div class="ip-loading" id="ip-loading" style="display:none;">
                <div class="ip-spinner"></div>
                <span>查询中...</span>
            </div>
            <!-- 错误信息 -->
            <div class="error-msg" id="ip-error" style="display:none;"></div>
            <!-- 结果卡片 -->
            <div class="ip-result-card" id="ip-result" style="display:none;">
                <div class="ip-main-row">
                    <span class="ip-big-ip" id="ip-address-display"></span>
                    <button class="btn btn-sm" id="ip-copy-btn" title="复制 IP">📋 复制</button>
                </div>
                <div class="ip-detail-grid">
                    <div class="ip-detail-item">
                        <span class="ip-detail-label">国家/地区</span>
                        <span class="ip-detail-value" id="ip-country"></span>
                    </div>
                    <div class="ip-detail-item">
                        <span class="ip-detail-label">城市</span>
                        <span class="ip-detail-value" id="ip-city"></span>
                    </div>
                    <div class="ip-detail-item">
                        <span class="ip-detail-label">ISP / 组织</span>
                        <span class="ip-detail-value" id="ip-org"></span>
                    </div>
                    <div class="ip-detail-item">
                        <span class="ip-detail-label">时区</span>
                        <span class="ip-detail-value" id="ip-timezone"></span>
                    </div>
                    <div class="ip-detail-item">
                        <span class="ip-detail-label">经度 / 纬度</span>
                        <span class="ip-detail-value" id="ip-location"></span>
                    </div>
                    <div class="ip-detail-item">
                        <span class="ip-detail-label">邮编</span>
                        <span class="ip-detail-value" id="ip-postal"></span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .ip-layout {
            max-width: 640px;
            margin: 0 auto;
        }
        .ip-search-row {
            display: flex;
            gap: var(--spacing-sm);
        }
        .ip-search-input {
            flex: 1;
        }
        .ip-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-sm);
            padding: var(--spacing-xxl);
            color: var(--color-text-secondary);
            font-size: var(--font-size-md);
        }
        .ip-spinner {
            width: 22px;
            height: 22px;
            border: 2px solid var(--color-border);
            border-top-color: var(--color-accent);
            border-radius: 50%;
            animation: ip-spin 0.6s linear infinite;
        }
        @keyframes ip-spin {
            to { transform: rotate(360deg); }
        }
        .ip-result-card {
            margin-top: var(--spacing-lg);
            background: var(--color-bg-card);
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
            overflow: hidden;
        }
        .ip-main-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: var(--spacing-lg) var(--spacing-xl);
            background: var(--color-bg-sidebar);
        }
        .ip-big-ip {
            font-size: 28px;
            font-weight: 700;
            font-family: "Cascadia Code", "Fira Code", monospace;
            color: #fff;
            letter-spacing: 1px;
        }
        .ip-detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-md);
            padding: var(--spacing-xl);
        }
        .ip-detail-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .ip-detail-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
        }
        .ip-detail-value {
            font-size: var(--font-size-md);
            font-weight: 500;
            color: var(--color-text-primary);
        }
        @media (max-width: 480px) {
            .ip-detail-grid {
                grid-template-columns: 1fr;
            }
            .ip-search-row {
                flex-direction: column;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#ip-input');
    const lookupBtn = container.querySelector('#ip-lookup-btn');
    const loadingEl = container.querySelector('#ip-loading');
    const errorEl = container.querySelector('#ip-error');
    const resultCard = container.querySelector('#ip-result');

    /**
     * 显示加载状态
     */
    function showLoading() {
        loadingEl.style.display = 'flex';
        errorEl.style.display = 'none';
        resultCard.style.display = 'none';
    }

    /**
     * 显示错误
     * @param {string} msg
     */
    function showError(msg) {
        loadingEl.style.display = 'none';
        resultCard.style.display = 'none';
        errorEl.textContent = '❌ ' + msg;
        errorEl.style.display = 'block';
    }

    /**
     * 显示结果
     * @param {object} data - IP 查询结果（ip-api.com 字段）
     */
    function showResult(data) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'none';
        resultCard.style.display = 'block';

        container.querySelector('#ip-address-display').textContent = data.query || '-';
        container.querySelector('#ip-country').textContent = data.country || '-';
        container.querySelector('#ip-city').textContent = data.city || '-';
        container.querySelector('#ip-org').textContent = data.isp || data.org || '-';
        container.querySelector('#ip-timezone').textContent = data.timezone || '-';
        container.querySelector('#ip-location').textContent =
            (data.lat && data.lon) ? `${data.lat}, ${data.lon}` : '-';
        container.querySelector('#ip-postal').textContent = data.postal || data.zip || '-';
    }

    /**
     * 查询 IP 信息
     * @param {string} [ip] - IP 地址，不传则查询当前公网 IP
     */
    async function lookup(ip) {
        showLoading();
        try {
            // ip-api.com 免费版仅支持 HTTP，不支持 HTTPS
            const url = ip
                ? `http://ip-api.com/json/${encodeURIComponent(ip)}?lang=zh-CN&fields=query,country,city,regionName,isp,org,timezone,lat,lon`
                : `http://ip-api.com/json/?lang=zh-CN&fields=query,country,city,regionName,isp,org,timezone,lat,lon`;
            const resp = await fetch(url);
            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
            }
            const data = await resp.json();
            if (data.status === 'fail') {
                throw new Error(data.message || '查询失败');
            }
            showResult(data);
            // 如果查询的是指定 IP，回填输入框；否则清空
            if (ip) {
                inputEl.value = ip;
            } else {
                inputEl.value = '';
            }
        } catch (err) {
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                showError('网络请求失败，请检查网络连接');
            } else {
                showError(err.message);
            }
        }
    }

    // 事件绑定
    let _copyTimer = null;
    lookupBtn.addEventListener('click', doLookup);
    inputEl.addEventListener('keydown', onKeydown);
    container.querySelector('#ip-copy-btn').addEventListener('click', onCopy);

    function doLookup() {
        const ip = inputEl.value.trim();
        lookup(ip || null);
    }
    function onKeydown(e) {
        if (e.key === 'Enter') {
            const ip = inputEl.value.trim();
            lookup(ip || null);
        }
    }
    async function onCopy() {
        const ipText = container.querySelector('#ip-address-display').textContent;
        if (!ipText || ipText === '-') return;
        try {
            await navigator.clipboard.writeText(ipText);
            const btn = container.querySelector('#ip-copy-btn');
            const original = btn.textContent;
            btn.textContent = '✅ 已复制';
            _copyTimer = setTimeout(() => { btn.textContent = original; }, 1500);
        } catch { /* ignore */ }
    }

    // 页面加载时自动查询当前 IP
    lookup(null);

    return {
        cleanup() {
            lookupBtn.removeEventListener('click', doLookup);
            inputEl.removeEventListener('keydown', onKeydown);
            if (_copyTimer) clearTimeout(_copyTimer);
        }
    };
}

/** Simple cross-browser copy */
function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
}
