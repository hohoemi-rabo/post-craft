# Post Craft フェーズ2 要件定義書

> 作成日: 2026-01-24
> ステータス: 要件定義完了
> フェーズ: Phase 2（認証・AI画像生成・管理機能）

---

## 1. プロジェクト概要

### 1.1 背景・目的

**Post Craft** は、ブログ記事URLまたはメモ書きからInstagram投稿素材を自動生成するWebサービス。

フェーズ2では、パソコン・スマホ ほほ笑みラボのInstagram運用を効率化し、以下の目標を達成する：

| 目標                     | 詳細                                                        |
| ------------------------ | ----------------------------------------------------------- |
| **シニア層への信頼構築** | 「こんな質問→こう解決」の投稿で専門性をアピール             |
| **新規ターゲット開拓**   | AI実務活用サポートの認知拡大                                |
| **最終ゴール**           | 「役に立つ → 覚えてもらう → 通いたい/相談したい」につなげる |

### 1.2 ターゲットユーザー

| ターゲット             | 投稿内容                                                     |
| ---------------------- | ------------------------------------------------------------ |
| **シニア層（既存）**   | スマホ・PC操作の解決方法、教室の雰囲気                       |
| **ビジネス層（新規）** | AI実務サポートの魅力、AIでできること、AIエージェントのすごさ |

### 1.3 サービスURL

- 本番環境: https://post-craft-rho.vercel.app/
- AI実務サポートページ: https://www.hohoemi-rabo.com/services/ai

---

## 2. フェーズ2 機能要件

### 2.1 機能一覧

| #   | 機能                 | 優先度 | 説明                                      |
| --- | -------------------- | ------ | ----------------------------------------- |
| 1   | Google OAuth認証     | 必須   | ホワイトリスト方式でアクセス制限          |
| 2   | 投稿タイプ選択       | 必須   | 4タイプから選択                           |
| 3   | テンプレート適用     | 必須   | タイプごとの文章構造                      |
| 4   | AI文章生成（Gemini） | 必須   | gemini-2.5-flash による投稿文生成         |
| 5   | AI画像生成（Gemini） | 必須   | gemini-3-pro-image-preview による画像生成 |
| 6   | 画像スタイル選択     | 必須   | 4スタイルから選択                         |
| 7   | 画像アスペクト比選択 | 必須   | 1:1 / 9:16                                |
| 8   | キャラクター管理     | 必須   | 画像アップロード・特徴自動抽出            |
| 9   | 投稿履歴管理         | 必須   | 生成した投稿の保存・閲覧                  |
| 10  | 管理画面             | 必須   | 履歴・キャラクター・設定管理              |
| 11  | ハッシュタグ生成     | 継続   | Phase 1から継続                           |
| 12  | URL記事抽出          | 継続   | Phase 1から継続                           |

### 2.2 Phase 1からの変更点

| 項目         | Phase 1                    | Phase 2                       |
| ------------ | -------------------------- | ----------------------------- |
| 認証         | なし（Cookie制限のみ）     | Google OAuth + ホワイトリスト |
| 文章生成     | キャプション（150文字）    | 投稿文（200〜400文字）        |
| 文章AI       | OpenAI GPT-4o-mini         | Google Gemini 2.5 Flash       |
| 画像生成     | @vercel/og（テキスト画像） | Gemini 3 Pro（AI画像生成）    |
| 画像スタイル | 背景色12色                 | 4スタイル（マンガ風等）       |
| データ保存   | なし                       | Supabase                      |
| 管理画面     | なし                       | あり                          |

---

## 3. 投稿タイプ仕様

### 3.1 タイプ一覧

| タイプID    | タイプ名           | 用途                      | ターゲット |
| ----------- | ------------------ | ------------------------- | ---------- |
| `solution`  | 🔧 解決タイプ      | シニアからの質問→解決方法 | シニア層   |
| `promotion` | 📢 宣伝タイプ      | AI実務サポートの告知      | ビジネス層 |
| `tips`      | 💡 Tips/知識タイプ | AIの便利な使い方紹介      | ビジネス層 |
| `showcase`  | ✨ 実績/事例タイプ | 成果物紹介、事例紹介      | ビジネス層 |

