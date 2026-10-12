# 规则库

## V 层规则（视觉，截图可判，所有模式都跑）

| 规则ID | 名称 | 判定逻辑 | AA阈值 | AAA阈值 | 标准条款 | fixTypes | evidence.target | 影响人群 |
|---|---|---|---|---|---|---|---|---|
| V1 | 对比度-正文 | fg/bg对比度 | ≥4.5:1 | ≥7:1 | WCAG 2.1 SC 1.4.3 | ["color"] | text | 低视力、老年用户 |
| V2 | 对比度-大字(≥18pt或≥14pt粗体) | fg/bg对比度 | ≥3:1 | ≥4.5:1 | WCAG 2.1 SC 1.4.3 | ["color"] | text | 低视力、老年用户 |
| V3 | 对比度-非文本UI组件 | 组件边界/背景对比度 | ≥3:1 | — | WCAG 2.1 SC 1.4.11 | ["color"] | component | 低视力 |
| V4 | 最小字号 | fontSize估算 | ≥18px(正文)/≥14px(辅助) | — | 适老化建议(非WCAG强制) | ["size"] | text | 老年用户 |
| V5-AA | 触摸目标尺寸(AA) | targetW×targetH | ≥24×24 CSS px | — | WCAG 2.2 SC 2.5.8 | ["size"] | background | 运动障碍、老年用户 |
| V5-AAA | 触摸目标尺寸(AAA) | targetW×targetH | — | ≥44×44 CSS px | WCAG 2.1 SC 2.5.5 | ["size"] | background | 运动障碍、老年用户 |
| V6 | 颜色不依赖信息 | 人工+AI判断是否仅用颜色区分 | 不应仅用颜色 | — | WCAG 2.1 SC 1.4.1 | ["color"] | component | 色盲用户 |
| V7 | 行高 | lineHeight估算 | ≥1.5 | — | 适老化建议(非WCAG强制) | ["size"] | text | 老年用户、低视力 |
| V8 | 文字间距 | letterSpacing估算 | ≥0.12em | — | 适老化建议(非WCAG强制) | ["size"] | text | 老年用户、低视力 |

## S 层规则（语义，需DOM，仅模式B，纯结构检查4条）

| 规则ID | 名称 | 判定逻辑 | 阈值 | 标准条款 | fixTypes | 影响人群 |
|---|---|---|---|---|---|---|
| S1 | label关联 | 每个input是否有关联label | 100% | WCAG 2.1 SC 1.3.1 | ["semantic"] | 屏幕阅读器用户 |
| S2 | img alt | 每个img是否有alt属性 | 100%(装饰图alt=""可接受) | WCAG 2.1 SC 1.1.1 | ["semantic"] | 屏幕阅读器用户 |
| S3 | ARIA可达名称 | button/[role]是否有accessible name | 100% | WCAG 2.1 SC 4.1.2 | ["semantic"] | 屏幕阅读器用户 |
| S4 | 标题层级 | h1-h6无跳级、不重复h1 | 100% | WCAG 2.1 SC 1.3.1 | ["semantic"] | 屏幕阅读器用户 |

## 国内标准（报告中同时引用）

| 标准 | 用途 |
|---|---|
| GB/T 37668-2019 | 信息技术 互联网内容无障碍可访问性技术要求 |
| YD/T 1761 | 信息无障碍 身体机能差异人群分级网站设计要求 |

## 对比度计算公式

```
sRGB线性化：若 C ≤ 0.03928 则 L = C/12.92 否则 L = ((C+0.055)/1.055)^2.4
相对亮度：L = 0.2126*R + 0.7152*G + 0.0722*B
对比度：  (L1 + 0.05) / (L2 + 0.05)   其中 L1 ≥ L2
```

## 背景像素替换算法（含降级）

```javascript
function renderBackgroundFix(regionCanvas, fgColor, bgColor, newBgColor, tolerance = 35) {
  // 步骤1：前置安全检查
  const fgBgDist = rgbDistance(fgColor, bgColor);
  if (fgBgDist < tolerance) {
    // 降级：前景背景色距过近，改用色块对比
    return { type: 'fallback', render: () => renderColorBlockCompare(...) };
  }
  // 步骤2：逐像素替换背景
  for (let i = 0; i < data.length; i += 4) {
    const pixel = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (rgbDistance(pixel, bgColor) < tolerance) {
      data[i] = newBgRgb.r; data[i + 1] = newBgRgb.g; data[i + 2] = newBgRgb.b;
    }
  }
}

function rgbDistance(c1, c2) {
  return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
}
```