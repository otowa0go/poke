/* ========================================
 * アプリ初期化・ルーティング設定
 * ======================================== */
document.addEventListener('DOMContentLoaded', function() {
  // Firebase 初期化
  App.Firebase.init();

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
