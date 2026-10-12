[README.md](https://github.com/user-attachments/files/33334189/README.md)
<div align="center">

# ♿ 适老化无障碍界面改造工具

**上传截图 · 画框标注 · 双引擎检测 · 一键导出验收报告**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Standard: WCAG 2.1](https://img.shields.io/badge/Standard-WCAG_2.1/2.2-green.svg)](https://www.w3.org/TR/WCAG21/)
[![Platform: Web](https://img.shields.io/badge/Platform-Web_Canvas-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success.svg)](#)
[![Built with CodeArts](https://img.shields.io/badge/Built_with-CodeArts-red.svg)](https://www.huaweicloud.com/product/codearts.html)

</div>

---

## 📖 项目介绍

随着我国老龄化加速及《无障碍环境建设法》实施，校园信息系统的无障碍适老化改造已成为法定要求。然而大量校园系统存在严重的无障碍问题——实测 11 个校园系统，对比度均低于 WCAG AA 标准 4.5:1，老年用户和低视力用户几乎无法正常阅读。

本工具面向**设计师**和**研发人员**，让设计师无需懂代码、研发无需搭环境，5 分钟内完成一次完整的无障碍检测并生成可交付报告。

### 核心流程

```
上传截图 → 手动画框标注区域 → 双引擎检测（规则引擎 + AI）→ 标注图 + 问题清单 → 改造详情 → 导出报告
```

### 已验证 11 个校园系统

| 教务类 | 生活类 | 学习类 | 社交类 |
|---|---|---|---|
| 教务选课系统 | 食堂点餐 App | 图书馆座位预约 | 社团活动报名 |
| 老旧教务管理系统 | 校园卡 App | 图书馆馆藏查询 | 校园二手交易 |
| 课程作业平台 | 校园地图 App | 宿舍报修表单 | |

---

## ✨ 核心亮点

| 亮点 | 说明 |
|---|---|
| 🎯 **肉眼可验收** | 每个功能都有「我能用肉眼判断对错」的验收标准，拒绝黑盒 |
| 🖼️ **截图即检测** | 设计师只需截图上传，零环境依赖，无需 URL，无需安装任何工具 |
| ⚡ **双引擎检测** | 规则引擎算客观指标（对比度/尺寸，精确可复现）+ AI 做语义判断（失败自动降级） |
| 🔧 **真实位置呈现** | 逐像素替换背景色，保留文字前景，含降级安全检查，不做整页重绘 |
| 📋 **一键导出报告** | PNG / PDF（图片式）/ PDF（打印式），含验收结论和免责声明 |
| 🚫 **禁止静默出错** | 失败不报错的功能一律砍掉，已删自动分割/Puppeteer/代码 diff |

---

## 🏗️ 功能架构

### 12 阶段完整流程

| 阶段 | 名称 | 说明 |
|---|---|---|
| 0 | 模式选择 + 参数配置 | 模式(A/B)、标准(AA/AAA)、DPR |
| 1 | 数据采集 | 拖拽/粘贴上传截图 → Canvas → 隐私确认 |
| 2 | 手动画框标注区域 | 拖拽画矩形框，选类型(文字/控件/图标/背景) |
| 3 | V层指标计算 | K-means 主色提取 → 对比度 → 字号 → 尺寸 |
| 4 | 规则引擎判定 | V层8条逐区域判定 + S层4条纯结构检查 |
| 5 | AI 语义分析 | 云函数 → 盘古大模型，8s 超时降级返回空数组 |
| 6 | 结果合并去重 | 三源合并 → regionId+ruleId 去重 → 分级 → 排序 |
| 7 | 渲染标注图 + 清单 | hard=红实线框、soft=黄虚线框 |
| 8 | 单条改造详情 | 色块对比 / 背景像素替换(含降级) / 尺寸示意 |
| 9 | 整页改造效果 | 标注图 + 改造卡片纵向排列，Tab 切换 |
| 10 | 导出验收报告 | PNG / PDF 图片式(jsPDF) / PDF 打印式(print) |
| 11 | 复检闭环 | 保存报告 → 改造后复检 → 并排目测对比 |

### 规则库

**V 层规则（视觉，截图可判，8 条）：**

| 规则 | 名称 | AA 阈值 | 标准条款 | 影响人群 |
|---|---|---|---|---|
| V1 | 对比度-正文 | ≥4.5:1 | WCAG 2.1 SC 1.4.3 | 低视力、老年用户 |
| V2 | 对比度-大字 | ≥3:1 | WCAG 2.1 SC 1.4.3 | 低视力、老年用户 |
| V3 | 对比度-UI组件 | ≥3:1 | WCAG 2.1 SC 1.4.11 | 低视力 |
| V4 | 最小字号 | ≥18px | 适老化建议 | 老年用户 |
| V5 | 触摸目标尺寸 | ≥24×24 | WCAG 2.2 SC 2.5.8 | 运动障碍、老年用户 |
| V6 | 颜色不依赖信息 | 不应仅用色 | WCAG 2.1 SC 1.4.1 | 色盲用户 |
| V7 | 行高 | ≥1.5 | 适老化建议 | 老年用户、低视力 |
| V8 | 文字间距 | ≥0.12em | 适老化建议 | 老年用户、低视力 |

**S 层规则（语义，需 DOM，4 条）：**

| 规则 | 名称 | 标准条款 | 影响人群 |
|---|---|---|---|
| S1 | label 关联 | WCAG 2.1 SC 1.3.1 | 屏幕阅读器用户 |
| S2 | img alt | WCAG 2.1 SC 1.1.1 | 屏幕阅读器用户 |
| S3 | ARIA 可达名称 | WCAG 2.1 SC 4.1.2 | 屏幕阅读器用户 |
| S4 | 标题层级 | WCAG 2.1 SC 1.3.1 | 屏幕阅读器用户 |

---

## 🔧 环境依赖

| 依赖 | 版本要求 | 用途 | 必需 |
|---|---|---|---|
| Python | ≥ 3.x | 启动开发服务器 | ✅ 必需 |
| 现代浏览器 | Chrome / Edge / Firefox | 运行应用（需支持 Canvas API） | ✅ 必需 |
| Node.js | — | — | ❌ 不需要 |
| npm | — | — | ❌ 不需要 |
| 前端框架 | — | — | ❌ 不需要 |
| 构建工具 | — | — | ❌ 不需要 |

> **零依赖设计**：纯静态 HTML/CSS/JS，无需 `npm install`，无需任何构建步骤。

---

## 📦 开源组件

| 组件 | 版本 | 用途 | 引入方式 | License |
|---|---|---|---|---|
| [html-to-image](https://github.com/bubkoo/html-to-image) | 1.11.11 | DOM 节点转 PNG 图片 | CDN | MIT |
| [jsPDF](https://github.com/parallax/jsPDF) | 2.5.2 | 生成 PDF 文件（图片式） | CDN | MIT |
| [python-pptx](https://github.com/scanny/python-pptx) | 1.0.2 | 生成交付 PPT（可选） | pip | MIT |
| Canvas API | 浏览器内置 | 截图绘制 / 像素操作 / 标注 | 浏览器原生 | — |
| DOMParser | 浏览器内置 | 解析 DOM 片段（模式 B） | 浏览器原生 | — |
| Python http.server | 标准库 | 开发服务器（自定义 MIME） | Python 内置 | — |

---

## 🚀 部署步骤

### 1. 克隆仓库

```bash
git clone https://github.com/An714-design/Elderly-friendly-barrier-free-modification.git
cd Elderly-friendly-barrier-free-modification
```

### 2. 启动开发服务器

```bash
python server.py
```

服务器启动后显示：
```
Serving on http://localhost:8888
```

### 3. 打开应用

浏览器访问 **http://localhost:8888/index.html**

### 4. 开始使用

1. **配置参数** → 选择模式（A=纯截图 / B=截图+DOM）、标准（AA/AAA）、DPR
2. **上传截图** → 拖拽 / 粘贴 / 选文件
3. **隐私确认** → 勾选无敏感信息
4. **画框标注** → 在截图上拖拽画框，选择类型（文字/控件/图标/背景）
5. **开始检测** → 规则引擎 + AI 自动分析
6. **查看结果** → 标注图 + 问题清单 + 改造详情
7. **导出报告** → PNG / PDF（图片式）/ PDF（打印式）

### 5. 观看演示

访问 **http://localhost:8888/demo.html** 观看 8 步自动播放演示（约 22 秒）

---

## 📥 输入输出示例

### 输入

一张界面截图（PNG/JPG），用户手动画框标注区域：

```json
{
  "regions": [
    { "id": "R01", "x": 32, "y": 140, "w": 120, "h": 28, "type": "text" },
    { "id": "R02", "x": 120, "y": 108, "w": 80, "h": 28, "type": "control" }
  ]
}
```

### 输出

问题清单 + 标注图 + 改造详情 + 验收报告：

```json
{
  "issues": [
    {
      "issueId": "I01",
      "regionId": "R01",
      "category": "对比度-正文",
      "level": "hard",
      "severity": "高",
      "description": "正文对比度 1.32:1，低于 AA 要求 4.5:1",
      "suggestion": "文字颜色由 #bbbbbb 改为 #333333",
      "standard": "WCAG 2.1 SC 1.4.3 (AA: 4.5:1)",
      "affectedGroups": ["低视力", "老年用户"],
      "fixTypes": ["color"]
    }
  ],
  "summary": {
    "totalIssues": 4,
    "hardCount": 3,
    "softCount": 1,
    "allPass": false
  }
}
```

完整示例见 [skills/.../examples/example-output.json](skills/Elderly-friendly/barrier-free%20interface%20modification/examples/example-output.json)。

---

## 📁 项目结构

```
├── index.html              # 主应用入口
├── demo.html               # 自动播放演示页面（8步动画）
├── server.py               # Python 开发服务器（端口8888，自定义MIME）
├── css/
│   └── style.css           # 全部样式（含打印CSS @media print）
├── js/
│   ├── app.js              # 全局状态 App 对象
│   ├── canvas.js           # Canvas 工具（hexToRgb/contrastRatio）
│   ├── metrics.js          # V层指标（K-means/对比度/字号/尺寸）
│   ├── rules.js            # 规则引擎（V层8条 + S层4条）
│   ├── ai.js               # AI 语义分析（盘古大模型，8s降级）
│   ├── merge.js            # 合并去重 + 排序
│   ├── render.js           # 标注图 + 问题清单渲染
│   ├── fix.js              # 改造详情（色块对比/像素替换/尺寸示意）
│   ├── export.js           # 导出（PNG/PDF图片式/打印式）
│   └── main.js             # 主入口（串联12阶段）
├── skills/
│   └── Elderly-friendly/
│       └── barrier-free interface modification/
│           ├── skill.md            # Skill 主文档
│           ├── rules.md            # 规则库完整定义
│           ├── card-template.md    # 卡片模板规范
│           └── examples/
│               └── example-output.json  # 示例输出
├── 适老化无障碍改造方案_SOP.md     # 完整 SOP 文档（593行）
├── LICENSE                          # MIT License
└── README.md                        # 本文件
```

---

## 🛠️ 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端核心 | Canvas API + 原生 JavaScript | 零框架依赖，纯静态 HTML/CSS/JS |
| 颜色分析 | K-means 聚类 | 区域内像素聚类提取前景色/背景色 |
| 对比度计算 | WCAG 相对亮度公式 | sRGB 线性化 → L=0.2126R+0.7152G+0.0722B |
| AI 分析 | 盘古视觉大模型（云函数） | try/catch + 8s 超时降级，失败不阻断 |
| 导出 PNG | html-to-image (CDN) | toPng(node, {pixelRatio: 2}) |
| 导出 PDF | jsPDF (CDN) + window.print | 双方案：图片式 + 打印式 |
| 开发服务器 | Python http.server (ThreadingMixIn) | 自定义 MIME type，端口 8888 |

### 对比度计算公式

```
sRGB 线性化：若 C ≤ 0.03928 则 L = C/12.92 否则 L = ((C+0.055)/1.055)^2.4
相对亮度：  L = 0.2126*R + 0.7152*G + 0.0722*B
对比度：    (L1 + 0.05) / (L2 + 0.05)   其中 L1 ≥ L2
```

---

## 🎨 设计原则

### 原则一：肉眼可验收

每个功能都必须有「我能用肉眼判断对错」的验收标准。

- 反例：【分割出多少个区域】——多少算对？判断不出来，不能做。
- 正例：【框选一块区域，能不能算出 3.18:1】——能和 3.18 对上就是对的。

### 原则二：禁止静默出错

任何失败时不会报错、只会静默出错的功能，一律砍掉。报错能复制修复；算法逻辑错了，根本不知道自己错了。

---

## 📊 遵循标准

| 标准 | 用途 |
|---|---|
| [WCAG 2.1](https://www.w3.org/TR/WCAG21/) / [WCAG 2.2](https://www.w3.org/TR/WCAG22/) | Web 内容无障碍指南（国际标准） |
| GB/T 37668-2019 | 信息技术 互联网内容无障碍可访问性技术要求 |
| YD/T 1761 | 信息无障碍 身体机能差异人群分级网站设计要求 |

---

## 🤖 码道 (CodeArts) 应用总结

本项目由**华为云码道 (CodeArts) 代码智能体**全程辅助开发。

### 应用流程

| 步骤 | 说明 |
|---|---|
| 💬 需求对话 | 用户描述适老化改造需求，CodeArts 评估可行性 |
| 📋 方案设计 | 生成 12 阶段 SOP 文档（593行），经多轮修正定稿 |
| 🏗️ 代码生成 | 10 个 JS 模块 + HTML + CSS，纯前端零依赖 |
| 🔍 问题修复 | 修复 ES Module 加载、MIME Type、线程阻塞等问题 |
| 🎬 演示制作 | 生成 8 步自动播放演示页面 |

### 关键能力体现

| 能力 | 本项目中的体现 |
|---|---|
| 需求理解与方案设计 | 从一句话需求 → 593 行完整 SOP（含 12 阶段/规则库/数据结构/验收标准） |
| 多轮对话修正 | 3 轮大修正：删除自动分割/Puppeteer/diff，确立两大设计原则 |
| 全栈代码生成 | 10 个 JS 模块共 ~700 行，覆盖 Canvas/K-means/规则引擎/AI/导出 |
| 工程问题排查 | 诊断并修复 MIME type 缺失/ES Module/线程阻塞/子进程 4 个问题 |
| 一体化交付 | 代码 + SOP 文档 + 演示页面 + 产品介绍 + 交付 PPT |

---

## 📝 暂不支持

| 不支持项 | 原因 |
|---|---|
| 自动区域分割 | UI 截图过分割、汉字连通域碎裂、失败不可验收 |
| URL 抓取检测 | Chromium 体积超限、内网不可达、合规风险 |
| 代码 diff 生成 | 引入新库违反约束；对设计师无价值 |
| CSS 样式检查 | 游离 DOM 无 CSS 上下文 |
| 键盘可达 / Tab 顺序 | 依赖交互态，截图无法执行 |
| 焦点可见性检测 | 截图无法可靠判断焦点态 |

---

## 📄 许可证

[MIT License](LICENSE) - 本项目采用 MIT 开源许可证。

---

<div align="center">

**Built with [华为云码道 (CodeArts)](https://www.huaweicloud.com/product/codearts.html) 代码智能体**

</div>
