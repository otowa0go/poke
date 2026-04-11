/* ========================================
 * localStorage データストア
 * ======================================== */
App.Store = (function() {
  var PREFIX = 'poke.';

  function _get(key) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)); }
    catch(e) { return null; }
  }
  function _set(key, val) {
    localStorage.setItem(PREFIX + key, JSON.stringify(val));
  }

  // Firebase同期トリガー
  function _sync() {
    if (App.Firebase && App.Firebase.syncAfterSave) {
      App.Firebase.syncAfterSave();
    }
  }

  // --- UUID ---
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // --- 型(Type) ---
  function getTypes() { return _get('types') || []; }
  function saveType(t) {
    var types = getTypes();
    var now = Date.now();
    if (!t.id) {
      t.id = uuid();
      t.createdAt = now;
    }
    t.updatedAt = now;
    var idx = types.findIndex(function(x) { return x.id === t.id; });
    if (idx >= 0) types[idx] = t; else types.push(t);
    _set('types', types);
    _sync();
    return t;
  }
  function deleteType(id) {
    var types = getTypes().filter(function(x) { return x.id !== id; });
    _set('types', types);
    // パーティからも除去
    var parties = getParties();
    parties.forEach(function(p) {
      p.typeIds = p.typeIds.map(function(tid) { return tid === id ? null : tid; });
    });
    _set('parties', parties);
    _sync();
  }
  function getTypeById(id) {
    return getTypes().find(function(x) { return x.id === id; }) || null;
  }

  // --- パーティ ---
  function getParties() { return _get('parties') || []; }
  function saveParty(p) {
    var parties = getParties();
    var now = Date.now();
    if (!p.id) {
      p.id = uuid();
      p.createdAt = now;
    }
    p.updatedAt = now;
    var idx = parties.findIndex(function(x) { return x.id === p.id; });
    if (idx >= 0) parties[idx] = p; else parties.push(p);
    _set('parties', parties);
    _sync();
    return p;
  }
  function deleteParty(id) {
    _set('parties', getParties().filter(function(x) { return x.id !== id; }));
    _sync();
  }
  function getPartyById(id) {
    return getParties().find(function(x) { return x.id === id; }) || null;
  }

  // --- 設定 ---
  var DEFAULT_SETTINGS = {
    weights: {
      coverO: 10, coverDouble: 6, coverSingle: 3,
      detailO: 2, detailX: -2,
      megaBonus: 5, priorityBonus: 5
    },
    candidateCount: 5
  };
  function getSettings() {
    var s = _get('settings');
    if (!s) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    // デフォルト値でマージ
    if (!s.weights) s.weights = {};
    var dw = DEFAULT_SETTINGS.weights;
    for (var k in dw) { if (s.weights[k] === undefined) s.weights[k] = dw[k]; }
    if (!s.candidateCount) s.candidateCount = DEFAULT_SETTINGS.candidateCount;
    return s;
  }
  function saveSettings(s) { _set('settings', s); _sync(); }

  // --- ユーザー略称 ---
  function getUserAbbreviations() { return _get('abbrev.user') || []; }
  function saveUserAbbreviations(list) { _set('abbrev.user', list); _sync(); }

  // --- 使用可能ポケモン ---
  // デフォルト: チャンピオンズ初期186匹
  var DEFAULT_ENABLED_IDS = [3,6,9,15,18,24,25,26,36,38,59,65,68,71,80,94,115,121,127,128,130,132,134,135,136,142,143,149,154,157,160,168,181,184,186,196,197,199,205,208,212,214,227,229,248,279,282,302,306,308,310,319,323,324,334,350,351,354,358,359,362,389,392,395,405,407,409,411,428,442,445,448,450,454,460,461,464,470,471,472,473,475,478,479,497,500,503,505,510,512,514,516,530,531,534,547,553,563,569,571,579,584,587,609,614,618,623,635,637,652,655,658,660,663,666,670,671,675,676,678,681,683,685,693,695,697,699,700,701,702,706,707,709,711,713,715,724,727,730,733,740,745,748,750,752,758,763,765,766,778,780,784,823,841,842,844,855,858,866,867,869,877,887,899,900,902,903,908,911,914,925,933,936,937,939,952,956,959,964,968,970,981,983,1013,1018,1019];

  function getEnabledIds() {
    var saved = _get('enabledPokemon');
    return (saved && saved.length) ? saved : DEFAULT_ENABLED_IDS.slice();
  }
  function saveEnabledIds(ids) { _set('enabledPokemon', ids); _sync(); }
  function getEnabledPokemon() {
    var ids = getEnabledIds();
    var idSet = {};
    ids.forEach(function(id) { idSet[id] = true; });
    return App.POKEMON.filter(function(p) { return idSet[p.id]; });
  }

  // --- バックアップ ---
  function exportAll() {
    return {
      types: getTypes(),
      parties: getParties(),
      settings: getSettings(),
      userAbbreviations: getUserAbbreviations(),
      enabledPokemon: getEnabledIds(),
      exportedAt: new Date().toISOString()
    };
  }
  function importAll(data) {
    if (data.types) _set('types', data.types);
    if (data.parties) _set('parties', data.parties);
    if (data.settings) _set('settings', data.settings);
    if (data.userAbbreviations) _set('abbrev.user', data.userAbbreviations);
    if (data.enabledPokemon) _set('enabledPokemon', data.enabledPokemon);
  }

  return {
    uuid: uuid,
    getTypes: getTypes, saveType: saveType, deleteType: deleteType, getTypeById: getTypeById,
    getParties: getParties, saveParty: saveParty, deleteParty: deleteParty, getPartyById: getPartyById,
    getSettings: getSettings, saveSettings: saveSettings, DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    getUserAbbreviations: getUserAbbreviations, saveUserAbbreviations: saveUserAbbreviations,
    getEnabledIds: getEnabledIds, saveEnabledIds: saveEnabledIds, getEnabledPokemon: getEnabledPokemon,
    DEFAULT_ENABLED_IDS: DEFAULT_ENABLED_IDS,
    exportAll: exportAll, importAll: importAll
  };
})();
