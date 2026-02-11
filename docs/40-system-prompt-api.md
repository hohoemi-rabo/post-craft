# チケット #40: システムプロンプト生成API + 設定API

> Phase 3 Revised | 優先度: 高 | 依存: #38

## 概要

`POST /api/generate/system-prompt` エンドポイント（メモ書きからシステムプロンプトをAI生成）と、`GET/PUT /api/settings/system-prompt` エンドポイント（システムプロンプトの取得・保存）を新規実装する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/api/generate/system-prompt/route.ts` | 新規作成 |
| `src/app/api/settings/system-prompt/route.ts` | 新規作成 |

## エンドポイント仕様

### POST /api/generate/system-prompt

メモ書きからシステムプロンプトをAI生成する。

**Request:**
```typescript
{ memo: string }
```

**Response:**
```typescript
{ systemPrompt: string }
```

**AIプロンプト** (SPEC-PHASE3-REVISED.md セクション6.1):
```
あなたはSNS投稿生成AIの設定アシスタントです。

ユーザーが入力したメモ書きから、Instagram投稿を生成するAIへのシステムプロンプトを作成してください。

【ユーザーのメモ書き】
{userMemo}

【生成するシステムプロンプトの要件】
- 投稿者の立場・キャラクターを明確に
- 文章のトーン・スタイルを指定
- ターゲット読者への配慮事項
- 全体的な投稿のルール

【出力形式】
システムプロンプトのテキストのみを出力してください。
```

**使用モデル**: `geminiFlash`（`src/lib/gemini.ts` の `generateWithRetry` を使用）

### GET /api/settings/system-prompt

**Response:**
```typescript
{
  systemPromptMemo: string | null
  systemPrompt: string | null
}
```

- 未登録時は `user_settings` レコードを UPSERT し、現在のハードコード `SYSTEM_PROMPT`（`caption/route.ts` L42-54）を初期値として設定

### PUT /api/settings/system-prompt

**Request:**
```typescript
{
  systemPromptMemo?: string
  systemPrompt?: string
}
```

**Response:** 同上（更新後の値）

## 実装パターン

既存の `/api/settings/hashtags/route.ts` と同じパターンで実装:
- 認証チェック: `requireAuth()`
- UPSERT: `supabase.from('user_settings').upsert(...)`
- エラーハンドリング: 標準パターン

## 受入条件

- メモ書きからシステムプロンプトが生成される
- GET で現在の設定が取得できる（初回はデフォルト SYSTEM_PROMPT を返す）
- PUT で手動編集したプロンプトが保存できる
- 認証なしで 401 が返る
- メモ書きが空の場合に 400 が返る
- `npm run build` が成功する

## TODO

- [x] `src/app/api/generate/system-prompt/route.ts` を作成
  - [x] 認証チェック（`requireAuth`）
  - [x] メモ書きバリデーション（空文字チェック）
  - [x] Gemini Flash でシステムプロンプト生成（`generateWithRetry`）
  - [x] レスポンス返却
- [x] `src/app/api/settings/system-prompt/route.ts` を作成
  - [x] GET: `user_settings` から `system_prompt_memo`, `system_prompt` を取得
  - [x] GET: 未登録時は UPSERT + デフォルト SYSTEM_PROMPT 設定
  - [x] PUT: `system_prompt_memo` と `system_prompt` を UPSERT
  - [x] バリデーション
- [x] 動作確認
- [x] `npm run build` 成功を確認
