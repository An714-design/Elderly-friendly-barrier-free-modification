App.showStep = function (id) {
  document.querySelectorAll('.step').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
};

App.init = function () {
  App.bindSetup();
  App.bindUpload();
  App.bindRegions();
  App.bindResults();
};

App.bindSetup = function () {
  var modeSelect = document.getElementById('mode-select');
  var domInputWrap = document.getElementById('dom-input-wrap');
  modeSelect.addEventListener('change', function () {
    domInputWrap.classList.toggle('hidden', modeSelect.value !== 'B');
  });
  document.getElementById('btn-start').addEventListener('click', function () {
    App.mode = modeSelect.value;
    App.level = document.getElementById('level-select').value;
    App.dpr = parseInt(document.getElementById('dpr-select').value);
    if (App.mode === 'B') {
      var html = document.getElementById('dom-input').value.trim();
      if (html) {
        var parser = new DOMParser();
        App.virtualDOM = parser.parseFromString(html, 'text/html');
      }
    }
    App.showStep('step-upload');
  });
};

App.bindUpload = function () {
  var dropZone = document.getElementById('drop-zone');
  var fileInput = document.getElementById('file-input');
  var privacyCheck = document.getElementById('privacy-check');
  var btnNext = document.getElementById('btn-next-regions');

  dropZone.addEventListener('click', function () { fileInput.click(); });
  dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('dragover'); });
  dropZone.addEventListener('drop', function (e) {
    e.preventDefault(); dropZone.classList.remove('dragover');
    var file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) App.loadImage(file);
  });
  fileInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (file) App.loadImage(file);
  });
  document.addEventListener('paste', function (e) {
    if (!document.getElementById('step-upload').classList.contains('active')) return;
    var items = e.clipboardData.items;
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) { App.loadImage(items[i].getAsFile()); break; }
    }
  });
  privacyCheck.addEventListener('change', function () {
    btnNext.disabled = !(privacyCheck.checked && App.image);
  });
  document.getElementById('btn-back-setup').addEventListener('click', function () { App.showStep('step-setup'); });
  btnNext.addEventListener('click', function () { App.initRegionCanvas(); App.showStep('step-regions'); });
};

App.loadImage = function (file) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      App.image = img;
      var canvas = document.getElementById('canvas-main');
      App.loadImageToCanvas(img, canvas);
      App.canvas = canvas;
      App.ctx = canvas.getContext('2d');
      var btnNext = document.getElementById('btn-next-regions');
      btnNext.disabled = !(document.getElementById('privacy-check').checked && App.image);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

App.initRegionCanvas = function () {
  var main = document.getElementById('canvas-main');
  var overlay = document.getElementById('canvas-overlay');
  overlay.width = main.width;
  overlay.height = main.height;
  App.regions = [];
  App.regionIdCounter = 0;
  App.drawRegions();
  App.renderRegionList(App.regions, App.removeRegion);
  document.getElementById('btn-next-analyze').disabled = true;
};

App.bindRegions = function () {
  var overlay = document.getElementById('canvas-overlay');
  var isDrawing = false;
  var startX = 0, startY = 0;
  overlay.addEventListener('mousedown', function (e) {
    isDrawing = true;
    var rect = overlay.getBoundingClientRect();
    var scaleX = overlay.width / rect.width;
    var scaleY = overlay.height / rect.height;
    startX = (e.clientX - rect.left) * scaleX;
    startY = (e.clientY - rect.top) * scaleY;
  });
  overlay.addEventListener('mousemove', function (e) {
    if (!isDrawing) return;
    var rect = overlay.getBoundingClientRect();
    var scaleX = overlay.width / rect.width;
    var scaleY = overlay.height / rect.height;
    var x = (e.clientX - rect.left) * scaleX;
    var y = (e.clientY - rect.top) * scaleY;
    App.drawRegions();
    var ctx = overlay.getContext('2d');
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]);
    ctx.strokeRect(Math.min(startX, x), Math.min(startY, y), Math.abs(x - startX), Math.abs(y - startY));
    ctx.setLineDash([]);
  });
  overlay.addEventListener('mouseup', function (e) {
    if (!isDrawing) return;
    isDrawing = false;
    var rect = overlay.getBoundingClientRect();
    var scaleX = overlay.width / rect.width;
    var scaleY = overlay.height / rect.height;
    var x = (e.clientX - rect.left) * scaleX;
    var y = (e.clientY - rect.top) * scaleY;
    var rx = Math.min(startX, x), ry = Math.min(startY, y);
    var rw = Math.abs(x - startX), rh = Math.abs(y - startY);
    if (rw < 5 || rh < 5) { App.drawRegions(); return; }
    var type = document.getElementById('region-type-select').value;
    App.regions.push({ id: App.nextRegionId(), x: Math.round(rx), y: Math.round(ry), w: Math.round(rw), h: Math.round(rh), type: type });
    App.drawRegions();
    App.renderRegionList(App.regions, App.removeRegion);
    document.getElementById('btn-next-analyze').disabled = App.regions.length === 0;
  });
  document.getElementById('btn-undo-region').addEventListener('click', function () {
    App.regions.pop();
    App.drawRegions();
    App.renderRegionList(App.regions, App.removeRegion);
    document.getElementById('btn-next-analyze').disabled = App.regions.length === 0;
  });
  document.getElementById('btn-clear-regions').addEventListener('click', function () {
    App.regions = []; App.regionIdCounter = 0;
    App.drawRegions();
    App.renderRegionList(App.regions, App.removeRegion);
    document.getElementById('btn-next-analyze').disabled = true;
  });
  document.getElementById('btn-back-upload').addEventListener('click', function () { App.showStep('step-upload'); });
  document.getElementById('btn-next-analyze').addEventListener('click', App.runAnalysis);
};

