App.RULES = {
  'V1': {
    id: 'V1', name: '对比度-正文', standard: 'WCAG 2.1 SC 1.4.3',
    fixTypes: ['color'], target: 'text', affectedGroups: ['低视力', '老年用户'],
    check: function (metrics, level) {
      var threshold = level === 'AAA' ? 7 : 4.5;
      return {
        pass: metrics.contrast >= threshold,
        actual: metrics.contrast, threshold: threshold,
        severity: metrics.contrast < 3 ? '高' : metrics.contrast < threshold ? '中' : '低',
        description: '正文对比度 ' + metrics.contrast.toFixed(2) + ':1，低于 ' + level + ' 要求 ' + threshold + ':1',
        suggestion: '文字颜色由 ' + App.rgbToHex(metrics.fg.r, metrics.fg.g, metrics.fg.b) + ' 改为 #333333',
      };
    },
  },
  'V5-AA': {
    id: 'V5-AA', name: '触摸目标尺寸(AA)', standard: 'WCAG 2.2 SC 2.5.8',
    fixTypes: ['size'], target: 'background', affectedGroups: ['运动障碍', '老年用户'],
    check: function (metrics, level) {
      var threshold = 24;
      var minDim = Math.min(metrics.target.w, metrics.target.h);
      return {
        pass: minDim >= threshold,
        actual: metrics.target.w + '×' + metrics.target.h,
        threshold: threshold + '×' + threshold,
        severity: minDim < 16 ? '高' : minDim < threshold ? '中' : '低',
        description: '触摸目标尺寸 ' + metrics.target.w + '×' + metrics.target.h + ' CSS px，低于 AA 要求 ' + threshold + '×' + threshold,
        suggestion: '增大触摸区域至至少 ' + threshold + '×' + threshold + ' CSS px',
      };
    },
  },
  'V5-AAA': {
    id: 'V5-AAA', name: '触摸目标尺寸(AAA)', standard: 'WCAG 2.1 SC 2.5.5',
    fixTypes: ['size'], target: 'background', affectedGroups: ['运动障碍', '老年用户'],
    check: function (metrics, level) {
      var threshold = 44;
      var minDim = Math.min(metrics.target.w, metrics.target.h);
      return {
        pass: minDim >= threshold,
        actual: metrics.target.w + '×' + metrics.target.h,
        threshold: threshold + '×' + threshold,
        severity: minDim < 24 ? '高' : minDim < threshold ? '中' : '低',
        description: '触摸目标尺寸 ' + metrics.target.w + '×' + metrics.target.h + ' CSS px，低于 AAA 要求 ' + threshold + '×' + threshold,
        suggestion: '增大触摸区域至至少 ' + threshold + '×' + threshold + ' CSS px',
      };
    },
  },
};

App.runVLayerRules = function (ctx, regions, dpr, level) {
  var issues = [];
  var issueCounter = 0;
  for (var ri = 0; ri < regions.length; ri++) {
    var region = regions[ri];
    if (region.type === 'text') {
      var colors = App.extractColors(ctx, region);
      var contrast = App.computeContrast(colors.fg, colors.bg);
      var metrics = { contrast: contrast, fg: colors.fg, bg: colors.bg };
      var result = App.RULES['V1'].check(metrics, level);
      if (!result.pass) {
        issueCounter++;
        issues.push({
          issueId: 'I' + String(issueCounter).padStart(2, '0'),
          regionId: region.id,
          region: { x: region.x, y: region.y, w: region.w, h: region.h },
          ruleId: 'V1', category: App.RULES['V1'].name,
          level: 'hard', severity: result.severity,
          description: result.description, suggestion: result.suggestion,
          standard: App.RULES['V1'].standard + ' (' + level + ': ' + result.threshold + ':1)',
          affectedGroups: App.RULES['V1'].affectedGroups,
          fixTypes: App.RULES['V1'].fixTypes, source: 'rule-engine',
          evidence: {
            target: App.RULES['V1'].target, actualValue: result.actual, threshold: result.threshold,
            fgColor: App.rgbToHex(colors.fg.r, colors.fg.g, colors.fg.b),
            bgColor: App.rgbToHex(colors.bg.r, colors.bg.g, colors.bg.b),
            dpr: dpr, estNote: '',
          },
        });
      }
    }
    if (region.type === 'control') {
      var targetSize = App.computeTargetSize(region, dpr);
      var m2 = { target: targetSize };
      var ruleId = level === 'AAA' ? 'V5-AAA' : 'V5-AA';
      var r2 = App.RULES[ruleId].check(m2, level);
      if (!r2.pass) {
        issueCounter++;
        issues.push({
          issueId: 'I' + String(issueCounter).padStart(2, '0'),
          regionId: region.id,
          region: { x: region.x, y: region.y, w: region.w, h: region.h },
          ruleId: ruleId, category: App.RULES[ruleId].name,
          level: 'hard', severity: r2.severity,
          description: r2.description, suggestion: r2.suggestion,
          standard: App.RULES[ruleId].standard + ' (' + level + ')',
          affectedGroups: App.RULES[ruleId].affectedGroups,
          fixTypes: App.RULES[ruleId].fixTypes, source: 'rule-engine',
          evidence: {
            target: App.RULES[ruleId].target, actualValue: r2.actual, threshold: r2.threshold,
            fgColor: '', bgColor: '', dpr: dpr, estNote: '',
          },
        });
      }
    }
  }
  return issues;
};

