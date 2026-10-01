---
name: db-dump
description: MySQLデータベースのダンプを取得する。DBバックアップ、データ確認、移行前のスナップショット取得時に使用。docs/dump-YYYYMMDD_HHMMSS.sql に出力。
---

# DB Dump - データベースダンプ取得

## Overview

Docker環境のMySQLデータベースのフルダンプを取得し、`docs/` ディレクトリにタイムスタンプ付きファイルとして保存する。

## When to Use

- 「DBダンプを取って」「バックアップして」と言われたとき
- マイグレーション実行前のスナップショット取得
- データ調査用にダンプが必要なとき
- 本番反映前の安全策としてバックアップを取るとき

## Instructions

以下のコマンドを実行する（プロジェクトに合わせて変数を書き換えること）：

```bash
# プロジェクト固有の設定に書き換えてください
MYSQL_CONTAINER="{{MYSQL_CONTAINER_NAME}}"  # 例: mysql, agu-mysql-1
DB_NAME="{{DB_NAME}}"                       # 例: my_database
DB_USER="{{DB_USER}}"                       # 例: root
DB_PASS="{{DB_PASSWORD}}"                   # 例: root
OUTPUT_DIR="docs"

# ダンプ実行
docker exec "$MYSQL_CONTAINER" mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
  --single-transaction --routines --triggers 2>/dev/null \
  > "$OUTPUT_DIR/dump-$(date +%Y%m%d_%H%M%S).sql"
```

実行後、ファイルサイズを確認して報告する：

```bash
ls -lh docs/dump-*.sql
```

## Guidelines

- **出力先**: `docs/dump-YYYYMMDD_HHMMSS.sql`
- **git除外推奨**: `.gitignore` に `docs/dump-*.sql` を追加すること
- **mysqldumpオプション**:
  - `--single-transaction`: InnoDB テーブルの一貫性のあるダンプ
  - `--routines`: ストアドプロシージャ・ファンクションを含む
  - `--triggers`: トリガーを含む
- **Warning は無視してOK**: `World-writable config file` や `password on the command line` の警告は正常動作
