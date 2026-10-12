App.renderFixDetail = function (issue, srcCanvas) {
  var container = document.getElementById('fix-detail');
  container.classList.remove('hidden');
  container.innerHTML = '';
  var title = document.createElement('h3');
  title.textContent = issue.issueId + ' 改造详情';
  container.appendChild(title);
  var desc = document.createElement('p');
  desc.className = 'hint';
  desc.textContent = issue.description;
  container.appendChild(desc);
  for (var i = 0; i < issue.fixTypes.length; i++) {
    if (issue.fixTypes[i] === 'color') App.renderColorFix(container, issue, srcCanvas);
    else if (issue.fixTypes[i] === 'size') App.renderSizeFix(container, issue);
  }
};

App.renderColorFix = function (container, issue, srcCanvas) {
  var evidence = issue.evidence;
  var fg = App.hexToRgb(evidence.fgColor);
  var bg = App.hexToRgb(evidence.bgColor);
  var newFg = App.parseSuggestedColor(issue.suggestion) || { r: 51, g: 51, b: 51 };
  if (evidence.target === 'background' && srcCanvas) {
    App.renderBackgroundPixelReplace(container, issue, srcCanvas, fg, bg, newFg);
  } else {
    App.renderColorBlockCompare(container, evidence, fg, bg, newFg);
  }
};

App.renderColorBlockCompare = function (container, evidence, fg, bg, newFg) {
  var oldRatio = App.contrastRatio(fg, bg);
  var newRatio = App.contrastRatio(newFg, bg);
  var oldHex = evidence.fgColor;
  var newHex = App.rgbToHex(newFg.r, newFg.g, newFg.b);
  var bgHex = evidence.bgColor;
  var wrap = document.createElement('div');
  wrap.className = 'fix-compare';
  wrap.innerHTML =
    '<div class="fix-side"><h4>改造前</h4>' +
      '<div class="fix-color-block" style="background:' + bgHex + ';color:' + oldHex + ';">Aa 文字</div>' +
      '<div class="fix-ratio fail">对比度 ' + oldRatio.toFixed(2) + ':1 ❌</div></div>' +
    '<div class="fix-arrow">→</div>' +
    '<div class="fix-side"><h4>改造后</h4>' +
      '<div class="fix-color-block" style="background:' + bgHex + ';color:' + newHex + ';">Aa 文字</div>' +
      '<div class="fix-ratio ' + (newRatio >= evidence.threshold ? 'pass' : 'fail') + '">对比度 ' + newRatio.toFixed(2) + ':1 ' + (newRatio >= evidence.threshold ? '✅' : '❌') + '</div></div>';
  container.appendChild(wrap);
};

App.renderBackgroundPixelReplace = function (container, issue, srcCanvas, fg, bg, newBg) {
  var tolerance = 35;
  var fgBgDist = App.rgbDistance(fg, bg);
  if (fgBgDist < tolerance) {
    var notice = document.createElement('p');
    notice.className = 'hint'; notice.style.color = '#dc2626';
    notice.textContent = '原图前景背景色距过近（' + fgBgDist.toFixed(1) + ' < 容差 ' + tolerance + '），已改用色块示意';
    container.appendChild(notice);
    App.renderColorBlockCompare(container, issue.evidence, fg, bg, newBg);
    return;
  }
  var region = issue.region;
  var regionCanvas = document.createElement('canvas');
  regionCanvas.width = region.w; regionCanvas.height = region.h;
  var rctx = regionCanvas.getContext('2d');
  rctx.drawImage(srcCanvas, region.x, region.y, region.w, region.h, 0, 0, region.w, region.h);
  var fixedCanvas = document.createElement('canvas');
  fixedCanvas.width = region.w; fixedCanvas.height = region.h;
  var fctx = fixedCanvas.getContext('2d');
  fctx.drawImage(regionCanvas, 0, 0);
  var imageData = fctx.getImageData(0, 0, region.w, region.h);
  var data = imageData.data;
  for (var i = 0; i < data.length; i += 4) {
    var pixel = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (App.rgbDistance(pixel, bg) < tolerance) { data[i] = newBg.r; data[i + 1] = newBg.g; data[i + 2] = newBg.b; }
  }
  fctx.putImageData(imageData, 0, 0);
  var wrap = document.createElement('div');
  wrap.className = 'fix-compare';
  wrap.innerHTML = '<div class="fix-side"><h4>改造前</h4></div><div class="fix-arrow">→</div><div class="fix-side"><h4>改造后</h4></div>';
  wrap.querySelector('.fix-side:first-child').appendChild(regionCanvas);
  wrap.querySelector('.fix-side:last-child').appendChild(fixedCanvas);
  container.appendChild(wrap);
};

App.renderSizeFix = function (container, issue) {
  var evidence = issue.evidence;
  var actual = evidence.actualValue;
  var threshold = evidence.threshold;
  var wrap = document.createElement('div');
  wrap.className = 'fix-compare';
  wrap.innerHTML =
    '<div class="fix-side"><h4>改造前</h4>' +
      '<div style="display:inline-flex;align-items:center;justify-content:center;width:' + Math.min(parseInt(actual), 80) + 'px;height:' + Math.min(parseInt(actual), 80) + 'px;background:#e5e7eb;border:1px solid #6b7280;border-radius:4px;font-size:12px;">按钮</div>' +
      '<div class="fix-ratio fail">' + actual + ' ❌</div></div>' +
    '<div class="fix-arrow">→</div>' +
    '<div class="fix-side"><h4>改造后</h4>' +
      '<div style="display:inline-flex;align-items:center;justify-content:center;width:' + Math.min(parseInt(threshold), 80) + 'px;height:' + Math.min(parseInt(threshold), 80) + 'px;background:#dbeafe;border:1px solid #2563eb;border-radius:4px;font-size:14px;">按钮</div>' +
      '<div class="fix-ratio pass">' + threshold + ' ✅</div></div>';
  container.appendChild(wrap);
};

App.parseSuggestedColor = function (suggestion) {
  var m = suggestion.match(/#([0-9a-fA-F]{6})/);
  if (m) return App.hexToRgb('#' + m[1]);
  return null;
};