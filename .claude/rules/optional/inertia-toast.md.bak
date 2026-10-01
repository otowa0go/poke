# Inertia.js トースト通知ルール

## 原則

Inertia リクエストではバックエンドからのフラッシュメッセージが自動的にトーストとして表示されるため、フロントエンドでの `onSuccess` コールバックでのトースト表示は不要。

## バックエンド側

コントローラーでフラッシュメッセージを返す：

```php
// 成功時
return back()->with('success', '処理が完了しました');
return redirect()->route('item.show', $item->id)->with('success', '作成しました');

// エラー時
return back()->with('error', '処理に失敗しました');
```

## フロントエンド側

Inertia のフラッシュメッセージを監視し、自動的にトーストを表示する仕組みを用意する。個別のフォーム送信で `onSuccess` コールバックからトーストを呼ぶ必要はない。
