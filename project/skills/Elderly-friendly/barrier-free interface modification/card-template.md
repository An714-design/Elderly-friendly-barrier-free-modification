# 卡片模板

## Issue 数据结构

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

## 字段说明

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
| evidence.target | string | text/background/component，决定改造呈现方式 |
| evidence.actualValue | number | 实际检测值 |
| evidence.threshold | number | 阈值 |
| evidence.fgColor | string | 前景色(检测时提取) |
| evidence.bgColor | string | 背景色(检测时提取) |
| evidence.dpr | number | 设备像素比 |
| evidence.estNote | string | 估算值标注(如"字号为估算值")，精确值则留空 |

## 改造详情卡片类型

### 8A：fixTypes 含 "color" → 颜色改造

**分支决策：**

```
evidence.target == "text"       → 色块对比(8A.1)
evidence.target == "background" → 背景像素替换(8A.2，含降级)
evidence.target == "component"  → 色块对比(8A.1)
```

**8A.1 色块对比（text/component）**

- 左：原色块(fg色样+bg色样+对比度❌)
- 右：建议色块(新fg+bg+对比度✅)
- 不做像素替换

**8A.2 背景像素替换（background，含降级）**

- 前置安全检查：fgBgDist < tolerance(35) → 降级为8A.1
- 逐像素替换：rgbDistance(pixel, bgColor) < tolerance 才替换
- 渲染前后对比：左"改造前"右"改造后"

### 8B：fixTypes 含 "size" → HTML/CSS 示意

- 左"改造前"(当前尺寸) → 右"改造后"(建议尺寸)
- 并排可视化 + 达标状态

## 标注图渲染规则

| 分级 | 样式 |
|---|---|
| hard（硬性项） | 红色实线框（#dc2626，3px） |
| soft（提示项） | 黄色虚线框（#f59e0b，2px，dash[8,4]） |

## 验收报告结构

```
封面：系统名称 / 检测日期 / 模式 / 标准档位 / DPR
概览：总问题数 / hard-soft分布 / 影响人群分布 / 规则覆盖清单
标注图（全图）
逐条问题：编号 / 缩略图 / 类别 / 分级 / 影响人群 / 标准条款 / 问题描述 / 改造建议 / 改造对比卡片
改造汇总：按类别统计 + 优先级建议
验收结论：hard项全部pass=合格；否则列出未通过项
免责声明：本报告为辅助自检，非第三方合规验收
```