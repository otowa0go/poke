/* ========================================
 * アプリ初期化・ルーティング設定
 * ======================================== */
document.addEventListener('DOMContentLoaded', function() {
  // Firebase 初期化
  App.Firebase.init();

  // ストレージに保存済みの使用率ランキングがあれば上書き適用
  var storedRank = App.Store.getUsageRank();
  if (storedRank) App.USAGE_RANK = storedRank;

  // データマイグレーション: 933(ジオヅム)→934(キョジオーン) の修正
  (function() {
    var ids = App.Store.getEnabledIds();
    var idx933 = ids.indexOf(933);
    if (idx933 >= 0 && ids.indexOf(934) < 0) {
      ids[idx933] = 934;
      App.Store.saveEnabledIds(ids);
    } else if (idx933 >= 0) {
      // 両方ある場合は933を除去
      ids.splice(idx933, 1);
      App.Store.saveEnabledIds(ids);
    }
  })();

  // 検索インデックス構築
  App.Search.buildIndex();

  // ルーティング
  App.Router.register('#/', App.Views.Home.render);
  App.Router.register('#/simulator', App.Views.Simulator.render);
  App.Router.register('#/types', App.Views.TypeList.render);
  App.Router.register('#/types/:id', App.Views.TypeEdit.render);
  App.Router.register('#/parties', App.Views.PartyList.render);
  App.Router.register('#/parties/:id', App.Views.PartyEdit.render);
  App.Router.register('#/settings', App.Views.Settings.render);

  // ルーター起動
  var appEl = document.getElementById('app');
  App.Router.start(appEl);

  // 認証状態が復元されたらホーム画面を再描画（ログインボタン更新）
  App.Firebase.onAuthChange(function() {
    var hash = window.location.hash || '#/';
    if (hash === '#/') {
      App.Views.Home.render(appEl);
    }
  });
});
