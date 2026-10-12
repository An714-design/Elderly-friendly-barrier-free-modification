App.hexToRgb = function (hex) {
  var m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[0], 16), g: parseInt(m[1], 16), b: parseInt(m[2], 16) };
};

App.rgbToHex = function (r, g, b) {
  var h = function (n) { return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0'); };
  return '#' + h(r) + h(g) + h(b);
};

App.rgbDistance = function (c1, c2) {
  return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2);
};

App.sRGBLinear = function (c) {
  var cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
};

App.relativeLuminance = function (rgb) {
  return 0.2126 * App.sRGBLinear(rgb.r) + 0.7152 * App.sRGBLinear(rgb.g) + 0.0722 * App.sRGBLinear(rgb.b);
};

App.contrastRatio = function (rgb1, rgb2) {
  var l1 = App.relativeLuminance(rgb1);
  var l2 = App.relativeLuminance(rgb2);
  var lighter = Math.max(l1, l2);
  var darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

App.loadImageToCanvas = function (image, canvas) {
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  return ctx;
};

App.cloneCanvas = function (src) {
  var c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
};