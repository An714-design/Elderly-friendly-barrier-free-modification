# 适老化/无障碍界面改造方案 SOP

| 项目 | 内容 |
|---|---|
| 文档名称 | 校园系统适老化/无障碍界面改造 Agent 方案 SOP |
| 版本 | v1.0（修正定稿） |
| 日期 | 2026-10-11 |
| 状态 | 待审核 |
| 目标用户 | 设计师、研发人员 |
| 技术栈 | 前端 Canvas API + html-to-image + jsPDF / 云函数 盘古大模型 |

---

## 一、项目概述

上传一张校园系统界面截图，输出一份可执行的适老化/无障碍改造方案：**问题清单 + 标注图 + 改造后效果 + 可交付验收报告**。

### 主链路

```
上传截图（拖拽/粘贴）
  ↓
用户手动画框标注区域（唯一区域来源，无自动分割）
  ↓
双引擎分析：规则引擎算客观指标 + AI 做语义判断
  ↓
标注图 + 问题清单（分级/影响人群/标准条款）
  ↓
单条改造详情 + 一键导出验收报告（PNG/PDF）
```

### 产品定位声明

> **本产品只做"在真实位置上呈现颜色变化"，不做整页重绘。像素替换仅限用户框选区域内、且前景背景色距 ≥ 容差的背景色块。**

---

## 二、设计原则

### 原则一：肉眼可验收

每个功能都必须有【我能用肉眼判断对错】的验收标准。

- 反例：【分割出多少个区域】——多少算对？判断不出来，不能做。
- 正例：【框选一块区域，能不能算出 3.18:1】——能和 3.18 对上就是对的。

### 原则二：禁止静默出错

任何失败时不会报错、只会【静默出错】的功能，一律砍掉。报错能复制修复；算法逻辑错了，根本不知道自己错了。

---

## 三、输入模式

| 模式 | 用户 | 输入 | 规则覆盖 | 说明 |
|---|---|---|---|---|
| 模式A | 设计师 | 纯截图 | 仅V层8条 | 报告标注"仅视觉检测" |
| 模式B | 研发 | 截图+DOM片段 | V层8条+S层4条(纯结构) | DOM仅做结构检查，不计算样式 |

> 模式C（Puppeteer抓URL）已删除：Chromium体积超限、内网不可达、登录验证码无解、合规风险。

---

## 四、12 阶段完整流程

### 阶段 0：模式选择

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 0.1 选择模式 | [前端] | 用户操作 | mode: A/B | A=纯截图；B=截图+DOM片段 |
| 0.2 标准档位 | [前端] | 用户选择 | level: AA/AAA | 影响后续规则阈值 |
| 0.3 DPR声明 | [前端] | 用户选择 | DPR: 1/2/3/自定义 | 下拉框+自定义输入 |
| 0.4 加载UI | [前端] | mode | 对应上传界面 | A：仅截图上传；B：截图+DOM粘贴框 |

### 阶段 1：数据采集

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 1.1 截图上传 | [前端] | 拖拽/粘贴 | ImageBitmap | drag-drop + clipboard API |
| 1.2 绘制Canvas | [前端] | ImageBitmap | Canvas(原图) | 记录宽高，保留原始像素 |
| 1.3 DOM粘贴(模式B) | [前端] | HTML字符串 | virtualDOM | `new DOMParser().parseFromString()`，仅用于纯结构检查 |
| 1.4 隐私确认 | [前端] | 用户操作 | confirmed | 用户勾选"已确认无敏感信息"；提供矩形遮挡工具(拖拽画框→马赛克覆盖) |

### 阶段 2：用户手动画框标注区域

> 唯一区域来源，无自动分割。

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 2.1 画框工具 | [前端] | Canvas+鼠标 | rawBox{x,y,w,h} | Canvas上拖拽画矩形框，实时预览 |
| 2.2 区域类型标注 | [前端] | rawBox | region{type} | 用户画完框后选类型：文字(text)/控件(control)/图标(icon)/背景(background)。必选 |
| 2.3 分配regionId | [前端] | region | region{id} | 自增编号 R01, R02... |
| 2.4 区域管理 | [前端] | regions[] | regions[] | 支持删除框、调整框边界(拖拽边角) |
| 2.5 确认提交 | [前端] | regions[] | 进入阶段3 | 用户确认区域标注完成 |