### 3.2 テンプレート構造

#### 🔧 解決タイプ（solution）

```
📱 シニアからの質問
「{question}」

💡 解決方法
① {step1}
② {step2}
③ {step3}

✨ ワンポイント
{tip}

---
📍パソコン・スマホ ほほ笑みラボ（飯田市）
```

| 項目             | 設定                                      |
| ---------------- | ----------------------------------------- |
| 想定文字数       | 200〜300文字                              |
| 必須入力         | question, step1〜3                        |
| 任意入力         | tip                                       |
| ハッシュタグ傾向 | #パソコン教室 #シニア #スマホ教室 #飯田市 |

#### 📢 宣伝タイプ（promotion）

```
【{headline}】

✅ {pain_point1}
✅ {pain_point2}
✅ {pain_point3}

ほほ笑みラボでは
「体験」で終わらせない
必ず成果物を完成させる
AI実務活用サポートを行っています。

{call_to_action}

---
📍詳細はプロフィールのリンクから
```

| 項目             | 設定                                          |
| ---------------- | --------------------------------------------- |
| 想定文字数       | 200〜400文字                                  |
| 必須入力         | headline, pain_point1〜3                      |
| 任意入力         | call_to_action                                |
| ハッシュタグ傾向 | #AI活用 #業務効率化 #ホームページ制作 #飯田市 |

#### 💡 Tips/知識タイプ（tips）

```
【{title}】

AIを使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
📍AIの使い方、もっと知りたい方は
プロフィールのリンクから
```

| 項目             | 設定                                     |
| ---------------- | ---------------------------------------- |
| 想定文字数       | 200〜350文字                             |
| 必須入力         | title, benefit1〜3                       |
| 任意入力         | example                                  |
| ハッシュタグ傾向 | #AI #ChatGPT #AIエージェント #業務効率化 |

#### ✨ 実績/事例タイプ（showcase）

```
【こんな{deliverable_type}を作りました】

📌 お客様の課題
{challenge}

🛠️ 作ったもの
{solution}

🎯 結果
{result}

---
📍一緒に作りませんか？
無料相談はプロフィールから
```

| 項目             | 設定                                        |
| ---------------- | ------------------------------------------- |
| 想定文字数       | 250〜400文字                                |
| 必須入力         | deliverable_type, challenge, solution       |
| 任意入力         | result                                      |
| ハッシュタグ傾向 | #制作実績 #ホームページ制作 #AI活用 #成果物 |

---

## 4. 画像生成仕様

### 4.1 AIモデル

| 用途     | モデル                       |
| -------- | ---------------------------- |
| 文章生成 | `gemini-2.5-flash`           |
| 画像生成 | `gemini-3-pro-image-preview` |

### 4.2 画像スタイル

| スタイルID     | スタイル名             | 説明                                 |
| -------------- | ---------------------- | ------------------------------------ |
| `manga_male`   | マンガ風（男性キャラ） | テック・ビジネス系、鮮やかな配色     |
| `manga_female` | マンガ風（女性キャラ） | クリエイティブ系、パステル調         |
| `pixel_art`    | ピクセルアート風       | レトロゲーム風、サイバー背景         |
| `illustration` | イラスト風（人物なし） | フラットデザイン、アイコン・図形のみ |

### 4.3 スタイル別ベースプロンプト

#### マンガ風（男性キャラ）- manga_male

```
縦長のショート動画用画像（9:16アスペクト比）。
日本のマンガ・アニメ調のイラストスタイル。
テック系・ビジネス系のサムネイル画像。
鮮やかでカラフルな配色、グラデーション背景。
プロフェッショナルだけど親しみやすい雰囲気。
テキストや文字は含めない、ビジュアルのみ。
メインの人物キャラクター（{character_description}）を中央に配置。
背景にはPC、コード、AI、テクノロジー要素を含める。
シーン: {scene_description}
```

#### マンガ風（女性キャラ）- manga_female

