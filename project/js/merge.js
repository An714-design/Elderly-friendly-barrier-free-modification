App.mergeAndDedup = function (vIssues, sIssues, aiIssues) {
  var merged = vIssues.concat(sIssues, aiIssues);
  var seen = {};
  var result = [];
  for (var i = 0; i < merged.length; i++) {
    var issue = merged[i];
    var key = issue.regionId + '|' + issue.ruleId;
    if (!seen[key]) {
      seen[key] = true;
      result.push(issue);
    } else {
      if (issue.source === 'rule-engine') {
        for (var j = 0; j < result.length; j++) {
          if (result[j].regionId + '|' + result[j].ruleId === key && result[j].source === 'ai') {
            result[j] = issue;
            break;
          }
        }
      }
    }
  }
  return result;
};

App.sortIssues = function (issues) {
  var severityOrder = { '高': 0, '中': 1, '低': 2 };
  var levelOrder = { 'hard': 0, 'soft': 1 };
  return issues.sort(function (a, b) {
    if (levelOrder[a.level] !== levelOrder[b.level]) return levelOrder[a.level] - levelOrder[b.level];
    if (severityOrder[a.severity] !== severityOrder[b.severity]) return severityOrder[a.severity] - severityOrder[b.severity];
    return 0;
  });
};

App.renumberIssues = function (issues) {
  return issues.map(function (issue, i) {
    issue.issueId = 'I' + String(i + 1).padStart(2, '0');
    return issue;
  });
};