**输出结构：**

```json
{
  "regions": [
    { "id": "R01", "x": 120, "y": 80, "w": 200, "h": 40, "type": "text" },
    { "id": "R02", "x": 20, "y": 600, "w": 80, "h": 32, "type": "control" }
  ]
}
```

**验收标准：** 用户框选一块文字区域 → 系统报出该区域的对比度数值 → 用户能与肉眼所见对照判断对错。

### 阶段 3：V层指标计算（纯本地）

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 3.1 主色提取 | [前端] | Canvas+region | fgColor, bgColor | 区域内像素聚类，文字区取深色簇=fg/浅色簇=bg；控件区取边框色/填充色 |
| 3.2 对比度计算 | [前端] | fg, bg | contrastRatio | `L = 0.2126R+0.7152G+0.0722B`(sRGB换算后)；`(L1+0.05)/(L2+0.05)` |
| 3.3 字号估算 | [前端] | region(type=text) | fontSizeEst(标注估算值) | `区域设备像素高 ÷ DPR ÷ 0.75`，报告中标注"估算值"；允许用户手动覆盖 |
| 3.4 触摸目标尺寸 | [前端] | region(type=control) | targetW, targetH(CSS px) | `区域设备像素宽 ÷ DPR`，`区域设备像素高 ÷ DPR` |
| 3.5 行高/间距估算 | [前端] | region(type=text) | lineHeightEst | 相邻文字行间距统计，标注"估算值" |

### 阶段 4：规则引擎判定

#### 4A：V层规则逐条判定（截图即可，所有模式都跑）

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 4A.1 逐区域遍历 | [前端] | regions[] + V层指标 | vIssues[] | 每个区域按type跑对应规则 |
| 4A.2 判定 | [前端] | 指标值+阈值 | pass/fail | 见规则库表(第五章) |

#### 4B：S层规则判定（仅模式B，纯结构检查4条）

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 4B.1 label关联 | [前端] | virtualDOM | issues[] | 检查每个input是否有label[for]=input.id 或被label包裹 |
| 4B.2 img alt | [前端] | virtualDOM | issues[] | 检查img是否有alt属性(alt=""视为装饰图可接受) |
| 4B.3 ARIA可达名称 | [前端] | virtualDOM | issues[] | 检查button/[role=button]是否有aria-label/alt/textContent/aria-labelledby |
| 4B.4 标题层级 | [前端] | virtualDOM | issues[] | 检查h1-h6是否跳级、是否有多个h1 |

> 模式A无DOM，跳过4B，sIssues=[]。报告标注"仅含视觉检测，未含语义检测"。

### 阶段 5：AI语义分析（简化版）

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 5.1 构造prompt | [前端] | regions[]+截图base64 | prompt | regions JSON + 截图 + few-shot示例(要求返回带regionId的JSON) |
| 5.2 调用云函数 | [前端] | prompt | 响应 | POST到云函数，8秒超时 |
| 5.3 云函数转发盘古 | [云函数] | prompt | 盘古响应 | 调用盘古视觉大模型API |
| 5.4 前端解析 | [前端] | 响应 | aiIssues[]或[] | `try { JSON.parse } catch { return [] }`。解析失败/超时→返回空数组，不阻断 |
| 5.5 标记来源 | [前端] | aiIssues[] | aiIssues[](level=soft) | AI结果统一标记为level:"soft"(提示项)，不作为硬性验收项 |

### 阶段 6：结果合并去重

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 6.1 合并三源 | [前端] | vIssues+sIssues+aiIssues | merged[] | 统一结构 |
| 6.2 去重 | [前端] | merged[] | deduped[] | 同一regionId + 同一ruleId才算重复，保留evidence最完整的一条。不同ruleId的同一区域=独立证据，不合并 |
| 6.3 分级标记 | [前端] | deduped[] | finalIssues[] | hard=V/S层规则引擎fail；soft=AI提示项 |
| 6.4 fixTypes赋值 | [前端] | finalIssues[] | finalIssues[](含fixTypes[]) | 按ruleId映射，数组形式 |
| 6.5 排序 | [前端] | finalIssues[] | sortedIssues[] | severity(高→低) → level(hard→soft) |

