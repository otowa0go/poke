/* ========================================
 * Firebase 認証 & Firestore 同期
 * ======================================== */
App.Firebase = (function() {
  var db = null;
  var auth = null;
  var currentUser = null;
  var _onAuthChangeCallbacks = [];
  var _syncStatus = ''; // 画面表示用

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

      // 認証をブラウザに永続化
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

      // オフラインキャッシュ有効化
      db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
        console.warn('Firestore persistence:', err.code);
      });

      // 認証状態の監視
      auth.onAuthStateChanged(function(user) {
        currentUser = user;
        _onAuthChangeCallbacks.forEach(function(cb) { cb(user); });
      });
    } catch(e) {
      console.warn('Firebase init failed:', e);
    }
  }

  function onAuthChange(callback) {
    _onAuthChangeCallbacks.push(callback);
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
  function getSyncStatus() { return _syncStatus; }

  // --- Firestore 同期 ---
  function userDoc() {
    if (!db || !currentUser) return null;
    return db.collection('users').doc(currentUser.uid);
  }

  /**
   * ローカル → クラウドに保存（保存のたびに自動実行）
   */
  function pushToCloud() {
    var doc = userDoc();
    if (!doc) return Promise.resolve();

    var data = App.Store.exportAll();
    data.lastSyncAt = new Date().toISOString();
    _syncStatus = '同期中...';

    return doc.set(data).then(function() {
      _syncStatus = '同期済み (' + new Date().toLocaleTimeString() + ')';
      console.log('Pushed to cloud');
    }).catch(function(err) {
      _syncStatus = '同期失敗: ' + err.message;
      console.error('Push failed:', err);
    });
  }

  /**
   * クラウド → ローカルに取得（手動 or 新デバイスのみ）
   * ローカルデータを上書きするので注意
   */
  function pullFromCloud() {
    var doc = userDoc();
    if (!doc) return Promise.reject('Not logged in');

    _syncStatus = 'クラウドから取得中...';

    return doc.get().then(function(snapshot) {
      if (!snapshot.exists) {
        _syncStatus = 'クラウドにデータなし';
        return { success: false, message: 'クラウドにデータがありません' };
      }

      var cloudData = snapshot.data();
      App.Store.importAll(cloudData);
      App.Search.buildIndex();
      _syncStatus = '取得完了 (' + new Date().toLocaleTimeString() + ')';
      console.log('Pulled from cloud');
      return { success: true, message: '取得完了' };
    }).catch(function(err) {
      _syncStatus = '取得失敗: ' + err.message;
      console.error('Pull failed:', err);
      return { success: false, message: err.message };
    });
  }

  /**
   * 自動同期: 保存操作のたびにクラウドへpush
   */
  function syncAfterSave() {
    if (isLoggedIn()) {
      clearTimeout(syncAfterSave._timer);
      syncAfterSave._timer = setTimeout(function() {
        pushToCloud();
      }, 500);
    }
  }

  return {
    init: init,
    login: login,
    logout: logout,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    getSyncStatus: getSyncStatus,
    onAuthChange: onAuthChange,
    pushToCloud: pushToCloud,
    pullFromCloud: pullFromCloud,
    syncAfterSave: syncAfterSave
  };
})();
