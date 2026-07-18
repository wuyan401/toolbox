/* ============================================
   扫雷 - 初级/中级/高级三档
   左键翻开/右键标旗，计时器+剩余雷数，首次点击必不为雷
   ============================================ */

export const id = 'minesweeper';
export const name = '扫雷';
export const icon = '💣';
export const description = '经典扫雷游戏，三档难度，左键翻开/右键标旗';
export const category = '趣味工具';
export const enabled = true;

/** 难度预设 */
const LEVELS = {
    easy:   { rows: 9,  cols: 9,  mines: 10, name: '初级' },
    medium: { rows: 16, cols: 16, mines: 40, name: '中级' },
    hard:   { rows: 16, cols: 30, mines: 99, name: '高级' }
};

export function init(container) {
    let currentLevel = 'easy';
    let board = [];        // board[r][c] = { mine, revealed, flagged, adjacent }
    let rows, cols, totalMines;
    let firstClick = true;
    let gameOver = false;
    let won = false;
    let flagCount = 0;
    let revealedCount = 0;
    let timerInterval = null;
    let elapsed = 0;
    let _timers = [];

    container.innerHTML = `
        <div class="ms-layout">
            <div class="ms-top-bar">
                <div class="ms-level-btns" id="ms-level-btns">
                    ${Object.entries(LEVELS).map(([k, v]) => `
                        <button class="ms-level-btn${k === currentLevel ? ' active' : ''}" data-level="${k}">${v.name} ${v.rows}×${v.cols}</button>
                    `).join('')}
                </div>
                <div class="ms-info">
                    <div class="ms-info-item">💣 <span id="ms-mine-count">10</span></div>
                    <div class="ms-info-item">⏱️ <span id="ms-timer">00:00</span></div>
                </div>
            </div>
            <div class="ms-board-wrap" id="ms-board-wrap"></div>
            <div class="ms-footer">
                <button class="btn btn-primary" id="ms-new-game">🔄 新游戏</button>
                <span class="ms-hint" id="ms-hint"></span>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .ms-layout {
            max-width: 700px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
            align-items: center;
        }
        .ms-top-bar {
            display: flex;
            align-items: center;
            gap: var(--spacing-xl);
            flex-wrap: wrap;
            justify-content: center;
        }
        .ms-level-btns {
            display: flex;
            gap: var(--spacing-xs);
        }
        .ms-level-btn {
            padding: 5px 14px;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-pill);
            background: var(--color-bg-secondary);
            color: var(--color-text-secondary);
            font-size: var(--font-size-sm);
            cursor: pointer;
            white-space: nowrap;
            transition: all var(--transition-fast);
        }
        .ms-level-btn:hover { border-color: var(--color-accent); }
        .ms-level-btn.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
        .ms-info {
            display: flex;
            gap: var(--spacing-lg);
        }
        .ms-info-item {
            font-size: var(--font-size-lg);
            font-weight: 700;
            font-family: var(--font-family-mono);
            color: var(--color-text-primary);
        }
        .ms-board-wrap {
            display: inline-grid;
            gap: 2px;
            background: #a0a0a0;
            border: 4px solid #a0a0a0;
            border-radius: var(--radius-md);
            overflow: hidden;
            user-select: none;
            -webkit-user-select: none;
        }
        .ms-cell {
            width: 40px;
            height: 40px;
            background: #c0c0c0;
            border-top: 3px solid #e8e8e8;
            border-left: 3px solid #e8e8e8;
            border-bottom: 3px solid #808080;
            border-right: 3px solid #808080;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.1s;
            color: #333;
            box-sizing: border-box;
        }
        .ms-cell:hover {
            background: #d0d0d0;
        }
        .ms-cell.revealed {
            background: #e8e8e8;
            border: 1px solid #b0b0b0;
            cursor: default;
        }
        .ms-cell.revealed:hover {
            background: #e8e8e8;
        }
        .ms-cell.flagged {
            background: #c0c0c0;
        }
        .ms-cell.mine-hit {
            background: #FEE2E2 !important;
            border: 1px solid #b0b0b0;
        }
        /* 红色三角旗子 */
        .ms-flag {
            color: #DC2626;
            font-size: 18px;
            line-height: 1;
        }
        /* 数字颜色 — 1蓝2绿3红4深蓝5暗红6青7黑8灰 */
        .ms-cell .n1 { color: #2563EB; }
        .ms-cell .n2 { color: #16A34A; }
        .ms-cell .n3 { color: #DC2626; }
        .ms-cell .n4 { color: #1E3A5F; }
        .ms-cell .n5 { color: #8B0000; }
        .ms-cell .n6 { color: #0D9488; }
        .ms-cell .n7 { color: #000000; }
        .ms-cell .n8 { color: #808080; }
        .ms-footer {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
        }
        .ms-hint {
            font-size: var(--font-size-sm);
            color: var(--color-text-muted);
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const boardWrap = container.querySelector('#ms-board-wrap');
    const mineCountEl = container.querySelector('#ms-mine-count');
    const timerEl = container.querySelector('#ms-timer');
    const hintEl = container.querySelector('#ms-hint');

    /**
     * 初始化棋盘
     */
    function initBoard() {
        const lvl = LEVELS[currentLevel];
        rows = lvl.rows;
        cols = lvl.cols;
        totalMines = lvl.mines;
        board = [];
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = { mine: false, revealed: false, flagged: false, adjacent: 0 };
            }
        }
        firstClick = true;
        gameOver = false;
        won = false;
        flagCount = 0;
        revealedCount = 0;
        elapsed = 0;
        clearInterval(timerInterval);
        timerInterval = null;
        mineCountEl.textContent = totalMines;
        timerEl.textContent = '00:00';
        hintEl.textContent = '右键标旗 ▼';
        renderBoard();
    }

    /**
     * 布雷（首次点击后，避开点击位置及其周围）
     */
    function placeMines(safeR, safeC) {
        const safeSet = new Set();
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = safeR + dr;
                const nc = safeC + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                    safeSet.add(nr * cols + nc);
                }
            }
        }

        let placed = 0;
        while (placed < totalMines) {
            const r = Math.floor(Math.random() * rows);
            const c = Math.floor(Math.random() * cols);
            const idx = r * cols + c;
            if (!board[r][c].mine && !safeSet.has(idx)) {
                board[r][c].mine = true;
                placed++;
            }
        }

        // 计算邻接地雷数
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].mine) continue;
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
                            count++;
                        }
                    }
                }
                board[r][c].adjacent = count;
            }
        }
    }

    /**
     * 翻开格子
     */
    function reveal(r, c) {
        if (gameOver || board[r][c].revealed || board[r][c].flagged) return;

        board[r][c].revealed = true;
        revealedCount++;

        if (board[r][c].mine) {
            // 炸了
            gameOver = true;
            clearInterval(timerInterval);
            revealAllMines();
            hintEl.textContent = '💥 游戏结束！';
            renderBoard();
            return;
        }

        // 如果邻接地雷为0，递归翻开周围
        if (board[r][c].adjacent === 0) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        reveal(nr, nc);
                    }
                }
            }
        }

        // 检查胜利
        checkWin();
        renderBoard();
    }

    /**
     * 翻开所有地雷
     */
    function revealAllMines() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].mine) {
                    board[r][c].revealed = true;
                }
            }
        }
    }

    /**
     * 切换旗标
     */
    function toggleFlag(r, c) {
        if (gameOver || board[r][c].revealed) return;

        if (board[r][c].flagged) {
            board[r][c].flagged = false;
            flagCount--;
        } else {
            board[r][c].flagged = true;
            flagCount++;
        }
        mineCountEl.textContent = totalMines - flagCount;
        renderBoard();
    }

    /**
     * 快速翻开（双击已翻开数字周围）
     */
    function chordReveal(r, c) {
        if (!board[r][c].revealed || board[r][c].adjacent === 0) return;

        // 计算周围旗标数
        let flags = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].flagged) {
                    flags++;
                }
            }
        }

        if (flags === board[r][c].adjacent) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !board[nr][nc].flagged) {
                        reveal(nr, nc);
                    }
                }
            }
        }
    }

    /**
     * 检查胜利
     */
    function checkWin() {
        if (revealedCount === rows * cols - totalMines) {
            won = true;
            gameOver = true;
            clearInterval(timerInterval);
            // 自动标旗所有雷
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (board[r][c].mine && !board[r][c].flagged) {
                        board[r][c].flagged = true;
                    }
                }
            }
            hintEl.textContent = '🎉 恭喜胜利！';
            renderBoard();
        }
    }

    /**
     * 渲染棋盘
     */
    function renderBoard() {
        const cellSize = 40;
        boardWrap.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        boardWrap.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;

        let html = '';
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = board[r][c];
                let cls = 'ms-cell';
                let content = '';

                if (cell.revealed) {
                    cls += ' revealed';
                    if (cell.mine) {
                        cls += ' mine-hit';
                        content = '💣';
                    } else if (cell.adjacent > 0) {
                        content = `<span class="n${cell.adjacent}">${cell.adjacent}</span>`;
                    }
                } else if (cell.flagged) {
                    cls += ' flagged';
                    content = '<span class="ms-flag">▼</span>';
                }

                html += `<div class="${cls}" data-r="${r}" data-c="${c}">${content}</div>`;
            }
        }
        boardWrap.innerHTML = html;
    }

    /**
     * 开始计时
     */
    function startTimer() {
        if (timerInterval) return;
        elapsed = 0;
        timerInterval = setInterval(() => {
            elapsed++;
            const min = Math.floor(elapsed / 60);
            const sec = elapsed % 60;
            timerEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
        }, 1000);
    }

    /**
     * 处理格子点击
     */
    function handleCellClick(e) {
        const cell = e.target.closest('.ms-cell');
        if (!cell || gameOver) return;

        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);

        if (firstClick) {
            firstClick = false;
            placeMines(r, c);
            startTimer();
        }

        reveal(r, c);
    }

    /**
     * 处理右键
     */
    function handleCellContextMenu(e) {
        const cell = e.target.closest('.ms-cell');
        if (!cell || gameOver) return;

        e.preventDefault();
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        toggleFlag(r, c);
    }

    /**
     * 双击（快速翻开）
     */
    function handleCellDblClick(e) {
        const cell = e.target.closest('.ms-cell');
        if (!cell || gameOver || firstClick) return;

        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        chordReveal(r, c);
    }

    // 事件绑定
    boardWrap.addEventListener('click', handleCellClick);
    boardWrap.addEventListener('contextmenu', handleCellContextMenu);
    boardWrap.addEventListener('dblclick', handleCellDblClick);

    // 难度切换
    container.querySelector('#ms-level-btns').addEventListener('click', (e) => {
        const btn = e.target.closest('.ms-level-btn');
        if (!btn) return;
        currentLevel = btn.dataset.level;
        container.querySelectorAll('.ms-level-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        initBoard();
    });

    // 新游戏
    container.querySelector('#ms-new-game').addEventListener('click', () => {
        initBoard();
    });

    // 初始化
    initBoard();

    return {
        cleanup() {
            clearInterval(timerInterval);
            _timers.forEach(t => clearTimeout(t));
        }
    };
}