### 阶段 7：渲染标注图 + 问题清单

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 7.1 绘制标注图 | [前端] | Canvas+sortedIssues | annotatedCanvas | hard=红实线框、soft=黄虚线框；框上标issueId |
| 7.2 渲染清单 | [前端] | sortedIssues | 清单HTML | 每条：编号+区域缩略图+类别+分级标签+影响人群+标准条款+fixTypes |
| 7.3 交互联动 | [前端] | 用户点击 | 高亮对应 | 点清单项→Canvas对应框闪烁；点框→清单项滚动展开 |
| 7.4 模式提示 | [前端] | mode | 顶部banner | 模式A显示"仅视觉检测，建议研发提供DOM做完整检测" |

### 阶段 8：单条改造详情

> 用户点击清单中某条 → 展开改造详情。代码diff已删除，仅保留两种：

#### 8A：fixTypes含"color" → 颜色改造

**分支决策：**

```
evidence.target == "text"       → 色块对比(8A.1)
evidence.target == "background" → 背景像素替换(8A.2，含降级)
evidence.target == "component"  → 色块对比(8A.1)
```

**8A.1 色块对比（text/component）**

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 8A.1.1 提取原色 | [前端] | issue.evidence | fgColor, bgColor | 从规则引擎结果中取 |
| 8A.1.2 提取建议色 | [前端] | issue.suggestion | newFgColor | 从建议中解析 |
| 8A.1.3 计算新对比度 | [前端] | newFg+bg | newRatio | 同对比度公式 |
| 8A.1.4 渲染对比卡片 | [前端] | 原色块+建议色块+数值 | HTML卡片 | 左：原色块(fg色样+bg色样+对比度❌) → 右：建议色块(新fg+bg+对比度✅)。不做像素替换 |

**8A.2 背景像素替换（background，含降级）**

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 8A.2.1 前置安全检查 | [前端] | fgColor, bgColor, tolerance=35 | 通过/降级 | 计算`fgBgDist = rgbDistance(fg, bg)`；若 < tolerance → 降级为8A.1色块对比，提示"原图对比度过低，已改用色块示意" |
| 8A.2.2 逐像素替换 | [前端] | regionCanvas, bgColor, newBgColor, tolerance | fixedCanvas | 逐像素判断：`rgbDistance(pixel, bgColor) < tolerance` 才替换为newBgColor，否则保留原像素(文字/前景) |
| 8A.2.3 渲染前后对比 | [前端] | regionCanvas+fixedCanvas | 对比卡片 | 左"改造前"右"改造后"，标注修改区域 |

**8A.2 算法伪代码：**

```javascript
function renderBackgroundFix(regionCanvas, fgColor, bgColor, newBgColor, tolerance = 35) {
  // 步骤1：前置安全检查
  const fgBgDist = rgbDistance(fgColor, bgColor);
  if (fgBgDist < tolerance) {
    return {
      type: 'fallback',
      reason: '原图前景背景色距过近（' + fgBgDist.toFixed(1) + ' < 容差 ' + tolerance + '），已改用色块示意',
      render: () => renderColorBlockCompare(fgColor, bgColor, fgColor, newBgColor)
    };
  }

  // 步骤2：逐像素替换背景
  const ctx = regionCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, regionCanvas.width, regionCanvas.height);
  const data = imageData.data;
  const bgRgb = hexToRgb(bgColor);
  const newBgRgb = hexToRgb(newBgColor);

  for (let i = 0; i < data.length; i += 4) {
    const pixel = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (rgbDistance(pixel, bgRgb) < tolerance) {
      data[i]     = newBgRgb.r;
      data[i + 1] = newBgRgb.g;
      data[i + 2] = newBgRgb.b;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return { type: 'pixel-replaced', canvas: regionCanvas };
}

function rgbDistance(c1, c2) {
  return Math.sqrt(
    (c1.r - c2.r) ** 2 +
    (c1.g - c2.g) ** 2 +
    (c1.b - c2.b) ** 2
  );
}
```

**8A.2 肉眼可验收标准：**

| 测试用例 | 输入 | 期望输出 | 验收方法 |
|---|---|---|---|
| 白底黑字 | bg=#FFFFFF, fg=#000000, newBg=#FFF0F0 | 像素替换成功，文字完整可读、无浅色晕圈 | 肉眼看改造后图中文字是否清晰、边缘无残色 |
| 浅灰底深灰字 | bg=#E0E0E0, fg=#999999, newBg=#FFFFFF | 自动降级为色块对比，提示"对比度过低" | 肉眼看是否出现降级提示+色块对比卡片 |
| 白底红字 | bg=#FFFFFF, fg=#CC0000, newBg=#FFFFF0 | 像素替换成功，红色文字完整保留 | 肉眼看红色文字是否完整无缺损 |

