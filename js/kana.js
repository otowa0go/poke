/* ========================================
 * カタカナ⇔ひらがな変換
 * ======================================== */
App.Kana = (function() {
  function toHiragana(str) {
    return str.replace(/[\u30A1-\u30F6]/g, function(c) {
      return String.fromCharCode(c.charCodeAt(0) - 0x60);
    });
  }

  function toKatakana(str) {
    return str.replace(/[\u3041-\u3096]/g, function(c) {
      return String.fromCharCode(c.charCodeAt(0) + 0x60);
    });
  }

  // 検索用に正規化: 小文字化 + ひらがな化
  function normalize(str) {
    return toHiragana(str.toLowerCase().trim());
  }

  return { toHiragana: toHiragana, toKatakana: toKatakana, normalize: normalize };
})();
