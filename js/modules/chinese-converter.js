/* ============================================
   简繁转换 - 简体↔繁体双向转换
   100+ 词组对照表实现
   ============================================ */

export const id = 'chinese-converter';
export const name = '简繁转换';
export const icon = '🈶';
export const description = '简体↔繁体双向转换，100+常用词汇对照';
export const category = '办公工具';
export const enabled = true;

/**
 * 简→繁 常用词汇对照表（100+词组）
 * 基于 Wikipedia 简繁转换词汇表
 */
const S2T_WORDS = {
    // 单字 (高频)
    '干': '幹', '干': '乾', '后': '後', '系': '繫',
    '历': '歷', '历': '曆', '发': '發', '发': '髮',
    '只': '隻', '只': '衹', '松': '鬆', '郁': '鬱',
    '面': '麵', '范': '範', '余': '餘', '御': '禦',
    '征': '徵', '冲': '衝', '复': '複', '复': '復',
    '舍': '捨', '云': '雲', '几': '幾', '斗': '鬥',
    '里': '裡', '表': '錶', '脏': '臟', '脏': '髒',
    '钟': '鐘', '钟': '鍾',

    // 二字词
    '什么': '什麼', '为什么': '為什麼', '怎么': '怎麼',
    '没关系': '沒關係', '认识': '認識', '运动': '運動',
    '这里': '這裡', '那里': '那裡', '哪里': '哪裡',
    '学习': '學習', '学习': '教學', '网络': '網絡',
    '程序': '程式', '软件': '軟體', '硬件': '硬體',
    '鼠标': '滑鼠', '屏幕': '螢幕', '文件': '檔案',
    '内存': '記憶體', '硬盘': '硬碟', '光盘': '光碟',
    '打印机': '印表機', '服务器': '伺服器', '数据库': '資料庫',
    '互联网': '網際網路', '信息': '資訊', '数据': '資料',
    '计算机': '電腦', '笔记本': '筆記型電腦', '手机': '行動電話',
    '电话': '電話', '短信': '簡訊', '视频': '視訊',
    '质量': '品質', '水平': '水準', '素质': '素質',
    '联系': '聯繫', '关系': '關係', '系统': '系統',
    '发展': '發展', '经济': '經濟', '政治': '政治',
    '文化': '文化', '技术': '技術', '科学': '科學',
    '教育': '教育', '艺术': '藝術', '历史': '歷史',
    '社会': '社會', '国家': '國家', '世界': '世界',
    '人民': '人民', '企业': '企業', '市场': '市場',
    '问题': '問題', '方法': '方法', '方式': '方式',
    '通过': '透過', '实现': '實現', '完成': '完成',
    '设计': '設計', '开发': '開發', '测试': '測試',
    '管理': '管理', '控制': '控制', '分析': '分析',
    '项目': '專案', '团队': '團隊', '组织': '組織',
    '服务': '服務', '产品': '產品', '客户': '客戶',
    '用户': '使用者', '访问': '存取', '存储': '儲存',
    '备份': '備份', '恢复': '還原', '更新': '更新',
    '安装': '安裝', '配置': '組態', '支持': '支援',
    '运行': '執行', '启动': '啟動', '关闭': '關閉',
    '输入': '輸入', '输出': '輸出', '编辑': '編輯',
    '选择': '選擇', '搜索': '搜尋', '查找': '尋找',
    '下载': '下載', '上传': '上傳', '保存': '儲存',
    '删除': '刪除', '添加': '新增', '修改': '修改',
    '创建': '建立', '设置': '設定', '默认': '預設',
    '帮助': '說明', '反馈': '回饋', '评论': '評論',
    '发布': '發佈', '订阅': '訂閱', '注册': '註冊',
    '登录': '登入', '注销': '登出', '密码': '密碼',
    '安全': '安全', '验证': '驗證', '确认': '確認',
    '取消': '取消', '继续': '繼續', '返回': '返回',
    '重新': '重新', '加载': '載入', '显示': '顯示',
    '隐藏': '隱藏', '选项': '選項', '菜单': '選單',
    '窗口': '視窗', '标签': '標籤', '按钮': '按鈕',
    // 继续补充
    '语言': '語言', '文字': '文字', '字母': '字母',
    '数字': '數字', '签名': '簽名', '证书': '憑證',
    '算法': '演算法', '函数': '函式', '变量': '變數',
    '对象': '物件', '接口': '介面', '参数': '參數',
    '属性': '屬性', '方法': '方法', '事件': '事件',
    '消息': '訊息', '错误': '錯誤', '警告': '警告',
    '提示': '提示', '进度': '進度', '状态': '狀態',
    '版本': '版本', '类型': '類型', '格式': '格式',
    '链接': '連結', '地址': '位址', '路径': '路徑',
    '目录': '目錄', '页面': '頁面', '站点': '網站',
    '博客': '部落格', '论坛': '論壇', '社区': '社群',
};

