---
name: Elderly-friendly/barrier-free interface modification
description: >-
  适老化/无障碍界面改造检测工具。上传界面截图 → 手动画框标注区域 →
  双引擎检测（规则引擎+AI）→ 输出标注图+问题清单+改造详情+验收报告。
  面向设计师和研发人员，基于 WCAG 2.1/2.2 标准。
version: 1.0.0
author: CodeArts
license: MIT
tags:
  - accessibility
  - wcag
  - elderly
  - barrier-free
  - canvas
  - contrast-ratio
triggers:
  - 用户上传界面截图并要求检测无障碍/适老化问题
  - 用户提到"对比度"、"触摸目标"、"无障碍"、"适老化"、"WCAG"
  - 用户要求生成无障碍验收报告
---

# Elderly-friendly / Barrier-free Interface Modification

## 概述

本 Skill 封装了一套完整的适老化/无障碍界面改造检测方法论。用户上传一张界面截图，手动画框标注检测区域，系统通过双引擎（规则引擎 + AI 语义分析）自动检测无障碍问题，输出标注图、问题清单、改造详情和可交付验收报告。

## 设计原则

### 原则一：肉眼可验收

每个功能都必须有「我能用肉眼判断对错」的验收标准。

- 反例：【分割出多少个区域】——多少算对？判断不出来，不能做。
- 正例：【框选一块区域，能不能算出 3.18:1】——能和 3.18 对上就是对的。

### 原则二：禁止静默出错

任何失败时不会报错、只会静默出错的功能，一律砍掉。报错能复制修复；算法逻辑错了，根本不知道自己错了。

## 输入模式

| 模式 | 用户 | 输入 | 规则覆盖 | 说明 |
|---|---|---|---|---|
| 模式A | 设计师 | 纯截图 | 仅V层8条 | 报告标注"仅视觉检测" |
| 模式B | 研发 | 截图+DOM片段 | V层8条+S层4条 | DOM仅做结构检查 |

## 12 阶段流程

```
阶段0  模式选择 + 参数配置（标准档位/DPR）
  ↓
阶段1  截图上传 → Canvas 绘制 → 隐私确认
  ↓
阶段2  用户手动画框标注区域（文字/控件/图标/背景）
  ↓
阶段3  V层指标计算（K-means主色提取 → 对比度 → 字号 → 尺寸）
  ↓
阶段4  规则引擎判定（V层8条 + S层4条纯结构检查）
  ↓
阶段5  AI语义分析（云函数 → 盘古大模型，8s超时降级）
  ↓
阶段6  结果合并去重（regionId+ruleId去重 → 分级 → 排序）
  ↓
阶段7  渲染标注图 + 问题清单（hard红实线 / soft黄虚线）
  ↓
阶段8  单条改造详情（色块对比 / 背景像素替换 / 尺寸示意）
  ↓
阶段9  整页改造效果（标注图 + 改造卡片纵向排列）
  ↓
阶段10 导出验收报告（PNG / PDF图片式 / PDF打印式）
  ↓
阶段11 复检闭环（保存报告 → 改造后复检 → 并排对比）
```

> 完整规则库见 [rules.md](rules.md)，卡片模板见 [card-template.md](card-template.md)。

## 每张卡片包含

| 字段 | 类型 | 说明 |
|---|---|---|
| issueId | string | 问题编号，I01 自增 |
| regionId | string | 关联的区域编号，R01 |
| category | string | 问题类别（对比度-正文 / 触摸目标尺寸 / label关联 等） |
| level | string | hard=规则引擎fail（硬性项）；soft=AI提示项 |
| severity | string | 高 / 中 / 低 |
| description | string | 问题描述（含实际值与阈值） |
| standard | string | 标准条款引用（WCAG 2.1 SC X.X.X） |
| affectedGroups | string[] | 影响人群（低视力 / 老年用户 / 色盲用户 / 屏幕阅读器用户） |
| fixTypes | string[] | 修复类型数组（color / size / semantic） |
| evidence | object | 证据（fgColor / bgColor / actualValue / threshold / dpr） |
| suggestion | string | 改造建议（具体色值或尺寸） |

## 要求

- **输入**：界面截图（PNG/JPG，支持拖拽/粘贴/选文件）
- **浏览器**：支持 Canvas API（Chrome / Edge / Firefox）
- **可选**：DOM 片段（模式B，解锁 S 层语义检测）
- **可选**：云函数接口（AI 语义分析，未配置时自动降级跳过）
- **用户操作**：手动画框标注区域（唯一区域来源，无自动分割）
- **隐私确认**：用户需勾选"已确认截图中无敏感个人信息"

## 暂不支持

| 不支持项 | 原因 |
|---|---|
| 自动区域分割 | UI截图过分割、汉字连通域碎裂、失败不可验收 |
| URL 抓取检测（Puppeteer） | Chromium体积超限、内网不可达、登录验证码无解、合规风险 |
| 代码 diff 生成 | 引入jsdiff违反禁止新库约束；对设计师无价值 |
| CSS 样式检查 | 游离DOM无CSS上下文，getComputedStyle不可信 |
| 键盘可达 / Tab 顺序 | 依赖交互态，截图和游离DOM均无法执行 |
| 焦点可见性检测 | 截图无法可靠判断焦点态 |
| 自动前后配对 diff | 手画框两次必然对不上，架构不自洽 |

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端核心 | Canvas API + 原生 JavaScript | 零框架依赖 |
| 颜色分析 | K-means 聚类 | 区域内像素聚类提取前景/背景色 |
| 对比度 | WCAG 相对亮度公式 | sRGB线性化 → L=0.2126R+0.7152G+0.0722B |
| AI 分析 | 盘古视觉大模型（云函数） | try/catch + 8s 超时降级 |
| 导出 PNG | html-to-image (CDN) | toPng(node, {pixelRatio: 2}) |
| 导出 PDF | jsPDF (CDN) + window.print | 双方案：图片式 + 打印式 |

## 使用方法

1. 启动开发服务器：`python server.py`（端口 8888）
2. 浏览器访问：`http://localhost:8888/index.html`
3. 配置参数 → 上传截图 → 勾选隐私确认 → 画框标注 → 开始检测
4. 查看标注图 + 问题清单 → 点击单条查看改造详情
5. 导出验收报告（PNG / PDF）

## 示例

完整示例输出见 [examples/example-output.json](examples/example-output.json)。

## 许可证

MIT License