---
paths:
  - "resources/js/**/*.vue"
  - "resources/js/**/*.ts"
  - "resources/js/**/*.tsx"
---

# フロントエンド UI ルール

## UI文言ルール

### 新規作成ボタン

- **ボタンテキスト**: 「+ 新規作成」（プラスアイコン + 新規作成）
- **「新規追加」は使用しない**（「新規作成」に統一）

```vue
<Button @click="openForm">
  <Plus class="w-4 h-4 mr-1" />新規作成
</Button>
```

### モーダルタイトル

- 新規作成時: `〇〇 新規作成`
- 編集時: `〇〇 編集`

### 行を追加ボタン

テーブルに行を追加する「行を追加」ボタンは、必ずセカンダリーボタン（`variant="secondary"`）を使用すること。

## バリデーションエラーの表示ルール

フォーム入力欄のバリデーションエラーは以下の2点で統一すること：

1. **入力欄の枠を赤くする**
2. **入力欄の下にエラーメッセージを小さく表示する**

Tailwind CSS + shadcn-vue を使用する場合の例:

```vue
<div class="space-y-1">
  <Input
    v-model="form.name"
    :class="{ 'border-red-500': form.errors.name }"
  />
  <p v-if="form.errors.name" class="text-xs text-destructive">
    {{ form.errors.name }}
  </p>
</div>
```

- `aria-invalid` は使用しない（ブラウザ依存で見た目が安定しない）
- エラーメッセージの色は `text-destructive`（テーマカラー）を使用

## プルダウン（Select / Combobox）のplaceholderルール

| 用途 | placeholder |
|------|------------|
| フォーム入力（非検索） | `選択してください` |
| テーブル・フィルター（検索/絞り込み） | `すべて` |
| 検索付きCombobox | `〇〇を検索...` |
| DatePicker | `日付を選択` |

## リンクとクリック領域のルール

**テーブル行全体をリンク（ページ遷移）にしてはいけない。**

- リンクは「リンクに見える箇所」のみに設置する
- テーブル内では特定のセル（伝票番号、品番など）にのみ `<Link>` を配置する
- **行全体の `@click` でページ遷移は禁止**

**例外: アコーディオン（展開/折りたたみ）は行全体クリックOK**