/**
 * 繁体→简体（反向映射）
 */
const T2S_WORDS = {};
for (const [s, t] of Object.entries(S2T_WORDS)) {
    T2S_WORDS[t] = s;
}

// 补充单字映射（常用简繁一对一关系）
const S2T_CHARS = {
    '国': '國', '学': '學', '习': '習', '会': '會',
    '开': '開', '关': '關', '门': '門', '车': '車',
    '马': '馬', '鱼': '魚', '鸟': '鳥', '龙': '龍',
    '风': '風', '电': '電', '气': '氣', '话': '話',
    '说': '說', '读': '讀', '写': '寫', '见': '見',
    '问': '問', '闻': '聞', '间': '間', '闲': '閒',
    '东': '東', '南': '南', '西': '西', '北': '北',
    '时': '時', '间': '間', '长': '長', '短': '短',
    '高': '高', '低': '低', '大': '大', '小': '小',
    '多': '多', '少': '少', '新': '新', '旧': '舊',
    '来': '來', '去': '去', '进': '進', '出': '出',
    '买': '買', '卖': '賣', '给': '給', '得': '得',
    '让': '讓', '请': '請', '谢': '謝', '欢': '歡',
    '爱': '愛', '觉': '覺', '记': '記', '号': '號',
    '机': '機', '线': '線', '网': '網', '点': '點',
    '头': '頭', '体': '體', '书': '書', '画': '畫',
    '图': '圖', '标': '標', '准': '準', '确': '確',
    '实': '實', '质': '質', '量': '量', '数': '數',
    '据': '據', '据': '據', '无': '無', '为': '為',
    '当': '當', '应': '應', '该': '該', '能': '能',
    '可': '可', '以': '以', '对': '對', '从': '從',
    '将': '將', '被': '被', '把': '把', '与': '與',
    '或': '或', '和': '和', '且': '且', '而': '而',
    '这': '這', '那': '那', '哪': '哪', '每': '每',
    '你': '你', '我': '我', '他': '他', '她': '她',
    '们': '們', '吗': '嗎', '吧': '吧', '呢': '呢',
    '啊': '啊', '了': '了', '着': '著', '过': '過',
    '着': '著', '在': '在', '不': '不', '很': '很',
    '都': '都', '也': '也', '就': '就', '才': '才',
    '还': '還', '又': '又', '再': '再', '只': '只',
    '已': '已', '经': '經', '正': '正', '要': '要',
};

// 反向
const T2S_CHARS = {};
for (const [s, t] of Object.entries(S2T_CHARS)) {
    T2S_CHARS[t] = s;
}

