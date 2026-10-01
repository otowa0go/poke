# テスト実行の安全ルール

## 基本原則（フレームワーク共通）

テスト実行前に、以下を必ず確認すること。これはフレームワークや言語に関係なく適用される原則である。

1. **本番データベースを使用していないことを確認する**: テスト用の DB が設定されていること
2. **テスト環境と本番環境の接続先が分離されていること**: 環境変数・設定ファイルで明示的に切り替えられていること
3. **破壊的な操作（テーブル削除・データリセット等）が本番環境に影響しないこと**

---

### Laravel（Pest / PHPUnit）の場合

#### 必須条件

開発環境でテスト（Pest / PHPUnit）を実行する前に、以下を必ず確認：

1. `.env.testing` が存在し、`DB_DATABASE` が本番DBと異なる名前になっている
2. `phpunit.xml` の `<php>` セクションに `force="true"` 付きで `APP_ENV=testing` と `DB_DATABASE=<テスト用DB名>` が設定されている
3. テスト用DBがMySQLに作成済み

#### 確認コマンド

```bash
# テスト用DBの存在確認
docker exec <mysql-container> mysql -u root -p<password> -e "SHOW DATABASES;"

# テスト実行時のDB接続先確認
docker compose exec <backend-container> php -r "putenv('APP_ENV=testing'); echo getenv('DB_DATABASE') ?: 'not set';"
```

#### テスト実行コマンド

```bash
# 全テスト実行
docker compose exec <backend-container> php artisan test

# 特定テストのみ実行
docker compose exec <backend-container> php artisan test --filter=テスト名
```

#### 禁止事項

- 上記3条件が揃っていない状態でのテスト実行
- `migrate:fresh` / `migrate:reset` / `db:wipe` の本番環境での実行
- ユーザーの確認なしのテスト実行（特に `RefreshDatabase` Trait 使用テスト）
- `.env` の `DB_DATABASE` が本番DB名のまま `php artisan test` を実行すること

#### 事故防止の仕組み

`phpunit.xml` の `force="true"` 設定により、`.env` の値より phpunit.xml の設定が優先される。
これにより本番DBに接続した状態でも、テスト実行時は自動的にテスト用DBに上書きされる。

#### 注意

`.env.testing` と `phpunit.xml` の `DB_DATABASE` は必ずテスト用DB名であること。
本番DB名になっていたら **絶対に** テストを実行しない。
