# PostCraft 分析機能統合 要件定義書

**Version**: 1.0
**作成日**: 2026-02-13
**ステータス**: ヒアリング完了 → 要件定義確定
**対象コンテスト**: 長野県飯田市 ビジネスプランコンテスト（半年以内）

---

## 1. エグゼクティブサマリー

### 1.1 プロジェクトの目的

PostCraft（Instagram投稿自動生成サービス）に、競合Instagram分析と自社ブログ分析の機能を統合し、**「分析 → 成果物」の間を埋める**サービスを構築する。

### 1.2 解決する課題

飯田市をはじめとする地方の個人事業主・飲食店は、AI（ChatGPT、Gemini等）を使えば競合分析はできるようになった。しかし、**分析結果から「じゃあ何を投稿すればいいのか」に落とし込む方法が分からない**。このギャップを埋める。

### 1.3 サービスコンセプト

```
競合のInstagram分析（外の成功パターンを学ぶ）
＋ 自分のブログ分析（自分のコンテンツ資産を棚卸し）
＝ PostCraftで「自分の強み × 競合の成功パターン」を掛け合わせた
  プロフィール・システムプロンプト・投稿テンプレートを自動生成
```

### 1.4 ユースケース例

> 飯田市の和菓子屋さんがInstagramで発信したい。
> ① Bright Dataで都会の人気和菓子屋のInstagram投稿データを取得
> ② 自分の店のブログ記事（100記事）もPostCraftに読み込ませる
> ③ AIが競合の投稿パターン・文体・ハッシュタグ戦略を分析
> ④ 分析結果をユーザーに提示 → ユーザーが承認
> ⑤ PostCraftのプロフィール・投稿タイプ・テンプレートが自動生成
> ⑥ あとはメモを入力するだけで、競合に匹敵する投稿が作れる

### 1.5 ターゲットユーザー

| セグメント       | 例                                   |
| ---------------- | ------------------------------------ |
| 飲食店           | カフェ、レストラン、和菓子屋、居酒屋 |
| 小売・サービス業 | 美容室、整体院、花屋、雑貨店         |
| 個人事業主全般   | フリーランス、教室運営、士業         |

**共通特性**: SNS発信の必要性は感じているが、何をどう投稿すればいいか分からない。

---

## 2. プロジェクト方針

### 2.1 技術方針

| 項目       | 方針                                                                               |
| ---------- | ---------------------------------------------------------------------------------- |
| 統合方式   | **PostCraftに新機能として追加**（既存コードは最小限の変更）                        |
| PrepFeed   | 別サービスとして存続（コード共有はしない）                                         |
| 新規追加   | 新ページ・新APIルート・新DBテーブルを追加する形                                    |
| 既存影響   | 生成されたプロフィール・投稿タイプは既存テーブル（`profiles`, `post_types`）に保存 |
| 下流フロー | 既存の投稿作成フロー（テンプレート→画像生成→Instagram投稿）は変更なし              |

### 2.2 スコープ管理

| 区分                      | 機能                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| **MVP（コンテスト向け）** | Instagram競合分析 + ブログ分析 → プロフィール・テンプレート自動生成 |
| **将来拡張**              | 複数競合の横断分析、Instagram以外のSNS対応、メールテンプレート生成  |

### 2.3 重要な前提

- ビジネスプランコンテスト用のデモが最優先。大量ユーザーへのスケーラビリティは後回し
- Instagram分析にBright Dataを使用（スクレイピングのグレーゾーンは承知の上）
- 実際のサービス展開ではなく、コンセプト実証が目的

---

## 3. システムアーキテクチャ

### 3.1 全体構成（統合後）

```
PostCraft（既存）
├── 認証（Google OAuth / NextAuth.js v5）
├── プロフィール管理（profiles）          ← 分析結果がここに自動生成される
├── 投稿タイプ管理（post_types）          ← 分析結果がここに自動生成される
├── 投稿作成フロー（create）              ← 変更なし
├── 投稿履歴（history）                   ← 変更なし
├── 画像生成（characters / AI）           ← 変更なし
├── Instagram投稿（Graph API）            ← 変更なし
│
├── 【NEW】競合分析モジュール
│   ├── Instagram分析（Bright Data連携）
│   └── ブログ分析（Web スクレイピング）
│
└── 【NEW】自動生成モジュール
    ├── プロフィール自動生成
    ├── システムプロンプト自動生成
    └── 投稿タイプ・テンプレート自動生成
```