export function init(container) {
    let _timers = [];
    let mode = 's2t'; // 's2t' 简体→繁体 或 't2s' 繁体→简体

    container.innerHTML = `
        <div class="ccv-layout">
            <div class="ccv-mode-bar">
                <button class="ccv-mode-btn active" data-mode="s2t">🇨🇳 简体 → 繁体 🇭🇰</button>
                <button class="ccv-mode-btn" data-mode="t2s">🇭🇰 繁体 → 简体 🇨🇳</button>
                <button class="btn btn-sm ccv-swap-btn" id="ccv-swap" title="互换方向">🔄</button>
            </div>

            <div class="ccv-io">
                <div class="ccv-io-panel">
                    <label class="ccv-io-label" id="ccv-input-label">原文 (简体)</label>
                    <textarea class="ccv-textarea" id="ccv-input" rows="8" placeholder="在此输入文本…"></textarea>
                    <div class="ccv-io-actions">
                        <span class="ccv-char-count" id="ccv-input-count">0 字</span>
                        <button class="btn btn-sm" id="ccv-clear-input">🗑️ 清空</button>
                    </div>
                </div>

                <div class="ccv-io-arrow">→</div>

                <div class="ccv-io-panel">
                    <label class="ccv-io-label" id="ccv-output-label">译文 (繁体)</label>
                    <textarea class="ccv-textarea" id="ccv-output" rows="8" readonly placeholder="转换结果…"></textarea>
                    <div class="ccv-io-actions">
                        <span class="ccv-char-count" id="ccv-output-count">0 字</span>
                        <button class="btn btn-sm" id="ccv-copy-output">📋 复制结果</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .ccv-layout {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        .ccv-mode-bar {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            flex-wrap: wrap;
        }
        .ccv-mode-btn {
            padding: 8px 20px;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-pill);
            background: var(--color-bg-secondary);
            color: var(--color-text-secondary);
            font-size: var(--font-size-md);
            font-weight: 600;
            cursor: pointer;
            transition: all var(--transition-fast);
        }
        .ccv-mode-btn:hover {
            border-color: var(--color-accent);
        }
        .ccv-mode-btn.active {
            background: var(--color-accent);
            color: #fff;
            border-color: var(--color-accent);
        }
        .ccv-swap-btn {
            margin-left: auto;
        }
        .ccv-io {
            display: flex;
            gap: var(--spacing-lg);
            align-items: stretch;
        }
        .ccv-io-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
            min-width: 0;
        }
        .ccv-io-label {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
        }
        .ccv-io-arrow {
            display: flex;
            align-items: center;
            font-size: 24px;
            color: var(--color-text-muted);
            flex-shrink: 0;
        }
        .ccv-textarea {
            flex: 1;
            width: 100%;
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
            min-height: 180px;
            transition: border-color var(--transition-fast);
        }
        .ccv-textarea:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 3px var(--color-accent-light);
        }
        .ccv-io-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .ccv-char-count {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
        }
        @media (max-width: 700px) {
            .ccv-io {
                flex-direction: column;
            }
            .ccv-io-arrow {
                transform: rotate(90deg);
                justify-content: center;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#ccv-input');
    const outputEl = container.querySelector('#ccv-output');
    const inputLabel = container.querySelector('#ccv-input-label');
    const outputLabel = container.querySelector('#ccv-output-label');
    const inputCount = container.querySelector('#ccv-input-count');
    const outputCount = container.querySelector('#ccv-output-count');
    const modeBtns = container.querySelectorAll('.ccv-mode-btn');

    /**
     * 执行转换
     * @param {string} text - 输入文本
     * @param {string} direction - 's2t' | 't2s'
     */
    function convert(text, direction) {
        if (!text) return '';

        // 1. 先替换二字及以上词组（按长度降序，避免短词优先匹配）
        const words = direction === 's2t' ? S2T_WORDS : T2S_WORDS;
        const sortedKeys = Object.keys(words).sort((a, b) => b.length - a.length);

        let result = text;
        for (const key of sortedKeys) {
            const val = words[key];
            // 使用正则替换避免重复替换已替换内容
            result = result.split(key).join(val);
        }

        // 2. 再替换单字
        const chars = direction === 's2t' ? S2T_CHARS : T2S_CHARS;
        for (const [c, tc] of Object.entries(chars)) {
            result = result.split(c).join(tc);
        }

        return result;
    }

    /**
     * 更新输出
     */
    function update() {
        const text = inputEl.value;
        const converted = convert(text, mode);
        outputEl.value = converted;
        inputCount.textContent = text.length + ' 字';
        outputCount.textContent = converted.length + ' 字';
    }

    /**
     * 设置模式
     */
    function setMode(newMode) {
        mode = newMode;
        modeBtns.forEach(b => b.classList.remove('active'));
        const activeBtn = container.querySelector(`.ccv-mode-btn[data-mode="${newMode}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        if (mode === 's2t') {
            inputLabel.textContent = '原文 (简体)';
            outputLabel.textContent = '译文 (繁体)';
        } else {
            inputLabel.textContent = '原文 (繁体)';
            outputLabel.textContent = '译文 (简体)';
        }
        update();
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

    // 事件：输入
    inputEl.addEventListener('input', update);

    // 事件：模式切换
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setMode(btn.dataset.mode);
        });
    });

    // 事件：互换方向
    container.querySelector('#ccv-swap').addEventListener('click', () => {
        const newMode = mode === 's2t' ? 't2s' : 's2t';
        // 也交换输入输出的内容
        const currentOutput = outputEl.value;
        inputEl.value = currentOutput;
        setMode(newMode);
        outputEl.value = convert(currentOutput, newMode);
        outputCount.textContent = outputEl.value.length + ' 字';
        inputCount.textContent = currentOutput.length + ' 字';
    });

    // 事件：清空
    container.querySelector('#ccv-clear-input').addEventListener('click', () => {
        inputEl.value = '';
        outputEl.value = '';
        update();
        inputEl.focus();
    });

    // 事件：复制结果
    container.querySelector('#ccv-copy-output').addEventListener('click', async () => {
        const text = outputEl.value;
        if (!text) return;
        const ok = await copyText(text);
        const btn = container.querySelector('#ccv-copy-output');
        const orig = btn.textContent;
        btn.textContent = ok ? '✅ 已复制' : '❌ 失败';
        _timers.push(setTimeout(() => { btn.textContent = orig; }, 1500));
    });

    return {
        cleanup() {
            _timers.forEach(t => clearTimeout(t));
        }
    };
}
