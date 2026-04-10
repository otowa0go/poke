/* ========================================
 * S4: ポケモン型一覧
 * ======================================== */
App.Views = App.Views || {};
App.Views.TypeList = (function() {

  function render(container) {
    var types = App.Store.getTypes();

    var html =
      '<div class="view-type-list">' +
        '<div class="view-header">' +
          '<a href="#/" class="btn-back">&larr;</a>' +
          '<h2>ポケモン型管理</h2>' +
          '<a href="#/types/new" class="btn-action">+ 新規作成</a>' +
        '</div>' +
        '<div class="filter-bar">' +
          '<input type="text" id="typeFilter" placeholder="フィルタ..." class="input-filter">' +
        '</div>' +
        '<div id="typeListBody" class="list-body">';

    if (types.length === 0) {
      html += '<p class="empty-msg">型が登録されていません。「+ 新規作成」から登録してください。</p>';
    } else {
      types.forEach(function(t) {
        var poke = App.POKEMON_MAP[t.pokemonId];
        var pokeName = poke ? poke.ja : '???';
        var label = pokeName + (t.nickname ? ' (' + t.nickname + ')' : '');
        var badges = '';
        if (t.isMega) badges += '<span class="badge badge-mega">M</span>';
        if (t.isPriority) badges += '<span class="badge badge-priority">&#9733;</span>';

        html +=
          '<div class="list-item" data-name="' + label + '">' +
            '<div class="list-item-main">' +
              '<span class="list-item-name">' + label + '</span>' +
              badges +
              (t.item ? '<span class="list-item-sub">' + t.item + '</span>' : '') +
            '</div>' +
            '<div class="list-item-actions">' +
              '<a href="#/types/' + t.id + '" class="btn-sm">編集</a>' +
              '<button class="btn-sm btn-dup" data-id="' + t.id + '">複製</button>' +
              '<button class="btn-sm btn-del" data-id="' + t.id + '">削除</button>' +
            '</div>' +
          '</div>';
      });
    }

    html += '</div></div>';
    container.innerHTML = html;

    // フィルタ
    var filter = document.getElementById('typeFilter');
    if (filter) {
      filter.addEventListener('input', function() {
        var q = App.Kana.normalize(filter.value);
        var items = container.querySelectorAll('.list-item');
        items.forEach(function(el) {
          var name = App.Kana.normalize(el.getAttribute('data-name') || '');
          el.style.display = name.indexOf(q) >= 0 ? '' : 'none';
        });
      });
    }

    // 削除
    container.querySelectorAll('.btn-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (confirm('この型を削除しますか？')) {
          App.Store.deleteType(btn.getAttribute('data-id'));
          render(container);
        }
      });
    });

    // 複製
    container.querySelectorAll('.btn-dup').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var orig = App.Store.getTypeById(btn.getAttribute('data-id'));
        if (orig) {
          var dup = JSON.parse(JSON.stringify(orig));
          dup.id = null;
          dup.nickname = (dup.nickname || '') + ' (コピー)';
          App.Store.saveType(dup);
          render(container);
        }
      });
    });
  }

  return { render: render };
})();
