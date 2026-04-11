/* ========================================
 * S5: 型編集画面（有利不利登録含む）
 * ======================================== */
App.Views = App.Views || {};
App.Views.TypeEdit = (function() {

  function render(container, params) {
    var isNew = !params || !params.id || params.id === 'new';
    var type = isNew ? createEmpty() : App.Store.getTypeById(params.id);
    if (!type) { App.Router.navigate('#/types'); return; }

    var html =
      '<div class="view-type-edit">' +
        '<div class="view-header">' +
          '<a href="#/types" class="btn-back">&larr;</a>' +
          '<h2>' + (isNew ? '新規型作成' : '型編集') + '</h2>' +
        '</div>' +
        '<div class="form-section">' +
          '<div class="form-row">' +
            '<label>ポケモン</label>' +
            '<div id="pokemonSelect"></div>' +
          '</div>' +
          '<div class="form-row">' +
            '<label>型名/メモ</label>' +
            '<input type="text" id="typeNickname" value="' + esc(type.nickname) + '" placeholder="例: スカーフ, 物理受け">' +
          '</div>' +
          '<div class="form-row">' +
            '<label>持ち物</label>' +
            '<input type="text" id="typeItem" value="' + esc(type.item) + '" placeholder="例: こだわりスカーフ">' +
          '</div>' +
          '<div class="form-row form-row-moves">' +
            '<label>技</label>' +
            '<input type="text" id="typeMove0" value="' + esc(type.moves[0]) + '" placeholder="技1">' +
            '<input type="text" id="typeMove1" value="' + esc(type.moves[1]) + '" placeholder="技2">' +
            '<input type="text" id="typeMove2" value="' + esc(type.moves[2]) + '" placeholder="技3">' +
            '<input type="text" id="typeMove3" value="' + esc(type.moves[3]) + '" placeholder="技4">' +
          '</div>' +
          '<div class="form-row">' +
            '<label>努力値 <span id="evTotal" class="ev-total">0</span>/66</label>' +
            '<div class="ev-grid">' +
              evInput('HP', 'hp', type.evs.hp) +
              evInput('攻撃', 'atk', type.evs.atk) +
              evInput('防御', 'def', type.evs.def) +
              evInput('特攻', 'spa', type.evs.spa) +
              evInput('特防', 'spd', type.evs.spd) +
              evInput('素早', 'spe', type.evs.spe) +
            '</div>' +
          '</div>' +
          '<div class="form-row">' +
            '<label>性格</label>' +
            '<select id="typeNature">' +
              '<option value="">--</option>' +
              App.NATURES.map(function(n) {
                var sel = n.name === type.nature ? ' selected' : '';
                var desc = n.up ? ' (' + n.up + '↑ ' + n.down + '↓)' : '';
                return '<option value="' + n.name + '"' + sel + '>' + n.name + desc + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="form-row form-row-checks">' +
            '<label><input type="checkbox" id="typeMega"' + (type.isMega ? ' checked' : '') + '> メガシンカ</label>' +
            '<label><input type="checkbox" id="typePriority"' + (type.isPriority ? ' checked' : '') + '> 優先ポケモン</label>' +
          '</div>' +
        '</div>' +
        '<div class="form-section">' +
          '<h3>有利不利登録</h3>' +
          '<div class="matchup-toolbar">' +
            '<input type="text" id="matchupFilter" placeholder="フィルタ..." class="input-filter">' +
            '<button class="btn-sm btn-sort active" id="sortByDex">図鑑番号</button>' +
            '<button class="btn-sm btn-sort" id="sortByRank">使用率順</button>' +
          '</div>' +
          '<div id="matchupTable" class="matchup-table"></div>' +
        '</div>' +
        '<div class="form-actions">' +
          '<button id="btnSave" class="btn-primary">保存</button>' +
          '<a href="#/types" class="btn-secondary">キャンセル</a>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // ポケモン選択
    var pokemonInput = App.PokemonInput.create(
      document.getElementById('pokemonSelect'),
      {
        initialValue: type.pokemonId ? App.POKEMON_MAP[type.pokemonId] : null,
        placeholder: 'ポケモン名を入力...'
      }
    );

    // 努力値リアルタイム計算
    var evInputs = container.querySelectorAll('.ev-input');
    function updateEvTotal() {
      var total = 0;
      evInputs.forEach(function(inp) { total += parseInt(inp.value) || 0; });
      var el = document.getElementById('evTotal');
      el.textContent = total;
      el.className = 'ev-total' + (total > 66 ? ' ev-over' : '');
    }
    evInputs.forEach(function(inp) {
      inp.addEventListener('input', updateEvTotal);
    });
    updateEvTotal();

    // 有利不利テーブル描画
    renderMatchupTable(type.matchups || {});

    // フィルタ
    document.getElementById('matchupFilter').addEventListener('input', applyFilter);

    // ソートボタン
    document.getElementById('sortByDex').addEventListener('click', function() {
      currentSort = 'dex';
      document.getElementById('sortByDex').classList.add('active');
      document.getElementById('sortByRank').classList.remove('active');
      var matchups = collectMatchups();
      renderMatchupTable(matchups);
      applyFilter();
    });
    document.getElementById('sortByRank').addEventListener('click', function() {
      currentSort = 'rank';
      document.getElementById('sortByRank').classList.add('active');
      document.getElementById('sortByDex').classList.remove('active');
      var matchups = collectMatchups();
      renderMatchupTable(matchups);
      applyFilter();
    });

    function collectMatchups() {
      var matchups = {};
      container.querySelectorAll('.matchup-row').forEach(function(row) {
        var oppId = parseInt(row.getAttribute('data-pokemon-id'));
        var checked = row.querySelector('input[type="radio"]:checked');
        if (checked) matchups[oppId] = checked.value;
      });
      return matchups;
    }

    function applyFilter() {
      var q = App.Kana.normalize(document.getElementById('matchupFilter').value);
      var rows = container.querySelectorAll('.matchup-row');
      rows.forEach(function(row) {
        var name = App.Kana.normalize(row.getAttribute('data-name') || '');
        row.style.display = name.indexOf(q) >= 0 ? '' : 'none';
      });
    }

    // 保存
    document.getElementById('btnSave').addEventListener('click', function() {
      var poke = pokemonInput.getSelected();
      if (!poke) { alert('ポケモンを選択してください'); return; }

      // 努力値バリデーション
      var evs = {};
      var evTotal = 0;
      ['hp','atk','def','spa','spd','spe'].forEach(function(stat) {
        var v = parseInt(document.getElementById('ev_' + stat).value) || 0;
        v = Math.max(0, Math.min(32, v));
        evs[stat] = v;
        evTotal += v;
      });
      if (evTotal > 66) { alert('努力値の合計が66を超えています（現在: ' + evTotal + '）'); return; }

      // 有利不利収集
      var matchups = {};
      container.querySelectorAll('.matchup-row').forEach(function(row) {
        var oppId = parseInt(row.getAttribute('data-pokemon-id'));
        var checked = row.querySelector('input[type="radio"]:checked');
        if (checked && checked.value !== '△') {
          matchups[oppId] = checked.value;
        }
      });

      type.pokemonId = poke.id;
      type.nickname = document.getElementById('typeNickname').value.trim();
      type.item = document.getElementById('typeItem').value.trim();
      type.moves = [
        document.getElementById('typeMove0').value.trim(),
        document.getElementById('typeMove1').value.trim(),
        document.getElementById('typeMove2').value.trim(),
        document.getElementById('typeMove3').value.trim()
      ];
      type.evs = evs;
      type.nature = document.getElementById('typeNature').value;
      type.isMega = document.getElementById('typeMega').checked;
      type.isPriority = document.getElementById('typePriority').checked;
      type.matchups = matchups;

      App.Store.saveType(type);
      App.Router.navigate('#/types');
    });
  }

  var currentSort = 'dex'; // 'dex' or 'rank'

  function renderMatchupTable(matchups) {
    var table = document.getElementById('matchupTable');
    var html = '';
    var list = App.Store.getEnabledPokemon().slice();

    if (currentSort === 'rank') {
      list.sort(function(a, b) {
        var ra = App.USAGE_RANK[a.id] || 999;
        var rb = App.USAGE_RANK[b.id] || 999;
        return ra !== rb ? ra - rb : a.id - b.id;
      });
    }

    list.forEach(function(p) {
      var current = matchups[p.id] || '△';
      html +=
        '<div class="matchup-row" data-pokemon-id="' + p.id + '" data-name="' + p.ja + ' ' + p.en + '">' +
          '<span class="matchup-name">' + p.ja + '</span>' +
          '<label class="matchup-radio matchup-circle"><input type="radio" name="mu_' + p.id + '" value="○"' + (current === '○' ? ' checked' : '') + '><span>○</span></label>' +
          '<label class="matchup-radio matchup-triangle"><input type="radio" name="mu_' + p.id + '" value="△"' + (current === '△' ? ' checked' : '') + '><span>△</span></label>' +
          '<label class="matchup-radio matchup-cross"><input type="radio" name="mu_' + p.id + '" value="×"' + (current === '×' ? ' checked' : '') + '><span>×</span></label>' +
        '</div>';
    });
    table.innerHTML = html;
  }

  function evInput(label, stat, value) {
    return '<div class="ev-cell"><span class="ev-label">' + label + '</span>' +
      '<input type="number" id="ev_' + stat + '" class="ev-input" min="0" max="32" value="' + (value || 0) + '"></div>';
  }

  function createEmpty() {
    return {
      id: null, pokemonId: null, nickname: '', item: '',
      moves: ['', '', '', ''],
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      nature: '', isMega: false, isPriority: false, matchups: {}
    };
  }

  function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  return { render: render };
})();
