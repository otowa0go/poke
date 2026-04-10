/* ========================================
 * S6: 選出シミュレータ（最重要画面）
 * ======================================== */
App.Views = App.Views || {};
App.Views.Simulator = (function() {

  function render(container) {
    var parties = App.Store.getParties();
    var settings = App.Store.getSettings();

    var html =
      '<div class="view-simulator">' +
        '<div class="view-header">' +
          '<a href="#/" class="btn-back">&larr;</a>' +
          '<h2>選出シミュレータ</h2>' +
        '</div>';

    if (parties.length === 0) {
      html += '<div class="empty-msg">パーティが登録されていません。<br>先にポケモン型の登録とパーティ作成を行ってください。<br><br>' +
        '<a href="#/types/new" class="btn-primary">型を作成</a></div></div>';
      container.innerHTML = html;
      return;
    }

    html +=
        '<div class="form-section">' +
          '<div class="form-row">' +
            '<label>自分のパーティ</label>' +
            '<select id="simParty">' +
              parties.map(function(p) {
                return '<option value="' + p.id + '">' + esc(p.name || '無名') + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div id="simPartyPreview" class="party-preview"></div>' +
        '</div>' +
        '<div class="form-section">' +
          '<h3>相手のパーティ</h3>' +
          '<div class="opponent-grid" id="opponentGrid"></div>' +
        '</div>' +
        '<div class="form-actions">' +
          '<button id="btnSimulate" class="btn-primary btn-large">シミュレート</button>' +
        '</div>' +
        '<div id="simResults" class="sim-results"></div>' +
      '</div>';

    container.innerHTML = html;

    // 自分のパーティプレビュー
    var partySelect = document.getElementById('simParty');
    function updatePartyPreview() {
      var party = App.Store.getPartyById(partySelect.value);
      var preview = document.getElementById('simPartyPreview');
      if (!party) { preview.innerHTML = ''; return; }
      var names = party.typeIds.map(function(tid) {
        if (!tid) return '<span class="party-empty">(空)</span>';
        var t = App.Store.getTypeById(tid);
        if (!t) return '<span class="party-empty">(不明)</span>';
        var p = App.POKEMON_MAP[t.pokemonId];
        var name = p ? p.ja : '???';
        var badges = '';
        if (t.isMega) badges += '<span class="badge badge-mega">M</span>';
        if (t.isPriority) badges += '<span class="badge badge-priority">&#9733;</span>';
        return '<span class="party-member">' + name + (t.nickname ? '<small>(' + esc(t.nickname) + ')</small>' : '') + badges + '</span>';
      });
      preview.innerHTML = names.join('');
    }
    partySelect.addEventListener('change', updatePartyPreview);
    updatePartyPreview();

    // 相手入力欄6つ
    var opponentInputs = [];
    var grid = document.getElementById('opponentGrid');
    for (var i = 0; i < 6; i++) {
      (function(idx) {
        var wrap = document.createElement('div');
        wrap.className = 'opponent-slot';
        var label = document.createElement('span');
        label.className = 'opponent-label';
        label.textContent = (idx + 1) + '';
        wrap.appendChild(label);
        var inp = App.PokemonInput.create(wrap, {
          placeholder: (idx + 1) + '匹目',
          onSelect: function() {
            // 次の入力欄にフォーカス
            if (idx < 5 && opponentInputs[idx + 1]) {
              opponentInputs[idx + 1].focus();
            }
          }
        });
        opponentInputs.push(inp);
        grid.appendChild(wrap);
      })(i);
    }

    // シミュレート
    document.getElementById('btnSimulate').addEventListener('click', function() {
      var party = App.Store.getPartyById(partySelect.value);
      if (!party) { alert('パーティを選択してください'); return; }

      // 自分のパーティの型を取得
      var partyTypes = [];
      party.typeIds.forEach(function(tid) {
        if (tid) {
          var t = App.Store.getTypeById(tid);
          if (t) partyTypes.push(t);
        }
      });
      if (partyTypes.length < 3) {
        alert('パーティに3匹以上のポケモンが必要です');
        return;
      }

      // 相手ポケモン収集
      var opponentIds = [];
      opponentInputs.forEach(function(inp) {
        var p = inp.getSelected();
        if (p) opponentIds.push(p.id);
      });
      if (opponentIds.length < 1) {
        alert('相手のポケモンを1匹以上入力してください');
        return;
      }

      // 計算実行
      var candidates = App.Score.calculateCandidates(partyTypes, opponentIds, settings);
      renderResults(candidates, opponentIds);
    });
  }

  function renderResults(candidates, opponentIds) {
    var resultsEl = document.getElementById('simResults');
    if (candidates.length === 0) {
      resultsEl.innerHTML = '<p class="empty-msg">候補が見つかりません</p>';
      return;
    }

    var rankIcons = ['&#129351;', '&#129352;', '&#129353;', '4', '5'];
    var html = '<h3>選出候補</h3>';

    candidates.forEach(function(c, idx) {
      var names = c.types.map(function(t) {
        var p = App.POKEMON_MAP[t.pokemonId];
        var name = p ? p.ja : '???';
        var badges = '';
        if (t.isMega) badges += '<span class="badge badge-mega">M</span>';
        if (t.isPriority) badges += '<span class="badge badge-priority">&#9733;</span>';
        return name + (t.nickname ? '<small>(' + esc(t.nickname) + ')</small>' : '') + badges;
      });

      var coverClass = c.coveredCount === opponentIds.length ? 'cover-full' : 'cover-partial';

      html +=
        '<div class="result-card' + (idx === 0 ? ' result-top' : '') + '">' +
          '<div class="result-rank">' + rankIcons[idx] + '</div>' +
          '<div class="result-body">' +
            '<div class="result-names">' + names.join(' <span class="sep">/</span> ') + '</div>' +
            '<div class="result-score">' +
              '<span class="score-total">' + c.totalScore + '点</span>' +
              '<span class="score-detail">カバレッジ ' + c.coverageScore +
                ' + 詳細 ' + c.detailScore +
                ' + ボーナス ' + c.bonusScore + '</span>' +
            '</div>' +
            '<div class="result-meta">' +
              '<span class="' + coverClass + '">カバー: ' + c.coveredCount + '/' + opponentIds.length + '</span>' +
              (c.megaCount > 0 ? ' <span class="badge badge-mega">メガ:' + c.megaCount + '</span>' : '') +
              (c.priorityCount > 0 ? ' <span class="badge badge-priority">優先:' + c.priorityCount + '</span>' : '') +
            '</div>';

      // 重い相手
      if (c.heavyOpponents.length > 0) {
        html += '<div class="result-heavy"><span class="heavy-label">重い相手:</span>';
        c.heavyOpponents.forEach(function(h) {
          html += ' <span class="heavy-pokemon">' + h.name +
            ' <small>(○' + h.circleCount + '/△' + h.triangleCount + '/×' + h.crossCount + ')</small></span>';
        });
        html += '</div>';
      }

      // 相手ごとの有利不利マトリクス
      html += '<div class="result-matrix"><table><thead><tr><th></th>';
      opponentIds.forEach(function(oppId) {
        var p = App.POKEMON_MAP[oppId];
        html += '<th>' + (p ? p.ja.substring(0,4) : '?') + '</th>';
      });
      html += '</tr></thead><tbody>';
      c.types.forEach(function(t) {
        var p = App.POKEMON_MAP[t.pokemonId];
        html += '<tr><td class="matrix-name">' + (p ? p.ja.substring(0,4) : '?') + '</td>';
        opponentIds.forEach(function(oppId) {
          var m = App.Score.getMatchup(t, oppId);
          var cls = m === '○' ? 'mu-circle' : (m === '×' ? 'mu-cross' : 'mu-triangle');
          html += '<td class="' + cls + '">' + m + '</td>';
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';

      html += '</div></div>';
    });

    resultsEl.innerHTML = html;
  }

  function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  return { render: render };
})();
