/* ========================================
 * S2: パーティ一覧
 * ======================================== */
App.Views = App.Views || {};
App.Views.PartyList = (function() {

  function render(container) {
    var parties = App.Store.getParties();
    var types = App.Store.getTypes();

    var html =
      '<div class="view-party-list">' +
        '<div class="view-header">' +
          '<a href="#/" class="btn-back">&larr;</a>' +
          '<h2>パーティ管理</h2>' +
          '<a href="#/parties/new" class="btn-action">+ 新規作成</a>' +
        '</div>' +
        '<div id="partyListBody" class="list-body">';

    if (parties.length === 0) {
      html += '<p class="empty-msg">パーティが登録されていません。<br>先にポケモン型を登録し、「+ 新規作成」からパーティを作成してください。</p>';
    } else {
      parties.forEach(function(p) {
        var members = (p.typeIds || []).map(function(tid) {
          if (!tid) return '(空)';
          var t = types.find(function(x) { return x.id === tid; });
          if (!t) return '(不明)';
          var poke = App.POKEMON_MAP[t.pokemonId];
          return poke ? poke.ja : '???';
        });

        html +=
          '<div class="list-item">' +
            '<div class="list-item-main">' +
              '<span class="list-item-name">' + esc(p.name || '無名パーティ') + '</span>' +
              '<span class="list-item-sub party-members">' + members.join(' / ') + '</span>' +
            '</div>' +
            '<div class="list-item-actions">' +
              '<a href="#/parties/' + p.id + '" class="btn-sm">編集</a>' +
              '<button class="btn-sm btn-dup" data-id="' + p.id + '">複製</button>' +
              '<button class="btn-sm btn-del" data-id="' + p.id + '">削除</button>' +
            '</div>' +
          '</div>';
      });
    }

    html += '</div></div>';
    container.innerHTML = html;

    // 削除
    container.querySelectorAll('.btn-del').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (confirm('このパーティを削除しますか？')) {
          App.Store.deleteParty(btn.getAttribute('data-id'));
          render(container);
        }
      });
    });

    // 複製
    container.querySelectorAll('.btn-dup').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var orig = App.Store.getPartyById(btn.getAttribute('data-id'));
        if (orig) {
          var dup = JSON.parse(JSON.stringify(orig));
          dup.id = null;
          dup.name = (dup.name || '') + ' (コピー)';
          App.Store.saveParty(dup);
          render(container);
        }
      });
    });
  }

  function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  return { render: render };
})();