```
縦長のショート動画用画像（9:16アスペクト比）。
日本のマンガ・アニメ調のイラストスタイル。
クリエイティブ系・スタートアップ系のサムネイル画像。
パステル調やソフトなグラデーション背景。
スタイリッシュでトレンド感のある雰囲気。
テキストや文字は含めない、ビジュアルのみ。
メインの人物キャラクター（{character_description}）を中央に配置。
背景にはPC、デザイン、SNS、クリエイティブ要素を含める。
シーン: {scene_description}
```

#### ピクセルアート風 - pixel_art

```
縦長のショート動画用画像（9:16アスペクト比）。
ピクセルアート・ドット絵スタイル。
レトロゲーム風のかわいいちびキャラクター。
サイバー・デジタルな背景、青いネオングリッド。
8bit/16bitゲームの雰囲気。
テキストや文字は含めない、ビジュアルのみ。
メインのピクセルキャラクター（{character_description}）を中央に配置。
背景にはデジタル空間、グリッド、テクノロジー要素を含める。
シーン: {scene_description}
```

#### イラスト風（人物なし）- illustration

```
縦長のショート動画用画像（9:16アスペクト比）。
フラットデザインのイラスト風、ポップで明るい色使い。
テキストは含めない、ビジュアルのみ。
シンプルでかわいらしい雰囲気、2Dイラストスタイル。
人物、キャラクター、顔、手、体は絶対に含めないでください。
アイコン、シンボル、抽象的な図形、風景イラストのみで表現してください。
テーマ: {theme_description}
```

### 4.4 アスペクト比

| 形式              | アスペクト比 | サイズ       | 用途                   |
| ----------------- | ------------ | ------------ | ---------------------- |
| フィード投稿      | 1:1          | 1080×1080 px | 通常投稿               |
| リール/ストーリー | 9:16         | 1080×1920 px | ショート動画、縦長投稿 |

### 4.5 キャラクター機能

#### キャラクター登録フロー

```
[ユーザー]
    │
    ├── キャラクター画像あり
    │       │
    │       ▼ 画像アップロード
    │   [Gemini 画像分析]
    │       │
    │       ▼ 特徴テキスト自動生成
    │   [キャラクター登録完了]
    │
    └── キャラクター画像なし
            │
            ▼ 特徴テキスト手動入力
        [キャラクター登録完了]
```

#### キャラクター特徴の自動抽出項目

| 項目   | 例                     |
| ------ | ---------------------- |
| 年代   | 30-40代                |
| 性別   | 男性                   |
| 髪型   | 短髪、黒髪             |
| 服装   | スーツ（紺）、白シャツ |
| 表情   | 親しみやすい笑顔       |
| 特徴   | 似顔絵イラスト風       |
| その他 | 眼鏡の有無など         |

#### 画像生成時のキャラクター適用

```
1. 登録済みキャラクターの特徴テキストを取得
2. 選択されたスタイルのベースプロンプトに挿入
3. 投稿内容からシーン設定を生成
4. Gemini 3 Pro で画像生成
```

---

## 5. 認証・認可仕様

### 5.1 認証方式

| 項目 | 内容                 |
| ---- | -------------------- |
| 方式 | Google OAuth 2.0     |
| 制限 | ホワイトリスト方式   |
| 管理 | 環境変数 or Supabase |

### 5.2 ホワイトリスト管理

```typescript
// 環境変数での管理例
ALLOWED_EMAILS=user1@gmail.com,user2@gmail.com

// または Supabase の allowed_users テーブル
| id | email | role | created_at |
|----|-------|------|------------|
| 1  | masayuki@example.com | admin | 2026-01-24 |
```

### 5.3 認証フロー

```
[ユーザー]
    │
    ▼ アクセス
[ログインページ]
    │
    ▼ Googleログイン
[Google OAuth]
    │
    ▼ メールアドレス取得
[ホワイトリストチェック]
    │
    ├── 許可されている → [ダッシュボードへ]
    │
    └── 許可されていない → [アクセス拒否画面]
```

---

## 6. データベース設計（Supabase）

### 6.1 テーブル一覧

| テーブル名    | 説明               |
| ------------- | ------------------ |
| `users`       | 許可されたユーザー |
| `characters`  | 登録キャラクター   |
| `posts`       | 生成した投稿       |
| `post_images` | 生成した画像       |

