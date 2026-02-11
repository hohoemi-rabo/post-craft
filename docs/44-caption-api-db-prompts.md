# チケット #44: キャプション生成API改修（DBプロンプト使用）

> Phase 3 Revised | 優先度: 高 | 依存: #38, #39

## 概要

`/api/generate/caption/route.ts` を更新し、ハードコードの `SYSTEM_PROMPT` の代わりに `user_settings.system_prompt` を、`TYPE_PROMPTS` の代わりに `post_types.type_prompt` を使用するように変更する。`input_mode` に応じた処理分岐も追加する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/generate/caption/route.ts` | 更新（主要変更） |

## 変更内容

### 1. システムプロンプトの動的取得

現在 L42-L54 にハードコードの `SYSTEM_PROMPT` → DB から動的取得:

```typescript
// user_settings から system_prompt を取得（required_hashtags と同時に）
const { data: settingsData } = await supabase
  .from('user_settings')
  .select('system_prompt, required_hashtags')
  .eq('user_id', userId)
  .single()

const systemPrompt = settingsData?.system_prompt || DEFAULT_SYSTEM_PROMPT
```

- `SYSTEM_PROMPT` を `DEFAULT_SYSTEM_PROMPT` にリネーム（フォールバック用に残す）

### 2. タイプ別プロンプトの DB優先解決

**postTypeId パス（DB取得）:**
```typescript
// 変更前
typePrompt: buildCustomTypePrompt(dbType.name, placeholders, charRange),

// 変更後: DB の type_prompt を優先
typePrompt: dbType.type_prompt || buildCustomTypePrompt(dbType.name, placeholders, charRange),
```

**postType パス（レガシー）:** そのまま維持（`TYPE_PROMPTS[postType]`）

### 3. input_mode 対応

`input_mode='memo'` の場合の処理:

```typescript
if (dbType.input_mode === 'memo') {
  resolved = {
    ...resolved,
    requiredFields: [],
    optionalFields: [],
  }
}
```

テンプレートデータ生成プロンプトで `input_mode` を考慮:
- `fields` モード: 既存ロジック（テンプレート変数をJSON出力）
- `memo` モード: テンプレート構造に沿って直接キャプションを生成

### 4. 定数の扱い

| 定数 | 変更 |
|------|------|
| `SYSTEM_PROMPT` | `DEFAULT_SYSTEM_PROMPT` にリネーム（フォールバック用） |
| `TYPE_PROMPTS` | レガシーパス用に残す |
| `buildCustomTypePrompt()` | フォールバック用に残す |

## 受入条件

- `user_settings.system_prompt` がある場合にそれが使用される
- `user_settings.system_prompt` が NULL の場合にデフォルトが使用される
- `post_types.type_prompt` がある場合にそれが使用される
- `post_types.type_prompt` が NULL の場合に `buildCustomTypePrompt()` にフォールバック
- `input_mode='fields'` の場合にテンプレート変数JSONが生成される
- `input_mode='memo'` の場合に入力テキストから直接キャプションが生成される
- 既存のレガシーパス（slug指定）が引き続き動作する
- ビルトイン7タイプの生成品質が維持される

## TODO

- [x] `SYSTEM_PROMPT` を `DEFAULT_SYSTEM_PROMPT` にリネーム
- [x] `user_settings.system_prompt` の取得処理を追加（`required_hashtags` と同時取得）
- [x] システムプロンプトの動的選択ロジック実装
- [x] `postTypeId` パスの `typePrompt` を DB優先に変更
- [x] `input_mode` に応じた処理分岐を追加
  - [x] `fields` モード: 既存ロジック維持
  - [x] `memo` モード: テンプレート構造 + 入力テキストから直接キャプション生成
- [x] フォールバック動作の確認（NULL値の場合に既存動作維持）
- [x] ビルトイン7タイプでの生成テスト
- [x] カスタムタイプでの生成テスト（fields / memo 両方）
- [x] `npm run build` 成功を確認
