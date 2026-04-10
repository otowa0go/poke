/* ========================================
 * Firebase 認証 & Firestore 同期
 * ======================================== */
App.Firebase = (function() {
  var db = null;
  var auth = null;
  var currentUser = null;
  var _onAuthChange = null;

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

      // オフラインキャッシュ有効化
      db.enablePersistence({ synchronizeTabs: true }).catch(function(err) {
        console.warn('Firestore persistence:', err.code);
      });

      // 認証状態の監視
      auth.onAuthStateChanged(function(user) {
        currentUser = user;
        if (_onAuthChange) _onAuthChange(user);
        if (user) {
          console.log('Logged in:', user.displayName);
          pullFromCloud();
        }
      });
    } catch(e) {
      console.warn('Firebase init failed:', e);
    }
  }

  function onAuthChange(callback) {
    _onAuthChange = callback;
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

  // ローカル → クラウドに保存
  function pushToCloud() {
    var doc = userDoc();
    if (!doc) return Promise.resolve();

    var data = App.Store.exportAll();
    data.lastSyncAt = new Date().toISOString();

    return doc.set(data, { merge: true }).then(function() {
      console.log('Pushed to cloud');
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
        console.log('No cloud data, pushing local...');
        return pushToCloud();
      }

      var cloudData = snapshot.data();
      var localData = App.Store.exportAll();

      // タイムスタンプ比較: クラウドの方が新しければ取り込む
      var cloudTime = cloudData.lastSyncAt || '';
      var localTime = localData.exportedAt || '';

      if (cloudTime > localTime) {
        console.log('Cloud is newer, pulling...');
        App.Store.importAll(cloudData);
        App.Search.buildIndex();
        // 画面リフレッシュ
        if (window.location.hash) {
          App.Router.navigate(window.location.hash);
        }
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
      // 少し遅延させて連続保存を束ねる
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