### 3.2 技術スタック（追加分）

| カテゴリ                | 技術                              | 用途                               |
| ----------------------- | --------------------------------- | ---------------------------------- |
| データ取得（Instagram） | Bright Data API / CSVアップロード | 競合Instagram投稿データ取得        |
| データ取得（ブログ）    | Cheerio / サイトマップパーサー    | ブログ記事の一括抽出               |
| AI分析                  | Google Gemini Flash               | 競合分析・ブログ分析               |
| AI生成                  | Google Gemini Flash               | プロフィール・テンプレート自動生成 |
| DB                      | Supabase PostgreSQL（既存）       | 分析データ・分析結果の保存         |

### 3.3 Bright Data 統合方式（ハイブリッド）

```
【Phase 1: MVP / コンテスト向け】
  Bright Dataの管理画面 → CSV/JSONエクスポート → PostCraftにアップロード
  ※ デモ時は事前にデータを用意

【Phase 2: 将来拡張】
  PostCraft → Bright Data API → リアルタイム取得
  ※ データ構造は共通化しておき、入口だけ差し替え
```

---

## 4. データモデル（新規テーブル）

### 4.1 competitor_analyses（競合分析）

| カラム                | 型                   | 説明                                             |
| --------------------- | -------------------- | ------------------------------------------------ |
| `id`                  | UUID (PK)            | 分析ID                                           |
| `user_id`             | text (FK → users.id) | ユーザーID                                       |
| `source_type`         | text                 | `instagram` / `blog`                             |
| `source_identifier`   | text                 | Instagramユーザー名 or ブログURL                 |
| `source_display_name` | text                 | 表示名（例: 「〇〇和菓子店」）                   |
| `raw_data`            | jsonb                | 取得した生データ（投稿一覧等）                   |
| `analysis_result`     | jsonb                | AI分析結果（4要素）                              |
| `status`              | text                 | `pending` / `analyzing` / `completed` / `failed` |
| `data_source`         | text                 | `upload` / `api`（ハイブリッド対応）             |
| `post_count`          | integer              | 分析した投稿/記事数                              |
| `error_message`       | text                 | エラー時のメッセージ                             |
| `created_at`          | timestamptz          | 作成日時                                         |
| `updated_at`          | timestamptz          | 更新日時                                         |

### 4.2 generated_configs（生成された設定）

| カラム                    | 型                                 | 説明                             |
| ------------------------- | ---------------------------------- | -------------------------------- |
| `id`                      | UUID (PK)                          | 生成設定ID                       |
| `user_id`                 | text (FK → users.id)               | ユーザーID                       |
| `analysis_id`             | UUID (FK → competitor_analyses.id) | 元となった分析ID                 |
| `generated_profile_id`    | UUID (FK → profiles.id)            | 生成されたプロフィールID         |
| `generated_post_type_ids` | UUID[]                             | 生成された投稿タイプIDの配列     |
| `generation_config`       | jsonb                              | 生成時のパラメータ               |
| `status`                  | text                               | `draft` / `approved` / `applied` |
| `created_at`              | timestamptz                        | 作成日時                         |

### 4.3 既存テーブルへの影響

| テーブル     | 変更       | 内容                                                                       |
| ------------ | ---------- | -------------------------------------------------------------------------- |
| `profiles`   | カラム追加 | `source_analysis_id` (UUID, nullable) — 分析から自動生成された場合にリンク |
| `post_types` | カラム追加 | `source_analysis_id` (UUID, nullable) — 分析から自動生成された場合にリンク |

**ポイント**: 既存テーブルへの変更はnullableカラムの追加のみ。既存データ・既存機能に影響なし。

### 4.4 RLS ポリシー

```sql
-- competitor_analyses
CREATE POLICY "Users can CRUD own analyses"
  ON competitor_analyses FOR ALL
  USING (auth.uid()::text = user_id::text);

-- generated_configs
CREATE POLICY "Users can CRUD own generated configs"
  ON generated_configs FOR ALL
  USING (auth.uid()::text = user_id::text);
```

