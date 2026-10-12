App.renderAnnotatedCanvas = function (srcCanvas, issues) {
  var canvas = document.getElementById('canvas-annotated');
  canvas.width = srcCanvas.width;
  canvas.height = srcCanvas.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(srcCanvas, 0, 0);
  for (var i = 0; i < issues.length; i++) {
    var issue = issues[i];
    var r = issue.region;
    if (r.w === 0 || r.h === 0) continue;
    if (issue.level === 'hard') { ctx.strokeStyle = '#dc2626'; ctx.lineWidth = 3; ctx.setLineDash([]); }
    else { ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([8, 4]); }
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.setLineDash([]);
    ctx.fillStyle = issue.level === 'hard' ? '#dc2626' : '#f59e0b';
    ctx.font = 'bold 16px sans-serif';
    var labelW = ctx.measureText(issue.issueId).width + 8;
    ctx.fillRect(r.x, r.y - 20, labelW, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(issue.issueId, r.x + 4, r.y - 5);
  }
  return canvas;
};

App.renderIssueList = function (issues, onIssueClick) {
  var container = document.getElementById('issue-list');
  container.innerHTML = '';
  if (issues.length === 0) { container.innerHTML = '<p class="hint">未检测到问题，全部通过！</p>'; return; }
  for (var i = 0; i < issues.length; i++) {
    (function (issue) {
      var item = document.createElement('div');
      item.className = 'issue-item';
      item.dataset.issueId = issue.issueId;
      item.innerHTML =
        '<div class="issue-item-header">' +
          '<span class="issue-id">' + issue.issueId + '</span>' +
          '<span class="issue-category">' + issue.category + '</span>' +
          '<span class="issue-level ' + issue.level + '">' + (issue.level === 'hard' ? '硬性' : '提示') + '</span>' +
          '<span class="issue-severity ' + issue.severity + '">' + issue.severity + '</span>' +
        '</div>' +
        '<div class="issue-detail">' + issue.description + '</div>' +
        '<div class="issue-standard">标准：' + issue.standard + '</div>' +
        '<div class="issue-groups">影响人群：' + issue.affectedGroups.join('、') + '</div>';
      item.addEventListener('click', function () {
        document.querySelectorAll('.issue-item').forEach(function (el) { el.classList.remove('highlight'); });
        item.classList.add('highlight');
        onIssueClick(issue);
      });
      container.appendChild(item);
    })(issues[i]);
  }
};

App.renderRegionList = function (regions, onRemove) {
  var container = document.getElementById('region-list');
  container.innerHTML = '';
  for (var i = 0; i < regions.length; i++) {
    (function (region) {
      var tag = document.createElement('span');
      tag.className = 'region-tag';
      tag.innerHTML = region.id + ' [' + region.type + '] <span class="remove">✕</span>';
      tag.querySelector('.remove').addEventListener('click', function () { onRemove(region.id); });
      container.appendChild(tag);
    })(regions[i]);
  }
};