### 6.2 テーブル定義

#### users テーブル

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'admin' | 'user'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### characters テーブル

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT, -- Supabase Storage
  description TEXT NOT NULL, -- AI生成または手動入力の特徴テキスト
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### posts テーブル

```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 入力データ
  post_type TEXT NOT NULL, -- 'solution' | 'promotion' | 'tips' | 'showcase'
  input_text TEXT NOT NULL, -- ユーザーのメモ書き
  source_url TEXT, -- 記事URLがある場合

  -- 生成データ
  generated_caption TEXT NOT NULL,
  generated_hashtags TEXT[] NOT NULL,

  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### post_images テーブル

```sql
CREATE TABLE post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,

  -- 画像設定
  style TEXT NOT NULL, -- 'manga_male' | 'manga_female' | 'pixel_art' | 'illustration'
  aspect_ratio TEXT NOT NULL, -- '1:1' | '9:16'

  -- 生成データ
  prompt TEXT NOT NULL, -- 実際に使用したプロンプト
  image_url TEXT NOT NULL, -- Supabase Storage

  -- メタデータ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6.3 Supabase Storage バケット

| バケット名         | 用途             | アクセス         |
| ------------------ | ---------------- | ---------------- |
| `characters`       | キャラクター画像 | 認証ユーザーのみ |
| `generated-images` | 生成した投稿画像 | 認証ユーザーのみ |

---

## 7. 画面設計

### 7.1 画面一覧

| 画面             | パス             | 説明                               |
| ---------------- | ---------------- | ---------------------------------- |
| ログイン         | `/login`         | Google OAuth ログイン              |
| ダッシュボード   | `/dashboard`     | メインメニュー                     |
| 新規投稿作成     | `/create`        | 投稿タイプ選択→入力→生成           |
| 生成結果         | `/create/result` | 文章・画像確認・編集・ダウンロード |
| 投稿履歴         | `/history`       | 過去の投稿一覧                     |
| 投稿詳細         | `/history/[id]`  | 投稿詳細表示                       |
| キャラクター管理 | `/characters`    | キャラクター一覧・登録・編集       |
| 設定             | `/settings`      | ユーザー設定                       |

### 7.2 画面遷移図

```
[ログイン]
    │
    ▼ 認証成功
[ダッシュボード]
    │
    ├── [新規投稿作成]
    │       │
    │       ├── 投稿タイプ選択
    │       ├── メモ書き入力
    │       ├── 画像スタイル選択
    │       ├── アスペクト比選択
    │       ├── キャラクター選択（任意）
    │       │
    │       ▼ 生成実行
    │   [生成結果]
    │       │
    │       ├── 文章編集
    │       ├── ハッシュタグ編集
    │       ├── 画像再生成
    │       ├── ダウンロード
    │       └── Instagram起動
    │
    ├── [投稿履歴]
    │       │
    │       └── [投稿詳細]
    │
    ├── [キャラクター管理]
    │       │
    │       ├── キャラクター追加
    │       └── キャラクター編集
    │
    └── [設定]
```

### 7.3 新規投稿作成フロー（詳細）

```
Step 1: 投稿タイプ選択
┌─────────────────────────────────────────────┐
│  どんな投稿を作りますか？                      │
│                                             │
│  🔧 解決タイプ     📢 宣伝タイプ              │
│  💡 Tipsタイプ     ✨ 実績タイプ              │
└─────────────────────────────────────────────┘

Step 2: 内容入力
┌─────────────────────────────────────────────┐
│  投稿したい内容をメモ書きで入力                 │
│  ┌─────────────────────────────────────────┐│
│  │ LINEの通知が来ないって質問されて、       ││
│  │ 設定から通知をONにしたら解決した。       ││
│  │ 結構この質問多いんだよね。              ││
│  └─────────────────────────────────────────┘│
│                                             │
│  または記事URLを入力: [________________]      │
└─────────────────────────────────────────────┘

Step 3: 画像設定
┌─────────────────────────────────────────────┐
│  画像スタイル                                │
│  ○ マンガ風（男性）  ○ マンガ風（女性）       │
│  ○ ピクセルアート    ○ イラスト（人物なし）   │
│                                             │
│  アスペクト比                                │
│  ○ 1:1（フィード）   ○ 9:16（リール）        │
│                                             │
│  キャラクター                                │
│  ○ なし  ○ まさゆきキャラ [プレビュー]       │
└─────────────────────────────────────────────┘

Step 4: 生成実行
┌─────────────────────────────────────────────┐
│           🔄 生成中...                       │
│                                             │
│     文章を生成しています                      │
│     ████████████░░░░░░░░ 60%                │
└─────────────────────────────────────────────┘
```