#### 8B：fixTypes含"size" → HTML/CSS示意

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 8B.1 提取当前值 | [前端] | issue.evidence | actualSize | 如 fontSize=14px, target=32×32 |
| 8B.2 提取建议值 | [前端] | issue.suggestion | suggestedSize | 如 fontSize=18px, target=44×44 |
| 8B.3 渲染对比卡片 | [前端] | 当前值+建议值 | HTML卡片 | 固定模板：左"改造前(14px/32×32)" → 右"改造后(18px/44×44)"并排示意+达标状态 |

### 阶段 9：整页改造效果

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 9.1 组装效果页 | [前端] | annotatedCanvas+所有改造卡片 | 改造效果视图 | 上方：原始标注图；下方：逐条改造卡片纵向排列 |
| 9.2 视图切换 | [前端] | 用户操作 | 标注图视图/改造效果视图 | Tab切换 |

### 阶段 10：导出验收报告

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 10.1 组装报告HTML | [前端] | 全部数据 | reportHTML | 封面+概览+标注图+逐条问题+改造卡片+验收结论+免责声明 |
| 10.2 导出PNG | [前端] | reportHTML | PNG文件 | `htmlToImage.toPng(node, {pixelRatio: 2})` |
| 10.3 导出PDF(图片式) | [前端] | reportHTML | PDF文件 | 见下方PDF方案A |
| 10.4 导出PDF(打印式) | [前端] | reportHTML | 打印对话框 | 见下方PDF方案B |
| 10.5 报告分视图 | [前端] | sortedIssues | 设计侧/研发侧 | 设计侧：标注图+视觉问题+色块/尺寸对比；研发侧：标注图+结构问题+文字改造建议 |

**验收报告结构：**

```
封面：系统名称 / 检测日期 / 模式 / 标准档位 / DPR及折算依据
概览：总问题数 / hard-soft分布 / 影响人群分布 / 规则覆盖清单
标注图（全图）
逐条问题：编号 / 缩略图 / 类别 / 分级 / 影响人群 / 标准条款 / 问题描述 / 改造建议 / 改造对比卡片
改造汇总：按类别统计 + 优先级建议
验收结论：hard项全部pass=合格；否则列出未通过项
免责声明：本报告为辅助自检，非第三方合规验收
```

**PDF方案A：一键导出PDF（html-to-image + jsPDF）**

4个实现约束：

| 约束 | 要求 | 原因 |
|---|---|---|
| 字体 | 报告节点只用系统字体栈 `font-family: -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif` | 不引外部字体，避免ttf CORS加载失败导致渲染空白 |
| 分页 | 不按像素均分分页，按内容节点(`.report-section`)分页，每节高度 ≤ A4内容高(约1100px@1240宽) | 像素均分会把文字行截断成上下两半 |
| 节点可见 | 待转节点必须可见。如需离屏渲染用`position: absolute; left: -9999px`，禁止`display: none` | html-to-image对display:none节点返回空白 |
| 尺寸 | 节点宽度固定`1240px`，`pixelRatio: 2`(输出2480×3519px/页) | 1240px @2x ≈ A4宽度@300dpi，保证打印清晰度 |

```javascript
async function exportPDF(reportNode) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const sections = reportNode.querySelectorAll('.report-section');
  
  for (let i = 0; i < sections.length; i++) {
    const png = await htmlToImage.toPng(sections[i], {
      pixelRatio: 2,
      backgroundColor: '#ffffff'
    });
    if (i > 0) pdf.addPage();
    pdf.addImage(png, 'PNG', 0, 0, 210, 297);
  }
  pdf.save('无障碍验收报告.pdf');
}
```

**PDF方案B：打印/另存为PDF（window.print）**

```css
@media print {
  /* 强制打印背景色和色块 */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 分页控制 */
  .report-section {
    page-break-inside: avoid;
  }
  .report-section + .report-section {
    page-break-before: auto;
  }
  .annotation-map {
    page-break-after: always;
  }

  /* 隐藏不需要打印的元素 */
  .no-print {
    display: none !important;
  }

  /* 页边距 */
  @page {
    margin: 15mm 12mm;
  }

  /* 字体回退 */
  body {
    font-family: "Microsoft YaHei", "PingFang SC", "SimHei", sans-serif;
  }
}
```

