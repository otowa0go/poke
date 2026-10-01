# ワークステーション ポート設定ルール

このワークステーションは **複数ユーザーが同時に使用** する環境のため、Docker 等でポートを公開する際は、他ユーザーとの競合を防ぐ仕組み（`${PORT_BASE}`）を必ず使用する。

---

## 背景

- デフォルトポート（3000, 3306, 8080 等）をそのまま使うと、他ユーザーのコンテナと競合してエラーになる
- ユーザーごとに環境変数 `PORT_BASE` が設定されている
- 全ポート番号の先頭に `${PORT_BASE}` を付けることで、ユーザー間で自動的に分離される

### 確認方法
```bash
echo $PORT_BASE
```

---

## ルール

### docker-compose.yml での書き方

**悪い例（絶対にやらない）:**
```yaml
services:
  app:
    ports:
      - "3000:3000"    # ← 他ユーザーと競合
```

**良い例（必ずこの形式）:**
```yaml
services:
  app:
    ports:
      - "${PORT_BASE}3000:3000"
```

### docker run での書き方

**ポート公開が不要な場合は `-p` オプション自体を省略する:**
```bash
docker run -d --name temp_mysql -e MYSQL_ROOT_PASSWORD=root mariadb:10.5
docker exec temp_mysql mariadb -u root -proot -e "SELECT 1;"
```

**ポート公開が必要な場合は `${PORT_BASE}` を使う:**
```bash
docker run -d --name temp_mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -p ${PORT_BASE}307:3306 \
  mariadb:10.5
```

### 命名ルール（ポート番号の組み立て）

| デフォルトポート | `${PORT_BASE}` 付き表記 |
|----------------|----------------------|
| 80 (HTTP)      | `${PORT_BASE}80`     |
| 3000 (Node)    | `${PORT_BASE}3000`   |
| 3306 (MySQL)   | `${PORT_BASE}306`    |
| 8080 (HTTP alt)| `${PORT_BASE}8080`   |
| 1433 (MSSQL)   | `${PORT_BASE}433`    |

---

## AI アシスタントへの指示

1. **Docker コンテナ起動コマンドを提案する際は、必ずポート公開の要否を検討する**
2. **既存プロジェクトのポートとの衝突を確認する**
3. **docker-compose.yml を新規作成・変更する場合は必ず `${PORT_BASE}` を使う**
4. **一時コンテナは可能な限りポート公開なしで作業する**
