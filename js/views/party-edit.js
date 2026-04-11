/* ========================================
 * S3: パーティ編集
 * ======================================== */
App.Views = App.Views || {};
App.Views.PartyEdit = (function() {

  function render(container, params) {
    var isNew = !params || !params.id || params.id === 'new';
    var party = isNew
      ? { id: null, name: '', typeIds: [null,null,null,null,null,null] }
      : App.Store.getPartyById(params.id);
    if (!party) { App.Router.navigate('#/parties'); return; }

    var types = App.Store.getTypes();

    // ポケモン別にグルーピング
    var grouped = {};
    types.forEach(function(t) {
      var poke = App.POKEMON_MAP[t.pokemonId];
      var pokeName = poke ? poke.ja : '???';
      if (!grouped[pokeName]) grouped[pokeName] = [];
      grouped[pokeName].push(t);
    });

    var html =
      '<div class="view-party-edit">' +
        '<div class="view-header">' +
          '<a href="#/parties" class="btn-back">&larr;</a>' +
          '<h2>' + (isNew ? '新規パーティ' : 'パーティ編集') + '</h2>' +
        '</div>' +
        '<div class="form-section">' +
          '<div class="form-row">' +
            '<label>パーティ名</label>' +
            '<input type="text" id="partyName" value="' + esc(party.name) + '" placeholder="例: メイン構築">' +
          '</div>';

    for (var i = 0; i < 6; i++) {
      html += '<div class="form-row">' +
        '<label>' + (i + 1) + '匹目</label>' +
        '<select id="partySlot' + i + '" class="party-slot-select">' +
          '<option value="">-- 選択 --</option>';

      var sortedNames = Object.keys(grouped).sort();
      sortedNames.forEach(function(pokeName) {
        grouped[pokeName].forEach(function(t) {
          var label = pokeName + (t.nickname ? ' (' + t.nickname + ')' : '');
          var sel = (party.typeIds[i] === t.id) ? ' selected' : '';
          html += '<option value="' + t.id + '"' + sel + '>' + label + '</option>';
        });
      });

      html += '</select></div>';
    }

    html +=
        '</div>' +
        '<div id="partySummary" class="party-summary"></div>' +
        '<div id="coveragePanel" class="coverage-panel"></div>' +
        '<div class="form-actions">' +
          '<button id="btnSave" class="btn-primary">保存</button>' +
          '<a href="#/parties" class="btn-secondary">キャンセル</a>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // 使用率TOP50を取得（ランク順）
    var top50 = [];
    if (App.USAGE_RANK) {
      App.Store.getEnabledPokemon().forEach(function(p) {
        if (App.USAGE_RANK[p.id] !== undefined) {
          top50.push({ pokemon: p, rank: App.USAGE_RANK[p.id] });
        }
      });
      top50.sort(function(a, b) { return a.rank - b.rank; });
    }

    function getSelectedTypes() {
      var selected = [];
      for (var i = 0; i < 6; i++) {
        var tid = document.getElementById('partySlot' + i).value;
        if (tid) {
          var t = types.find(function(x) { return x.id === tid; });
          if (t) selected.push(t);
        }
      }
      return selected;
    }

    function getCoverage(selectedTypes, pokemonId) {
      if (selectedTypes.length === 0) return 'none';
      var hasCircle = false;
      var hasTriangle = false;
      selectedTypes.forEach(function(t) {
        var m = (t.matchups && t.matchups[pokemonId]) || '△';
        if (m === '○') hasCircle = true;
        else if (m === '△') hasTriangle = true;
      });
      if (hasCircle) return 'ok';
      if (hasTriangle) return 'partial';
      return 'none';
    }

    function updateSummary() {
      var megaCount = 0, priorityCount = 0;
      var selectedTypes = getSelectedTypes();
      for (var i = 0; i < 6; i++) {
        var tid = document.getElementById('partySlot' + i).value;
        if (tid) {
          var t = types.find(function(x) { return x.id === tid; });
          if (t) {
            if (t.isMega) megaCount++;
            if (t.isPriority) priorityCount++;
          }
        }
      }
      document.getElementById('partySummary').innerHTML =
        'メガシンカ: ' + megaCount + ' / 優先: ' + priorityCount;

      // カバレッジパネル更新
      if (top50.length === 0) return;

      var groups = { ok: [], partial: [], none: [] };
      top50.forEach(function(entry) {
        var cov = getCoverage(selectedTypes, entry.pokemon.id);
        groups[cov].push(entry.pokemon);
      });

      var total = top50.length;
      var okCount = groups.ok.length;
      var noneCount = groups.none.length;
      var partialCount = groups.partial.length;

      function chips(list, cls) {
        return list.map(function(p) {
          return '<span class="coverage-chip ' + cls + '">' + p.ja + '</span>';
        }).join('');
      }

      var html = '<div class="coverage-header">' +
        'カバレッジ確認 <span class="coverage-stats">TOP' + total + '中 ' +
        '<span class="cov-ok-text">' + okCount + 'カバー</span> / ' +
        '<span class="cov-none-text">' + noneCount + '未カバー</span>' +
        '</span></div>';

      if (selectedTypes.length === 0) {
        html += '<p class="coverage-empty">ポケモンを選択するとカバレッジが表示されます</p>';
      } else {
        if (groups.none.length > 0) {
          html += '<div class="coverage-group">' +
            '<div class="coverage-group-label cov-none-label">未カバー (' + noneCount + '匹)</div>' +
            '<div class="coverage-chips">' + chips(groups.none, 'chip-none') + '</div>' +
          '</div>';
        }
        if (groups.partial.length > 0) {
          html += '<div class="coverage-group">' +
            '<div class="coverage-group-label cov-partial-label">△のみ (' + partialCount + '匹)</div>' +
            '<div class="coverage-chips">' + chips(groups.partial, 'chip-partial') + '</div>' +
          '</div>';
        }
        if (groups.ok.length > 0) {
          html += '<details class="coverage-group"><summary class="coverage-group-label cov-ok-label">カバー済み (' + okCount + '匹)</summary>' +
            '<div class="coverage-chips">' + chips(groups.ok, 'chip-ok') + '</div>' +
          '</details>';
        }
      }

      document.getElementById('coveragePanel').innerHTML = html;
    }

    for (var i = 0; i < 6; i++) {
      document.getElementById('partySlot' + i).addEventListener('change', updateSummary);
    }
    updateSummary();

    // 保存
    document.getElementById('btnSave').addEventListener('click', function() {
      party.name = document.getElementById('partyName').value.trim() || '無名パーティ';
      party.typeIds = [];
      for (var i = 0; i < 6; i++) {
        party.typeIds.push(document.getElementById('partySlot' + i).value || null);
      }
      App.Store.saveParty(party);
      App.Router.navigate('#/parties');
    });
  }

  function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  return { render: render };
})();
