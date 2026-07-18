/* ============================================
   摩斯电码 - 文本↔摩斯电码双向转换
   AudioContext 长短 beep 播放，对照表参考
   ============================================ */

export const id = 'morse-code';
export const name = '摩斯电码';
export const icon = '📻';
export const description = '文本↔摩斯电码转换，播放声音，对照表参考';
export const category = '趣味工具';
export const enabled = true;

/** 摩斯电码对照表 */
const MORSE_MAP = {
    'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
    'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
    'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
    'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
    '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
    '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
    '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
    '$': '...-..-', '@': '.--.-.', ' ': '/'
};

/** 反向映射 */
const REVERSE_MAP = {};
for (const [char, code] of Object.entries(MORSE_MAP)) {
    REVERSE_MAP[code] = char;
}

/** DOT 时长 (ms) — 以此为基准单位 */
const DOT_MS = 80;
const DASH_MS = DOT_MS * 3;
const SYMBOL_GAP = DOT_MS;
const LETTER_GAP = DOT_MS * 3;
const WORD_GAP = DOT_MS * 7;

export function init(container) {
    let _timers = [];
    let isPlaying = false;
    let audioCtx = null;

    container.innerHTML = `
        <div class="mc-layout">
            <div class="mc-mode-bar">
                <button class="mc-mode-btn active" data-mode="text2morse">📝 文本 → 摩斯</button>
                <button class="mc-mode-btn" data-mode="morse2text">📻 摩斯 → 文本</button>
            </div>

            <div class="mc-io">
                <div class="mc-io-panel">
                    <label class="mc-label" id="mc-input-label">输入文本</label>
                    <textarea class="mc-textarea" id="mc-input" rows="6" placeholder="输入文本…"></textarea>
                    <div class="mc-input-actions">
                        <span class="mc-char-count" id="mc-input-count">0 字</span>
                        <button class="btn btn-sm" id="mc-clear">🗑️ 清空</button>
                    </div>
                </div>

                <div class="mc-io-arrow">→</div>

                <div class="mc-io-panel">
                    <label class="mc-label" id="mc-output-label">摩斯电码</label>
                    <div class="mc-output-box" id="mc-output-box">
                        <span class="mc-output-text" id="mc-output-text"></span>
                    </div>
                    <div class="mc-output-actions">
                        <span class="mc-char-count" id="mc-output-count">--</span>
                        <button class="btn btn-sm" id="mc-copy">📋 复制</button>
                        <button class="btn btn-sm" id="mc-play" title="播放">🔊 播放</button>
                        <button class="btn btn-sm" id="mc-stop" title="停止" disabled>⏹️ 停止</button>
                    </div>
                </div>
            </div>

            <!-- 对照表 -->
            <details class="mc-ref-section">
                <summary class="mc-ref-title">📖 摩斯电码对照表</summary>
                <div class="mc-ref-grid" id="mc-ref-grid"></div>
            </details>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .mc-layout {
            max-width: 900px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        .mc-mode-bar {
            display: flex;
            gap: var(--spacing-sm);
        }
        .mc-mode-btn {
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
        .mc-mode-btn:hover { border-color: var(--color-accent); }
        .mc-mode-btn.active { background: var(--color-accent); color:#fff; border-color:var(--color-accent); }
        .mc-io {
            display: flex;
            gap: var(--spacing-lg);
            align-items: stretch;
        }
        .mc-io-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
            min-width: 0;
        }
        .mc-label {
            font-size: var(--font-size-sm);
            font-weight: 600;
            color: var(--color-text-secondary);
        }
        .mc-io-arrow {
            display: flex;
            align-items: center;
            font-size: 24px;
            color: var(--color-text-muted);
            flex-shrink: 0;
        }
        .mc-textarea {
            width: 100%;
            padding: var(--spacing-md);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-bg-input);
            color: var(--color-text-primary);
            font-size: var(--font-size-md);
            font-family: var(--font-family);
            outline: none;
            resize: vertical;
            line-height: 1.8;
            min-height: 150px;
            transition: border-color var(--transition-fast);
        }
        .mc-textarea:focus {
            border-color: var(--color-accent);
            box-shadow: 0 0 0 3px var(--color-accent-light);
        }
        .mc-output-box {
            flex: 1;
            padding: var(--spacing-lg);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-bg-input);
            min-height: 150px;
            overflow-y: auto;
        }
        .mc-output-text {
            font-family: var(--font-family-mono);
            font-size: var(--font-size-lg);
            color: var(--color-text-primary);
            word-break: break-all;
            line-height: 1.8;
            letter-spacing: 2px;
        }
        .mc-input-actions, .mc-output-actions {
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
        }
        .mc-char-count {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
            flex: 1;
        }
        .mc-ref-section {
            border-top: 1px solid var(--color-border);
            padding-top: var(--spacing-md);
        }
        .mc-ref-title {
            font-size: var(--font-size-md);
            font-weight: 600;
            color: var(--color-text-primary);
            cursor: pointer;
            user-select: none;
            padding: var(--spacing-sm) 0;
        }
        .mc-ref-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: var(--spacing-xs);
            margin-top: var(--spacing-sm);
            max-height: 250px;
            overflow-y: auto;
        }
        .mc-ref-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 10px;
            background: var(--color-bg-secondary);
            border-radius: var(--radius-sm);
            font-size: var(--font-size-sm);
            font-family: var(--font-family-mono);
        }
        .mc-ref-char {
            font-weight: 700;
            color: var(--color-accent);
            font-size: var(--font-size-md);
        }
        .mc-ref-code {
            color: var(--color-text-secondary);
        }
        @media (max-width: 700px) {
            .mc-io { flex-direction: column; }
            .mc-io-arrow { transform: rotate(90deg); justify-content: center; }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#mc-input');
    const outputText = container.querySelector('#mc-output-text');
    const outputBox = container.querySelector('#mc-output-box');
    const inputLabel = container.querySelector('#mc-input-label');
    const outputLabel = container.querySelector('#mc-output-label');
    const inputCount = container.querySelector('#mc-input-count');
    const outputCountEl = container.querySelector('#mc-output-count');
    const playBtn = container.querySelector('#mc-play');
    const stopBtn = container.querySelector('#mc-stop');
    const modeBtns = container.querySelectorAll('.mc-mode-btn');

    let mode = 'text2morse'; // 'text2morse' | 'morse2text'

    /**
     * 文本 → 摩斯电码
     */
    function textToMorse(text) {
        const upper = text.toUpperCase();
        const parts = [];
        for (const ch of upper) {
            if (MORSE_MAP[ch] !== undefined) {
                parts.push(MORSE_MAP[ch]);
            }
            // 忽略不支持的字符
        }
        return parts.join(' ');
    }

    /**
     * 摩斯电码 → 文本
     */
    function morseToText(morse) {
        // 分割：单词间用 '/' 或 多个空格
        const words = morse.split(/\s*\/\s*|\s{3,}/);
        const result = [];
        for (const word of words) {
            const chars = word.trim().split(/\s+/);
            for (const code of chars) {
                if (REVERSE_MAP[code] !== undefined) {
                    result.push(REVERSE_MAP[code]);
                }
            }
            result.push(' ');
        }
        return result.join('').trim();
    }

    /**
     * 更新输出
     */
    function update() {
        const text = inputEl.value;
        if (!text) {
            outputText.textContent = '';
            outputCountEl.textContent = '--';
            inputCount.textContent = '0 字';
            return;
        }

        inputCount.textContent = text.length + ' 字';

        let result;
        if (mode === 'text2morse') {
            result = textToMorse(text);
        } else {
            result = morseToText(text);
            outputCountEl.textContent = result.length + ' 字';
        }
        outputText.textContent = result;
        outputCountEl.textContent = result.length + ' 字符';
    }

    /**
     * 设置模式
     */
    function setMode(newMode) {
        mode = newMode;
        modeBtns.forEach(b => b.classList.remove('active'));
        const btn = container.querySelector(`.mc-mode-btn[data-mode="${newMode}"]`);
        if (btn) btn.classList.add('active');

        if (mode === 'text2morse') {
            inputLabel.textContent = '输入文本';
            outputLabel.textContent = '摩斯电码';
            inputEl.placeholder = '输入文本…';
        } else {
            inputLabel.textContent = '输入摩斯电码';
            outputLabel.textContent = '解码文本';
            inputEl.placeholder = '输入摩斯电码 (. / - 分隔)…';
        }
        update();
    }

    /**
     * 播放摩斯电码声音
     */
    async function playMorse(morseStr) {
        if (isPlaying) return;
        isPlaying = true;
        playBtn.disabled = true;
        stopBtn.disabled = false;

        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            const now = audioCtx.currentTime;
            let t = 0;
            const signals = []; // { start, duration }

            for (const ch of morseStr) {
                switch (ch) {
                    case '.': signals.push({ start: t, duration: DOT_MS }); t += DOT_MS + SYMBOL_GAP; break;
                    case '-': signals.push({ start: t, duration: DASH_MS }); t += DASH_MS + SYMBOL_GAP; break;
                    case ' ': t += LETTER_GAP - SYMBOL_GAP; break;
                    case '/': t += WORD_GAP - SYMBOL_GAP; break;
                }
            }

            // 创建音调
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 700;
            gain.gain.setValueAtTime(0, now);

            // 按时间安排信号
            for (const { start, duration } of signals) {
                const s = now + start / 1000;
                const d = duration / 1000;
                gain.gain.setValueAtTime(0.3, s);
                gain.gain.setValueAtTime(0.3, s + d - 0.001);
                gain.gain.setValueAtTime(0, s + d);
            }

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + (t + 200) / 1000);

            return new Promise((resolve) => {
                const check = setInterval(() => {
                    if (audioCtx.currentTime >= now + (t + 200) / 1000) {
                        clearInterval(check);
                        resolve();
                    }
                }, 50);
            });
        } finally {
            isPlaying = false;
            playBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    /**
     * 停止播放
     */
    function stopPlay() {
        if (audioCtx && audioCtx.state === 'running') {
            audioCtx.close().then(() => {
                audioCtx = null;
            });
        }
        isPlaying = false;
        playBtn.disabled = false;
        stopBtn.disabled = true;
    }

    /**
     * 渲染对照表
     */
    function renderRef() {
        const grid = container.querySelector('#mc-ref-grid');
        const entries = Object.entries(MORSE_MAP)
            .filter(([char]) => char !== ' ')
            .sort((a, b) => a[0].localeCompare(b[0]));
        grid.innerHTML = entries.map(([char, code]) => `
            <div class="mc-ref-item">
                <span class="mc-ref-char">${char}</span>
                <span class="mc-ref-code">${code}</span>
            </div>
        `).join('');
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
        btn.addEventListener('click', () => setMode(btn.dataset.mode));
    });

    // 事件：清空
    container.querySelector('#mc-clear').addEventListener('click', () => {
        inputEl.value = '';
        outputText.textContent = '';
        update();
        inputEl.focus();
    });

    // 事件：复制
    container.querySelector('#mc-copy').addEventListener('click', async () => {
        const text = outputText.textContent;
        if (!text) return;
        const ok = await copyText(text);
        const btn = container.querySelector('#mc-copy');
        const orig = btn.textContent;
        btn.textContent = ok ? '✅' : '❌';
        _timers.push(setTimeout(() => { btn.textContent = orig; }, 1500));
    });

    // 事件：播放
    playBtn.addEventListener('click', async () => {
        const morseStr = mode === 'text2morse' ? outputText.textContent : inputEl.value;
        if (!morseStr) return;
        const origText = playBtn.textContent;
        playBtn.textContent = '🔊 播放中…';
        await playMorse(morseStr);
        playBtn.textContent = origText;
    });

    // 事件：停止
    stopBtn.addEventListener('click', stopPlay);

    // 初始化
    renderRef();
    update();

    return {
        cleanup() {
            _timers.forEach(t => clearTimeout(t));
            if (audioCtx) {
                audioCtx.close().catch(() => {});
                audioCtx = null;
            }
            isPlaying = false;
        }
    };
}
