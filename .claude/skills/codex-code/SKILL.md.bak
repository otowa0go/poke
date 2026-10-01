---
name: codex-code
description: Codex CLI にコーディング作業を委譲する
---

# Codex コーディング実行スキル

Codex CLI に実装作業を委譲するスキル。

## 使い方

ユーザーから実装指示を受けたら、以下の手順で Codex を実行する：

### Step 1: プロンプトを組み立てる

ユーザーの要望を、Codex が理解しやすい明確な実装指示に変換する。

### Step 2: Codex exec を実行

```bash
codex exec --full-auto -m <model> -C <working-directory> "$(cat <<'PROMPT'
【実装指示】
ここに具体的な実装指示を書く
PROMPT
)"
```

**オプション説明:**
- `--full-auto`: サンドボックス内で自動実行（workspace-write権限）
- `-m <model>`: 使用モデル
- `-C`: 作業ディレクトリ指定

### Step 3: 結果を確認

Codex の出力を確認し、必要に応じて `git diff` で変更内容をチェックする。

### Step 4: コードフォーマット

プロジェクトのフォーマッタを実行する。

## 注意事項

- Codex はサンドボックス内で動作するため、Docker コマンドは実行できない場合がある
- テスト実行は別途 Claude 側で行う
- Codex の出力が不十分な場合、追加指示で再実行する
