export const id = 'json-csv';
export const name = 'JSON↔CSV';
export const icon = '🔄';
export const description = 'JSON与CSV互相转换，支持复杂嵌套';
export const category = '格式化';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;gap:6px;align-items:center">
                <span style="font-size:13px;color:var(--color-text-secondary)">模式:</span>
                <select id="mode" style="padding:6px 10px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text);font-size:13px">
                    <option value="j2c">JSON → CSV</option>
                    <option value="c2j">CSV → JSON</option>
                </select>
                <button class="btn btn-primary" id="go" style="margin-left:auto">转换</button>
                <button class="btn" id="swap">⇅ 交换</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div>
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">输入</div>
                    <textarea id="in" style="width:100%;height:280px;font-family:var(--font-family-mono);font-size:12px;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:8px;padding:10px;color:var(--color-text)" placeholder="粘贴JSON或CSV..."></textarea>
                </div>
                <div>
                    <div style="font-size:11px;color:var(--color-text-secondary);margin-bottom:4px">输出</div>
                    <textarea id="out" readonly style="width:100%;height:280px;font-family:var(--font-family-mono);font-size:12px;background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:8px;padding:10px;color:var(--color-text)" placeholder="转换结果..."></textarea>
                </div>
            </div>
            <div style="font-size:11px;color:var(--color-text-tertiary)" id="status"></div>
        </div>`;

    const mode = container.querySelector('#mode');
    const inEl = container.querySelector('#in');
    const outEl = container.querySelector('#out');
    const status = container.querySelector('#status');

    function escapeCSV(v) {
        if (v === null || v === undefined) return '';
        v = String(v);
        if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
        return v;
    }

    function jsonToCsv(json) {
        if (!Array.isArray(json)) {
            if (typeof json === 'object' && json !== null) json = [json];
            else throw new Error('JSON 必须是数组或对象');
        }
        if (!json.length) return '';
        const keys = new Set();
        const flat = json.map(row => {
            const o = {};
            const walk = (obj, prefix) => {
                for (const k of Object.keys(obj)) {
                    const v = obj[k];
                    const key = prefix ? prefix + '.' + k : k;
                    if (v !== null && typeof v === 'object') walk(v, key);
                    else { o[key] = v; keys.add(key); }
                }
            };
            walk(row, '');
            return o;
        });
        const keyList = [...keys];
        const lines = [keyList.map(escapeCSV).join(',')];
        for (const row of flat) {
            lines.push(keyList.map(k => escapeCSV(row[k])).join(','));
        }
        return lines.join('\n');
    }

    function csvToJson(csv) {
        const lines = csv.replace(/\r/g, '').split('\n').filter(l => l.trim());
        if (!lines.length) return '[]';
        const parseLine = (line) => {
            const res = []; let cur = '', inQ = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (inQ) {
                    if (ch === '"' && line[i+1] === '"') { cur += '"'; i++; }
                    else if (ch === '"') inQ = false;
                    else cur += ch;
                } else {
                    if (ch === '"') inQ = true;
                    else if (ch === ',') { res.push(cur); cur = ''; }
                    else cur += ch;
                }
            }
            res.push(cur);
            return res;
        };
        const headers = parseLine(lines[0]).map(h => h.trim());
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const cells = parseLine(lines[i]);
            const obj = {};
            headers.forEach((h, idx) => { obj[h] = cells[idx] !== undefined ? cells[idx].trim() : ''; });
            result.push(obj);
        }
        return JSON.stringify(result, null, 2);
    }

    function convert() {
        try {
            const input = inEl.value.trim();
            if (!input) { status.textContent = '请输入内容'; return; }
            if (mode.value === 'j2c') {
                outEl.value = jsonToCsv(JSON.parse(input));
                status.textContent = '✅ JSON → CSV 完成';
            } else {
                outEl.value = csvToJson(input);
                status.textContent = '✅ CSV → JSON 完成';
            }
        } catch (e) {
            status.textContent = '❌ ' + e.message;
            status.style.color = '#ef4444';
        }
    }

    container.querySelector('#go').addEventListener('click', convert);
    container.querySelector('#swap').addEventListener('click', () => {
        const t = inEl.value; inEl.value = outEl.value; outEl.value = t;
        mode.value = mode.value === 'j2c' ? 'c2j' : 'j2c';
    });

    return { cleanup() {} };
}
