/* ========================================
 * ポケモン予測入力コンポーネント
 * ======================================== */
App.PokemonInput = (function() {

  /**
   * 予測入力付きインプットを生成
   * @param {HTMLElement} container - 配置先
   * @param {Object} opts
   *   opts.onSelect(pokemon) - 選択時コールバック
   *   opts.placeholder - プレースホルダ
   *   opts.initialValue - 初期値（ポケモンオブジェクト）
   *   opts.inputClass - inputに追加するCSSクラス
   */
  function create(container, opts) {
    opts = opts || {};
    var wrapper = document.createElement('div');
    wrapper.className = 'poke-input-wrapper';
    wrapper.style.position = 'relative';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'poke-input ' + (opts.inputClass || '');
    input.placeholder = opts.placeholder || 'ポケモン名を入力...';
    input.autocomplete = 'off';

    var dropdown = document.createElement('div');
    dropdown.className = 'poke-dropdown';
    dropdown.style.display = 'none';

    wrapper.appendChild(input);
    wrapper.appendChild(dropdown);
    container.appendChild(wrapper);

    var selectedPokemon = opts.initialValue || null;
    var activeIndex = -1;
    var currentResults = [];

    if (selectedPokemon) {
      input.value = selectedPokemon.ja;
    }

    function showDropdown(results) {
      currentResults = results;
      activeIndex = -1;
      if (results.length === 0) {
        dropdown.style.display = 'none';
        return;
      }
      dropdown.innerHTML = '';
      results.forEach(function(p, i) {
        var item = document.createElement('div');
        item.className = 'poke-dropdown-item';
        item.textContent = p.ja + '  (' + p.en + ')';
        item.setAttribute('data-index', i);
        item.addEventListener('mousedown', function(e) {
          e.preventDefault();
          selectItem(i);
        });
        dropdown.appendChild(item);
      });
      dropdown.style.display = 'block';
    }

    function selectItem(index) {
      if (index >= 0 && index < currentResults.length) {
        selectedPokemon = currentResults[index];
        input.value = selectedPokemon.ja;
        dropdown.style.display = 'none';
        if (opts.onSelect) opts.onSelect(selectedPokemon);
      }
    }

    function updateHighlight() {
      var items = dropdown.querySelectorAll('.poke-dropdown-item');
      items.forEach(function(el, i) {
        el.classList.toggle('active', i === activeIndex);
      });
      if (activeIndex >= 0 && items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      }
    }

    input.addEventListener('input', function() {
      selectedPokemon = null;
      var q = input.value;
      if (q.length >= 1) {
        var results = App.Search.search(q, 8);
        showDropdown(results);
      } else {
        dropdown.style.display = 'none';
      }
    });

    input.addEventListener('keydown', function(e) {
      if (dropdown.style.display === 'none') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, currentResults.length - 1);
        updateHighlight();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateHighlight();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0) {
          selectItem(activeIndex);
        } else if (currentResults.length > 0) {
          selectItem(0);
        }
      } else if (e.key === 'Tab') {
        if (currentResults.length > 0 && !selectedPokemon) {
          e.preventDefault();
          selectItem(activeIndex >= 0 ? activeIndex : 0);
        }
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
      }
    });

    input.addEventListener('blur', function() {
      setTimeout(function() { dropdown.style.display = 'none'; }, 150);
    });

    input.addEventListener('focus', function() {
      if (input.value.length >= 1 && !selectedPokemon) {
        var results = App.Search.search(input.value, 8);
        showDropdown(results);
      }
    });

    return {
      getSelected: function() { return selectedPokemon; },
      clear: function() { selectedPokemon = null; input.value = ''; },
      setValue: function(pokemon) {
        selectedPokemon = pokemon;
        input.value = pokemon ? pokemon.ja : '';
      },
      focus: function() { input.focus(); },
      getInput: function() { return input; }
    };
  }

  return { create: create };
})();
