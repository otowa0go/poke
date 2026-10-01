---
paths:
  - "app/Http/Controllers/**/*.php"
  - "app/Services/**/*.php"
  - "app/Http/Requests/**/*.php"
---

# バックエンド コントローラー / サービス ルール

## トースト通知ルール（必須）

以下の操作が成功した場合、必ずトースト通知を表示すること：
- 新規作成
- 更新（調整入力、フラグ切替等）
- 削除
- 一括操作

**実装方法**: バックエンドのコントローラーでフラッシュメッセージを返す。

```php
// 成功時
return back()->with('success', '処理が完了しました');
return redirect()->route('item.show', $item->id)->with('success', '作成しました');

// エラー時
return back()->with('error', '処理に失敗しました');
```

## 楽観的ロック（重要）

複数ユーザーが同時に同じレコードを更新する可能性がある操作では、楽観的ロックを実装すること。

**実装方法**: フロントエンドから `updated_at` をサーバーに送り、更新時に一致しているか確認する。

```php
$model = Model::findOrFail($id);

// 楽観的ロックチェック
if ($model->updated_at->toISOString() !== $request->updated_at) {
    return back()->with('error', '他のユーザーが更新しました。ページを更新して再度お試しください。');
}

$model->update($validated);
```

## N+1問題の防止（重要）

データベースクエリでN+1問題を発生させないこと。

- **Eloquentリレーション取得時**: `with()` や `load()` でEager Loadingを使用すること
- **ループ内での個別クエリ禁止**: `foreach` ループ内で `->delete()` や `->save()` を個別に呼ばない
- **一括削除**: クエリビルダで一括削除する
- **一括更新**: `upsert` や `whereNotIn` + `delete` を検討

```php
// N+1パターン（NG）
$about->details()->get()
    ->filter(fn ($d) => !in_array($d->sku_id, $keepIds))
    ->each(fn ($d) => $d->delete());

// 一括削除パターン（OK）
$about->details()
    ->whereNotIn('sku_id', $keepIds)
    ->delete();
```