---

## 5. コア機能仕様

### 5.1 機能A: Instagram競合分析

#### 5.1.1 データ取得

**Phase 1（MVP）: CSVアップロード方式**

| 項目             | 仕様                                               |
| ---------------- | -------------------------------------------------- |
| 入力             | CSV / JSON ファイル（Bright Dataからエクスポート） |
| 対応フォーマット | Bright Data Instagram Scraper の標準出力形式       |
| 最大件数         | 200投稿/回                                         |
| バリデーション   | 必須フィールド確認、文字コード自動判定             |

**Phase 2（将来）: Bright Data API直接連携**

| 項目         | 仕様                        |
| ------------ | --------------------------- |
| API          | Bright Data Web Scraper API |
| 入力         | Instagramユーザー名 or URL  |
| 取得件数     | 最新50〜200投稿（設定可能） |
| タイムアウト | 120秒                       |

**共通データ構造**（Phase 1/2 で統一）:

```typescript
interface InstagramPostData {
  post_id: string;
  post_type: 'image' | 'carousel' | 'video' | 'reel';
  caption: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  posted_at: string; // ISO 8601
  engagement_rate?: number;
  image_url?: string;
}

interface InstagramProfileData {
  username: string;
  display_name: string;
  bio: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  posts: InstagramPostData[];
}
```

#### 5.1.2 AI分析（4要素抽出）

Gemini Flashに投稿データを渡し、以下の4要素を構造化JSONで抽出する。

```typescript
interface InstagramAnalysisResult {
  // 1. 投稿タイプの傾向
  post_type_distribution: {
    types: Array<{
      category: string; // 例: '商品紹介', '日常風景', '豆知識', 'お客様の声'
      percentage: number; // 全投稿に対する割合
      avg_engagement: number; // 平均エンゲージメント率
      example_caption: string; // 代表的なキャプション（要約）
    }>;
    recommendation: string; // 推奨される投稿タイプ配分
  };

  // 2. トーン・文体
  tone_analysis: {
    primary_tone: string; // 例: 'カジュアル・親しみやすい'
    formality_level: number; // 1-5（1: くだけた, 5: フォーマル）
    emoji_usage: string; // 例: '多用（1投稿平均5個）'
    sentence_style: string; // 例: '短文中心、体言止め多用'
    first_person: string; // 例: '私たち'
    call_to_action_style: string; // 例: 'プロフィールリンク誘導'
    sample_phrases: string[]; // 特徴的なフレーズ集
  };

  // 3. ハッシュタグ戦略
  hashtag_strategy: {
    avg_count: number; // 平均ハッシュタグ数
    categories: Array<{
      type: string; // 例: 'ブランド', '地域', 'ジャンル', 'トレンド'
      tags: string[];
      frequency: number; // 使用頻度
    }>;
    top_performing_tags: string[]; // エンゲージメントが高いタグ
    recommended_tags: string[]; // 類似業種向け推奨タグ
  };

  // 4. 投稿頻度・タイミング
  posting_pattern: {
    avg_posts_per_week: number;
    most_active_days: string[]; // 例: ['月', '木', '土']
    most_active_hours: string[]; // 例: ['12:00', '18:00']
    posting_consistency: string; // 例: '非常に規則的'
    recommendation: string; // 推奨投稿スケジュール
  };

  // 総合サマリー
  summary: string; // 300文字以内の総合分析
  key_success_factors: string[]; // 成功要因トップ3
}
```

### 5.2 機能B: ブログ分析

#### 5.2.1 データ取得

| 項目         | 仕様                                                           |
| ------------ | -------------------------------------------------------------- |
| 入力         | ブログのURL（トップページ）                                    |
| 取得方法     | ① sitemap.xml → ② RSSフィード → ③ リンク巡回（フォールバック） |
| 最大記事数   | 100記事                                                        |
| 抽出内容     | タイトル、本文テキスト、公開日、カテゴリ/タグ                  |
| 処理方式     | バックグラウンド処理（記事数が多いため）                       |
| タイムアウト | 300秒（5分）                                                   |

