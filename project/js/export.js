App.exportPNG = function (reportNode) {
  return htmlToImage.toPng(reportNode, { pixelRatio: 2, backgroundColor: '#ffffff' }).then(function (dataUrl) {
    var link = document.createElement('a');
    link.download = '无障碍验收报告.png';
    link.href = dataUrl;
    link.click();
  });
};

App.exportPDFImage = function (reportNode) {
  var jsPDF = window.jspdf.jsPDF;
  var pdf = new jsPDF('p', 'mm', 'a4');
  var sections = reportNode.querySelectorAll('.report-section');
  var promises = [];
  for (var i = 0; i < sections.length; i++) {
    promises.push(htmlToImage.toPng(sections[i], { pixelRatio: 2, backgroundColor: '#ffffff' }));
  }
  return Promise.all(promises).then(function (pngs) {
    for (var i = 0; i < pngs.length; i++) {
      if (i > 0) pdf.addPage();
      pdf.addImage(pngs[i], 'PNG', 0, 0, 210, 297);
    }
    pdf.save('无障碍验收报告.pdf');
  });
};

App.printReport = function () { window.print(); };

App.buildReportHTML = function (state) {
  var sortedIssues = state.sortedIssues;
  var date = new Date().toLocaleDateString('zh-CN');
  var hardCount = sortedIssues.filter(function (i) { return i.level === 'hard'; }).length;
  var softCount = sortedIssues.filter(function (i) { return i.level === 'soft'; }).length;
  var allPass = hardCount === 0;
  var issueRows = sortedIssues.map(function (issue) {
    return '<div class="report-section" style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px;">' +
      '<strong>' + issue.issueId + '</strong> [' + (issue.level === 'hard' ? '硬性' : '提示') + '] ' +
      issue.category + ' - ' + issue.severity + '<br>' +
      '<span style="color:#6b7280;">' + issue.description + '</span><br>' +
      '<span style="color:#6b7280;">标准：' + issue.standard + '</span><br>' +
      '<span style="color:#6b7280;">影响人群：' + issue.affectedGroups.join('、') + '</span><br>' +
      '<span>建议：' + issue.suggestion + '</span></div>';
  }).join('');
  return '<div class="report-template" style="padding:40px;background:#fff;width:1240px;">' +
    '<div class="report-section report-cover" style="text-align:center;margin-bottom:32px;">' +
      '<h1 style="font-size:28px;margin-bottom:16px;">无障碍验收报告</h1>' +
      '<table style="margin:0 auto;border-collapse:collapse;">' +
        '<tr><td style="padding:6px 16px;border:1px solid #e5e7eb;">检测日期</td><td style="padding:6px 16px;border:1px solid #e5e7eb;">' + date + '</td></tr>' +
        '<tr><td style="padding:6px 16px;border:1px solid #e5e7eb;">检测模式</td><td style="padding:6px 16px;border:1px solid #e5e7eb;">模式' + state.mode + '</td></tr>' +
        '<tr><td style="padding:6px 16px;border:1px solid #e5e7eb;">标准档位</td><td style="padding:6px 16px;border:1px solid #e5e7eb;">WCAG ' + state.level + '</td></tr>' +
        '<tr><td style="padding:6px 16px;border:1px solid #e5e7eb;">DPR</td><td style="padding:6px 16px;border:1px solid #e5e7eb;">' + state.dpr + 'x</td></tr>' +
      '</table></div>' +
    '<div class="report-section" style="margin-bottom:24px;"><h2>概览</h2>' +
      '<div style="display:flex;gap:24px;">' +
        '<div style="text-align:center;"><div style="font-size:32px;font-weight:700;">' + sortedIssues.length + '</div><div style="font-size:14px;color:#6b7280;">总问题数</div></div>' +
        '<div style="text-align:center;"><div style="font-size:32px;font-weight:700;color:#dc2626;">' + hardCount + '</div><div style="font-size:14px;color:#6b7280;">硬性项</div></div>' +
        '<div style="text-align:center;"><div style="font-size:32px;font-weight:700;color:#f59e0b;">' + softCount + '</div><div style="font-size:14px;color:#6b7280;">提示项</div></div>' +
      '</div></div>' +
    '<div class="report-section annotation-map" style="margin-bottom:24px;"><h2>标注图</h2>' +
      '<img src="' + document.getElementById('canvas-annotated').toDataURL('image/png') + '" style="max-width:100%;border:1px solid #e5e7eb;"></div>' +
    '<div class="report-section" style="margin-bottom:24px;"><h2>问题清单</h2>' + (issueRows || '<p>未检测到问题，全部通过！</p>') + '</div>' +
    '<div class="report-section" style="margin-bottom:24px;"><h2>验收结论</h2>' +
      '<p style="font-size:16px;font-weight:600;color:' + (allPass ? '#16a34a' : '#dc2626') + ';">' +
        (allPass ? '✅ 合格：所有硬性项均通过' : '❌ 不合格：' + hardCount + ' 项硬性指标未通过') + '</p></div>' +
    '<div class="report-section" style="margin-bottom:24px;">' +
      '<p style="font-size:12px;color:#6b7280;">免责声明：本报告为辅助自检，非第三方合规验收。</p>' +
      '<p style="font-size:12px;color:#6b7280;">本产品只做"在真实位置上呈现颜色变化"，不做整页重绘。</p></div>' +
  '</div>';
};