---

## 8. API設計

### 8.1 エンドポイント一覧

| メソッド | パス                      | 説明                      |
| -------- | ------------------------- | ------------------------- |
| POST     | `/api/auth/google`        | Google OAuth コールバック |
| GET      | `/api/auth/session`       | セッション確認            |
| POST     | `/api/auth/logout`        | ログアウト                |
| GET      | `/api/characters`         | キャラクター一覧取得      |
| POST     | `/api/characters`         | キャラクター登録          |
| PUT      | `/api/characters/[id]`    | キャラクター更新          |
| DELETE   | `/api/characters/[id]`    | キャラクター削除          |
| POST     | `/api/characters/analyze` | 画像から特徴抽出          |
| POST     | `/api/generate/caption`   | 投稿文生成                |
| POST     | `/api/generate/image`     | 画像生成                  |
| GET      | `/api/posts`              | 投稿履歴取得              |
| GET      | `/api/posts/[id]`         | 投稿詳細取得              |
| POST     | `/api/posts`              | 投稿保存                  |
| DELETE   | `/api/posts/[id]`         | 投稿削除                  |

### 8.2 主要API仕様

#### POST /api/generate/caption

投稿文とハッシュタグを生成する。

**Request:**

```typescript
{
  postType: 'solution' | 'promotion' | 'tips' | 'showcase';
  inputText: string;      // ユーザーのメモ書き
  sourceUrl?: string;     // 記事URLがある場合
}
```

**Response:**

```typescript
{
  caption: string;        // 生成された投稿文
  hashtags: string[];     // 生成されたハッシュタグ
  templateData: {         // テンプレートに埋め込まれたデータ
    [key: string]: string;
  };
}
```

#### POST /api/generate/image

AI画像を生成する。

**Request:**

```typescript
{
  postId?: string;        // 投稿に紐づける場合
  style: 'manga_male' | 'manga_female' | 'pixel_art' | 'illustration';
  aspectRatio: '1:1' | '9:16';
  characterId?: string;   // キャラクターを使用する場合
  sceneDescription: string; // シーンの説明（投稿内容から生成）
}
```

**Response:**

```typescript
{
  imageUrl: string; // 生成された画像URL
  prompt: string; // 使用したプロンプト
}
```

#### POST /api/characters/analyze

アップロードされた画像からキャラクター特徴を抽出する。

**Request:**

```typescript
{
  imageBase64: string; // Base64エンコードされた画像
}
```

**Response:**

```typescript
{
  description: string;    // 抽出された特徴テキスト
  attributes: {
    age: string;
    gender: string;
    hair: string;
    clothing: string;
    expression: string;
    style: string;
    other: string[];
  };
}
```

---

## 9. 技術スタック

### 9.1 フロントエンド

| カテゴリ  | 技術                     | バージョン |
| --------- | ------------------------ | ---------- |
| Framework | Next.js (App Router)     | 15.x       |
| Language  | TypeScript               | 5.x        |
| UI        | React                    | 19.x       |
| Styling   | Tailwind CSS             | 3.x        |
| State     | Zustand or React Context | -          |
| Form      | React Hook Form          | -          |

### 9.2 バックエンド

| カテゴリ | 技術                  | 備考            |
| -------- | --------------------- | --------------- |
| API      | Next.js API Routes    | App Router      |
| Auth     | NextAuth.js           | Google Provider |
| Database | Supabase (PostgreSQL) | -               |
| Storage  | Supabase Storage      | 画像保存        |

