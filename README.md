# 🧰 纯前端多功能 Web 工具箱

> 31 个实用工具 + 2 个小游戏 | 零依赖纯前端 | ES6 Module

## ✨ 特性

- 🔌 **零依赖** — 无框架、无 CDN、无 npm，纯原生 HTML/CSS/JS
- 📦 **插件式架构** — 工具通过 `tools.json` 注册，即插即用
- 🎨 **Apple HIG 风格** — 渐变背景 + 彩色光斑 + 毛玻璃 + 12 色彩色卡片
- 🌗 **亮/暗双主题** — 支持切换，默认亮色 Apple HIG
- ⌨️ **Ctrl+K 全局搜索** — 快速找到工具

## 📋 工具列表 (31个)

| 分类 | 工具 |
|------|------|
| 🔢 日常工具 | 计算器、随机选择器、IP查询、单位换算、进制转换、字数统计、简繁转换、日期计算器、摩斯电码 |
| 📝 格式化 | JSON格式化、Base64编解码、Markdown预览、文本去重排序、文本对比 |
| 🔐 编码转换 | URL编解码、哈希生成器、颜色格式转换、颜色选择器 |
| 🛠️ 生成工具 | 密码生成器、UUID生成器、二维码生成器、.gitignore生成器、时间戳转换 |
| 🤖 AI工具 | Token估算器、Prompt模板库 |
| 💻 开发工具 | 正则测试器 |
| 🎮 趣味工具 | 吸血鬼幸存者、2048、扫雷、贪吃蛇 |
| ⏱️ 办公工具 | 番茄钟 |

## 🎮 游戏

### 🦇 吸血鬼幸存者 (2788行)
Canvas 肉鸽游戏，支持：
- **3 个职业**：剑士(光剑大师)、射手(弹幕专家)、法师(雷电使者)，各有 6+ 专属强化
- **大地图** 2000×1500 + 镜头平滑跟随 + 场景装饰
- **7 种怪物** + **BOSS 系统** + **掉落道具**
- **自定义模式**：22 滑块调节属性 + 4 档预设 + 开局技能叠选
- **操作**：WASD 移动 · 自动射击 · Shift 冲刺 · E 反击 · Q 自动寻路 · Tab 属性面板

### 🔢 2048 (152行)
经典滑动合成游戏，DOM 复用动画方案

## 🚀 快速开始

```bash
# 启动本地服务器
cd toolbox
python -m http.server 8080

# 浏览器打开
# http://localhost:8080
```

## 📁 项目结构

```
toolbox/
├── index.html          # 入口
├── tools.json          # 工具注册表
├── css/
│   ├── main.css        # 主样式
│   └── themes/         # 亮/暗主题
├── js/
│   ├── app.js          # 入口逻辑
│   ├── router.js       # 路由 & 欢迎页
│   ├── theme.js        # 主题切换
│   └── modules/        # 31个工具模块 + 2个游戏
└── .gitignore
```

## 🤝 贡献

欢迎 PR！工具模块需遵循约定：

```js
export const id = 'my-tool';
export const name = '我的工具';
export const icon = '🔧';
export const description = '工具描述';
export const category = '日常工具';
export function init(container) { /* 渲染UI */ }
export function cleanup() { /* 清理事件/定时器 */ }
```

## 📄 License

MIT
