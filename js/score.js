/* ========================================
 * 選出スコアリングエンジン
 * ======================================== */
App.Score = (function() {

  // 有利不利を取得（未登録は△）
  function getMatchup(type, opponentId) {
    if (!type.matchups) return '△';
    return type.matchups[opponentId] || '△';
  }

  // C(n,3) の全組み合わせを生成
  function combinations3(arr) {
    var result = [];
    var n = arr.length;
    for (var i = 0; i < n - 2; i++) {
      for (var j = i + 1; j < n - 1; j++) {
        for (var k = j + 1; k < n; k++) {
          result.push([arr[i], arr[j], arr[k]]);
        }
      }
    }
    return result;
  }

  /**
   * メイン計算
   * @param {Array} partyTypes - 自分のパーティの型オブジェクト6つ
   * @param {Array} opponentIds - 相手ポケモンID 6つ
   * @param {Object} settings - 設定オブジェクト
   * @returns {Array} 候補リスト（スコア降順）
   */
  function calculateCandidates(partyTypes, opponentIds, settings) {
    var w = settings.weights;
    var combos = combinations3(partyTypes);
    var candidates = [];

    combos.forEach(function(trio) {
      var coverageScore = 0;
      var detailScore = 0;
      var bonusScore = 0;
      var heavyOpponents = [];

      // 相手6匹それぞれに対する評価
      opponentIds.forEach(function(oppId) {
        var hasCircle = false;
        var triangleCount = 0;
        var crossCount = 0;
        var circleCount = 0;

        trio.forEach(function(type) {
          var m = getMatchup(type, oppId);
          if (m === '○') { hasCircle = true; circleCount++; detailScore += w.detailO; }
          else if (m === '△') { triangleCount++; }
          else if (m === '×') { crossCount++; detailScore += w.detailX; }
        });

        // カバレッジ点
        if (hasCircle) {
          coverageScore += w.coverO;
        } else if (triangleCount >= 2) {
          coverageScore += w.coverDouble;
        } else if (triangleCount === 1) {
          coverageScore += w.coverSingle;
        }
        // else: 0点

        // 「重い相手」判定: ○がいない相手
        if (!hasCircle) {
          heavyOpponents.push({
            pokemonId: oppId,
            name: App.POKEMON_MAP[oppId] ? App.POKEMON_MAP[oppId].ja : '???',
            circleCount: circleCount,
            triangleCount: triangleCount,
            crossCount: crossCount
          });
        }
      });

      // ボーナス点
      var megaCount = 0;
      var priorityCount = 0;
      trio.forEach(function(type) {
        if (type.isMega) { megaCount++; bonusScore += w.megaBonus; }
        if (type.isPriority) { priorityCount++; bonusScore += w.priorityBonus; }
      });

      var totalScore = coverageScore + detailScore + bonusScore;

      candidates.push({
        types: trio,
        totalScore: totalScore,
        coverageScore: coverageScore,
        detailScore: detailScore,
        bonusScore: bonusScore,
        megaCount: megaCount,
        priorityCount: priorityCount,
        heavyOpponents: heavyOpponents,
        coveredCount: opponentIds.length - heavyOpponents.length
      });
    });

    // スコア降順ソート
    candidates.sort(function(a, b) { return b.totalScore - a.totalScore; });

    // 上位N件を返す
    var count = settings.candidateCount || 5;
    return candidates.slice(0, count);
  }

  return { calculateCandidates: calculateCandidates, getMatchup: getMatchup };
})();