```javascript
function printReport() {
  window.print();
}
```

**两方案对比：**

| | 方案A(图片式PDF) | 方案B(打印PDF) |
|---|---|---|
| 触发方式 | 一键导出 | 调起打印对话框，用户选另存为PDF |
| 中文 | 图片渲染，无字体问题 | 浏览器原生渲染，中文完美 |
| 文字可搜索 | 不可搜索 | 可搜索可选中 |
| 色块/标注框 | 图片内嵌，必定保留 | 依赖print-color-adjust: exact，已配置 |
| 分页精确度 | 高(jsPDF控制) | 中(CSS控制，浏览器差异) |
| 依赖 | html-to-image + jsPDF | 零依赖 |

### 阶段 11：复检闭环

| 步骤 | 端 | 入 | 出 | 技 |
|---|---|---|---|---|
| 11.1 保存本次报告 | [前端] | reportHTML+sortedIssues | localStorage | 存为`report-{date}.json` |
| 11.2 改造后复检 | [前端] | 新上传截图 | 新报告 | 用户改造后重新走阶段1-10，生成第二份报告 |
| 11.3 并排对比 | [前端] | 旧报告+新报告 | 对比视图 | 两份报告左右并排展示，不做自动配对diff。用户自行目测对比 |

---

## 五、完整规则库

### V层（视觉，截图可判，所有模式都跑）

| 规则ID | 名称 | 判定逻辑 | AA阈值 | AAA阈值(可选) | 标准条款 | fixTypes | evidence.target |
|---|---|---|---|---|---|---|---|
| V1 | 对比度-正文 | fg/bg对比度 | ≥4.5:1 | ≥7:1 | WCAG 2.1 SC 1.4.3 | ["color"] | text |
| V2 | 对比度-大字(≥18pt或≥14pt粗体) | fg/bg对比度 | ≥3:1 | ≥4.5:1 | WCAG 2.1 SC 1.4.3 | ["color"] | text |
| V3 | 对比度-非文本UI组件 | 组件边界/背景对比度 | ≥3:1 | — | WCAG 2.1 SC 1.4.11 | ["color"] | component |
| V4 | 最小字号 | fontSize估算 | ≥18px(正文)/≥14px(辅助) | — | 适老化建议(非WCAG强制) | ["size"] | text |
| V5-AA | 触摸目标尺寸(AA) | targetW×targetH | ≥24×24 CSS px | — | WCAG 2.2 SC 2.5.8 | ["size"] | background |
| V5-AAA | 触摸目标尺寸(AAA) | targetW×targetH | — | ≥44×44 CSS px | WCAG 2.1 SC 2.5.5 | ["size"] | background |
| V6 | 颜色不依赖信息 | 人工+AI判断是否仅用颜色区分 | 不应仅用颜色 | — | WCAG 2.1 SC 1.4.1 | ["color"] | component |
| V7 | 行高 | lineHeight估算 | ≥1.5 | — | 适老化建议(非WCAG强制) | ["size"] | text |
| V8 | 文字间距 | letterSpacing估算 | ≥0.12em | — | 适老化建议(非WCAG强制) | ["size"] | text |

### S层（语义，需DOM，仅模式B，纯结构检查4条）

| 规则ID | 名称 | 判定逻辑 | 阈值 | 标准条款 | fixTypes |
|---|---|---|---|---|---|
| S1 | label关联 | 每个input是否有关联label | 100% | WCAG 2.1 SC 1.3.1 | ["semantic"] |
| S2 | img alt | 每个img是否有alt属性 | 100%(装饰图alt=""可接受) | WCAG 2.1 SC 1.1.1 | ["semantic"] |
| S3 | ARIA可达名称 | button/[role]是否有accessible name | 100% | WCAG 2.1 SC 4.1.2 | ["semantic"] |
| S4 | 标题层级 | h1-h6无跳级、不重复h1 | 100% | WCAG 2.1 SC 1.3.1 | ["semantic"] |

### 国内标准（报告中同时引用）

