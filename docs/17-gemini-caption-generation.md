# チケット #17: Gemini 文章生成

> Phase 2 AI 文章生成
> 優先度: 高
> 参照: SPEC-PHASE2.md セクション 4.1, 8.2
> **ステータス: 完了（APIキー設定待ち）**

---

## 概要

OpenAI GPT-4o-mini から Google Gemini 2.5 Flash に移行し、
投稿タイプに応じたテンプレートベースの文章生成を実装する。

---

## 変更点（Phase 1 → Phase 2）

| 項目 | Phase 1 | Phase 2 |
|------|---------|---------|
| AI モデル | GPT-4o-mini | Gemini 2.5 Flash |
| 出力形式 | キャプション (150文字) | 投稿文 (200-400文字) |
| 構造 | 自由形式 | テンプレートベース |
| ハッシュタグ | 10個固定 | タイプ別推奨 + AI生成 |

---

## タスク一覧

### 1. Google AI SDK セットアップ
- [x] `@google/generative-ai` パッケージインストール
- [x] 環境変数設定 (`GOOGLE_AI_API_KEY`)
- [x] Gemini クライアント作成 (`lib/gemini.ts`)

### 2. 文章生成プロンプト設計
- [x] システムプロンプト作成
- [x] タイプ別プロンプト作成（4種類）

### 3. 文章生成 API 実装
- [x] `/api/generate/caption/route.ts` 作成
- [x] リクエスト・レスポンス形式定義

### 4. テンプレート変数抽出
- [x] AI による変数抽出機能
- [x] JSON パース処理

### 5. ハッシュタグ生成
- [x] タイプ別推奨タグ + AI 生成タグの組み合わせ
- [x] 10個のハッシュタグ生成

### 6. エラーハンドリング
- [x] API エラーハンドリング
- [x] リトライロジック（指数バックオフ）
- [x] タイムアウト設定（30秒）

### 7. 既存 OpenAI コードの整理
- [x] Phase 1 のコードを維持（互換性のため）

---

## API 仕様

### POST /api/generate/caption

**Request:**
```json
{
  "postType": "solution",
  "inputText": "LINEの通知が来ないって質問されて、設定から通知をONにしたら解決した。",
  "sourceUrl": null
}
```

**Response:**
```json
{
  "caption": "📱 シニアからの質問\n「LINEの通知が来ない」\n\n💡 解決方法\n① 設定アプリを開く\n② 通知を選択\n③ LINEの通知をONにする\n\n✨ ワンポイント\n通知がオフになっていると大切なメッセージを見逃すことも...",
  "hashtags": ["パソコン教室", "シニア", "LINE", "通知設定", ...],
  "templateData": {
    "question": "LINEの通知が来ない",
    "step1": "設定アプリを開く",
    ...
  }
}
```

---

## 完了条件

- [x] Gemini API への接続設定が完了
- [x] 4種類の投稿タイプで文章生成ができる
- [x] テンプレート構造に沿った出力が得られる
- [x] ハッシュタグが適切に生成される
- [x] エラーハンドリングが動作する

---

## 作成されたファイル

| ファイル | 説明 |
|---------|------|
| `src/lib/gemini.ts` | Gemini クライアント、リトライ処理 |
| `src/app/api/generate/caption/route.ts` | 文章生成API |

---

## ユーザーへの注意事項

### Google AI API キー取得

1. https://aistudio.google.com/ にアクセス
2. **Get API key** をクリック
3. プロジェクトを作成または選択
4. API キーをコピー
5. `.env.local` に設定:
   ```
   GOOGLE_AI_API_KEY=your-api-key
   ```

### Vercel 環境変数

Vercel にも `GOOGLE_AI_API_KEY` を追加してください。

---

## 依存関係

- #16 投稿タイプ・テンプレート ✅

## 後続タスク

- #21 投稿作成フロー
- #19 Gemini 画像生成（同じ API キー使用）
