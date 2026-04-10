/* ========================================
 * Firebase 認証 & Firestore 同期
 * ======================================== */
App.Firebase = (function() {
  var db = null;
  var auth = null;
  var currentUser = null;
  var _onAuthChangeCallbacks = [];

  var firebaseConfig = {
    apiKey: "AIzaSyAErzHcU2oMB7hiGCN-n3KKQiygjgzB3lA",
    authDomain: "poke-battle-assist.firebaseapp.com",
    projectId: "poke-battle-assist",
    storageBucket: "poke-battle-assist.firebasestorage.app",
    messagingSenderId: "230341640594",
    appId: "1:230341640594:web:463f4036452fe9ac49414b"
  };

  function init() {
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();

      // 認証をブラウザに永続化（デフォルトだが明示的に）
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      // オフラインキャッシュ有効化
      db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
        console.warn('Firestore persistence:', err.code);
      });

      // 認証状態の監視
      auth.onAuthStateChanged(function(user) {
        currentUser = user;
        console.log('Auth state changed:', user ? user.displayName : 'logged out');
        _onAuthChangeCallbacks.forEach(function(cb) { cb(user); });
        if (user) {
          pullFromCloud();
        }
      });
    } catch(e) {
      console.warn('Firebase init failed:', e);
    }
  }

  function onAuthChange(callback) {
    _onAuthChangeCallbacks.push(callback);
    // 既にログイン済みの場合は即コールバック
    if (currentUser) callback(currentUser);
  }

  function login() {
    if (!auth) return Promise.reject('Firebase not initialized');
    var provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
  }

  function logout() {
    if (!auth) return Promise.reject('Firebase not initialized');
    return auth.signOut();
  }

  function getUser() { return currentUser; }
  function isLoggedIn() { return !!currentUser; }

  // --- Firestore 同期 ---
  function userDoc() {
    if (!db || !currentUser) return null;
    return db.collection('users').doc(currentUser.uid);
  }

  // ローカルの最終同期時刻を管理
  function getLocalSyncTime() {
    try { return localStorage.getItem('poke.lastSyncAt') || ''; }
    catch(e) { return ''; }
  }
  function setLocalSyncTime(time) {
    try { localStorage.setItem('poke.lastSyncAt', time); }
    catch(e) {}
  }

  // ローカル → クラウドに保存
  function pushToCloud() {
    var doc = userDoc();
    if (!doc) return Promise.resolve();

    var data = App.Store.exportAll();
    var now = new Date().toISOString();
    data.lastSyncAt = now;

    return doc.set(data).then(function() {
      setLocalSyncTime(now);
      console.log('Pushed to cloud at', now);
    }).catch(function(err) {
      console.error('Push failed:', err);
    });
  }

  // クラウド → ローカルに取得
  function pullFromCloud() {
    var doc = userDoc();
    if (!doc) return Promise.resolve();

    return doc.get().then(function(snapshot) {
      if (!snapshot.exists) {
        // クラウドにデータがない → ローカルデータをpush
        console.log('No cloud data found, pushing local...');
        return pushToCloud();
      }

      var cloudData = snapshot.data();
      var cloudTime = cloudData.lastSyncAt || '';
      var localTime = getLocalSyncTime();

      console.log('Cloud sync time:', cloudTime);
      console.log('Local sync time:', localTime);

      if (cloudTime && cloudTime > localTime) {
        console.log('Cloud is newer, pulling...');
        App.Store.importAll(cloudData);
        setLocalSyncTime(cloudTime);
        App.Search.buildIndex();
        // 現在の画面を再描画
        var hash = window.location.hash || '#/';
        App.Router.navigate(hash);
      } else if (!localTime && !cloudTime) {
        // 両方空 → ローカルをpush
        console.log('Both empty, pushing local...');
        return pushToCloud();
      } else {
        console.log('Local is newer or same, pushing...');
        return pushToCloud();
      }
    }).catch(function(err) {
      console.error('Pull failed:', err);
    });
  }

  // 自動同期: 保存操作のたびにクラウドへ
  function syncAfterSave() {
    if (isLoggedIn()) {
      clearTimeout(syncAfterSave._timer);
      syncAfterSave._timer = setTimeout(function() {
        pushToCloud();
      }, 1000);
    }
  }

  return {
    init: init,
    login: login,
    logout: logout,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    onAuthChange: onAuthChange,
    pushToCloud: pushToCloud,
    pullFromCloud: pullFromCloud,
    syncAfterSave: syncAfterSave
  };
})();
