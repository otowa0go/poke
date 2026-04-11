/* ========================================
 * 予測入力用 検索インデックス
 * ======================================== */
App.Search = (function() {
  var entries = []; // { normalized: string, pokemon: object }[]

  function buildIndex() {
    entries = [];
    var norm = App.Kana.normalize;

    // 使用可能ポケモンのみインデックス化
    App.Store.getEnabledPokemon().forEach(function(p) {
      // 日本語名（カタカナ→ひらがな正規化）
      entries.push({ normalized: norm(p.ja), pokemon: p });
      // 英語名
      entries.push({ normalized: p.en.toLowerCase(), pokemon: p });
      // 図鑑番号
      entries.push({ normalized: String(p.id), pokemon: p });
    });

    // 組み込み略称
    App.ABBREVIATIONS.forEach(function(a) {
      var p = App.POKEMON_MAP[a.pokemonId];
      if (p) entries.push({ normalized: norm(a.short), pokemon: p });
    });

    // ユーザー略称
    var userAbbr = App.Store.getUserAbbreviations();
    userAbbr.forEach(function(a) {
      var p = App.POKEMON_MAP[a.pokemonId];
      if (p) entries.push({ normalized: norm(a.short), pokemon: p });
    });
  }

  function search(query, limit) {
    if (!query || !query.trim()) return [];
    limit = limit || 10;
    var q = App.Kana.normalize(query);
    var seen = {};
    var results = [];

    // 前方一致を優先
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].normalized.indexOf(q) === 0) {
        var pid = entries[i].pokemon.id;
        if (!seen[pid]) {
          seen[pid] = true;
          results.push(entries[i].pokemon);
          if (results.length >= limit) return results;
        }
      }
    }

    // 部分一致
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].normalized.indexOf(q) > 0) {
        var pid = entries[i].pokemon.id;
        if (!seen[pid]) {
          seen[pid] = true;
          results.push(entries[i].pokemon);
          if (results.length >= limit) return results;
        }
      }
    }

    return results;
  }

  return { buildIndex: buildIndex, search: search };
})();
