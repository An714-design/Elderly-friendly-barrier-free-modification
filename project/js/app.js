var App = {
  mode: 'A',
  level: 'AA',
  dpr: 2,
  image: null,
  canvas: null,
  ctx: null,
  regions: [],
  regionIdCounter: 0,
  vIssues: [],
  sIssues: [],
  aiIssues: [],
  sortedIssues: [],
  virtualDOM: null,
};

App.resetResults = function () {
  App.vIssues = [];
  App.sIssues = [];
  App.aiIssues = [];
  App.sortedIssues = [];
};

App.nextRegionId = function () {
  App.regionIdCounter++;
  return 'R' + String(App.regionIdCounter).padStart(2, '0');
};