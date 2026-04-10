/* ========================================
 * アプリ初期化・ルーティング設定
 * ======================================== */
document.addEventListener('DOMContentLoaded', function() {
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
  App.Router.start(document.getElementById('app'));
});
