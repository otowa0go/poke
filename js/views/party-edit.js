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
        '<div class="form-actions">' +
          '<button id="btnSave" class="btn-primary">保存</button>' +
          '<a href="#/parties" class="btn-secondary">キャンセル</a>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    function updateSummary() {
      var megaCount = 0, priorityCount = 0;
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
