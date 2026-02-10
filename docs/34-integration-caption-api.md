# チケット #34: 統合 - キャプション生成 API 更新

> Phase 3 | 優先度: 高 | 依存: #25, #26, #27

## 概要

`/api/generate/caption/route.ts` を更新し、DB管理の投稿タイプテンプレートと必須ハッシュタグ設定を使用するようにする。後方互換性を維持しつつ `postTypeId` での新方式にも対応する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/generate/caption/route.ts` | 更新（主要変更） |
| `src/app/api/generate/scene/route.ts` | 更新（postType参照） |

## 変更内容

### 1. リクエストに `postTypeId` を追加

```typescript
// 新方式（優先）
postTypeId?: string  // UUID → DB からテンプレート取得

// 後方互換性
postType?: string    // slug → 従来のハードコード定数を使用
```

### 2. テンプレート取得ロジック

```typescript
// postTypeId がある場合 → DB から取得
if (postTypeId) {
  const { data: postTypeData } = await supabaseAdmin
    .from('post_types')
    .select('*')
    .eq('id', postTypeId)
    .single()
  // postTypeData.template_structure, postTypeData.placeholders を使用
}
// フォールバック: postType (slug) → 従来の POST_TYPES/TEMPLATES 定数
```

### 3. 必須ハッシュタグをDBから取得

現在（L225 ハードコード）:
```typescript
const mandatoryHashtags = ['ほほ笑みラボ', '飯田市', 'パソコン教室', 'スマホ']
```

変更後:
```typescript
// user_settings から取得
const { data: settings } = await supabaseAdmin
  .from('user_settings')
  .select('required_hashtags')
  .eq('user_id', userId)
  .single()

const mandatoryHashtags = settings?.required_hashtags || []
const generatedCount = 10 - mandatoryHashtags.length
```

### 4. ハッシュタグ生成数の動的計算

ハッシュタグ生成プロンプト内の「6個」を `generatedCount` で動的に:
```
ハッシュタグを${generatedCount}個生成してください。
```

### 5. テンプレートベースの生成

DB から取得した `template_structure` と `placeholders` を使って:
- テンプレートデータ生成プロンプトにプレースホルダー情報を含める
- 文字数目安に `min_length`〜`max_length` を使用

## 受入条件

- `postTypeId`（UUID）でのキャプション生成が正常に動作する
- 従来の `postType`（slug）での生成も引き続き動作する（後方互換性）
- 必須ハッシュタグがDB設定を反映する
- ハッシュタグ生成数が `10 - 必須数` で正しく動的計算される
- DB にタイプが見つからない場合のエラーハンドリング

## TODO

- [x] リクエストに `postTypeId` パラメータを追加
- [x] `postTypeId` → DB からテンプレート取得ロジックを実装
- [x] `postType`（slug）のフォールバックを維持
- [x] 必須ハッシュタグを `user_settings` テーブルから取得に変更
- [x] ハッシュタグ生成数を動的に計算（10 - 必須数）
- [x] テンプレート構造をDB値で動的に生成
- [x] 文字数目安をDB値（min_length, max_length）で動的に設定
- [x] ハッシュタグプロンプトの「除外するタグ」をDB値に変更
- [x] `scene/route.ts` の postType 参照も必要に応じて更新
- [x] 後方互換性テスト（slug での生成が動作すること）
- [x] 新方式テスト（postTypeId での生成が動作すること）
