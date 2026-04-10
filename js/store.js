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
    return p;
  }
  function deleteParty(id) {
    _set('parties', getParties().filter(function(x) { return x.id !== id; }));
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
  function saveSettings(s) { _set('settings', s); }

  // --- ユーザー略称 ---
  function getUserAbbreviations() { return _get('abbrev.user') || []; }
  function saveUserAbbreviations(list) { _set('abbrev.user', list); }

  // --- バックアップ ---
  function exportAll() {
    return {
      types: getTypes(),
      parties: getParties(),
      settings: getSettings(),
      userAbbreviations: getUserAbbreviations(),
      exportedAt: new Date().toISOString()
    };
  }
  function importAll(data) {
    if (data.types) _set('types', data.types);
    if (data.parties) _set('parties', data.parties);
    if (data.settings) _set('settings', data.settings);
    if (data.userAbbreviations) _set('abbrev.user', data.userAbbreviations);
  }

  return {
    uuid: uuid,
    getTypes: getTypes, saveType: saveType, deleteType: deleteType, getTypeById: getTypeById,
    getParties: getParties, saveParty: saveParty, deleteParty: deleteParty, getPartyById: getPartyById,
    getSettings: getSettings, saveSettings: saveSettings, DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    getUserAbbreviations: getUserAbbreviations, saveUserAbbreviations: saveUserAbbreviations,
    exportAll: exportAll, importAll: importAll
  };
})();
