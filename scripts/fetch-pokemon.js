/**
 * PokeAPIから全ポケモンデータ（日本語名付き）を取得して
 * data/pokemon_all.json に保存するスクリプト
 *
 * 実行: node scripts/fetch-pokemon.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_PATH = path.join(__dirname, '../data/pokemon_all.json');
const BATCH_SIZE = 20; // 同時リクエスト数

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

async function fetchBatch(urls) {
  return Promise.all(urls.map(function(url) {
    return fetchJson(url).catch(function(err) {
      console.warn('  失敗:', url, err.message);
      return null;
    });
  }));
}

async function main() {
  console.log('PokeAPI から全ポケモンデータを取得中...\n');

  // 全species一覧を取得
  console.log('1. species一覧を取得...');
  var list = await fetchJson('https://pokeapi.co/api/v2/pokemon-species?limit=2000');
  var species = list.results;
  console.log('  ' + species.length + '匹のspeciesを確認\n');

  // 各speciesの詳細を並列バッチで取得
  console.log('2. 日本語名を取得中 (バッチサイズ: ' + BATCH_SIZE + ')...');
  var results = [];
  var total = species.length;

  for (var i = 0; i < total; i += BATCH_SIZE) {
    var batch = species.slice(i, i + BATCH_SIZE);
    var urls = batch.map(function(s) { return s.url; });
    var details = await fetchBatch(urls);

    details.forEach(function(detail) {
      if (!detail) return;

      // IDを取得（URLから抽出）
      var id = detail.id;

      // 英語名
      var enName = detail.name; // kebab-case
      var enEntry = detail.names.find(function(n) { return n.language.name === 'en'; });
      if (enEntry) enName = enEntry.name;

      // 日本語名
      var jaEntry = detail.names.find(function(n) { return n.language.name === 'ja'; });
      // 日本語（漢字なし）がなければ ja-Hrkt（カタカナ）を使う
      var jaHrktEntry = detail.names.find(function(n) { return n.language.name === 'ja-Hrkt'; });
      var jaName = jaEntry ? jaEntry.name : (jaHrktEntry ? jaHrktEntry.name : enName);

      results.push({ id: id, en: enName, ja: jaName });
    });

    var done = Math.min(i + BATCH_SIZE, total);
    process.stdout.write('\r  ' + done + ' / ' + total);
  }

  console.log('\n');

  // IDでソート
  results.sort(function(a, b) { return a.id - b.id; });

  // 保存
  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log('3. 保存完了: ' + OUT_PATH);
  console.log('   合計: ' + results.length + '匹');
}

main().catch(function(err) {
  console.error('エラー:', err);
  process.exit(1);
});