| 标准 | 用途 |
|---|---|
| GB/T 37668-2019 | 信息技术 互联网内容无障碍可访问性技术要求 |
| YD/T 1761 | 信息无障碍 身体机能差异人群分级网站设计要求 |

### 对比度计算公式

```
sRGB线性化：若 C ≤ 0.03928 则 L = C/12.92 否则 L = ((C+0.055)/1.055)^2.4
相对亮度：L = 0.2126*R + 0.7152*G + 0.0722*B
对比度：  (L1 + 0.05) / (L2 + 0.05)   其中 L1 ≥ L2
```

---

## 六、Issue 数据结构

```json
{
  "issueId": "I01",
  "regionId": "R01",
  "region": { "x": 120, "y": 80, "w": 200, "h": 40 },
  "ruleId": "V1",
  "category": "对比度-正文",
  "level": "hard",
  "severity": "高",
  "description": "正文对比度 3.18:1，低于 AA 要求 4.5:1",
  "suggestion": "文字颜色由 #777777 改为 #333333",
  "standard": "WCAG 2.1 SC 1.4.3 (AA: 4.5:1)",
  "affectedGroups": ["低视力", "老年用户"],
  "fixTypes": ["color"],
  "source": "rule-engine",
  "evidence": {
    "target": "text",
    "actualValue": 3.18,
    "threshold": 4.5,
    "fgColor": "#777777",
    "bgColor": "#FFFFFF",
    "dpr": 2,
    "estNote": "字号为估算值"
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|---|---|---|
| issueId | string | 问题编号，I01自增 |
| regionId | string | 关联的区域编号，R01 |
| region | object | 区域坐标{x,y,w,h}，设备像素 |
| ruleId | string | 触发的规则ID，如V1/S1 |
| category | string | 问题类别名称 |
| level | string | hard=规则引擎fail(硬性项)；soft=AI提示项 |
| severity | string | 高/中/低 |
| description | string | 问题描述(含实际值与阈值) |
| suggestion | string | 改造建议 |
| standard | string | 标准条款引用 |
| affectedGroups | string[] | 影响人群 |
| fixTypes | string[] | 修复类型数组，如["color"]或["color","size"] |
| source | string | rule-engine或ai |
| evidence.target | string | text/background/component，决定8A改造呈现方式 |
| evidence.actualValue | number | 实际检测值 |
| evidence.threshold | number | 阈值 |
| evidence.fgColor | string | 前景色(检测时提取) |
| evidence.bgColor | string | 背景色(检测时提取) |
| evidence.dpr | number | 设备像素比 |
| evidence.estNote | string | 估算值标注(如"字号为估算值")，精确值则留空 |

---

## 七、完整数据流图

```
阶段0  模式选择: A(纯截图) / B(截图+DOM)
       + 标准档位(AA/AAA) + DPR声明
  │
阶段1  截图 ──→ Canvas
       DOM(模式B) ──→ virtualDOM(仅结构)
       隐私: 用户勾选确认 + 遮挡工具
  │
阶段2  用户手动画框 ──→ regions[](含id/坐标/type)
       ★ 唯一区域来源，无自动分割
  │
阶段3  regions[] + Canvas ──→ V层指标
       对比度(精确) / 字号(估算) / 尺寸(精确) / 行高(估算)
  │
阶段4  V层: 8条规则逐区域判定 ──→ vIssues[]
       S层(模式B): 4条纯结构检查 ──→ sIssues[]
  │
阶段5  regions[] + 截图 ──→ 云函数 ──→ 盘古 ──→ aiIssues[]
       try/catch + 8s超时 → 失败返回[]不阻断
  │
阶段6  vIssues + sIssues + aiIssues
       ──→ 去重(regionId+ruleId) ──→ 分级(hard/soft)
       ──→ fixTypes[]赋值 ──→ 排序 ──→ sortedIssues[]
  │
阶段7  Canvas + sortedIssues ──→ 标注图 + 问题清单
       (hard红实线 / soft黄虚线)
  │
阶段8  逐条 issue 按 fixTypes 分流:
       color  ──→ target=text/component: 色块对比
                  target=background: 像素替换(含降级安全检查)
       size   ──→ HTML/CSS示意卡片(前→后并排)
       ★ 代码diff已删除
  │
阶段9  标注图 + 改造卡片 ──→ 整页改造效果
       (不重绘整页)
  │
