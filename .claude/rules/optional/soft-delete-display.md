# 削除済みレコードの表示ルール

ソフトデリート（論理削除）されたレコードを参照する明細行での表示ルール。バックエンドとフロントエンドの両方で対応が必要。

---

## バックエンド

ソフトデリート（`SoftDeletes`）されたレコードを参照する明細行では、`withTrashed()` で削除済みレコードも含めて取得し、`is_deleted` フラグをフロントに渡す。

```php
// リレーションの読み込み（withTrashed）
$relations['details.sku'] = fn ($q) => $q->withTrashed();
$relations['details.sku.product'] = fn ($q) => $q->withTrashed();

// 明細データの整形
$base['is_deleted'] = $sku?->deleted_at !== null || ($product && $product->deleted_at !== null);
```

---

## フロントエンド

`is_deleted` が `true` の場合、リンクを消して「（削除済）」ラベルを表示する。

```vue
<Link
  v-if="detail.product_id && !detail.is_deleted"
  :href="`/product/detail/${detail.product_id}`"
  class="text-teal-600 dark:text-teal-400 hover:underline"
>
  {{ detail.product_name }}
</Link>
<span v-else :class="{ 'text-muted-foreground': detail.is_deleted }">
  {{ detail.product_name || '-' }}
  <span v-if="detail.is_deleted" class="text-xs">(削除済)</span>
</span>
```
