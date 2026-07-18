/* ============================================
   番茄钟 - 大圆环倒计时，工作/休息模式切换，
   浏览器通知，简单 beep 音效
   ============================================ */

export const id = 'pomodoro-timer';
export const name = '番茄钟';
export const icon = '🍅';
export const description = '番茄工作法计时器，25分钟专注/5分钟休息，支持浏览器通知';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    // 状态
    const WORK_MIN = 25;
    const BREAK_MIN = 5;
    let mode = 'work'; // 'work' | 'break'
    let totalSeconds = WORK_MIN * 60;
    let remaining = totalSeconds;
    let running = false;
    let timerId = null;
    let completedCount = 0;

    container.innerHTML = `
        <div class="pomo-layout">
            <!-- 左侧：圆环计时器 -->
            <div class="pomo-ring-section">
                <div class="pomo-ring-wrapper" id="pomo-ring-wrapper">
                    <svg class="pomo-ring-svg" viewBox="0 0 200 200">
                        <circle class="pomo-ring-bg" cx="100" cy="100" r="88"
                            fill="none" stroke-width="10" />
                        <circle class="pomo-ring-progress" id="pomo-ring-progress"
                            cx="100" cy="100" r="88"
                            fill="none" stroke-width="10"
                            stroke-dasharray="553" stroke-dashoffset="0"
                            stroke-linecap="round" />
                    </svg>
                    <div class="pomo-ring-center">
                        <div class="pomo-time" id="pomo-time">25:00</div>
                        <div class="pomo-mode" id="pomo-mode">专注工作</div>
                    </div>
                </div>

                <!-- 按钮 -->
                <div class="pomo-controls">
                    <button class="btn btn-primary pomo-btn-main" id="pomo-toggle">
                        ▶ 开始
                    </button>
                    <button class="btn pomo-btn-reset" id="pomo-reset">↺ 重置</button>
                </div>
            </div>

            <!-- 右侧：信息面板 -->
            <div class="pomo-info-section">
                <div class="pomo-mode-switch">
                    <button class="pomo-mode-btn active" data-mode="work" id="pomo-work-btn">
                        🍅 工作 ${WORK_MIN}min
                    </button>
                    <button class="pomo-mode-btn" data-mode="break" id="pomo-break-btn">
                        ☕ 休息 ${BREAK_MIN}min
                    </button>
                </div>

                <div class="pomo-stats">
                    <div class="pomo-stat-card">
                        <div class="pomo-stat-value" id="pomo-completed">0</div>
                        <div class="pomo-stat-label">今日完成</div>
                    </div>
                </div>

                <div class="pomo-audio-toggle">
                    <label class="pg-check-label">
                        <input type="checkbox" id="pomo-sound" checked /> 提示音
                    </label>
                    <label class="pg-check-label">
                        <input type="checkbox" id="pomo-notify" checked /> 通知
                    </label>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .pomo-layout {
            display: flex;
            gap: var(--spacing-xxl);
            align-items: flex-start;
            min-height: 0;
        }
        .pomo-ring-section {
            flex: 0 0 380px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-xl);
        }
        .pomo-ring-wrapper {
            position: relative;
            width: 280px;
            height: 280px;
        }
        .pomo-ring-svg {
            width: 100%;
            height: 100%;
            transform: rotate(-90deg);
        }
        .pomo-ring-bg {
            stroke: var(--color-bg-input);
        }
        .pomo-ring-progress {
            stroke: var(--color-accent);
            transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
        }
        .pomo-ring-center {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-xs);
        }
        .pomo-time {
            font-family: var(--font-family-mono);
            font-size: 52px;
            font-weight: 600;
            color: var(--color-text-primary);
            letter-spacing: 2px;
            line-height: 1;
        }
        .pomo-mode {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            font-weight: 500;
        }
        .pomo-controls {
            display: flex;
            gap: var(--spacing-md);
        }
        .pomo-btn-main {
            padding: var(--spacing-md) var(--spacing-xxl);
            font-size: var(--font-size-lg);
            font-weight: 600;
            min-width: 140px;
        }
        .pomo-btn-reset {
            padding: var(--spacing-md) var(--spacing-lg);
        }
        .pomo-info-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
        }
        .pomo-mode-switch {
            display: flex;
            gap: var(--spacing-sm);
        }
        .pomo-mode-btn {
            flex: 1;
            padding: var(--spacing-md);
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            background: var(--color-bg-card);
            color: var(--color-text-secondary);
            font-size: var(--font-size-md);
            font-weight: 500;
            cursor: pointer;
            transition: all var(--transition-fast);
            font-family: var(--font-family);
        }
        .pomo-mode-btn.active {
            border-color: var(--color-accent);
            background: var(--color-accent-light);
            color: var(--color-accent);
            font-weight: 600;
        }
        .pomo-mode-btn:hover:not(.active) {
            border-color: var(--color-text-muted);
        }
        .pomo-stats {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
        }
        .pomo-stat-card {
            text-align: center;
            padding: var(--spacing-xl);
            background: var(--color-bg-card);
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
        }
        .pomo-stat-value {
            font-size: 48px;
            font-weight: 700;
            color: var(--color-accent);
            font-family: var(--font-display);
            line-height: 1;
        }
        .pomo-stat-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-secondary);
            margin-top: var(--spacing-xs);
        }
        .pomo-audio-toggle {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
        @media (max-width: 768px) {
            .pomo-layout {
                flex-direction: column;
                align-items: center;
            }
            .pomo-ring-section {
                flex: none;
            }
            .pomo-info-section {
                width: 100%;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const ringProgress = container.querySelector('#pomo-ring-progress');
    const timeEl = container.querySelector('#pomo-time');
    const modeEl = container.querySelector('#pomo-mode');
    const toggleBtn = container.querySelector('#pomo-toggle');
    const resetBtn = container.querySelector('#pomo-reset');
    const workBtn = container.querySelector('#pomo-work-btn');
    const breakBtn = container.querySelector('#pomo-break-btn');
    const completedEl = container.querySelector('#pomo-completed');
    const soundCb = container.querySelector('#pomo-sound');
    const notifyCb = container.querySelector('#pomo-notify');

    const CIRCUMFERENCE = 2 * Math.PI * 88; // ~553

    // 读取今日完成数
    const todayKey = 'pomo-today-' + new Date().toISOString().slice(0, 10);
    try { completedCount = parseInt(localStorage.getItem(todayKey) || '0', 10); } catch(e) { completedCount = 0; }
    completedEl.textContent = completedCount;

    /**
     * 格式化时间显示
     */
    function formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    /**
     * 更新圆环 + 时间显示
     */
    function updateDisplay() {
        timeEl.textContent = formatTime(remaining);
        const fraction = remaining / totalSeconds;
        ringProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);
    }

    /**
     * 播放 beep 音效
     */
    function playBeep() {
        if (!soundCb.checked) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            // 静默忽略
        }
    }

    /**
     * 发送浏览器通知
     */
    function sendNotification(title, body) {
        if (!notifyCb.checked) return;
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '🍅' });
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(p => {
                if (p === 'granted') {
                    new Notification(title, { body, icon: '🍅' });
                }
            });
        }
    }

    /**
     * 计时完成
     */
    function onComplete() {
        running = false;
        if (timerId) { clearInterval(timerId); timerId = null; }
        playBeep();

        if (mode === 'work') {
            completedCount++;
            completedEl.textContent = completedCount;
            try { localStorage.setItem(todayKey, String(completedCount)); } catch(e) {}
            sendNotification('🍅 番茄钟', '工作完成！休息一下吧~');
            // 自动切换到休息模式
            switchMode('break');
        } else {
            sendNotification('☕ 休息结束', '休息结束，继续工作吧！');
            // 自动切换到工作模式
            switchMode('work');
        }
        updateDisplay();
        updateToggleBtn();
    }

    /**
     * 切换模式
     */
    function switchMode(newMode) {
        mode = newMode;
        totalSeconds = mode === 'work' ? WORK_MIN * 60 : BREAK_MIN * 60;
        remaining = totalSeconds;
        running = false;
        if (timerId) { clearInterval(timerId); timerId = null; }

        // 更新圆环颜色
        ringProgress.style.stroke = mode === 'work' ? 'var(--color-accent)' : '#22c55e';
        modeEl.textContent = mode === 'work' ? '专注工作' : '休息一下';
        timeEl.style.color = mode === 'work' ? 'var(--color-text-primary)' : '#22c55e';

        // 更新模式按钮
        workBtn.classList.toggle('active', mode === 'work');
        breakBtn.classList.toggle('active', mode === 'break');

        updateDisplay();
        updateToggleBtn();
    }

    /**
     * 更新开始/暂停按钮
     */
    function updateToggleBtn() {
        toggleBtn.textContent = running ? '⏸ 暂停' : '▶ 开始';
        toggleBtn.classList.toggle('btn-primary', !running);
    }

    /**
     * 开始/恢复计时
     */
    function startTimer() {
        if (remaining <= 0) {
            remaining = totalSeconds;
            updateDisplay();
        }
        running = true;
        updateToggleBtn();

        timerId = setInterval(() => {
            remaining--;
            updateDisplay();
            if (remaining <= 0) {
                onComplete();
            }
        }, 1000);
    }

    /**
     * 暂停计时
     */
    function pauseTimer() {
        running = false;
        if (timerId) { clearInterval(timerId); timerId = null; }
        updateToggleBtn();
    }

    /**
     * 重置
     */
    function resetTimer() {
        pauseTimer();
        remaining = totalSeconds;
        updateDisplay();
    }

    // 事件绑定
    toggleBtn.addEventListener('click', () => {
        if (running) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    resetBtn.addEventListener('click', resetTimer);

    workBtn.addEventListener('click', () => {
        if (mode !== 'work') switchMode('work');
    });

    breakBtn.addEventListener('click', () => {
        if (mode !== 'break') switchMode('break');
    });

    // 初始显示
    updateDisplay();
    ringProgress.style.strokeDasharray = CIRCUMFERENCE;

    return {
        cleanup() {
            if (timerId) clearInterval(timerId);
        }
    };
}
