/* ========================================
 * S1: ホーム画面
 * ======================================== */
App.Views = App.Views || {};
App.Views.Home = (function() {

  function render(container) {
    var types = App.Store.getTypes();
    var parties = App.Store.getParties();
    var user = App.Firebase.getUser();

    container.innerHTML =
      '<div class="view-home">' +
        '<h1 class="app-title">Pokemon Battle Assist</h1>' +
        '<p class="app-subtitle">ポケモンチャンピオンズ 選出補助ツール</p>' +

        // ログイン状態
        '<div id="authArea" class="auth-area">' +
          (user
            ? '<div class="auth-logged-in">' +
                '<span class="auth-user">' + esc(user.displayName || user.email) + '</span>' +
                '<span class="auth-sync">&#9989; 同期ON</span>' +
                '<button id="btnLogout" class="btn-sm">ログアウト</button>' +
              '</div>'
            : '<div class="auth-logged-out">' +
                '<span class="auth-msg">ログインでPC&#8596;スマホ同期</span>' +
                '<button id="btnLogin" class="btn-primary btn-login">Googleでログイン</button>' +
              '</div>'
          ) +
        '</div>' +

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

    // ログインボタン
    var btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
      btnLogin.addEventListener('click', function() {
        btnLogin.disabled = true;
        btnLogin.textContent = 'ログイン中...';
        App.Firebase.login().then(function() {
          render(container);
        }).catch(function(err) {
          if (err.code !== 'auth/popup-closed-by-user') {
            alert('ログインに失敗しました: ' + err.message);
          }
          btnLogin.disabled = false;
          btnLogin.textContent = 'Googleでログイン';
        });
      });
    }

    // ログアウトボタン
    var btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', function() {
        App.Firebase.logout().then(function() {
          render(container);
        });
      });
    }
  }

  function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  return { render: render };
})();