阶段10 全部数据 ──→ 报告HTML
       PNG: html-to-image
       PDF(图片式): html-to-image→PNG→jsPDF addImage
       PDF(打印式): window.print + @media print
       设计侧视图 + 研发侧视图
  │
阶段11 保存报告 → 改造后复检 → 两份报告并排对比
       (不做自动配对diff)
```

---

## 八、MVP 范围 + 后续加成顺序

### MVP（第一版）最小闭环

| 阶段 | MVP包含 | MVP砍掉 |
|---|---|---|
| 0 | 仅模式A，仅AA档，DPR固定2x | 模式B、AAA档、自定义DPR |
| 1 | 截图上传+Canvas+隐私勾选 | DOM粘贴、遮挡工具 |
| 2 | 手动画框+类型标注+删除/调整 | — |
| 3 | 对比度(精确)+尺寸(精确) | 字号估算、行高、间距 |
| 4 | V1对比度-正文 + V5-AA触摸目标(2条) | 其余V层规则、S层全部 |
| 5 | AI语义分析(try/catch降级) | — |
| 6 | 合并+去重+排序 | — |
| 7 | 标注图+清单 | 交互联动 |
| 8 | 8A色块对比 | 8B尺寸示意、背景像素替换 |
| 9 | 标注图+改造卡片 | 视图切换 |
| 10 | 导出PNG | 导出PDF、分视图 |
| 11 | — | 复检闭环 |

**MVP验收标准：** 上传截图 → 手动画一个文字框 → 报出对比度数值(能与肉眼对照) → 画一个按钮框 → 报出触摸尺寸 → 生成标注图+清单+色块对比 → 导出PNG。

### 后续加成顺序

| 顺序 | 加成内容 | 解锁价值 |
|---|---|---|
| 1 | V层其余规则(V2/V3/V4/V6/V7/V8) + 字号估算 | 视觉检测覆盖率从2条→8条 |
| 2 | 8B尺寸示意卡片 | 触摸目标改造可视化 |
| 3 | 8A.2背景像素替换(含降级) | 背景色改造在真实位置呈现 |
| 4 | 导出PDF(方案A+方案B) | 可交付验收报告 |
| 5 | 模式B + S层4条纯结构检查 | 语义检测，研发可用 |
| 6 | AAA档位 + V5-AAA(44×44) | 更高标准支持 |
| 7 | 报告分视图(设计侧/研发侧) | 两类用户各取所需 |
| 8 | 复检闭环(并排对比) | 改造后验证 |
| 9 | 自定义DPR + 字号手动覆盖 | 适配更多设备 |
| 10 | 遮挡工具 | 隐私保护增强 |

---

## 九、已删除内容清单（含删除理由）

| 删除内容 | 删除理由 |
|---|---|
| 阶段2自动区域分割(Sobel/Canny+K-means+连通域) | UI截图过分割、汉字连通域碎裂、失败不可验收(500碎片无法判断对错)、且又要人工编辑=冗余 |
| 模式C(Puppeteer抓URL) | Chromium体积超云函数限制；校园内网公网不可达；登录验证码无解；合规风险 |
| 模式B CSS相关检查(焦点样式/布局) | 游离DOM无CSS上下文，getComputedStyle不可信 |
| S层键盘可达/Tab顺序/焦点样式/表单错误提示(原S5-S8) | 依赖CSS或交互态，游离DOM无法执行 |
| V9焦点可见性(视觉) | 截图无法可靠判断焦点态 |
| 9C代码diff | 引入jsdiff违反禁止新库约束；对设计师/教师评委无价值 |
| 阶段6.4三重校验+重试+置信度过滤 | 第一版过度设计，简化为try/catch+超时降级 |
| 阶段12自动配对diff | 手画框两次必然对不上，架构不自洽 |

---

## 十、审核确认

| 审核项 | 状态 |
|---|---|
| 12阶段流程完整性 | ☐ 待确认 |
| 规则库正确性(标准条号/阈值) | ☐ 待确认 |
| issue数据结构完整性 | ☐ 待确认 |
| 背景像素替换算法(含降级) | ☐ 待确认 |
| PDF导出方案(双方案) | ☐ 待确认 |
| MVP范围合理性 | ☐ 待确认 |
| 后续加成顺序 | ☐ 待确认 |

> 审核通过后，按本SOP执行开发。