App.runSLayerRules = function (virtualDOM) {
  if (!virtualDOM) return [];
  var issues = [];
  var issueCounter = 0;
  var inputs = virtualDOM.querySelectorAll('input, select, textarea');
  for (var i = 0; i < inputs.length; i++) {
    var input = inputs[i];
    var id = input.id;
    var hasLabelFor = id && virtualDOM.querySelector('label[for="' + id + '"]');
    var hasLabelParent = input.closest('label');
    var hasAriaLabel = input.getAttribute('aria-label');
    var hasAriaLabelledby = input.getAttribute('aria-labelledby');
    if (!hasLabelFor && !hasLabelParent && !hasAriaLabel && !hasAriaLabelledby) {
      issueCounter++;
      issues.push({
        issueId: 'I' + String(issueCounter).padStart(2, '0'), regionId: '',
        region: { x: 0, y: 0, w: 0, h: 0 }, ruleId: 'S1', category: 'label关联',
        level: 'hard', severity: '高', description: 'input 元素缺少关联的 label',
        suggestion: '为该 input 添加 label[for] 或用 label 包裹，或添加 aria-label',
        standard: 'WCAG 2.1 SC 1.3.1', affectedGroups: ['屏幕阅读器用户'],
        fixTypes: ['semantic'], source: 'rule-engine',
        evidence: { target: 'component', actualValue: 0, threshold: 1, fgColor: '', bgColor: '', dpr: 1, estNote: '' },
      });
    }
  }
  var imgs = virtualDOM.querySelectorAll('img');
  for (var i2 = 0; i2 < imgs.length; i2++) {
    if (!imgs[i2].hasAttribute('alt')) {
      issueCounter++;
      issues.push({
        issueId: 'I' + String(issueCounter).padStart(2, '0'), regionId: '',
        region: { x: 0, y: 0, w: 0, h: 0 }, ruleId: 'S2', category: 'img alt',
        level: 'hard', severity: '中', description: 'img 元素缺少 alt 属性',
        suggestion: '添加 alt 属性描述图片内容，装饰图可用 alt=""',
        standard: 'WCAG 2.1 SC 1.1.1', affectedGroups: ['屏幕阅读器用户'],
        fixTypes: ['semantic'], source: 'rule-engine',
        evidence: { target: 'component', actualValue: 0, threshold: 1, fgColor: '', bgColor: '', dpr: 1, estNote: '' },
      });
    }
  }
  var buttons = virtualDOM.querySelectorAll('button, [role="button"]');
  for (var bi = 0; bi < buttons.length; bi++) {
    var btn = buttons[bi];
    var name = btn.getAttribute('aria-label') || btn.textContent.trim() || btn.getAttribute('alt');
    var labelledby = btn.getAttribute('aria-labelledby');
    var hasName = name || (labelledby && virtualDOM.getElementById(labelledby));
    if (!hasName) {
      issueCounter++;
      issues.push({
        issueId: 'I' + String(issueCounter).padStart(2, '0'), regionId: '',
        region: { x: 0, y: 0, w: 0, h: 0 }, ruleId: 'S3', category: 'ARIA可达名称',
        level: 'hard', severity: '高', description: 'button/[role=button] 缺少可达名称',
        suggestion: '添加 aria-label 或元素文本内容',
        standard: 'WCAG 2.1 SC 4.1.2', affectedGroups: ['屏幕阅读器用户'],
        fixTypes: ['semantic'], source: 'rule-engine',
        evidence: { target: 'component', actualValue: 0, threshold: 1, fgColor: '', bgColor: '', dpr: 1, estNote: '' },
      });
    }
  }
  var headings = virtualDOM.querySelectorAll('h1, h2, h3, h4, h5, h6');
  var headingLevels = [];
  for (var hi = 0; hi < headings.length; hi++) headingLevels.push(parseInt(headings[hi].tagName[1]));
  for (var h2 = 1; h2 < headingLevels.length; h2++) {
    if (headingLevels[h2] > headingLevels[h2 - 1] + 1) {
      issueCounter++;
      issues.push({
        issueId: 'I' + String(issueCounter).padStart(2, '0'), regionId: '',
        region: { x: 0, y: 0, w: 0, h: 0 }, ruleId: 'S4', category: '标题层级',
        level: 'hard', severity: '中',
        description: '标题层级跳级：h' + headingLevels[h2 - 1] + ' → h' + headingLevels[h2],
        suggestion: '不应跳过 h' + (headingLevels[h2 - 1] + 1),
        standard: 'WCAG 2.1 SC 1.3.1', affectedGroups: ['屏幕阅读器用户'],
        fixTypes: ['semantic'], source: 'rule-engine',
        evidence: { target: 'component', actualValue: headingLevels[h2], threshold: headingLevels[h2 - 1] + 1, fgColor: '', bgColor: '', dpr: 1, estNote: '' },
      });
    }
  }
  return issues;
};