/**
 * リージョンフォーム・フォルム違いポケモンのデータを取得して
 * pokemon_all.json に追加するスクリプト
 *
 * 実行: node scripts/fetch-forms.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ALL_PATH = path.join(__dirname, '../data/pokemon_all.json');

function fetchJson(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(res) {
      var data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error: ' + url)); }
      });
    }).on('error', reject);
  });
}

// 追加するフォルムの定義 [pokeapi_name, japanese_name]
// 公式チャンピオンズサイトの表記に合わせた日本語名
var FORMS_TO_ADD = [
  // ロトムフォルム (PokeAPI ID: 10008-10012)
  ['rotom-heat',          'ロトム (ヒートロトム)'],
  ['rotom-wash',          'ロトム (ウォッシュロトム)'],
  ['rotom-frost',         'ロトム (フロストロトム)'],
  ['rotom-fan',           'ロトム (スピンロトム)'],
  ['rotom-mow',           'ロトム (カットロトム)'],
  // ニャオニクス メス
  ['meowstic-female',     'ニャオニクス (メスのすがた)'],
  // パンプジン サイズ違い
  ['gourgeist-small',     'パンプジン (こだましゅ)'],
  ['gourgeist-large',     'パンプジン (おおだましゅ)'],
  ['gourgeist-super',     'パンプジン (ギガだましゅ)'],
  // アローラのすがた
  ['raichu-alola',        'ライチュウ (アローラのすがた)'],
  ['ninetales-alola',     'キュウコン (アローラのすがた)'],
  // ガラルのすがた
  ['slowbro-galar',       'ヤドラン (ガラルのすがた)'],
  ['slowking-galar',      'ヤドキング (ガラルのすがた)'],
  ['stunfisk-galar',      'マッギョ (ガラルのすがた)'],
  // ヒスイのすがた
  ['arcanine-hisui',      'ウインディ (ヒスイのすがた)'],
  ['typhlosion-hisui',    'バクフーン (ヒスイのすがた)'],
  ['samurott-hisui',      'ダイケンキ (ヒスイのすがた)'],
  ['zoroark-hisui',       'ゾロアーク (ヒスイのすがた)'],
  ['goodra-hisui',        'ヌメルゴン (ヒスイのすがた)'],
  ['avalugg-hisui',       'クレベース (ヒスイのすがた)'],
  ['decidueye-hisui',     'ジュナイパー (ヒスイのすがた)'],
  // パルデアのすがた
  ['tauros-paldea-combat', 'ケンタロス (パルデアのすがた・コンバットしゅ)'],
  ['tauros-paldea-blaze',  'ケンタロス (パルデアのすがた・ブレイズしゅ)'],
  ['tauros-paldea-aqua',   'ケンタロス (パルデアのすがた・ウォーターしゅ)'],
  // ルガルガン
  ['lycanroc-midnight',   'ルガルガン (まよなかのすがた)'],
  ['lycanroc-dusk',       'ルガルガン (たそがれのすがた)'],
  // イダイトウ メス
  ['basculegion-female',  'イダイトウ (メスのすがた)'],
];

// 既存データの修正 [id, 新しい日本語名, 新しい英語名(任意)]
var FIXES = [
  // ロトム基本形→すがた表記に統一
  { id: 479,  ja: 'ロトム (ロトムのすがた)' },
  // ニャオニクス→オスのすがた
  { id: 678,  ja: 'ニャオニクス (オスのすがた)' },
  // パンプジン→ちゅうだましゅ
  { id: 711,  ja: 'パンプジン (ちゅうだましゅ)' },
  // ルガルガン→まひるのすがた
  { id: 745,  ja: 'ルガルガン (まひるのすがた)' },
  // イダイトウ→オスのすがた
  { id: 902,  ja: 'イダイトウ (オスのすがた)' },
  // カミツオロチ (Hydrapple) 日本語名修正
  { id: 1019, ja: 'カミツオロチ' },
];

async function main() {
  console.log('フォルムデータを取得中...\n');

  var all = JSON.parse(fs.readFileSync(ALL_PATH, 'utf8'));

  // 既存データを修正
  console.log('1. 既存データの日本語名を修正...');
  FIXES.forEach(function(fix) {
    var p = all.find(function(x) { return x.id === fix.id; });
    if (p) {
      console.log('  ' + p.ja + ' → ' + fix.ja);
      p.ja = fix.ja;
      if (fix.en) p.en = fix.en;
    } else {
      console.warn('  ID ' + fix.id + ' が見つかりません');
    }
  });

  // フォルムを取得して追加
  console.log('\n2. フォルムポケモンを取得...');
  for (var i = 0; i < FORMS_TO_ADD.length; i++) {
    var formName = FORMS_TO_ADD[i][0];
    var jaName   = FORMS_TO_ADD[i][1];

    try {
      var data = await fetchJson('https://pokeapi.co/api/v2/pokemon/' + formName);
      var id = data.id;

      // 既にあればスキップ
      if (all.find(function(x) { return x.id === id; })) {
        console.log('  スキップ(既存): ' + jaName + ' (ID:' + id + ')');
        continue;
      }

      all.push({ id: id, en: data.name, ja: jaName });
      console.log('  追加: ' + jaName + ' (ID:' + id + ')');
    } catch(e) {
      console.warn('  失敗: ' + formName + ' - ' + e.message);
    }
  }

  // IDでソート
  all.sort(function(a, b) { return a.id - b.id; });

  fs.writeFileSync(ALL_PATH, JSON.stringify(all, null, 2), 'utf8');
  console.log('\n完了: ' + all.length + '件');
}

main().catch(function(err) {
  console.error('エラー:', err);
  process.exit(1);
});
