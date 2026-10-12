App.callAI = function (regions, imageBase64) {
  var prompt = App.buildPrompt(regions);
  return new Promise(function (resolve) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 8000);
    fetch('/api/pangu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt, image: imageBase64 }),
      signal: controller.signal,
    }).then(function (response) {
      clearTimeout(timeout);
      if (!response.ok) return resolve([]);
      return response.json();
    }).then(function (data) {
      if (!data || !data.issues || !Array.isArray(data.issues)) return resolve([]);
      resolve(data.issues.map(function (issue) {
        return Object.assign({}, issue, {
          level: 'soft', source: 'ai',
          issueId: 'AI-' + Math.random().toString(36).substr(2, 4),
        });
      }));
    }).catch(function (e) {
      console.warn('AI 分析失败，已降级跳过:', e.message);
      resolve([]);
    });
  });
};

App.buildPrompt = function (regions) {
  var regionDesc = regions.map(function (r) {
    return { id: r.id, type: r.type, position: 'x:' + r.x + ', y:' + r.y + ', w:' + r.w + ', h:' + r.h };
  });
  return '你是无障碍检测专家。以下是用户标注的UI区域。请检查每个区域的无障碍问题，返回JSON格式。\n\n区域列表：\n' +
    JSON.stringify(regionDesc, null, 2) +
    '\n\n请返回如下格式的JSON（不要返回其他内容）：\n{"issues":[{"regionId":"R01","category":"对比度","severity":"高","description":"问题描述","suggestion":"改造建议","standard":"WCAG 2.1 SC X.X.X","confidence":0.9}]}';
};

App.imageToBase64 = function (canvas) {
  return canvas.toDataURL('image/png');
};