# チケット #41: 投稿タイプ生成API

> Phase 3 Revised | 優先度: 高 | 依存: #38

## 概要

`POST /api/generate/post-type` エンドポイントを新規実装する。ユーザーのメモ書きと基本情報から、タイプ別プロンプト・テンプレート構造・プレースホルダー変数・サンプル投稿を AI（Gemini Flash）で一括生成する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/generate/post-type/route.ts` | 新規作成 |

## エンドポイント仕様

### POST /api/generate/post-type

**Request:**
```typescript
{
  name: string         // タイプ名
  description: string  // 説明文
  minLength: number    // 最小文字数
  maxLength: number    // 最大文字数
  userMemo: string     // ユーザーのメモ書き
  inputMode: 'fields' | 'memo'  // 入力方式
}
```

**Response:**
```typescript
{
  typePrompt: string            // タイプ別プロンプト
  templateStructure: string     // テンプレート構造
  placeholders: Placeholder[]   // プレースホルダー変数（inputMode='fields'のみ）
  samplePost: string            // サンプル投稿
}
```

**AIプロンプト** (SPEC-PHASE3-REVISED.md セクション6.2):
```
あなたはSNS投稿生成AIの設定アシスタントです。

ユーザーが入力した情報から、投稿タイプの設定を生成してください。

【投稿タイプ情報】
- タイプ名: {name}
- 説明: {description}
- 文字数目安: {minLength}〜{maxLength}文字
- 入力方式: {inputMode}

【ユーザーのメモ書き】
{userMemo}

【生成する内容】
1. タイプ別プロンプト（AIへの生成指示）
2. テンプレート構造（出力形式、絵文字・見出し含む）
3. プレースホルダー変数（入力方式が'fields'の場合のみ）
4. サンプル投稿

【出力形式】
以下のJSON形式で出力してください：
{
  "typePrompt": "...",
  "templateStructure": "...",
  "placeholders": [...],
  "samplePost": "..."
}
```

**使用モデル**: `geminiFlash`（`generateWithRetry` + `parseJsonResponse`）

## 実装の注意点

- `inputMode='memo'` の場合、`placeholders` は空配列 `[]` を返す
- `inputMode='fields'` の場合、`placeholders` の各要素は `Placeholder` 型に準拠（name, label, description, required, inputType）
- JSON レスポンスのパースには既存の `parseJsonResponse` ユーティリティを使用
- AI生成のJSONが不正な場合のエラーハンドリングを実装

## 受入条件

- メモ書きからタイプ別プロンプト・テンプレート・プレースホルダー・サンプル投稿が生成される
- `inputMode='fields'` の場合は `placeholders` が返る
- `inputMode='memo'` の場合は `placeholders` が空配列
- サンプル投稿がテンプレート構造に沿った内容である
- 認証なしで 401 が返る
- 必須パラメータ不足で 400 が返る
- `npm run build` が成功する

## TODO

- [x] `src/app/api/generate/post-type/route.ts` を作成
  - [x] 認証チェック（`requireAuth`）
  - [x] リクエストバリデーション（name, description, userMemo, inputMode 必須）
  - [x] Gemini Flash で投稿タイプ設定を生成
  - [x] JSON レスポンスをパース（`parseJsonResponse` 使用）
  - [x] `placeholders` の型整合性を検証
  - [x] `inputMode='memo'` の場合に placeholders を空配列にする
  - [x] エラーハンドリング（AI生成失敗、JSONパース失敗）
- [x] 動作確認
- [x] `npm run build` 成功を確認