### 9.3 AI/外部サービス

| カテゴリ | 技術                    | 用途                     |
| -------- | ----------------------- | ------------------------ |
| 文章生成 | Google Gemini 2.5 Flash | 投稿文・ハッシュタグ生成 |
| 画像生成 | Google Gemini 3 Pro     | AI画像生成               |
| 画像分析 | Google Gemini (Vision)  | キャラクター特徴抽出     |

### 9.4 インフラ

| カテゴリ  | 技術               |
| --------- | ------------------ |
| Hosting   | Vercel             |
| Database  | Supabase           |
| Analytics | Google Analytics 4 |

---

## 10. 環境変数

```bash
# ===================
# 認証
# ===================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://post-craft-rho.vercel.app

# ===================
# アクセス制限
# ===================
ALLOWED_EMAILS=user@example.com

# ===================
# Supabase
# ===================
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ===================
# AI
# ===================
GOOGLE_AI_API_KEY=

# ===================
# Analytics
# ===================
NEXT_PUBLIC_GA_ID=

# ===================
# 開発用
# ===================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 11. 非機能要件

### 11.1 パフォーマンス

| 項目           | 目標     |
| -------------- | -------- |
| 文章生成       | 5秒以内  |
| 画像生成       | 30秒以内 |
| ページ読み込み | 3秒以内  |

### 11.2 セキュリティ

| 項目       | 対応                          |
| ---------- | ----------------------------- |
| 認証       | Google OAuth + ホワイトリスト |
| API保護    | 認証必須（public APIなし）    |
| データ保護 | Supabase RLS                  |
| 環境変数   | Vercel Secrets                |

### 11.3 可用性

| 項目         | 目標                       |
| ------------ | -------------------------- |
| 稼働率       | 99%（Vercel依存）          |
| バックアップ | Supabaseの自動バックアップ |

---

## 12. 開発スケジュール（案）

| フェーズ | 内容                     | 期間目安      |
| -------- | ------------------------ | ------------- |
| 1        | DB設計・Supabase構築     | 1-2日         |
| 2        | 認証機能（Google OAuth） | 1-2日         |
| 3        | キャラクター管理機能     | 2-3日         |
| 4        | 投稿タイプ・テンプレート | 1-2日         |
| 5        | Gemini文章生成連携       | 1-2日         |
| 6        | Gemini画像生成連携       | 2-3日         |
| 7        | 投稿履歴・管理画面       | 2-3日         |
| 8        | UI/UXブラッシュアップ    | 2-3日         |
| 9        | テスト・デバッグ         | 2-3日         |
| **合計** |                          | **約2-3週間** |

---

## 13. 将来の拡張（Phase 3以降）

| 機能                     | 説明                           |
| ------------------------ | ------------------------------ |
| 複数キャラクター対応     | 用途別にキャラクターを使い分け |
| 投稿予約機能             | 日時指定で投稿準備             |
| テンプレートカスタマイズ | ユーザー独自のテンプレート作成 |
| 複数ユーザー対応         | チーム利用、クライアント向け   |
| 他SNS対応                | Twitter/X、Facebook対応        |
| 分析ダッシュボード       | 投稿パフォーマンス分析         |

---

## 14. 用語集

| 用語           | 説明                                       |
| -------------- | ------------------------------------------ |
| 投稿タイプ     | 投稿の目的・形式（解決、宣伝、Tips、実績） |
| テンプレート   | 投稿タイプごとの文章構造                   |
| キャラクター   | 画像生成に使用するオリジナルキャラクター   |
| スタイル       | 画像のビジュアルスタイル（マンガ風等）     |
| ホワイトリスト | アクセスを許可するメールアドレスのリスト   |

---

## 更新履歴

| 日付       | 内容     | 担当   |
| ---------- | -------- | ------ |
| 2026-01-24 | 初版作成 | Claude |

---

## 承認

| 役割                 | 氏名 | 日付 | 署名 |
| -------------------- | ---- | ---- | ---- |
| プロジェクトオーナー |      |      |      |
| 開発担当             |      |      |      |
