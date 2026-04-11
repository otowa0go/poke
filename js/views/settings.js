/* ========================================
 * S7: 設定画面
 * ======================================== */
App.Views = App.Views || {};
App.Views.Settings = (function() {

  function render(container) {
    var settings = App.Store.getSettings();
    var w = settings.weights;
    var userAbbr = App.Store.getUserAbbreviations();

    var html =
      '<div class="view-settings">' +
        '<div class="view-header">' +
          '<a href="#/" class="btn-back">&larr;</a>' +
          '<h2>設定</h2>' +
        '</div>' +

        // スコア重み
        '<div class="form-section">' +
          '<h3>スコア重み</h3>' +
          '<div class="settings-grid">' +
            weightInput('○カバー', 'coverO', w.coverO) +
            weightInput('△2匹カバー', 'coverDouble', w.coverDouble) +
            weightInput('△1匹カバー', 'coverSingle', w.coverSingle) +
            weightInput('詳細○', 'detailO', w.detailO) +
            weightInput('詳細×', 'detailX', w.detailX) +
            weightInput('メガボーナス', 'megaBonus', w.megaBonus) +
            weightInput('優先ボーナス', 'priorityBonus', w.priorityBonus) +
          '</div>' +
          '<div class="form-row">' +
            '<label>候補表示数</label>' +
            '<input type="number" id="candidateCount" min="1" max="20" value="' + settings.candidateCount + '">' +
          '</div>' +
          '<button id="btnSaveWeights" class="btn-primary">重みを保存</button>' +
          '<button id="btnResetWeights" class="btn-secondary">デフォルトに戻す</button>' +
        '</div>' +

        // 略称辞書
        '<div class="form-section">' +
          '<h3>略称辞書（ユーザー追加）</h3>' +
          '<div id="abbrList" class="abbr-list">';

    userAbbr.forEach(function(a, idx) {
      var poke = App.POKEMON_MAP[a.pokemonId];
      html += '<div class="abbr-item">' +
        '<span>' + esc(a.short) + ' → ' + (poke ? poke.ja : '???') + '</span>' +
        '<button class="btn-sm btn-del-abbr" data-idx="' + idx + '">削除</button>' +
      '</div>';
    });

    html += '</div>' +
          '<div class="abbr-add">' +
            '<input type="text" id="abbrShort" placeholder="略称 (例: ガブ)">' +
            '<div id="abbrPokemonSelect"></div>' +
            '<button id="btnAddAbbr" class="btn-sm">追加</button>' +
          '</div>' +
        '</div>' +

        // 使用可能ポケモンリスト管理
        '<div class="form-section">' +
          '<h3>使用可能ポケモンリスト</h3>' +
          '<p class="help-text">現在: ' + App.Store.getEnabledPokemon().length + '匹 / 全' + App.POKEMON.length + '匹</p>' +
          '<div class="form-actions">' +
            '<button id="btnExportList" class="btn-secondary">リストをエクスポート</button>' +
            '<button id="btnResetList" class="btn-secondary">デフォルトに戻す</button>' +
          '</div>' +
          '<p class="help-text" style="margin-top:12px">JSONファイルからインポート（Champions console抽出形式）</p>' +
          '<div class="form-actions">' +
            '<button id="btnImportJsonOverwrite" class="btn-primary">上書きインポート</button>' +
            '<button id="btnImportJsonAdd" class="btn-secondary">追加インポート</button>' +
            '<input type="file" id="fileImportJson" accept=".json" style="display:none">' +
          '</div>' +
          '<p id="importJsonResult" class="help-text"></p>' +
          '<details style="margin-top:8px"><summary class="help-text" style="cursor:pointer">テキストでインポート（旧形式）</summary>' +
          '<p class="help-text">1行1ポケモン、英語名 or 日本語名</p>' +
          '<textarea id="importList" rows="6" placeholder="Venusaur&#10;Charizard&#10;リザードン&#10;..."></textarea>' +
          '<div class="form-actions" style="margin-top:4px">' +
            '<button id="btnImportListOverwrite" class="btn-primary">上書きインポート</button>' +
            '<button id="btnImportListAdd" class="btn-secondary">追加インポート</button>' +
          '</div>' +
          '<p id="importResult" class="help-text"></p>' +
          '</details>' +
        '</div>' +

        // バックアップ
        '<div class="form-section">' +
          '<h3>データ管理</h3>' +
          '<button id="btnExport" class="btn-primary">全データバックアップ</button>' +
          '<button id="btnImport" class="btn-secondary">データ復元</button>' +
          '<input type="file" id="fileImport" accept=".json" style="display:none">' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // 略称のポケモン入力
    var abbrPokemonInput = App.PokemonInput.create(
      document.getElementById('abbrPokemonSelect'),
      { placeholder: 'ポケモン名' }
    );

    // 重み保存
    document.getElementById('btnSaveWeights').addEventListener('click', function() {
      ['coverO','coverDouble','coverSingle','detailO','detailX','megaBonus','priorityBonus'].forEach(function(key) {
        settings.weights[key] = parseFloat(document.getElementById('w_' + key).value) || 0;
      });
      settings.candidateCount = parseInt(document.getElementById('candidateCount').value) || 5;
      App.Store.saveSettings(settings);
      alert('設定を保存しました');
    });

    // デフォルトに戻す
    document.getElementById('btnResetWeights').addEventListener('click', function() {
      if (confirm('重みをデフォルトに戻しますか？')) {
        settings.weights = JSON.parse(JSON.stringify(App.Store.DEFAULT_SETTINGS.weights));
        settings.candidateCount = App.Store.DEFAULT_SETTINGS.candidateCount;
        App.Store.saveSettings(settings);
        render(container);
      }
    });

    // 略称追加
    document.getElementById('btnAddAbbr').addEventListener('click', function() {
      var short = document.getElementById('abbrShort').value.trim();
      var poke = abbrPokemonInput.getSelected();
      if (!short || !poke) { alert('略称とポケモンの両方を入力してください'); return; }
      userAbbr.push({ short: short, pokemonId: poke.id });
      App.Store.saveUserAbbreviations(userAbbr);
      App.Search.buildIndex();
      render(container);
    });

    // 略称削除
    container.querySelectorAll('.btn-del-abbr').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(btn.getAttribute('data-idx'));
        userAbbr.splice(idx, 1);
        App.Store.saveUserAbbreviations(userAbbr);
        App.Search.buildIndex();
        render(container);
      });
    });

    // エクスポート（使用可能ポケモンリスト）
    document.getElementById('btnExportList').addEventListener('click', function() {
      var list = App.Store.getEnabledPokemon();
      var text = list.map(function(p) { return p.ja; }).join('\n');
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'pokemon_list_' + new Date().toISOString().slice(0,10) + '.txt';
      a.click();
    });

    // デフォルトに戻す
    document.getElementById('btnResetList').addEventListener('click', function() {
      if (confirm('使用可能ポケモンリストをデフォルト（186匹）に戻しますか？')) {
        App.Store.saveEnabledIds(App.Store.DEFAULT_ENABLED_IDS.slice());
        App.Search.buildIndex();
        render(container);
      }
    });

    // JSONインポート（Champions console抽出形式）
    var jsonImportMode = 'overwrite';
    document.getElementById('btnImportJsonOverwrite').addEventListener('click', function() {
      jsonImportMode = 'overwrite';
      document.getElementById('fileImportJson').click();
    });
    document.getElementById('btnImportJsonAdd').addEventListener('click', function() {
      jsonImportMode = 'add';
      document.getElementById('fileImportJson').click();
    });
    document.getElementById('fileImportJson').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var entries = JSON.parse(ev.target.result);
          if (!Array.isArray(entries)) throw new Error('配列形式のJSONではありません');

          var newIds = [];
          var matched = 0;
          var notFound = [];

          entries.forEach(function(entry) {
            if (!entry || typeof entry.dex === 'undefined') return;
            var name = (entry.name || '').trim();
            var dex = Number(entry.dex);
            var form = Number(entry.form || 0);

            var found = null;
            if (name) {
              found = App.POKEMON.find(function(p) { return p.ja === name; });
            }
            if (!found && form === 0) {
              found = App.POKEMON.find(function(p) { return p.id === dex; });
            }

            if (found && newIds.indexOf(found.id) < 0) {
              newIds.push(found.id);
              matched++;
            } else if (!found) {
              notFound.push(name || ('No.' + dex));
            }
          });

          var resultEl = document.getElementById('importJsonResult');
          if (matched === 0) {
            resultEl.textContent = 'マッチするポケモンが見つかりませんでした。';
            e.target.value = '';
            return;
          }

          var msg = entries.length + '件中 ' + matched + '匹をマッチ。';
          if (notFound.length > 0) {
            msg += ' 未マッチ: ' + notFound.slice(0, 5).join('、') + (notFound.length > 5 ? '…他' + (notFound.length - 5) + '件' : '');
          }

          var isAdd = jsonImportMode === 'add';
          var confirmMsg = isAdd
            ? matched + '匹を既存リストに追加します。よろしいですか？'
            : matched + '匹で使用可能ポケモンを上書きします。よろしいですか？';

          if (confirm(confirmMsg)) {
            var finalIds = isAdd
              ? App.Store.getEnabledIds().concat(newIds.filter(function(id) { return App.Store.getEnabledIds().indexOf(id) < 0; }))
              : newIds;
            App.Store.saveEnabledIds(finalIds);
            App.Search.buildIndex();
            resultEl.textContent = msg + ' → ' + (isAdd ? '追加' : '上書き') + '保存しました。';
            render(container);
          }
          e.target.value = '';
        } catch(err) {
          document.getElementById('importJsonResult').textContent = 'JSONの読み込みに失敗: ' + err.message;
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    });

    // テキストインポート
    function doTextImport(isAdd) {
      var text = document.getElementById('importList').value.trim();
      if (!text) return;
      var lines = text.split(/\r?\n/).map(function(l) { return l.trim(); }).filter(Boolean);
      var matched = 0;
      var notFound = [];
      var newIds = [];

      lines.forEach(function(line) {
        var found = App.POKEMON.find(function(p) {
          return p.en.toLowerCase() === line.toLowerCase() ||
                 p.ja === line ||
                 App.Kana.normalize(p.ja) === App.Kana.normalize(line);
        });
        if (found && newIds.indexOf(found.id) < 0) {
          newIds.push(found.id);
          matched++;
        } else if (!found) {
          notFound.push(line);
        }
      });

      if (matched === 0) {
        document.getElementById('importResult').textContent = 'マッチするポケモンが見つかりませんでした。';
        return;
      }

      var msg = lines.length + '行中 ' + matched + '匹をマッチしました。';
      if (notFound.length > 0) {
        msg += ' 未マッチ: ' + notFound.slice(0,5).join('、') + (notFound.length > 5 ? '…他' + (notFound.length - 5) + '件' : '');
      }

      var confirmMsg = isAdd
        ? matched + '匹を既存リストに追加します。よろしいですか？'
        : matched + '匹で使用可能ポケモンを上書きします。よろしいですか？';

      if (confirm(confirmMsg)) {
        var finalIds = isAdd
          ? App.Store.getEnabledIds().concat(newIds.filter(function(id) { return App.Store.getEnabledIds().indexOf(id) < 0; }))
          : newIds;
        App.Store.saveEnabledIds(finalIds);
        App.Search.buildIndex();
        document.getElementById('importResult').textContent = msg + ' → ' + (isAdd ? '追加' : '上書き') + '保存しました。';
        render(container);
      }
    }
    document.getElementById('btnImportListOverwrite').addEventListener('click', function() { doTextImport(false); });
    document.getElementById('btnImportListAdd').addEventListener('click', function() { doTextImport(true); });

    // バックアップ
    document.getElementById('btnExport').addEventListener('click', function() {
      var data = App.Store.exportAll();
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'poke_backup_' + new Date().toISOString().slice(0,10) + '.json';
      a.click();
    });

    // 復元
    document.getElementById('btnImport').addEventListener('click', function() {
      document.getElementById('fileImport').click();
    });
    document.getElementById('fileImport').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (confirm('現在のデータを上書きしてバックアップから復元しますか？')) {
            App.Store.importAll(data);
            alert('復元しました');
            App.Router.navigate('#/');
          }
        } catch(err) {
          alert('ファイルの読み込みに失敗しました: ' + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  function weightInput(label, key, value) {
    return '<div class="settings-cell">' +
      '<label>' + label + '</label>' +
      '<input type="number" id="w_' + key + '" value="' + value + '" step="1">' +
    '</div>';
  }

  function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  return { render: render };
})();
