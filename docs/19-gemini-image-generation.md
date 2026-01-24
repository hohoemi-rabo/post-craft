# チケット #19: Gemini 画像生成

> Phase 2 AI 画像生成
> 優先度: 高
> 参照: SPEC-PHASE2.md セクション 4

---

## 概要

Phase 1 の @vercel/og（テキスト画像）から、
Google Gemini 3 Pro による AI 画像生成に移行する。
4種類の画像スタイルと2種類のアスペクト比に対応する。

---

## 変更点（Phase 1 → Phase 2）

| 項目 | Phase 1 | Phase 2 |
|------|---------|---------|
| 技術 | @vercel/og (Satori) | Gemini 3 Pro |
| スタイル | 背景色12色 | 4スタイル（マンガ風等） |
| サイズ | 1080×1080 固定 | 1:1 or 9:16 選択 |
| 内容 | テキスト表示 | AI 生成イラスト |
| キャラクター | なし | カスタムキャラクター対応 |

---

## 画像スタイル一覧

| ID | スタイル名 | 説明 |
|----|-----------|------|
| `manga_male` | マンガ風（男性キャラ） | テック・ビジネス系、鮮やかな配色 |
| `manga_female` | マンガ風（女性キャラ） | クリエイティブ系、パステル調 |
| `pixel_art` | ピクセルアート風 | レトロゲーム風、サイバー背景 |
| `illustration` | イラスト風（人物なし） | フラットデザイン、アイコンのみ |

---

## タスク一覧

### 1. Gemini 画像生成モデルセットアップ
- [ ] `lib/gemini.ts` に画像生成モデル追加
  ```typescript
  export const geminiImageGen = genAI.getGenerativeModel({
    model: 'gemini-3-pro-image-preview',
  });
  ```
- [ ] 画像生成用の設定確認

### 2. スタイル別プロンプト定義
- [ ] `lib/image-styles.ts` 作成
- [ ] 各スタイルのベースプロンプト定義
  ```typescript
  export const IMAGE_STYLES: Record<ImageStyle, StyleConfig> = {
    manga_male: {
      id: 'manga_male',
      name: 'マンガ風（男性キャラ）',
      basePrompt: `縦長のショート動画用画像。
日本のマンガ・アニメ調のイラストスタイル。
テック系・ビジネス系のサムネイル画像。
鮮やかでカラフルな配色、グラデーション背景。
プロフェッショナルだけど親しみやすい雰囲気。
テキストや文字は含めない、ビジュアルのみ。`,
      supportsCharacter: true,
    },
    // ... 他のスタイル
  };
  ```

### 3. プロンプト生成関数
- [ ] `lib/image-prompt.ts` 作成
- [ ] キャラクター特徴の埋め込み
  ```typescript
  export function buildImagePrompt(options: {
    style: ImageStyle;
    aspectRatio: AspectRatio;
    characterDescription?: string;
    sceneDescription: string;
  }): string {
    const styleConfig = IMAGE_STYLES[options.style];
    let prompt = styleConfig.basePrompt;

    // アスペクト比
    const aspectText = options.aspectRatio === '9:16'
      ? '縦長のショート動画用画像（9:16アスペクト比）'
      : '正方形のフィード投稿用画像（1:1アスペクト比）';
    prompt = prompt.replace(/縦長.*アスペクト比）/, aspectText);

    // キャラクター
    if (options.characterDescription && styleConfig.supportsCharacter) {
      prompt += `\nメインの人物キャラクター（${options.characterDescription}）を中央に配置。`;
    }

    // シーン
    prompt += `\nシーン: ${options.sceneDescription}`;

    return prompt;
  }
  ```

### 4. シーン説明生成
- [ ] 投稿内容からシーン説明を生成
  ```typescript
  export async function generateSceneDescription(
    caption: string,
    postType: PostType
  ): Promise<string> {
    const prompt = `
以下の投稿内容から、画像のシーン説明を生成してください。
30-50文字程度で、具体的なビジュアルをイメージできる説明にしてください。

投稿タイプ: ${postType}
投稿内容:
${caption}

出力例:
- スマートフォンを操作する手と、画面に表示されたLINEアイコン
- ノートPCの前で笑顔で説明するビジネスパーソン
`;
    // Gemini Flash で生成
  }
  ```

### 5. 画像生成 API 実装
- [ ] `/api/generate/image/route.ts` 作成
- [ ] リクエスト形式
  ```typescript
  interface GenerateImageRequest {
    postId?: string;
    style: ImageStyle;
    aspectRatio: AspectRatio;
    characterId?: string;
    sceneDescription: string;
  }
  ```
- [ ] レスポンス形式
  ```typescript
  interface GenerateImageResponse {
    imageUrl: string;
    prompt: string;
  }
  ```

### 6. 画像の Supabase Storage 保存
- [ ] 生成された画像を Storage に保存
- [ ] ファイルパス: `generated-images/{userId}/{postId}/{timestamp}.png`
- [ ] 公開 URL を返却

### 7. 画像スタイル選択 UI
- [ ] `components/create/style-selector.tsx` 作成
- [ ] 4スタイルのプレビュー表示
- [ ] 選択状態のハイライト

### 8. アスペクト比選択 UI
- [ ] `components/create/aspect-ratio-selector.tsx` 作成
- [ ] 1:1 / 9:16 の選択
- [ ] サイズプレビュー表示

### 9. 画像プレビュー・再生成
- [ ] 生成された画像のプレビュー表示
- [ ] 再生成ボタン
- [ ] 別スタイルで再生成

### 10. エラーハンドリング
- [ ] 生成失敗時のリトライ
- [ ] タイムアウト処理（30秒）
- [ ] 不適切なコンテンツのフィルタリング

---

## アスペクト比仕様

| 形式 | アスペクト比 | ピクセルサイズ | 用途 |
|------|------------|--------------|------|
| フィード | 1:1 | 1080×1080 | 通常投稿 |
| リール | 9:16 | 1080×1920 | ショート動画 |

---

## API 仕様

### POST /api/generate/image

**Request:**
```json
{
  "style": "manga_male",
  "aspectRatio": "9:16",
  "characterId": "uuid-xxx",
  "sceneDescription": "スマートフォンを操作しながら笑顔で説明している"
}
```

**Response:**
```json
{
  "imageUrl": "https://xxx.supabase.co/storage/v1/object/public/generated-images/...",
  "prompt": "縦長のショート動画用画像（9:16アスペクト比）..."
}
```

---

## 完了条件

- [ ] 4種類の画像スタイルで生成できる
- [ ] 2種類のアスペクト比で生成できる
- [ ] キャラクター特徴が画像に反映される
- [ ] 生成された画像が Storage に保存される
- [ ] 画像の再生成ができる
- [ ] 生成時間が30秒以内

---

## 技術メモ

### Gemini 3 Pro 画像生成
- モデル: `gemini-3-pro-image-preview`
- 出力形式: Base64 エンコード画像
- 対応サイズ: 指定可能

### 画像生成のコツ
- プロンプトは具体的に
- 「テキストを含めない」は必ず指定
- キャラクターの一貫性は難しいので、特徴を詳細に記述

---

## 依存関係

- #17 Gemini 文章生成（Gemini API 共通）
- #18 キャラクター管理（キャラクター特徴取得）
- #13 Supabase セットアップ（Storage 保存）

## 後続タスク

- #21 投稿作成フロー（画像生成統合）
- #20 投稿履歴管理（画像保存）
