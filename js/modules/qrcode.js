/* ============================================
   二维码生成器 - Canvas 绘制二维码
   实现了一个简化的 QR 码生成算法（版本 1-6, Byte 模式, M 级纠错）
   ============================================ */

export const id = 'qrcode';
export const name = '二维码生成';
export const icon = '📱';
export const description = '在线生成二维码，支持 URL/文本';
export const category = '生成工具';
export const enabled = true;

export function init(container) {
    // 渲染 UI
    container.innerHTML = `
        <div class="qr-layout">
            <div class="qr-input-area">
                <label class="tool-col-title">输入内容</label>
                <textarea class="textarea" id="qr-input" placeholder="输入文本或 URL，例如: https://example.com" rows="4"></textarea>
                <div class="tool-actions" style="margin-top:var(--spacing-sm);">
                    <button class="btn btn-primary" id="qr-generate">📱 生成二维码</button>
                    <button class="btn" id="qr-download">💾 下载图片</button>
                    <button class="btn" id="qr-clear">🗑 清空</button>
                </div>
            </div>
            <div class="qr-output-area">
                <span class="tool-col-title">二维码</span>
                <div class="qr-canvas-wrapper">
                    <canvas id="qr-canvas" width="256" height="256"></canvas>
                </div>
                <span class="qr-hint" id="qr-hint" style="display:none;"></span>
            </div>
        </div>
    `;

    // 注入样式
    const style = document.createElement('style');
    style.textContent = `
        .qr-layout {
            display: flex;
            gap: var(--spacing-xxl);
            flex-wrap: wrap;
        }
        .qr-input-area {
            flex: 1;
            min-width: 280px;
            display: flex;
            flex-direction: column;
        }
        .qr-input-area .textarea {
            flex: 1;
            min-height: 120px;
        }
        .qr-output-area {
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-md);
        }
        .qr-canvas-wrapper {
            background: #fff;
            padding: var(--spacing-lg);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--color-border);
            line-height: 0;
        }
        #qr-canvas {
            width: 256px;
            height: 256px;
            image-rendering: pixelated;
        }
        .qr-hint {
            font-size: var(--font-size-sm);
            color: var(--color-danger);
            text-align: center;
            max-width: 280px;
        }

        @media (max-width: 768px) {
            .qr-layout {
                flex-direction: column;
                align-items: center;
            }
            .qr-input-area {
                width: 100%;
            }
        }
    `;
    container.appendChild(style);

    // DOM 引用
    const inputEl = container.querySelector('#qr-input');
    const canvasEl = container.querySelector('#qr-canvas');
    const hintEl = container.querySelector('#qr-hint');
    const ctx = canvasEl.getContext('2d');

    /* =============================================
       QR 码生成算法
       参考: ISO/IEC 18004:2015 标准简化实现
       支持版本 1-6, Byte 模式, M 级纠错 (15%)
       ============================================= */

    /**
     * GF(256) 算术——Reed-Solomon 纠错码所需
     */
    const GF256_EXP = new Array(512);
    const GF256_LOG = new Array(256);

    (function initGF256() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            GF256_EXP[i] = x;
            GF256_LOG[x] = i;
            x <<= 1;
            if (x & 0x100) x ^= 0x11D; // 本原多项式 x^8 + x^4 + x^3 + x^2 + 1
        }
        for (let i = 255; i < 512; i++) {
            GF256_EXP[i] = GF256_EXP[i - 255];
        }
    })();

    /**
     * GF(256) 乘法
     */
    function gfMul(a, b) {
        if (a === 0 || b === 0) return 0;
        return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
    }

    /**
     * 多项式乘法（GF(256) 域）
     * @param {number[]} p1
     * @param {number[]} p2
     * @returns {number[]}
     */
    function polyMul(p1, p2) {
        const result = new Array(p1.length + p2.length - 1).fill(0);
        for (let i = 0; i < p1.length; i++) {
            for (let j = 0; j < p2.length; j++) {
                result[i + j] ^= gfMul(p1[i], p2[j]);
            }
        }
        return result;
    }

    /**
     * 生成纠错码字的生成多项式
     * @param {number} numEC - 纠错码字数量
     * @returns {number[]}
     */
    function generatorPoly(numEC) {
        let g = [1];
        for (let i = 0; i < numEC; i++) {
            g = polyMul(g, [1, GF256_EXP[i]]);
        }
        return g;
    }

    /**
     * 计算纠错码字
     * @param {number[]} data - 数据码字
     * @param {number} numEC - 纠错码字数量
     * @returns {number[]}
     */
    function computeEC(data, numEC) {
        const gen = generatorPoly(numEC);
        const result = new Array(data.length + numEC).fill(0);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i];
        }

        for (let i = 0; i < data.length; i++) {
            const factor = result[i];
            if (factor === 0) continue;
            for (let j = 0; j < gen.length; j++) {
                result[i + j] ^= gfMul(gen[j], factor);
            }
        }

        const ec = new Array(numEC);
        for (let i = 0; i < numEC; i++) {
            ec[i] = result[data.length + i];
        }
        return ec;
    }

    /**
     * QR 版本规格（版本 1-6, M 级纠错）
     *   version, size, ecWords, group1_blocks, group1_data, group2_blocks, group2_data
     */
    const VERSION_SPECS = [
        // v  sz  ec   b1  d1  b2  d2
        [1, 21, 10, 1, 16, 0, 0],
        [2, 25, 16, 1, 28, 0, 0],
        [3, 29, 26, 1, 44, 0, 0],
        [4, 33, 18, 2, 16, 0, 0],
        [5, 37, 24, 2, 22, 0, 0],
        [6, 41, 18, 4, 16, 0, 0],
    ];

    // 对齐图案位置（版本 2+）
    const ALIGN_POS = {
        2: [6, 18],
        3: [6, 22],
        4: [6, 26],
        5: [6, 30],
        6: [6, 34],
    };

    /**
     * 选择合适的 QR 版本
     * @param {number} dataLen - 数据字节长度
     * @returns {number} 版本号 (1-6), 容量不足返回 -1
     */
    function selectVersion(dataLen) {
        for (let i = 0; i < VERSION_SPECS.length; i++) {
            const [, , , b1, d1, b2, d2] = VERSION_SPECS[i];
            const capacity = b1 * d1 + b2 * d2;
            if (dataLen <= capacity) return i + 1;
        }
        return -1;
    }

    /**
     * 构建数据码字 + 纠错码字的最终序列
     * @param {number[]} dataCodewords
     * @param {number} version
     */
    function interleaveData(dataCodewords, version) {
        const specIdx = version - 1;
        const [, , ecWords, b1, d1, b2, d2] = VERSION_SPECS[specIdx];

        // 分组
        const blocks = [];
        let offset = 0;

        // 第一组
        for (let i = 0; i < b1; i++) {
            const block = dataCodewords.slice(offset, offset + d1);
            offset += d1;
            const ec = computeEC(block, ecWords);
            blocks.push({ data: block, ec: ec });
        }

        // 第二组
        for (let i = 0; i < b2; i++) {
            const block = dataCodewords.slice(offset, offset + d2);
            offset += d2;
            const ec = computeEC(block, ecWords);
            blocks.push({ data: block, ec: ec });
        }

        // 交织：交错排列数据和纠错码字
        const result = [];

        // 先交织数据码字
        let idx = 0;
        const maxDataLen = Math.max(d1, d2);
        for (let i = 0; i < maxDataLen; i++) {
            for (const block of blocks) {
                if (i < block.data.length) {
                    result.push(block.data[i]);
                }
            }
        }

        // 再交织纠错码字
        for (let i = 0; i < ecWords; i++) {
            for (const block of blocks) {
                result.push(block.ec[i]);
            }
        }

        return result;
    }

    /**
     * 编码数据为 QR 数据码字（Byte 模式）
     * @param {string} text
     * @param {number} version
     * @returns {number[]}
     */
    function encodeData(text, version) {
        const specIdx = version - 1;
        const [, , , b1, d1, b2, d2] = VERSION_SPECS[specIdx];
        const capacity = b1 * d1 + b2 * d2;

        const bytes = [];
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code < 0x80) {
                bytes.push(code);
            } else if (code < 0x800) {
                bytes.push(0xC0 | (code >> 6));
                bytes.push(0x80 | (code & 0x3F));
            } else {
                bytes.push(0xE0 | (code >> 12));
                bytes.push(0x80 | ((code >> 6) & 0x3F));
                bytes.push(0x80 | (code & 0x3F));
            }
        }

        const dataBits = [];
        const modeIndicator = [0, 1, 0, 0]; // Byte 模式

        // 模式指示符 (4 bits)
        dataBits.push(...modeIndicator);

        // 字符计数 (8 bits for version 1-9)
        const countBits = bytes.length.toString(2).padStart(8, '0');
        for (const bit of countBits) {
            dataBits.push(parseInt(bit));
        }

        // 数据位
        for (const byte of bytes) {
            const bits = byte.toString(2).padStart(8, '0');
            for (const bit of bits) {
                dataBits.push(parseInt(bit));
            }
        }

        // 终止符 (4 个 0 bit)
        const terminatorBits = Math.min(4, capacity * 8 - dataBits.length);
        for (let i = 0; i < terminatorBits; i++) {
            dataBits.push(0);
        }

        // 补足到 8 的倍数
        while (dataBits.length % 8 !== 0) {
            dataBits.push(0);
        }

        // 填充字节 (11101100, 00010001 交替)
        const padBytes = [0xEC, 0x11];
        let padIdx = 0;
        while (dataBits.length / 8 < capacity) {
            const padByte = padBytes[padIdx % 2];
            const bits = padByte.toString(2).padStart(8, '0');
            for (const bit of bits) {
                dataBits.push(parseInt(bit));
            }
            padIdx++;
        }

        // 转换为码字
        const codewords = [];
        for (let i = 0; i < dataBits.length; i += 8) {
            let cw = 0;
            for (let j = 0; j < 8; j++) {
                cw = (cw << 1) | dataBits[i + j];
            }
            codewords.push(cw);
        }

        return codewords;
    }

    /**
     * 创建空矩阵
     * @param {number} size
     * @returns {number[][]} -1 = 预留, 0 = 白, 1 = 黑, 2 = 必须为0
     */
    function createMatrix(size) {
        const matrix = [];
        for (let i = 0; i < size; i++) {
            matrix.push(new Array(size).fill(-1));
        }
        return matrix;
    }

    /**
     * 放置定位图案（三个角 + 一个角的时间图案）
     */
    function placeFinders(matrix, size) {
        const positions = [
            [0, 0],
            [0, size - 7],
            [size - 7, 0],
        ];

        for (const [row, col] of positions) {
            for (let r = -1; r <= 7; r++) {
                for (let c = -1; c <= 7; c++) {
                    const rr = row + r;
                    const cc = col + c;
                    if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;

                    // 外框
                    if (r === -1 || r === 7 || c === -1 || c === 7 ||
                        (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                        (c >= 0 && c <= 6 && (r === 0 || r === 6))) {
                        matrix[rr][cc] = 0;
                    }
                    // 内部 3x3
                    else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
                        matrix[rr][cc] = 1;
                    }
                    // 其余内框
                    else if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
                        matrix[rr][cc] = 0;
                    }
                }
            }
        }
    }

    /**
     * 放置时间图案（行/列交替黑白）
     */
    function placeTiming(matrix, size) {
        // 水平时间图案（第 6 行）
        for (let c = 8; c < size - 8; c++) {
            matrix[6][c] = (c % 2 === 0) ? 1 : 0;
        }
        // 垂直时间图案（第 6 列）
        for (let r = 8; r < size - 8; r++) {
            matrix[r][6] = (r % 2 === 0) ? 1 : 0;
        }
    }

    /**
     * 放置对齐图案（版本 2+）
     */
    function placeAlignment(matrix, version) {
        if (version < 2) return;
        const positions = ALIGN_POS[version];
        if (!positions) return;

        for (const row of positions) {
            for (const col of positions) {
                // 跳过与定位图案重叠的位置
                if ((row < 9 && col < 9) ||
                    (row < 9 && col > matrix.length - 9) ||
                    (row > matrix.length - 9 && col < 9)) {
                    continue;
                }

                for (let r = -2; r <= 2; r++) {
                    for (let c = -2; c <= 2; c++) {
                        const rr = row + r;
                        const cc = col + c;
                        if (rr < 0 || rr >= matrix.length || cc < 0 || cc >= matrix.length) continue;

                        if (r === -2 || r === 2 || c === -2 || c === 2 ||
                            (r === -1 || r === 1) && (c >= -1 && c <= 1) ||
                            (c === -1 || c === 1) && (r >= -1 && r <= 1)) {
                            matrix[rr][cc] = 1;
                        } else if (r === 0 && c === 0) {
                            matrix[rr][cc] = 1;
                        } else {
                            matrix[rr][cc] = 0;
                        }
                    }
                }
            }
        }
    }

    /**
     * 放置格式信息
     * ECL M (00) + Mask pattern → 15 bits BCH
     */
    function placeFormatInfo(matrix, maskPattern) {
        const size = matrix.length;

        // 格式信息: ECL=M (00) + 掩码
        let data = (0 << 3) | maskPattern; // 5 bits
        let formatBits = data << 10;
        let gen = 0x537; // 10100110111

        // BCH 编码
        for (let i = 4; i >= 0; i--) {
            if (formatBits & (1 << (i + 10))) {
                formatBits ^= gen << i;
            }
        }
        formatBits = (data << 10) | (formatBits & 0x3FF);
        formatBits ^= 0x5412; // XOR 掩码

        // 放置到矩阵
        const positions = [];
        // 右上角定位图案周围
        for (let i = 0; i <= 5; i++) {
            positions.push([i, 8]);
        }
        positions.push([7, 8]);
        positions.push([8, 8]);
        positions.push([8, 7]);
        for (let i = 5; i >= 0; i--) {
            positions.push([8, i]);
        }
        // 左下角定位图案周围
        for (let i = size - 1; i >= size - 7; i--) {
            positions.push([8, i]);
        }
        for (let i = size - 8; i <= size - 2; i++) {
            if (i <= size - 1) {
                // 这些位置已在上方设置，放在这里作为第二部分
            }
        }

        const positions2 = [
            [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
            [size - 5, 8], [size - 6, 8], [size - 7, 8], [size - 8, 8],
            [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
            [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1],
        ];

        const allPos = positions.concat(positions2);

        for (let i = 0; i < Math.min(15, allPos.length); i++) {
            const [r, c] = allPos[i];
            if (r >= 0 && r < size && c >= 0 && c < size) {
                const bit = (formatBits >> i) & 1;
                matrix[r][c] = bit;
            }
        }

        // 暗模块（版本 1+ 的固定模块）
        matrix[size - 8][8] = 1;
    }

    /**
     * 将数据位填入矩阵
     * 从右下角开始，2 列一组，蛇形向上
     */
    function placeData(matrix, allCodewords) {
        const size = matrix.length;

        // 将码字展开为位序列
        const bits = [];
        for (const cw of allCodewords) {
            for (let i = 7; i >= 0; i--) {
                bits.push((cw >> i) & 1);
            }
        }

        let col = size - 1;
        let bitIdx = 0;
        let goingUp = true;

        while (col > 0) {
            // 跳过垂直时间图案列
            if (col === 6) col--;

            if (goingUp) {
                for (let row = size - 1; row >= 0; row--) {
                    // 右侧位
                    if (matrix[row][col] === -1 && bitIdx < bits.length) {
                        matrix[row][col] = bits[bitIdx++];
                    }
                    // 左侧位
                    if (col - 1 >= 0 && matrix[row][col - 1] === -1 && bitIdx < bits.length) {
                        matrix[row][col - 1] = bits[bitIdx++];
                    }
                }
            } else {
                for (let row = 0; row < size; row++) {
                    if (matrix[row][col] === -1 && bitIdx < bits.length) {
                        matrix[row][col] = bits[bitIdx++];
                    }
                    if (col - 1 >= 0 && matrix[row][col - 1] === -1 && bitIdx < bits.length) {
                        matrix[row][col - 1] = bits[bitIdx++];
                    }
                }
            }

            goingUp = !goingUp;
            col -= 2;
        }
    }

    /**
     * 应用掩码并评分，选择最佳掩码
     */
    const MASK_FUNCTIONS = [
    (r, c) => (r + c) % 2 === 0,
        (r) => r % 2 === 0,
        (c) => c % 3 === 0,
        (r, c) => (r + c) % 3 === 0,
        (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
        (r, c) => ((r * c) % 2 + (r * c) % 3) === 0,
        (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
        (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
    ];

    function applyMaskAndScore(matrix) {
        const size = matrix.length;
        let bestMask = 0;
        let bestScore = Infinity;
        let bestMatrix = null;

        for (let mask = 0; mask < 8; mask++) {
            const testMatrix = matrix.map(row => [...row]);

            // 应用掩码
            const maskFn = MASK_FUNCTIONS[mask];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (testMatrix[r][c] === 1 || testMatrix[r][c] === 0) {
                        if (maskFn(r, c)) {
                            testMatrix[r][c] = testMatrix[r][c] === 1 ? 0 : 1;
                        }
                    }
                }
            }

            // 填充格式信息
            placeFormatInfo(testMatrix, mask);

            // 简单评分
            const score = scoreMatrix(testMatrix);
            if (score < bestScore) {
                bestScore = score;
                bestMask = mask;
                bestMatrix = testMatrix;
            }
        }

        return { matrix: bestMatrix, mask: bestMask };
    }

    /**
     * 评分矩阵（简化版）
     */
    function scoreMatrix(matrix) {
        let score = 0;
        const size = matrix.length;

        // 评分 1: 连续同色模块
        for (let r = 0; r < size; r++) {
            let run = 0;
            let lastColor = -1;
            for (let c = 0; c < size; c++) {
                if (matrix[r][c] === lastColor && matrix[r][c] >= 0) {
                    run++;
                } else {
                    if (run >= 5) score += 3 + (run - 5);
                    run = 1;
                    lastColor = matrix[r][c];
                }
            }
            if (run >= 5) score += 3 + (run - 5);
        }

        for (let c = 0; c < size; c++) {
            let run = 0;
            let lastColor = -1;
            for (let r = 0; r < size; r++) {
                if (matrix[r][c] === lastColor && matrix[r][c] >= 0) {
                    run++;
                } else {
                    if (run >= 5) score += 3 + (run - 5);
                    run = 1;
                    lastColor = matrix[r][c];
                }
            }
            if (run >= 5) score += 3 + (run - 5);
        }

        // 评分 2: 2x2 同色块
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size - 1; c++) {
                const a = matrix[r][c];
                if (a >= 0 && a === matrix[r][c + 1] &&
                    a === matrix[r + 1][c] && a === matrix[r + 1][c + 1]) {
                    score += 3;
                }
            }
        }

        return score;
    }

    /**
     * 主生成函数
     * @param {string} text - 输入文本
     * @returns {{ matrix: number[][], size: number, version: number } | null}
     */
    function generateQRCode(text) {
        if (!text) return null;

        // UTF-8 编码后的字节数
        const bytes = [];
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code < 0x80) {
                bytes.push(code);
            } else if (code < 0x800) {
                bytes.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
            } else {
                bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
            }
        }

        // Byte 模式开销：模式指示符(4) + 计数字段(8) + 数据 + 终止符(4)
        const dataBits = 4 + 8 + bytes.length * 8 + 4;
        const dataCodewords = Math.ceil(dataBits / 8);

        const version = selectVersion(dataCodewords);
        if (version < 0) {
            return null; // 数据过长
        }

        const specIdx = version - 1;
        const size = VERSION_SPECS[specIdx][1];

        // 编码数据
        const dataCWs = encodeData(text, version);

        // 交织纠错
        const allCodewords = interleaveData(dataCWs, version);

        // 创建矩阵
        let matrix = createMatrix(size);

        // 放置固定图案
        placeFinders(matrix, size);
        placeTiming(matrix, size);
        placeAlignment(matrix, version);

        // 暗模块
        matrix[size - 8][8] = 1;

        // 放置数据
        placeData(matrix, allCodewords);

        // 剩余 -1 的格子填充为 0
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (matrix[r][c] === -1) {
                    matrix[r][c] = 0;
                }
            }
        }

        // 应用掩码并评分
        const result = applyMaskAndScore(matrix);
        return { matrix: result.matrix, size: size, version: version };
    }

    /**
     * 在 Canvas 上绘制 QR 码
     * @param {number[][]} matrix
     * @param {number} moduleCount - 模块数
     */
    function drawQRCode(matrix, moduleCount) {
        const canvasSize = 256;
        const quietZone = 4; // 静区模块数
        const totalModules = moduleCount + quietZone * 2;
        const moduleSize = Math.floor(canvasSize / totalModules);
        const offset = quietZone * moduleSize;
        const drawSize = moduleCount * moduleSize;

        // 清空画布
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // 绘制静区（白色边距）
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // 绘制模块
        ctx.fillStyle = '#000000';
        for (let r = 0; r < moduleCount; r++) {
            for (let c = 0; c < moduleCount; c++) {
                if (matrix[r][c] === 1) {
                    const x = offset + c * moduleSize;
                    const y = offset + r * moduleSize;
                    // 带圆角效果的模块会更好看，但这里保持简洁
                    ctx.fillRect(x, y, moduleSize, moduleSize);
                }
            }
        }
    }

    /**
     * 执行生成
     */
    function generate() {
        const text = inputEl.value.trim();
        hintEl.style.display = 'none';

        if (!text) {
            // 清空画布
            ctx.fillStyle = '#F5F5F5';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('输入内容后点击生成', 128, 134);
            return;
        }

        if (text.length > 100) {
            hintEl.textContent = '⚠️ 输入内容过长，请控制在 100 字符以内';
            hintEl.style.display = 'block';
            return;
        }

        const result = generateQRCode(text);
        if (!result) {
            hintEl.textContent = '⚠️ 无法生成二维码：内容过长或包含不支持的字符';
            hintEl.style.display = 'block';

            // 绘制提示到 canvas
            ctx.fillStyle = '#FFF9C4';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#E65100';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('内容过长，无法生成', 128, 120);
            ctx.fillText('请缩短输入内容', 128, 142);
            return;
        }

        drawQRCode(result.matrix, result.size);
        hintEl.style.display = 'none';
    }

    /**
     * 下载二维码图片
     */
    function download() {
        const text = inputEl.value.trim();
        if (!text) return;

        const result = generateQRCode(text);
        if (!result) return;

        // 重新绘制到临时 canvas 以获得更大的输出
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 256;
        tempCanvas.height = 256;
        const tempCtx = tempCanvas.getContext('2d');

        const quietZone = 4;
        const totalModules = result.size + quietZone * 2;
        const moduleSize = Math.floor(256 / totalModules);
        const offset = quietZone * moduleSize;

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, 256, 256);

        tempCtx.fillStyle = '#000000';
        for (let r = 0; r < result.size; r++) {
            for (let c = 0; c < result.size; c++) {
                if (result.matrix[r][c] === 1) {
                    tempCtx.fillRect(
                        offset + c * moduleSize,
                        offset + r * moduleSize,
                        moduleSize,
                        moduleSize
                    );
                }
            }
        }

        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
    }

    // 事件绑定
    let debounceTimer = null;

    inputEl.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(generate, 300);
    });

    container.querySelector('#qr-generate').addEventListener('click', generate);
    container.querySelector('#qr-download').addEventListener('click', download);

    container.querySelector('#qr-clear').addEventListener('click', () => {
        inputEl.value = '';
        hintEl.style.display = 'none';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 256, 256);
        inputEl.focus();
    });

    // 初始状态：空白画布提示
    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('输入内容后点击生成', 128, 128);
    ctx.fillText('支持 URL、文本等', 128, 148);

    inputEl.focus();

    return {
        cleanup() {
            clearTimeout(debounceTimer);
        }
    };
}
