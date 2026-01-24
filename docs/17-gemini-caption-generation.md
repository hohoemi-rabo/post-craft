# チケット #17: Gemini 文章生成

> Phase 2 AI 文章生成
> 優先度: 高
> 参照: SPEC-PHASE2.md セクション 4.1, 8.2

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
- [ ] `@google/generative-ai` パッケージインストール
- [ ] 環境変数設定
  ```
  GOOGLE_AI_API_KEY=
  ```
- [ ] Gemini クライアント作成 (`lib/gemini.ts`)
  ```typescript
  import { GoogleGenerativeAI } from '@google/generative-ai';

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

  export const geminiFlash = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-preview-05-20',
  });
  ```

### 2. 文章生成プロンプト設計
- [ ] システムプロンプト作成
  ```typescript
  const SYSTEM_PROMPT = `あなたはInstagram投稿文のライターです。
  パソコン教室「ほほ笑みラボ」の投稿を作成します。

  ルール：
  - 指定されたテンプレート構造に従う
  - 親しみやすく、分かりやすい文章
  - 絵文字は適度に使用（多用しない）
  - ハッシュタグは日本語中心
  `;
  ```

- [ ] タイプ別プロンプト作成
  ```typescript
  const TYPE_PROMPTS: Record<PostType, string> = {
    solution: `シニアからの質問と解決方法を紹介する投稿です。
    簡潔で分かりやすい手順を心がけてください。`,
    promotion: `AI実務サポートサービスの宣伝投稿です。
    ターゲットは業務効率化に興味があるビジネスパーソンです。`,
    tips: `AIの便利な使い方を紹介する投稿です。
    具体的な例を交えて説明してください。`,
    showcase: `制作実績や成功事例を紹介する投稿です。
    Before/Afterや具体的な成果を強調してください。`,
  };
  ```

### 3. 文章生成 API 実装
- [ ] `/api/generate/caption/route.ts` 作成（既存を改修）
- [ ] リクエスト形式
  ```typescript
  interface GenerateCaptionRequest {
    postType: PostType;
    inputText: string;
    sourceUrl?: string;
  }
  ```
- [ ] レスポンス形式
  ```typescript
  interface GenerateCaptionResponse {
    caption: string;
    hashtags: string[];
    templateData: Record<string, string>;
  }
  ```

### 4. テンプレート変数抽出
- [ ] AI に各テンプレート変数を生成させる
  ```typescript
  const extractPrompt = `
  以下のメモから、テンプレート変数を抽出してください。

  投稿タイプ: ${postType}
  必要な変数: ${requiredFields.join(', ')}
  任意の変数: ${optionalFields.join(', ')}

  メモ:
  ${inputText}

  JSON形式で出力してください。
  `;
  ```

### 5. ハッシュタグ生成
- [ ] タイプ別推奨タグ + AI 生成タグの組み合わせ
  ```typescript
  const hashtagPrompt = `
  以下の投稿に適したハッシュタグを10個生成してください。

  投稿タイプ: ${postType}
  推奨タグ: ${hashtagTrend.join(', ')}
  投稿内容: ${caption}

  ルール：
  - 推奨タグから3-4個選択
  - 残りは内容に基づいて生成
  - 日本語ハッシュタグを優先
  - #は含めずに出力
  `;
  ```

### 6. エラーハンドリング
- [ ] API エラーハンドリング
- [ ] レート制限対応
- [ ] リトライロジック（指数バックオフ）
- [ ] タイムアウト設定（30秒）

### 7. 既存 OpenAI コードの整理
- [ ] Phase 1 の OpenAI コードを残すか削除するか決定
- [ ] 移行期間中の互換性維持（必要に応じて）

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
  "hashtags": ["パソコン教室", "シニア", "LINE", "通知設定", "スマホ教室", "飯田市", "スマホ初心者", "シニア向けサポート", "デジタル活用", "暮らしに役立つ"],
  "templateData": {
    "question": "LINEの通知が来ない",
    "step1": "設定アプリを開く",
    "step2": "通知を選択",
    "step3": "LINEの通知をONにする",
    "tip": "通知がオフになっていると大切なメッセージを見逃すことも..."
  }
}
```

---

## 完了条件

- [ ] Gemini API への接続が動作する
- [ ] 4種類の投稿タイプで文章生成ができる
- [ ] テンプレート構造に沿った出力が得られる
- [ ] ハッシュタグが適切に生成される
- [ ] エラーハンドリングが動作する
- [ ] 生成時間が5秒以内

---

## 技術メモ

### Gemini 2.5 Flash
- 高速・低コスト
- JSON モード対応
- マルチモーダル対応（画像分析にも使用可能）

### プロンプトエンジニアリング
- Few-shot learning で品質向上
- 各タイプの良い例を用意

---

## 依存関係

- #16 投稿タイプ・テンプレート

## 後続タスク

- #21 投稿作成フロー
- #19 Gemini 画像生成（同じ API キー使用）
