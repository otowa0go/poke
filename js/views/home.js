/* ========================================
 * S1: ホーム画面
 * ======================================== */
App.Views = App.Views || {};
App.Views.Home = (function() {

  function render(container) {
    var types = App.Store.getTypes();
    var parties = App.Store.getParties();

    container.innerHTML =
      '<div class="view-home">' +
        '<h1 class="app-title">Pokemon Battle Assist</h1>' +
        '<p class="app-subtitle">ポケモンチャンピオンズ 選出補助ツール</p>' +
        '<div class="home-stats">' +
          '<span>登録済み型: ' + types.length + '</span>' +
          '<span>パーティ: ' + parties.length + '</span>' +
        '</div>' +
        '<div class="home-menu">' +
          '<a href="#/simulator" class="home-btn home-btn-primary">' +
            '<span class="home-btn-icon">&#127919;</span>' +
            '<span class="home-btn-label">選出シミュレータ</span>' +
            '<span class="home-btn-desc">相手パーティを入力して最適選出を計算</span>' +
          '</a>' +
          '<a href="#/parties" class="home-btn">' +
            '<span class="home-btn-icon">&#128203;</span>' +
            '<span class="home-btn-label">パーティ管理</span>' +
            '<span class="home-btn-desc">6匹でパーティを構成</span>' +
          '</a>' +
          '<a href="#/types" class="home-btn">' +
            '<span class="home-btn-icon">&#128062;</span>' +
            '<span class="home-btn-label">ポケモン型管理</span>' +
            '<span class="home-btn-desc">持ち物・技・有利不利を登録</span>' +
          '</a>' +
          '<a href="#/settings" class="home-btn">' +
            '<span class="home-btn-icon">&#9881;</span>' +
            '<span class="home-btn-label">設定</span>' +
            '<span class="home-btn-desc">スコア重み・略称辞書</span>' +
          '</a>' +
        '</div>' +
      '</div>';
  }

  return { render: render };
})();