**注意**: PostCraft既存の `/api/extract` (ブログ記事抽出API) のロジックを再利用・拡張する。

```typescript
interface BlogPostData {
  url: string;
  title: string;
  content: string; // 本文テキスト（HTML除去済み）
  published_at?: string;
  categories?: string[];
  tags?: string[];
  word_count: number;
}

interface BlogAnalysisInput {
  blog_url: string;
  blog_name: string;
  posts: BlogPostData[];
}
```

#### 5.2.2 AI分析

ブログ記事群を分析し、PostCraftのテンプレート生成に必要な要素を抽出する。

```typescript
interface BlogAnalysisResult {
  // コンテンツの強み
  content_strengths: {
    main_topics: string[]; // 主要テーマ（最大5つ）
    unique_value: string; // 独自の価値・専門性
    target_audience: string; // 想定読者層
    writing_style: string; // 文体の特徴
  };

  // SNS転用可能なネタ
  reusable_content: Array<{
    original_title: string;
    original_url: string;
    suggested_post_type: string; // PostCraftの投稿タイプにマッピング
    suggested_caption_outline: string;
    suggested_hashtags: string[];
  }>;

  // プロフィール生成用の素材
  profile_material: {
    expertise_areas: string[]; // 専門分野
    tone_keywords: string[]; // トーンを表すキーワード
    brand_message: string; // ブランドメッセージ案
  };

  summary: string;
}
```

### 5.3 機能C: プロフィール・テンプレート自動生成

#### 5.3.1 生成フロー

分析結果（Instagram分析 + ブログ分析の両方またはいずれか）を入力として、以下を一括生成する。

**生成物一覧:**

| 生成物               | 保存先テーブル | 説明                                                                          |
| -------------------- | -------------- | ----------------------------------------------------------------------------- |
| プロフィール         | `profiles`     | name, icon, description, system_prompt_memo, system_prompt, required_hashtags |
| 投稿タイプ（3〜5種） | `post_types`   | name, slug, description, template_structure, placeholders, type_prompt 等     |

#### 5.3.2 プロフィール自動生成の仕様

```typescript
interface GeneratedProfile {
  name: string; // 例: '〇〇和菓子店 Instagram'
  icon: string; // 絵文字アイコン
  description: string; // プロフィール説明
  system_prompt_memo: string; // システムプロンプトの元メモ（分析サマリー）
  system_prompt: string; // AI用システムプロンプト（自動生成）
  required_hashtags: string[]; // 必須ハッシュタグ（分析結果から抽出）
}
```

**system_prompt の自動生成ロジック:**

分析結果から以下を組み合わせてシステムプロンプトを構築する:

- 業種・専門分野（ブログ分析の `content_strengths` から）
- トーン・文体（Instagram分析の `tone_analysis` から）
- ターゲット読者（両分析の結果を統合）
- ブランドメッセージ（ブログ分析の `profile_material` から）
- 地域情報（ユーザー入力）

#### 5.3.3 投稿タイプ自動生成の仕様

Instagram分析の `post_type_distribution` を元に、エンゲージメントの高い投稿カテゴリから3〜5種の投稿タイプを自動生成する。

```typescript
interface GeneratedPostType {
  name: string; // 例: '季節の和菓子紹介'
  slug: string; // 自動生成（例: 'seasonal-wagashi'）
  description: string;
  icon: string; // 絵文字
  template_structure: string; // テンプレート本体
  placeholders: Placeholder[]; // 入力フィールド定義
  input_mode: 'fields' | 'memo';
  min_length: number;
  max_length: number;
  type_prompt: string; // タイプ別AIプロンプト
  profile_id: string; // 生成されたプロフィールに紐付け
}
```

---

## 6. ページ構成（新規追加）

### 6.1 追加ページ一覧

```
src/app/(dashboard)/
├── analysis/                          # 【NEW】分析機能
│   ├── page.tsx                      # 分析ダッシュボード（一覧 + 新規分析開始）
│   ├── new/page.tsx                  # 新規分析ウィザード
│   ├── [id]/page.tsx                 # 分析結果詳細 + 承認画面
│   └── [id]/generate/page.tsx        # 生成プレビュー + 適用画面
```

