---
name: test-spec-generator
description: テスト項目書（xlsx シート）を生成・更新する汎用スキル。結果サマリ自動集計付き。任意のプロジェクトで使用可能。
---

# Test Spec Generator

## Overview

プロジェクト共通のテスト項目書（xlsx）生成・更新スキル。
定型フォーマットで xlsx シートにテスト項目を展開し、結果サマリを自動集計する。

## When to Use

- 新しい機能/画面のテスト項目書を初めて作る（新シート追加）
- 既存シートの特定行だけピンポイント修正したい
- セクションを追加 / 削除したい
- 「結果サマリが自動集計される xlsx を作って」と依頼された時

## Core Functions

`scripts/helpers.py` に以下の関数を実装済み。Claude は Python ヒアドキュメントから呼び出す。

| 関数 | 用途 |
|------|------|
| `create_or_replace_sheet()` | 新シート作成 or 全体再生成（既存F/H列値を保持可） |
| `update_row()` | 特定項目の行をピンポイント書き換え |
| `verify_sheet_integrity()` | データ消失検出（B列が None の行を検出） |
| `safe_unmerge()` | マージ解除時のデータ消失防止 |

## Usage Pattern

### Pattern A: 新シート追加

```python
import sys
sys.path.insert(0, '<PROJECT_ROOT>/.claude/skills/test-spec-generator/scripts')
from helpers import create_or_replace_sheet

create_or_replace_sheet(
    xlsx_path='/path/to/テスト項目書.xlsx',
    sheet_name='値引きロジック',
    title='Beauty EC テスト項目書',
    scope='対象機能: 値引きロジック（カート・注文確認画面）',
    preconditions='前提: ダミーデータで動作（基幹API未接続）',
    sections=[
        {
            'title': '【セクション1】カート画面: 値引き表示',
            'prep': '事前準備: ログイン後、カートに商品を追加した状態で実施',
            'items': [
                # (cat, feat, op, expected, env, remark)
                ('カート', '値引き表示', '商品をカートに追加し区分を設定', '値引き後単価が表示される', '開発', None),
            ],
        },
    ],
    preserve_user_input=True,
)
```

### Pattern B: 1行ピンポイント修正

```python
from helpers import update_row

update_row(
    xlsx_path='/path/to/テスト項目書.xlsx',
    sheet_name='値引きロジック',
    item_no=3,
    updates={
        'expected': '修正後の期待結果',
        'remark': '仕様変更により修正',
    },
)
```

### Pattern C: データ整合性チェック

```python
from helpers import verify_sheet_integrity

issues = verify_sheet_integrity(xlsx_path='...', sheet_name='...')
if issues:
    print('データ消失検出:', issues)
```

## Sheet Layout (Reference)

```
r1: タイトル (A:H merge, bold 14pt)
r2: 対象機能 (A:H merge)
r3: 前提条件 (A:H merge, italic 灰色)
r4: 必要環境凡例 (A:H merge, italic 灰色)
r5: (空行)
r6: B6:C6 merge「結果サマリ」(青背景 4472C4・白文字)
r7: B='全項目数', C='=COUNT($A$15:$A$200)'
r8: B='合格', C='=COUNTIF($F$15:$F$200,"o")'
r9: B='不合格', C='=COUNTIF($F$15:$F$200,"x")+COUNTIF($F$15:$F$200,"×")'
r10: B='未実施', C='=C7-C8-C9'
r11: (空行、小)
r12: 列ヘッダ (D9E1F2 背景、太字)
     # / カテゴリ / 機能・項目 / 操作手順 / 期待結果 / 結果 / 必要環境 / 備考
r13〜: セクション + 事前準備 + データ行
```

## 列幅・スタイル

| 列 | 幅 | 内容 | スタイル |
|----|-----|------|---------|
| A | 5 | # | 中央寄せ |
| B | 12 | カテゴリ | 折返し |
| C | 26 | 機能・項目 | 折返し |
| D | 50 | 操作手順 | 折返し |
| E | 50 | 期待結果 | 折返し |
| F | 8 | 結果 | 中央寄せ |
| G | 10 | 必要環境 | 中央寄せ |
| H | 24 | 備考 | 折返し |

## 必要環境の値（凡例）

- `開発`: 開発環境で実施可能
- `データ要`: テストデータ準備が必要
- `本番`: 本番環境でしか実施不可

## 結果記号

- `o`: 合格（COUNTIF で集計）
- `x` or `×`: 不合格
- `-`: テスト不可（未実施扱い）
- 空: 未実施

## CRITICAL: 絶対に守るべき罠回避

1. **unmerge_cells() の前に必ずスナップショット取得**
   - `helpers.safe_unmerge()` を使うこと

2. **insert_rows() / delete_rows() の直後に整合性検証**
   - `helpers.verify_sheet_integrity()` を呼ぶ

3. **データ消失検出時は即報告**
   - 勝手に推測復元せず、ユーザーに報告して指示を仰ぐ

4. **既存シート再生成時の F・H 列保持**
   - `create_or_replace_sheet(preserve_user_input=True)` で保持

5. **insert_rows 後の merge 再設定**
   - openpyxl の insert_rows は merge を完全 shift しないバグあり

6. **行高設定漏れ注意**
   - ループ完了後に「全データ行が高さ60、全セクションが22、全事前準備が22or38」を検証

## Workflow

新シート追加時の標準フロー：

1. **対象機能の仕様調査**（必要に応じて API 仕様書・画面仕様書を確認）
2. **テスト項目を sections 構造で組み立て**
3. **`create_or_replace_sheet()` を呼ぶ**
4. **生成後 `verify_sheet_integrity()` で検証**
5. **生成結果をユーザーに報告**
