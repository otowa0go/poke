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
        '<div id="counterSuggestionPanel" class="counter-suggestion-panel"></div>' +
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

    // 2匹カバー判定の閾値（上位N匹に適用）
    var doubleThreshold = 20;

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

    // coverage: 'full'(2匹以上○) / 'single'(1匹○) / 'partial'(△のみ) / 'none'(×のみ)
    function getCoverage(selectedTypes, pokemonId, requireDouble) {
      if (selectedTypes.length === 0) return 'none';
      var circleCount = 0;
      var hasTriangle = false;
      selectedTypes.forEach(function(t) {
        var m = (t.matchups && t.matchups[pokemonId]) || '△';
        if (m === '○') circleCount++;
        else if (m === '△') hasTriangle = true;
      });
      if (requireDouble) {
        if (circleCount >= 2) return 'full';
        if (circleCount === 1) return 'single';
      } else {
        if (circleCount >= 1) return 'full';
      }
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
      var megaWarning = megaCount >= 3 ? ' <span class="mega-warning">⚠️ メガ3体！</span>' : '';
      document.getElementById('partySummary').innerHTML =
        'メガシンカ: ' + megaCount + megaWarning + ' / 優先: ' + priorityCount;

      // カバレッジパネル更新
      if (top50.length === 0) return;

      var groups = { full: [], single: [], partial: [], none: [] };
      top50.forEach(function(entry) {
        var requireDouble = entry.rank <= doubleThreshold;
        var cov = getCoverage(selectedTypes, entry.pokemon.id, requireDouble);
        groups[cov].push(entry.pokemon);
      });

      var fullCount    = groups.full.length;
      var singleCount  = groups.single.length;
      var partialCount = groups.partial.length;
      var noneCount    = groups.none.length;
      var total        = top50.length;

      function chips(list, cls) {
        return list.map(function(p) {
          return '<span class="coverage-chip ' + cls + '">' + p.ja + '</span>';
        }).join('');
      }
      function clickableChips(list, cls) {
        return list.map(function(p) {
          return '<button class="coverage-chip ' + cls + ' chip-clickable" data-pokemon-id="' + p.id + '">' + p.ja + '</button>';
        }).join('');
      }

      var html =
        '<div class="coverage-header">' +
          'カバレッジ確認' +
          '<span class="coverage-threshold-btns">' +
            '<button class="btn-sm btn-sort' + (doubleThreshold === 20 ? ' active' : '') + '" id="thresh20">上位20</button>' +
            '<button class="btn-sm btn-sort' + (doubleThreshold === 30 ? ' active' : '') + '" id="thresh30">上位30</button>' +
            '<span class="cov-thresh-label">を2匹カバー判定</span>' +
          '</span>' +
        '</div>' +
        '<div class="coverage-stats-row">' +
          '<span class="cov-ok-text">✅ ' + fullCount + '</span>' +
          (singleCount > 0 ? '<span class="cov-single-text">🔵 ' + singleCount + '</span>' : '') +
          (partialCount > 0 ? '<span class="cov-partial-text">⚠️ ' + partialCount + '</span>' : '') +
          (noneCount > 0 ? '<span class="cov-none-text">❌ ' + noneCount + '</span>' : '') +
        '</div>';

      // まとめて対策 <details> の open 状態を保存
      var multiCounterOpen = false;
      var existingMultiCounter = document.querySelector('#coveragePanel .multi-counter-group');
      if (existingMultiCounter) multiCounterOpen = existingMultiCounter.open;

      // パーティ変更時は対策候補パネルをリセット
      var suggPanel = document.getElementById('counterSuggestionPanel');
      if (suggPanel) { suggPanel.innerHTML = ''; suggPanel.removeAttribute('data-active-id'); }

      if (selectedTypes.length === 0) {
        html += '<p class="coverage-empty">ポケモンを選択するとカバレッジが表示されます</p>';
      } else {
        if (groups.none.length > 0) {
          html += '<div class="coverage-group">' +
            '<div class="coverage-group-label cov-none-label">❌ 未カバー (' + noneCount + '匹) <span class="chip-hint">タップで対策確認</span></div>' +
            '<div class="coverage-chips">' + clickableChips(groups.none, 'chip-none') + '</div>' +
          '</div>';
        }
        if (groups.partial.length > 0) {
          html += '<div class="coverage-group">' +
            '<div class="coverage-group-label cov-partial-label">⚠️ △のみ (' + partialCount + '匹) <span class="chip-hint">タップで対策確認</span></div>' +
            '<div class="coverage-chips">' + clickableChips(groups.partial, 'chip-partial') + '</div>' +
          '</div>';
        }
        if (groups.single.length > 0) {
          html += '<div class="coverage-group">' +
            '<div class="coverage-group-label cov-single-label">🔵 1匹カバー (' + singleCount + '匹) <span class="chip-hint">タップで対策確認</span></div>' +
            '<div class="coverage-chips">' + clickableChips(groups.single, 'chip-single') + '</div>' +
          '</div>';
        }
        if (groups.full.length > 0) {
          html += '<details class="coverage-group"><summary class="coverage-group-label cov-ok-label">✅ カバー済み (' + fullCount + '匹) <span class="chip-hint">タップで対策確認</span></summary>' +
            '<div class="coverage-chips">' + clickableChips(groups.full, 'chip-ok') + '</div>' +
          '</details>';
        }

        // まとめて対策ランキング
        var weakPokemons = groups.none.concat(groups.partial).concat(groups.single);
        if (weakPokemons.length >= 2) {
          var selectedIds = selectedTypes.map(function(t) { return t.id; });
          var selectedPokemonIds = selectedTypes.map(function(t) { return t.pokemonId; });
          var ranked = types
            .filter(function(t) {
              return selectedIds.indexOf(t.id) < 0 &&
                     selectedPokemonIds.indexOf(t.pokemonId) < 0 &&
                     !(megaCount >= 2 && t.isMega);
            })
            .map(function(t) {
              var covered = weakPokemons.filter(function(p) {
                return t.matchups && t.matchups[p.id] === '○';
              });
              return { type: t, covered: covered };
            })
            .filter(function(c) { return c.covered.length >= 2; })
            .sort(function(a, b) { return b.covered.length - a.covered.length; })
            .slice(0, 5);

          if (ranked.length > 0) {
            html += '<details class="coverage-group multi-counter-group"' + (multiCounterOpen ? ' open' : '') + '><summary class="coverage-group-label multi-counter-label">🎯 まとめて対策できる型（上位' + ranked.length + '）</summary>' +
              '<div class="multi-counter-list">';
            ranked.forEach(function(c) {
              var poke = App.POKEMON_MAP[c.type.pokemonId];
              var typeName = (poke ? poke.ja : '???') + (c.type.nickname ? ' (' + c.type.nickname + ')' : '');
              var covNames = c.covered.map(function(p) { return p.ja; }).join('、');
              html += '<div class="multi-counter-item">' +
                '<span class="multi-counter-name">' + typeName + '</span>' +
                '<span class="multi-counter-count">' + c.covered.length + '匹</span>' +
                '<div class="multi-counter-pokes">' + covNames + '</div>' +
              '</div>';
            });
            html += '</div></details>';
          }
        }
      }

      document.getElementById('coveragePanel').innerHTML = html;
    }

    function updateSlotOptions() {
      var usedIds = [];
      for (var i = 0; i < 6; i++) {
        var val = document.getElementById('partySlot' + i).value;
        if (val) usedIds.push(val);
      }
      for (var i = 0; i < 6; i++) {
        var sel = document.getElementById('partySlot' + i);
        var ownVal = sel.value;
        for (var j = 0; j < sel.options.length; j++) {
          var opt = sel.options[j];
          if (!opt.value) continue;
          opt.disabled = usedIds.indexOf(opt.value) >= 0 && opt.value !== ownVal;
        }
      }
    }

    for (var i = 0; i < 6; i++) {
      document.getElementById('partySlot' + i).addEventListener('change', function() {
        updateSlotOptions();
        updateSummary();
      });
    }
    updateSlotOptions();
    updateSummary();

    // 閾値ボタン＆チップクリック（イベント委譲でパネル再描画後も動作）
    document.getElementById('coveragePanel').addEventListener('click', function(e) {
      if (e.target.id === 'thresh20') { doubleThreshold = 20; updateSummary(); }
      if (e.target.id === 'thresh30') { doubleThreshold = 30; updateSummary(); }
      var chip = e.target.closest('.chip-clickable');
      if (chip) {
        var pokemonId = parseInt(chip.getAttribute('data-pokemon-id'));
        showCounterSuggestion(pokemonId);
      }
    });

    function showCounterSuggestion(pokemonId) {
      var panel = document.getElementById('counterSuggestionPanel');
      // 同じチップを再クリックで閉じる
      if (panel.getAttribute('data-active-id') === String(pokemonId)) {
        panel.innerHTML = '';
        panel.removeAttribute('data-active-id');
        return;
      }
      panel.setAttribute('data-active-id', String(pokemonId));

      var selectedTypes = getSelectedTypes();
      var selectedIds = selectedTypes.map(function(t) { return t.id; });
      var counters = types.filter(function(t) {
        return selectedIds.indexOf(t.id) < 0 &&
               t.matchups && t.matchups[pokemonId] === '○';
      });

      var pokemon = App.POKEMON_MAP[pokemonId];
      var pokeName = pokemon ? pokemon.ja : '???';

      var html = '<div class="counter-suggestion-header">【' + pokeName + '】への対策候補（未採用の型）</div>';
      if (counters.length === 0) {
        html += '<p class="counter-suggestion-empty">○として登録された型がありません</p>';
      } else {
        html += '<div class="counter-suggestion-chips">';
        counters.forEach(function(t) {
          var poke = App.POKEMON_MAP[t.pokemonId];
          var name = poke ? poke.ja : '???';
          var nick = t.nickname ? ' <small>(' + t.nickname + ')</small>' : '';
          html += '<span class="counter-suggestion-chip">' + name + nick + '</span>';
        });
        html += '</div>';
      }
      panel.innerHTML = html;
    }

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