App.drawRegions = function () {
  var overlay = document.getElementById('canvas-overlay');
  var ctx = overlay.getContext('2d');
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  for (var i = 0; i < App.regions.length; i++) {
    var region = App.regions[i];
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2;
    ctx.strokeRect(region.x, region.y, region.w, region.h);
    ctx.fillStyle = '#2563eb'; ctx.font = 'bold 14px sans-serif';
    ctx.fillRect(region.x, region.y - 18, 60, 18);
    ctx.fillStyle = '#fff';
    ctx.fillText(region.id, region.x + 4, region.y - 4);
  }
};

App.removeRegion = function (id) {
  App.regions = App.regions.filter(function (r) { return r.id !== id; });
  App.drawRegions();
  App.renderRegionList(App.regions, App.removeRegion);
  document.getElementById('btn-next-analyze').disabled = App.regions.length === 0;
};

App.runAnalysis = function () {
  App.showStep('step-results');
  App.resetResults();
  var banner = document.getElementById('result-banner');
  banner.className = 'result-banner info';
  banner.textContent = '正在分析...';
  App.vIssues = App.runVLayerRules(App.ctx, App.regions, App.dpr, App.level);
  if (App.mode === 'B' && App.virtualDOM) {
    App.sIssues = App.runSLayerRules(App.virtualDOM);
  }
  var imageBase64 = App.imageToBase64(App.canvas);
  App.callAI(App.regions, imageBase64).then(function (aiIssues) {
    App.aiIssues = aiIssues;
    var merged = App.mergeAndDedup(App.vIssues, App.sIssues, App.aiIssues);
    var sorted = App.sortIssues(merged);
    App.sortedIssues = App.renumberIssues(sorted);
    App.renderAnnotatedCanvas(App.canvas, App.sortedIssues);
    App.renderIssueList(App.sortedIssues, function (issue) { App.renderFixDetail(issue, App.canvas); });
    if (App.mode === 'A') {
      banner.className = 'result-banner warning';
      banner.textContent = '⚠️ 仅视觉检测，未含语义检测。建议研发提供 DOM 做完整检测。';
    } else {
      banner.className = 'result-banner info';
      banner.textContent = '检测完成：' + App.sortedIssues.length + ' 个问题（V层 ' + App.vIssues.length + ' + S层 ' + App.sIssues.length + ' + AI ' + App.aiIssues.length + '）';
    }
  });
};

App.bindResults = function () {
  document.getElementById('btn-back-regions').addEventListener('click', function () { App.showStep('step-regions'); });
  document.getElementById('btn-export-png').addEventListener('click', function () {
    var reportHTML = App.buildReportHTML(App);
    var tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute'; tempDiv.style.left = '-9999px'; tempDiv.style.top = '0';
    tempDiv.innerHTML = reportHTML;
    document.body.appendChild(tempDiv);
    App.exportPNG(tempDiv.firstElementChild).then(function () { document.body.removeChild(tempDiv); });
  });
  document.getElementById('btn-export-pdf-img').addEventListener('click', function () {
    var reportHTML = App.buildReportHTML(App);
    var tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute'; tempDiv.style.left = '-9999px'; tempDiv.style.top = '0';
    tempDiv.innerHTML = reportHTML;
    document.body.appendChild(tempDiv);
    App.exportPDFImage(tempDiv.firstElementChild).then(function () { document.body.removeChild(tempDiv); });
  });
  document.getElementById('btn-print-pdf').addEventListener('click', function () {
    var reportHTML = App.buildReportHTML(App);
    var printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>无障碍验收报告</title><style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}.report-section{page-break-inside:avoid;}.annotation-map{page-break-after:always;}@page{margin:15mm 12mm;}body{font-family:"Microsoft YaHei","PingFang SC","SimHei",sans-serif;}</style></head><body>' + reportHTML + '</body></html>');
    printWindow.document.close();
    printWindow.onload = function () { printWindow.print(); };
  });
};

App.init();