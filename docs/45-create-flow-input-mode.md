# チケット #45: 投稿作成画面の input_mode 対応

> Phase 3 Revised | 優先度: 中 | 依存: #38, #44

## 概要

`src/components/create/step-content-input.tsx` を更新し、投稿タイプの `input_mode` に応じて異なる入力フォームを表示する。`fields` モードではDBのプレースホルダー変数に基づくフォームフィールド、`memo` モードでは単一のテキストエリアを表示する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/create/step-content-input.tsx` | 更新（主要変更） |
| `src/types/create-flow.ts` | 更新（`inputMode` 追加） |
| `src/app/(dashboard)/create/page.tsx` | 更新（inputMode, placeholders の受け渡し） |

## 変更内容

### 1. StepContentInput の Props 拡張

```typescript
interface StepContentInputProps {
  // 既存 Props
  postType: PostType | null
  postTypeName?: string | null
  initialText: string
  initialUrl: string
  initialRelatedPostId?: string | null
  onSubmit: (text: string, url: string, relatedPost?: RelatedPostData | null) => void
  onBack: () => void

  // 新規追加
  postTypeId?: string | null
  inputMode?: 'fields' | 'memo'
  placeholders?: Placeholder[]
}
```

### 2. 入力フォームの分岐

**`memo` モード（デフォルト、既存動作に近い）:**
- 現在と同じ単一のテキストエリア
- プレースホルダーヒント: ビルトインは `PLACEHOLDERS[postType]`、カスタムはタイプの説明文

**`fields` モード + `placeholders` あり:**
- DB の `placeholders` 配列に基づいてフォームフィールドを動的生成
- `inputType='text'` → `<input>`、`inputType='textarea'` → `<textarea>`
- ラベル: `placeholder.label`、ヒント: `placeholder.description`
- 必須マーク: `placeholder.required` が true の場合 `*`
- 必須フィールド未入力時は「次へ」ボタン無効

### 3. inputText への変換

`fields` モードの場合、各フィールドの値を `inputText` にまとめる:

```typescript
const inputText = placeholders
  .map(p => `${p.label}: ${fieldValues[p.name] || ''}`)
  .filter(line => !line.endsWith(': '))
  .join('\n')
```

### 4. 呼び出し元の更新

`src/app/(dashboard)/create/page.tsx` でタイプ選択時に `inputMode` と `placeholders` を取得し、`StepContentInput` に渡す。

### 5. CreateFormState の拡張

```typescript
// src/types/create-flow.ts に追加
export interface CreateFormState {
  // ... 既存フィールド
  inputMode?: 'fields' | 'memo'
}
```

## 受入条件

- ビルトインタイプで既存動作が維持される
- カスタムタイプ（`input_mode='memo'`）で単一テキストエリアが表示される
- カスタムタイプ（`input_mode='fields'`）でプレースホルダーに基づくフォームフィールドが表示される
- `fields` モードで必須フィールド未入力時に「次へ」ボタンが無効
- 入力データが正しく `inputText` に変換される
- モバイル表示が正常

## TODO

- [x] `StepContentInputProps` に `inputMode`, `placeholders`, `postTypeId` を追加
- [x] `input_mode='fields'` のフォームフィールド動的生成を実装
  - [x] `<input>` / `<textarea>` の出し分け
  - [x] ラベル、ヒント、必須マーク表示
  - [x] フィールド値の状態管理
  - [x] 必須フィールドバリデーション
- [x] `input_mode='memo'` の既存テキストエリア表示を維持
- [x] `fields` モードの入力値を `inputText` テキストに変換
- [x] `src/types/create-flow.ts` に `inputMode` を追加
- [x] `src/app/(dashboard)/create/page.tsx` で `inputMode` と `placeholders` を渡す
- [x] ビルトインタイプの動作確認
- [x] カスタムタイプ（fields / memo）の動作確認
- [x] モバイル対応確認
- [x] `npm run build` 成功を確認
