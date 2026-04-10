/* ========================================
 * ハッシュベース SPA ルーター
 * ======================================== */
App.Router = (function() {
  var routes = [];
  var container = null;

  function register(pattern, renderFn) {
    // pattern: '#/types/:id' → regex: /^#\/types\/([^/]+)$/
    var paramNames = [];
    var regexStr = pattern.replace(/:(\w+)/g, function(_, name) {
      paramNames.push(name);
      return '([^/]+)';
    });
    routes.push({
      regex: new RegExp('^' + regexStr + '$'),
      paramNames: paramNames,
      render: renderFn
    });
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function resolve() {
    var hash = window.location.hash || '#/';
    for (var i = 0; i < routes.length; i++) {
      var match = hash.match(routes[i].regex);
      if (match) {
        var params = {};
        routes[i].paramNames.forEach(function(name, idx) {
          params[name] = decodeURIComponent(match[idx + 1]);
        });
        container.innerHTML = '';
        routes[i].render(container, params);
        window.scrollTo(0, 0);
        return;
      }
    }
    // デフォルト: ホームへ
    navigate('#/');
  }

  function start(el) {
    container = el;
    window.addEventListener('hashchange', resolve);
    resolve();
  }

  return { register: register, navigate: navigate, start: start };
})();
