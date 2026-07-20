/* ============================================
   工具模块模板 - 参照此模板创建新工具

   每个工具模块导出以下对象:
   {
       id:          string   - 唯一标识 (与 tools.json 中一致)
       name:        string   - 工具名称
       icon:        string   - 工具图标 (emoji)
       description: string   - 工具描述
       category:    string   - 分类名称
       enabled:     boolean  - 是否启用
       init(container)       - 初始化函数，返回 { cleanup?: Function }
   }

   约定:
   - init 函数接收一个 DOM 容器元素，作为工具的渲染目标
   - init 函数可返回 { cleanup: () => void }，在切换工具时调用
   - 工具之间零依赖，互不影响
   - 使用 ES6 Module 导出
   ============================================ */

export const id = 'template';
export const name = '模板工具';
export const icon = '📄';
export const description = '这是一个模板工具';
export const category = '示例';
export const enabled = false; // 设置为 true 才会显示在侧边栏

/**
 * 初始化工具
 * @param {HTMLElement} container - 工具容器 DOM 元素
 * @returns {{ cleanup?: Function } | void}
 */
export function init(container) {
    container.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--color-text-secondary)">
            <p>在这里实现你的工具内容</p>
        </div>
    `;

    return {
        cleanup() {
            // 清理事件监听器、定时器等
        }
    };
}