### 6.2 画面フロー

```
分析ダッシュボード (/analysis)
    │
    ├── [新規分析] → 分析ウィザード (/analysis/new)
    │                 Step 1: 分析ソース選択（Instagram / ブログ / 両方）
    │                 Step 2: データ入力
    │                   - Instagram → CSVアップロード or ユーザー名入力（将来）
    │                   - ブログ → ブログURL入力
    │                 Step 3: 分析実行（プログレス表示）
    │                 Step 4: 分析完了 → 結果ページへ遷移
    │
    ├── [分析結果を見る] → 分析結果詳細 (/analysis/[id])
    │                       - 4要素の分析レポート表示
    │                       - [この分析からテンプレートを生成] ボタン
    │
    └── [テンプレート生成] → 生成プレビュー (/analysis/[id]/generate)
                              - 生成されるプロフィールのプレビュー
                              - 生成される投稿タイプ（3〜5種）のプレビュー
                              - [承認して適用] ボタン → profiles, post_types に保存
                              - 適用後 → 投稿作成ページへ誘導
```

### 6.3 サイドバー変更

既存のサイドバーに「分析」メニューを追加:

```
🏠 ダッシュボード
✏️ 投稿作成
📋 履歴
🔍 分析            ← NEW
👤 キャラクター
⚙️ 設定
```

---

## 7. API ルート（新規追加）

### 7.1 分析管理

| Route                       | Method | 説明                               |
| --------------------------- | ------ | ---------------------------------- |
| `/api/analysis`             | GET    | 分析一覧取得                       |
| `/api/analysis`             | POST   | 新規分析作成 + 実行開始            |
| `/api/analysis/[id]`        | GET    | 分析詳細取得（結果含む）           |
| `/api/analysis/[id]`        | DELETE | 分析削除                           |
| `/api/analysis/[id]/status` | GET    | 分析ステータス確認（ポーリング用） |

### 7.2 データ取得

| Route                      | Method | 説明                                         |
| -------------------------- | ------ | -------------------------------------------- |
| `/api/analysis/upload`     | POST   | CSV/JSONファイルアップロード（Instagram用）  |
| `/api/analysis/blog-crawl` | POST   | ブログURL → 記事一括取得（バックグラウンド） |

### 7.3 自動生成

| Route                         | Method | 説明                                         |
| ----------------------------- | ------ | -------------------------------------------- |
| `/api/analysis/[id]/generate` | POST   | 分析結果から生成プレビュー作成               |
| `/api/analysis/[id]/apply`    | POST   | 生成結果を承認 → profiles, post_types に保存 |

---

## 8. UXフロー詳細

