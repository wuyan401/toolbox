/* ============================================
   贪吃蛇 - Canvas 游戏 400x400
   方向键控制 + 移动端触摸滑动，速度随分数递增
   ============================================ */

export const id = 'snake-game';
export const name = '贪吃蛇';
export const icon = '🐍';
export const description = '经典贪吃蛇游戏，方向键/触摸滑动控制，加速机制';
export const category = '趣味工具';
export const enabled = true;

export function init(container) {
    const CANVAS_SIZE = 400;
    const GRID_SIZE = 16;
    const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
    const BASE_SPEED = 140; // ms/step

    let snake = [];
    let food = { x: 0, y: 0 };
    let direction = { x: 0, y: 0 };
    let nextDirection = { x: 0, y: 0 };
    let score = 0;
    let running = false;
    let gameLoop = null;
    let gameOver = false;
    let paused = false;

    // 触摸相关
    let touchStartX = 0;
    let touchStartY = 0;

    container.innerHTML = `
        <div class="sg-layout">
            <div class="sg-header">
                <div class="sg-score-wrap">
                    <span class="sg-score-label">分数</span>
                    <span class="sg-score-value" id="sg-score">0</span>
                </div>
                <div class="sg-score-wrap">
                    <span class="sg-score-label">速度</span>
                    <span class="sg-score-value" id="sg-speed">1x</span>
                </div>
            </div>

            <div class="sg-canvas-wrap">
                <canvas id="sg-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
                <div class="sg-overlay" id="sg-overlay">
                    <div class="sg-overlay-title" id="sg-overlay-title">🐍 贪吃蛇</div>
                    <div class="sg-overlay-sub" id="sg-overlay-sub">按 方向键 或 点击开始</div>
                    <button class="btn btn-primary" id="sg-start">▶ 开始游戏</button>
                </div>
            </div>

            <div class="sg-controls">
                <div class="sg-dpad">
                    <button class="sg-dpad-btn" data-dir="up">▲</button>
                    <div class="sg-dpad-row">
                        <button class="sg-dpad-btn" data-dir="left">◀</button>
                        <button class="sg-dpad-btn" data-dir="down">▼</button>
                        <button class="sg-dpad-btn" data-dir="right">▶</button>
                    </div>
                </div>
                <div class="sg-action-btns">
                    <button class="btn btn-sm" id="sg-pause" disabled>⏸️ 暂停</button>
                    <button class="btn btn-sm" id="sg-restart">🔄 重新开始</button>
                </div>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .sg-layout {
            max-width: 460px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
            align-items: center;
        }
        .sg-header {
            display: flex;
            gap: var(--spacing-xxl);
        }
        .sg-score-wrap {
            text-align: center;
        }
        .sg-score-label {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
        }
        .sg-score-value {
            display: block;
            font-size: 28px;
            font-weight: 700;
            color: var(--color-accent);
            font-family: var(--font-family-mono);
        }
        .sg-canvas-wrap {
            position: relative;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-lg);
            overflow: hidden;
            background: #1a1a2e;
        }
        #sg-canvas {
            display: block;
        }
        .sg-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-md);
            background: rgba(26, 26, 46, 0.92);
            border-radius: var(--radius-lg);
        }
        .sg-overlay-title {
            font-size: 28px;
            font-weight: 700;
            color: #fff;
        }
        .sg-overlay-sub {
            font-size: var(--font-size-md);
            color: var(--color-text-muted);
        }
        .sg-controls {
            display: flex;
            align-items: center;
            gap: var(--spacing-xl);
            flex-wrap: wrap;
            justify-content: center;
        }
        .sg-dpad {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        .sg-dpad-row {
            display: flex;
            gap: 4px;
        }
        .sg-dpad-btn {
            width: 48px;
            height: 48px;
            border: 2px solid var(--color-border);
            border-radius: var(--radius-md);
            background: var(--color-bg-secondary);
            color: var(--color-text-primary);
            font-size: 18px;
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all var(--transition-fast);
        }
        .sg-dpad-btn:active {
            background: var(--color-accent);
            color: #fff;
            border-color: var(--color-accent);
        }
        .sg-action-btns {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-sm);
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const canvas = container.querySelector('#sg-canvas');
    const ctx = canvas.getContext('2d');
    const overlay = container.querySelector('#sg-overlay');
    const overlayTitle = container.querySelector('#sg-overlay-title');
    const overlaySub = container.querySelector('#sg-overlay-sub');
    const startBtn = container.querySelector('#sg-start');
    const pauseBtn = container.querySelector('#sg-pause');
    const restartBtn = container.querySelector('#sg-restart');
    const scoreEl = container.querySelector('#sg-score');
    const speedEl = container.querySelector('#sg-speed');

    /**
     * 生成随机食物位置（避开蛇身）
     */
    function spawnFood() {
        const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
        const available = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                if (!occupied.has(`${x},${y}`)) {
                    available.push({ x, y });
                }
            }
        }
        if (available.length === 0) return; // 满了
        food = available[Math.floor(Math.random() * available.length)];
    }

    /**
     * 初始化/重置游戏
     */
    function initGame() {
        // 蛇初始居中，长度3，向右移动
        const mid = Math.floor(GRID_SIZE / 2);
        snake = [
            { x: mid, y: mid },
            { x: mid - 1, y: mid },
            { x: mid - 2, y: mid }
        ];
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        score = 0;
        gameOver = false;
        paused = false;
        running = false;
        spawnFood();
        updateDisplay();
        draw();
    }

    /**
     * 获取当前速度
     */
    function getSpeed() {
        const level = Math.floor(score / 5);
        return Math.max(BASE_SPEED - level * 10, 50);
    }

    /**
     * 获取速度倍率显示
     */
    function getSpeedMultiplier() {
        return (BASE_SPEED / getSpeed()).toFixed(1) + 'x';
    }

    /**
     * 游戏主循环步
     */
    function step() {
        if (!running || paused || gameOver) return;

        // 应用缓冲方向
        direction = { ...nextDirection };

        // 计算新头
        const head = snake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };

        // 碰墙检测
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
            endGame();
            return;
        }

        // 碰自己检测
        if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
            endGame();
            return;
        }

        snake.unshift(newHead);

        // 吃到食物
        if (newHead.x === food.x && newHead.y === food.y) {
            score++;
            spawnFood();
            // 重新启动循环以调整速度
            clearInterval(gameLoop);
            gameLoop = setInterval(step, getSpeed());
        } else {
            snake.pop();
        }

        updateDisplay();
        draw();
    }

    /**
     * 结束游戏
     */
    function endGame() {
        running = false;
        gameOver = true;
        clearInterval(gameLoop);
        gameLoop = null;
        showOverlay('💀 游戏结束', `得分: ${score}`, '再来一局');
        startBtn.textContent = '▶ 再来一局';
        pauseBtn.disabled = true;
    }

    /**
     * 显示遮罩层
     */
    function showOverlay(title, sub, btnText) {
        overlayTitle.textContent = title;
        overlaySub.textContent = sub;
        startBtn.textContent = btnText || '▶ 开始游戏';
        overlay.style.display = '';
    }

    /**
     * 隐藏遮罩层
     */
    function hideOverlay() {
        overlay.style.display = 'none';
    }

    /**
     * 开始游戏
     */
    function startGame() {
        if (gameOver) initGame();
        running = true;
        paused = false;
        hideOverlay();
        pauseBtn.disabled = false;
        pauseBtn.textContent = '⏸️ 暂停';
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(step, getSpeed());
        draw();
    }

    /**
     * 切换暂停
     */
    function togglePause() {
        if (gameOver || !running) return;
        paused = !paused;
        pauseBtn.textContent = paused ? '▶ 继续' : '⏸️ 暂停';
        if (paused) {
            showOverlay('⏸️ 已暂停', '点击继续或按空格', '▶ 继续');
        } else {
            hideOverlay();
            if (gameLoop) clearInterval(gameLoop);
            gameLoop = setInterval(step, getSpeed());
        }
    }

    /**
     * 更新显示
     */
    function updateDisplay() {
        scoreEl.textContent = score;
        speedEl.textContent = getSpeedMultiplier();
    }

    /**
     * 绘制
     */
    function draw() {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // 网格线（极淡）
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID_SIZE; i++) {
            const pos = i * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(pos, 0); ctx.lineTo(pos, CANVAS_SIZE); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos); ctx.lineTo(CANVAS_SIZE, pos); ctx.stroke();
        }

        // 绘制食物
        const fx = food.x * CELL_SIZE + CELL_SIZE / 2;
        const fy = food.y * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(fx, fy, CELL_SIZE / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        // 光晕
        ctx.fillStyle = 'rgba(239,68,68,0.3)';
        ctx.beginPath();
        ctx.arc(fx, fy, CELL_SIZE / 2 + 2, 0, Math.PI * 2);
        ctx.fill();

        // 绘制蛇
        snake.forEach((seg, i) => {
            const x = seg.x * CELL_SIZE;
            const y = seg.y * CELL_SIZE;
            const pad = 1;

            if (i === 0) {
                // 蛇头
                const gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
                gradient.addColorStop(0, '#22c55e');
                gradient.addColorStop(1, '#16a34a');
                ctx.fillStyle = gradient;
                roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 4);

                // 眼睛
                const eyeSize = 3;
                ctx.fillStyle = '#fff';
                let ex1, ey1, ex2, ey2;
                const mid = CELL_SIZE / 2;
                if (direction.x === 1) { ex1 = x + mid + 2; ey1 = y + mid - 4; ex2 = x + mid + 2; ey2 = y + mid + 4; }
                else if (direction.x === -1) { ex1 = x + mid - 2; ey1 = y + mid - 4; ex2 = x + mid - 2; ey2 = y + mid + 4; }
                else if (direction.y === -1) { ex1 = x + mid - 4; ey1 = y + mid - 2; ex2 = x + mid + 4; ey2 = y + mid - 2; }
                else { ex1 = x + mid - 4; ey1 = y + mid + 2; ex2 = x + mid + 4; ey2 = y + mid + 2; }
                ctx.beginPath();
                ctx.arc(ex1, ey1, eyeSize / 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath();
                ctx.arc(ex2, ey2, eyeSize / 2, 0, Math.PI * 2); ctx.fill();
            } else {
                // 蛇身渐变
                const t = i / snake.length;
                const r = Math.round(34 + t * 30);
                const g = Math.round(197 - t * 30);
                const b = Math.round(94 - t * 10);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                roundRect(x + pad, y + pad, CELL_SIZE - pad * 2, CELL_SIZE - pad * 2, 3);
            }
        });
    }

    /**
     * 圆角矩形
     */
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 方向键控制
     */
    function handleKey(e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (gameOver) { startGame(); return; }
            if (running) { togglePause(); return; }
            if (!running) { startGame(); return; }
            return;
        }

        const keyMap = {
            'ArrowUp':    { x: 0, y: -1 },
            'ArrowDown':  { x: 0, y: 1 },
            'ArrowLeft':  { x: -1, y: 0 },
            'ArrowRight': { x: 1, y: 0 }
        };

        const dir = keyMap[e.key];
        if (!dir) return;
        e.preventDefault();

        // 不能180度转向
        if (dir.x + direction.x === 0 && dir.y + direction.y === 0) return;
        nextDirection = dir;

        // 如果还没开始，按下方向键自动开始
        if (!running && !gameOver) {
            direction = dir;
            nextDirection = dir;
            startGame();
        }
    }

    /**
     * 触摸处理
     */
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchEnd(e) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const minSwipe = 30;

        if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;

        let dir;
        if (Math.abs(dx) > Math.abs(dy)) {
            dir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        } else {
            dir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }

        if (dir.x + direction.x === 0 && dir.y + direction.y === 0) return;
        nextDirection = dir;

        if (!running && !gameOver) {
            direction = dir;
            startGame();
        }
    }

    // 事件绑定
    document.addEventListener('keydown', handleKey);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });

    // 虚拟方向键
    container.querySelectorAll('.sg-dpad-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dirMap = {
                'up':    { x: 0, y: -1 },
                'down':  { x: 0, y: 1 },
                'left':  { x: -1, y: 0 },
                'right': { x: 1, y: 0 }
            };
            const dir = dirMap[btn.dataset.dir];
            if (!dir) return;
            if (dir.x + direction.x === 0 && dir.y + direction.y === 0) return;
            nextDirection = dir;
            if (!running && !gameOver) {
                direction = dir;
                startGame();
            }
        });
    });

    // 开始/暂停/重新开始按钮
    startBtn.addEventListener('click', startGame);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.closest('#sg-overlay-sub') || e.target.closest('#sg-overlay-title')) {
            if (paused) { togglePause(); return; }
            if (!running) startGame();
        }
    });
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', () => {
        clearInterval(gameLoop);
        gameLoop = null;
        initGame();
        showOverlay('🐍 贪吃蛇', '按 方向键 或 点击开始', '▶ 开始游戏');
        pauseBtn.disabled = true;
        draw();
    });

    // 初始化
    initGame();

    return {
        cleanup() {
            document.removeEventListener('keydown', handleKey);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchend', handleTouchEnd);
            clearInterval(gameLoop);
        }
    };
}
