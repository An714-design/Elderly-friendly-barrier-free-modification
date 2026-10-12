App.kMeans = function (pixels, k, maxIter) {
  maxIter = maxIter || 10;
  if (pixels.length === 0) return [];
  var centroids = [];
  for (var i = 0; i < k; i++) {
    var idx = Math.floor((i / k) * pixels.length);
    centroids.push({ r: pixels[idx].r, g: pixels[idx].g, b: pixels[idx].b });
  }
  for (var iter = 0; iter < maxIter; iter++) {
    var clusters = [];
    for (var j = 0; j < k; j++) clusters.push([]);
    for (var p = 0; p < pixels.length; p++) {
      var minDist = Infinity, minIdx = 0;
      for (var ci = 0; ci < k; ci++) {
        var d = (pixels[p].r - centroids[ci].r) ** 2 + (pixels[p].g - centroids[ci].g) ** 2 + (pixels[p].b - centroids[ci].b) ** 2;
        if (d < minDist) { minDist = d; minIdx = ci; }
      }
      clusters[minIdx].push(pixels[p]);
    }
    for (var c = 0; c < k; c++) {
      if (clusters[c].length > 0) {
        var sum = { r: 0, g: 0, b: 0 };
        for (var s = 0; s < clusters[c].length; s++) {
          sum.r += clusters[c][s].r; sum.g += clusters[c][s].g; sum.b += clusters[c][s].b;
        }
        centroids[c] = {
          r: Math.round(sum.r / clusters[c].length),
          g: Math.round(sum.g / clusters[c].length),
          b: Math.round(sum.b / clusters[c].length),
        };
      }
    }
  }
  return centroids.sort(function (a, b) { return App.relativeLuminance(b) - App.relativeLuminance(a); });
};

App.samplePixels = function (imageData, step) {
  step = step || 2;
  var pixels = [];
  var d = imageData.data;
  for (var i = 0; i < d.length; i += 4 * step) {
    pixels.push({ r: d[i], g: d[i + 1], b: d[i + 2] });
  }
  return pixels;
};

App.extractColors = function (ctx, region) {
  var imageData = ctx.getImageData(region.x, region.y, region.w, region.h);
  var pixels = App.samplePixels(imageData, 2);
  var centroids = App.kMeans(pixels, 4);
  if (centroids.length < 2) {
    return { fg: centroids[0] || { r: 0, g: 0, b: 0 }, bg: centroids[0] || { r: 255, g: 255, b: 255 } };
  }
  var bg = centroids[0];
  var fg = centroids[centroids.length - 1];
  return { fg: { r: fg.r, g: fg.g, b: fg.b }, bg: { r: bg.r, g: bg.g, b: bg.b } };
};

App.computeContrast = function (fg, bg) {
  return App.contrastRatio(fg, bg);
};

App.estimateFontSize = function (region, dpr) {
  return Math.round((region.h / dpr / 0.75) * 10) / 10;
};

App.computeTargetSize = function (region, dpr) {
  return {
    w: Math.round((region.w / dpr) * 10) / 10,
    h: Math.round((region.h / dpr) * 10) / 10,
  };
};