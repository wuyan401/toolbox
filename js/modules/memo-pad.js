export const id = 'memo-pad';
export const name = '备忘录';
export const icon = '📝';
export const description = '快速记录便签，自动保存到本地';
export const category = '日常工具';
export const enabled = true;

export function init(container) {
    container.innerHTML = `
        <div style="max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;gap:8px;align-items:center">
                <input id="title" type="text" placeholder="备忘标题..." style="flex:1;padding:8px 12px;border-radius:8px;background:var(--color-bg-secondary);border:1px solid var(--color-border);color:var(--color-text);font-size:14px">
                <button class="btn btn-primary" id="add">➕ 添加</button>
            </div>
            <div id="list" style="display:flex;flex-direction:column;gap:8px"></div>
            <div style="font-size:11px;color:var(--color-text-tertiary" id="tip">数据保存在浏览器本地</div>
        </div>`;

    const title = container.querySelector('#title');
    const list = container.querySelector('#list');
    const tip = container.querySelector('#tip');

    let memos = [];
    try { memos = JSON.parse(localStorage.getItem('toolbox-memos') || '[]'); } catch (e) {}

    function save() { try { localStorage.setItem('toolbox-memos', JSON.stringify(memos)); } catch (e) {} }

    function render() {
        list.innerHTML = '';
        if (!memos.length) {
            list.innerHTML = '<div style="text-align:center;color:var(--color-text-tertiary);padding:30px;font-size:13px">还没有备忘，添加一条吧 ✨</div>';
            return;
        }
        memos.forEach((m, i) => {
            const card = document.createElement('div');
            card.style.cssText = 'background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;transition:all .2s';
            card.innerHTML = `
                <span style="font-size:18px">📌</span>
                <span style="flex:1;font-size:13px;word-break:break-all">${m.text.replace(/</g,'&lt;')}</span>
                <span style="font-size:10px;color:var(--color-text-tertiary)">${m.time}</span>
                <button class="btn btn-sm" data-del="${i}" style="padding:2px 8px">🗑️</button>`;
            list.appendChild(card);
            card.querySelector('[data-del]').addEventListener('click', () => {
                memos.splice(i, 1); save(); render();
            });
        });
    }

    function add() {
        const t = title.value.trim();
        if (!t) return;
        const now = new Date();
        memos.unshift({ text: t, time: `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}` });
        save(); render();
        title.value = '';
        tip.textContent = `✅ 已保存 (共 ${memos.length} 条)`;
    }

    container.querySelector('#add').addEventListener('click', add);
    title.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
    render();

    return { cleanup() {} };
}
