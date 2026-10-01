---
name: codex-review
description: Codex CLI にコードレビューを依頼する。Claudeとのダブルレビューも可能。
---

# Codex コードレビュースキル

Codex CLI にコードレビューを依頼するスキル。Claude の code-reviewer と異なる視点でレビューを行う。

## 使い方

### 重要: CLI仕様の制約

- **モデル指定**: `-c model=<model>` を使う
- **プロンプト**: `--base`/`--uncommitted`/`--commit` と `[PROMPT]`（位置引数）は併用不可。プロンプトは `-c review.prompt="..."` で渡す

### パターン A: 未コミットの変更をレビュー

```bash
codex review --uncommitted -c model=<model> -c 'review.prompt="セキュリティ、パフォーマンス、コード品質の観点で問題点を指摘してください。"'
```

### パターン B: ブランチの差分をレビュー

```bash
codex review --base main -c model=<model> -c 'review.prompt="セキュリティ、パフォーマンス、コード品質の観点で問題点を指摘してください。"'
```

### パターン C: 特定コミットをレビュー

```bash
codex review --commit <SHA> -c model=<model> -c 'review.prompt="このコミットの変更をレビューしてください。"'
```

## ダブルレビュー体制

以下の2段階レビューを並行で実行する：

1. **codex review**（OpenAI視点）→ Bash tool で Codex CLI を実行
2. **code-reviewer agent**（Claude視点）→ Agent tool で code-reviewer を起動

両方の結果をまとめて、ユーザーに報告する。