### 8.1 メインフロー（Instagram分析 + ブログ分析 → テンプレート生成）

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: 分析ソース選択                                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ 📸 Instagram │  │ 📝 ブログ    │  │ 📸+📝 両方      │    │
│  │  競合分析     │  │  自社分析    │  │  （推奨）        │    │
│  └──────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: データ入力                                            │
│                                                              │
│  【Instagram】                                                │
│  ┌─────────────────────────────────────┐                     │
│  │ 競合アカウント名: @wagashi_tokyo    │                     │
│  │ データ: [CSVアップロード ▼]          │                     │
│  │         └─ ファイル選択              │                     │
│  └─────────────────────────────────────┘                     │
│                                                              │
│  【ブログ】                                                   │
│  ┌─────────────────────────────────────┐                     │
│  │ ブログURL: https://example.com/blog │                     │
│  │ ブログ名: 〇〇和菓子店ブログ         │                     │
│  └─────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: 分析実行中                                            │
│                                                              │
│  📊 分析を実行しています...                                    │
│                                                              │
│  ✅ Instagramデータ取得完了（87投稿）                          │
│  ✅ ブログ記事取得完了（43記事）                                │
│  ⏳ AI分析中... (投稿タイプ分析)                               │
│  ○ トーン・文体分析                                           │
│  ○ ハッシュタグ戦略分析                                       │
│  ○ 投稿パターン分析                                           │
│                                                              │
│  ████████████░░░░░░░░ 45%                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: 分析結果レポート                                      │
│                                                              │
│  📊 競合分析レポート: @wagashi_tokyo                          │
│                                                              │
│  【投稿タイプの傾向】                                         │
│  ┌─────────────────────────────────────┐                     │
│  │ 商品紹介: 40%  ████████             │                     │
│  │ 季節情報: 25%  █████                │                     │
│  │ 製造工程: 20%  ████                 │                     │
│  │ お客様の声: 15% ███                 │                     │
│  └─────────────────────────────────────┘                     │
│                                                              │
│  【トーン・文体】【ハッシュタグ戦略】【投稿パターン】          │
│  ...（各セクション展開可能）                                    │
│                                                              │
│         [🚀 この分析からテンプレートを生成]                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: 生成プレビュー + 承認                                  │
│                                                              │
│  📝 以下のプロフィールと投稿タイプが生成されます                │
│                                                              │
│  【プロフィール】                                              │
│  ┌─────────────────────────────────────┐                     │
│  │ 🍡 〇〇和菓子店 Instagram                                │
│  │ システムプロンプト: (プレビュー表示)                       │
│  │ 必須ハッシュタグ: #和菓子 #飯田市 #〇〇堂                │
│  └─────────────────────────────────────┘                     │
│                                                              │
│  【投稿タイプ】(4種)                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │🍡商品紹介 │ │🌸季節便り │ │👩‍🍳製造裏側 │ │💬お客様声 │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  （各タイプをクリックでテンプレート詳細表示）                    │
│                                                              │
│   [✅ 承認して適用]     [✏️ 編集してから適用]                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
           適用完了 → 投稿作成ページへ誘導
           「さっそく投稿を作ってみましょう！」
```

---

## 9. 非機能要件

### 9.1 パフォーマンス

| 処理                            | 目標時間                      |
| ------------------------------- | ----------------------------- |
| CSVアップロード + パース        | 5秒以内                       |
| ブログ記事取得（100記事）       | 300秒以内（バックグラウンド） |
| Instagram AI分析                | 30秒以内                      |
| ブログ AI分析                   | 30秒以内                      |
| プロフィール + テンプレート生成 | 20秒以内                      |
| 分析ステータスポーリング        | 2秒間隔                       |

### 9.2 制限事項

| 項目                | 制限                             |
| ------------------- | -------------------------------- |
| 競合分析            | MVP: 1件/回、将来: 複数対応      |
| Instagram投稿データ | 最大200投稿/分析                 |
| ブログ記事          | 最大100記事/分析                 |
| 生成投稿タイプ数    | 3〜5種/分析                      |
| CSVファイルサイズ   | 10MB以下                         |
| 分析結果の保持期間  | 無期限（ユーザーが削除するまで） |

### 9.3 セキュリティ

- 全新規APIルートで `requireAuth()` 必須
- 全新規テーブルでRLS有効化
- アップロードファイルのバリデーション（ファイルタイプ、サイズ）
- Bright Data APIキーはサーバーサイドのみ

---

## 10. 環境変数（追加分）

```bash
# Bright Data（Phase 2 で使用）
BRIGHT_DATA_API_TOKEN=
BRIGHT_DATA_COLLECTOR_ID=

# ブログ分析（既存のGOOGLE_AI_API_KEYを共用）
# 追加の環境変数は不要
```

---

## 11. 実装フェーズ

### Phase 5A: 分析基盤（2〜3週間）

| タスク           | 内容                                                                              |
| ---------------- | --------------------------------------------------------------------------------- |
| DB設計           | `competitor_analyses`, `generated_configs` テーブル作成、既存テーブルにカラム追加 |
| CSVパーサー      | Bright Data形式のCSV/JSONパース処理                                               |
| ブログクローラー | sitemap.xml / RSS / リンク巡回による記事取得                                      |
| 分析APIルート    | `/api/analysis/*` の実装                                                          |
| 分析ウィザードUI | Step 1〜3 の実装                                                                  |

### Phase 5B: AI分析パイプライン（2〜3週間）

| タスク                  | 内容                                            |
| ----------------------- | ----------------------------------------------- |
| Instagram分析プロンプト | 4要素抽出用のGeminiプロンプト設計・チューニング |
| ブログ分析プロンプト    | コンテンツ強み・SNS転用ネタ抽出プロンプト       |
| 分析結果表示UI          | 4要素レポート画面                               |
| バックグラウンド処理    | ブログ取得・分析のジョブ管理                    |

### Phase 5C: 自動生成 + 統合（2〜3週間）

| タスク             | 内容                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| 生成プロンプト     | 分析結果→プロフィール・テンプレート生成用のGeminiプロンプト                      |
| 生成プレビューUI   | 生成物の確認・承認画面                                                           |
| 適用処理           | 承認後に `profiles`, `post_types` へ保存                                         |
| 既存フローとの接続 | 生成されたプロフィール・投稿タイプが投稿作成フローでシームレスに使えることを確認 |
| E2Eテスト          | 和菓子屋ユースケースで通しテスト                                                 |

### Phase 6（将来）: 拡張

| タスク                  | 内容                               |
| ----------------------- | ---------------------------------- |
| Bright Data API直接連携 | アップロード不要のリアルタイム取得 |
| 複数競合の横断分析      | 複数アカウントの統合分析           |
| Instagram以外のSNS      | X, LINE等のテンプレート対応        |
| メールテンプレート      | メール文面の自動生成               |

---

## 12. コンテスト向けデモシナリオ

### 推奨デモストーリー

```
1. 導入（1分）
   「飯田市の〇〇和菓子店さんが、Instagramを始めたいと相談に来ました」

2. 競合分析（2分）
   事前に取得済みの都会の人気和菓子屋データをアップロード
   → AIが分析 → 4要素のレポート表示
   「都会の成功店は、こういう投稿パターンで成果を出しています」

3. ブログ分析（1分）
   和菓子店の既存ブログURLを入力
   → 記事を自動取得 → AIが強みを分析
   「〇〇さんの強みは季節の素材へのこだわりです」

4. 自動生成（2分）
   分析結果を承認 → プロフィール + 投稿タイプが自動生成
   「競合の成功パターン × 自分の強みで、最適なテンプレートが完成しました」

5. 投稿作成（1分）
   生成されたテンプレートで実際に投稿を作成
   → メモ入力だけで投稿完成
   「あとはメモを書くだけ。AIが全部やってくれます」

6. まとめ（1分）
   「分析はできる。でもそこからどうすればいいか分からない。
    PostCraftはその間を埋めます」
```

---

## 付録A: 用語集

| 用語               | 定義                                                            |
| ------------------ | --------------------------------------------------------------- |
| PostCraft          | Instagram投稿自動生成サービス（既存）                           |
| PrepFeed           | コンテンツ分析サービス（既存、別サービスとして存続）            |
| Bright Data        | Webスクレイピングプラットフォーム（Instagram データ取得に使用） |
| プロフィール       | PostCraftにおけるビジネスアカウントの設定単位                   |
| 投稿タイプ         | 投稿のカテゴリ・テンプレート定義                                |
| システムプロンプト | AI（Gemini）へのベース指示文                                    |
| テンプレート構造   | 投稿キャプションの雛形（プレースホルダー付き）                  |

## 付録B: ヒアリング結果まとめ

| 項目            | 決定事項                                                             |
| --------------- | -------------------------------------------------------------------- |
| 統合方式        | PostCraftに追加する形（既存コードは最小限の変更）                    |
| PrepFeedの扱い  | 別サービスとして存続                                                 |
| Bright Data連携 | ハイブリッド（MVPはCSVアップロード、将来API直接連携）                |
| 分析対象        | Instagram競合分析 + 自社ブログ分析                                   |
| 分析要素        | 投稿タイプ傾向、トーン・文体、ハッシュタグ戦略、投稿頻度・タイミング |
| 競合分析単位    | MVPは1件、将来複数対応                                               |
| 生成物の保存先  | 新規プロフィールとして自動作成                                       |
| UXフロー        | 分析結果を見せてからユーザーが承認して生成                           |
| ターゲット      | 飲食店・小売・サービス業・個人事業主（幅広く）                       |
| コンテスト時期  | 半年以内                                                             |
| 出力形式        | .mdファイル                                                          |
