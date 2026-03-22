# Post Craft フェーズ5 要件定義書 Part 1: 過去投稿リメイク機能

- **作成日:** 2026-03-22
- **ステータス:** 要件定義完了
- **フェーズ:** Phase 5（過去投稿リメイク機能 + 投稿レポート）

---

## 1. この要件定義書の目的

### 1.1 背景

Post Craft は Phase 4 までに42件の投稿を蓄積しており、投稿履歴は「資産」として活用できるデータとなっている。現在、アイデア提案機能で投稿履歴を活用しているが、さらに既存投稿を直接再活用する仕組みがない。

### 1.2 Phase 5 の目標

| 目標                     | 詳細                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| コンテンツ再活用の効率化 | 過去の投稿を別の投稿タイプ・プロフィールに変換し、1つのネタから複数の投稿を量産 |
| 投稿傾向の可視化         | 投稿データを分析し、偏りや改善ポイントを明確にする                              |
| リメイク候補のAI提案     | AIが過去投稿を分析し、リメイクすると効果的な投稿を提案                          |

### 1.3 Phase 5 の構成

| Part   | 機能                               | 要件定義書 |
| ------ | ---------------------------------- | ---------- |
| Part 1 | 過去投稿リメイク機能               | 本書       |
| Part 2 | 投稿レポート（分析ダッシュボード） | 別ファイル |
| Part 3 | 開発スケジュール・共通事項         | 別ファイル |

### 1.4 変更しない部分

- 既存の投稿作成フロー（/create）の基本構造
- 既存の「関連投稿参照」機能（related_post_id）
- 既存の投稿履歴データ（絶対に削除しない）
- 既存のアイデア提案機能（/ideas）

---

## 2. 機能要件

### 2.1 機能一覧

| #   | 機能                           | 優先度 | 説明                                           |
| --- | ------------------------------ | ------ | ---------------------------------------------- |
| 1   | 履歴詳細からのリメイク開始     | 必須   | 履歴詳細ページに「リメイク」ボタンを設置       |
| 2   | リメイク投稿作成フロー         | 必須   | 既存 /create にリメイクモードを追加            |
| 3   | 投稿タイプ変更                 | 必須   | リメイク時に別の投稿タイプを選択可能           |
| 4   | プロフィール変更               | 必須   | リメイク時に別のプロフィールを選択可能         |
| 5   | キャプション完全再生成         | 必須   | 新しいタイプ・プロフィールでキャプション再生成 |
| 6   | ハッシュタグ再生成             | 必須   | 新しいプロフィールの必須タグを反映             |
| 7   | 画像再生成                     | 必須   | スタイル・アスペクト比変更して画像再生成       |
| 8   | リメイク元の関連記録           | 必須   | remake_source_id で元投稿との紐付け            |
| 9   | 新規投稿として保存             | 必須   | リメイク結果は常に新規投稿として保存           |
| 10  | 履歴詳細でのリメイク提案       | 必須   | AIが投稿ごとにリメイク提案を表示               |
| 11  | レポートページでのリメイク提案 | 必須   | AIが全投稿から候補を選んで提案（3〜5件）       |
| 12  | リメイク提案のDB保存           | 必須   | 提案をDBに保存し管理                           |

### 2.2 Phase 4 からの変更点

| 項目           | Phase 4                     | Phase 5                         |
| -------------- | --------------------------- | ------------------------------- |
| 投稿の再活用   | アイデア提案のみ            | アイデア提案 + リメイク機能     |
| 履歴詳細ページ | 編集・再生成・Instagram投稿 | + リメイクボタン + リメイク提案 |
| 投稿レポート   | なし                        | 新規追加（Part 2）              |
| DB posts       | related_post_id のみ        | + remake_source_id 追加         |
| DB 新テーブル  | -                           | remake_suggestions 追加         |

---

## 3. リメイク機能仕様

### 3.1 リメイクの起点

リメイクは以下の2箇所から開始できる。

| 起点           | 場所                       | 操作                                   |
| -------------- | -------------------------- | -------------------------------------- |
| 履歴詳細ページ | /history/[id]              | 「リメイク」ボタンをクリック           |
| リメイク提案   | 履歴詳細 or レポートページ | 提案カードの「この案でリメイク」ボタン |

### 3.2 リメイク開始時のデータ引き継ぎ

リメイク開始時に、元投稿の以下のデータを /create ページに引き継ぐ。

| データ               | 引き継ぎ方法                | 変更可否 |
| -------------------- | --------------------------- | -------- |
| 元投稿ID             | remake_source_id として記録 | 変更不可 |
| 元投稿の入力テキスト | inputText にセット          | 変更可   |
| 元投稿のキャプション | 参照情報として表示          | -        |
| 投稿タイプ           | デフォルト選択（変更推奨）  | 変更可   |
| プロフィール         | デフォルト選択（変更推奨）  | 変更可   |
| 画像設定             | 元投稿の設定を初期値に      | 変更可   |

3.3 リメイクフロー
履歴詳細からのリメイク

[履歴詳細ページ]
│
▼ 「リメイク」ボタンクリック
[/create?remakeFrom={postId}]
│
▼ 元投稿データを取得・セット
[投稿作成フロー（リメイクモード）]
│
├── Step 0: プロフィール選択（2つ以上で表示、変更推奨）
├── Step 1: 投稿タイプ選択（変更推奨、元タイプにバッジ表示）
├── Step 2: 内容入力（元投稿の入力テキストがプリセット）
├── Step 3: 画像設定（元投稿の設定を初期値に）
├── Step 4: キャッチコピー確認
├── Step 5: 生成中
└── Step 6: 完成（リメイク元の参照を表示）

リメイク提案からのリメイク
[リメイク提案カード]
│
▼ 「この案でリメイク」ボタンクリック
[/create?remakeFrom={postId}&suggestedType={typeSlug}&suggestedProfile={profileId}]
│
▼ 元投稿データ + 提案されたタイプ・プロフィールをセット
[投稿作成フロー（リメイクモード）]
│
├── 提案されたタイプ・プロフィールがデフォルト選択済み
└── 以降は通常のリメイクフローと同じ

3.4 リメイクモードのUI変更
投稿作成ページのヘッダー

┌─────────────────────────────────────────────────────────────┐
│ 🔄 リメイク投稿を作成 │
│ │
│ ┌─ 元の投稿 ──────────────────────────────────────────────┐ │
│ │ 🔧 解決タイプ | 2026-03-15 │ │
│ │ 📱 よくある質問 │ │
│ │ 「LINEの通知が来ないんです」... │ │
│ │ [元投稿を見る] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 💡 投稿タイプやプロフィールを変えて、新しい投稿を作りましょう │
└─────────────────────────────────────────────────────────────┘

Step 1: 投稿タイプ選択（リメイクモード）
┌─────────────────────────────────────────────────────────────┐
│ Step 1: 投稿タイプを選択 │
├─────────────────────────────────────────────────────────────┤
│ │
│ 💡 元の投稿は「🔧 解決タイプ」です。 │
│ 別のタイプを選ぶと、同じ内容を違う切り口で投稿できます。 │
│ │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ 🔧 │ │ 📢 │ │ 💡 │ │
│ │ 解決タイプ │ │ 宣伝タイプ │ │ AI活用タイプ │ │
│ │ [元の投稿] │ │ │ │ │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
│ ... │
└─────────────────────────────────────────────────────────────┘

Step 2: 内容入力（リメイクモード）
┌─────────────────────────────────────────────────────────────┐
│ Step 2: 内容を入力 │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌─ 元の投稿の入力テキスト ────────────────────────────────┐ │
│ │ │ │
│ │ LINEの通知が来ないって質問されて │ │
│ │ 設定から通知をONにしたら解決した │ │
│ │ 結構この質問多いんだよね │ │
│ │ │ │
│ │ ✏️ 必要に応じて編集してください │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─ 元の投稿のキャプション（参考） ────────────────────────┐ │
│ │ │ │
│ │ 📱 よくある質問 │ │
│ │ 「LINEの通知が来ないんです」 │ │
│ │ ... [折りたたみ ▼] │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

3.5 リメイク時のキャプション生成
AIプロンプトに以下の追加コンテキストを含める。

【リメイク元の投稿】
タイプ: 解決タイプ
キャプション:

---

📱 よくある質問
「LINEの通知が来ないんです」
...

---

上記の投稿を「{新しい投稿タイプ名}」のフォーマットでリメイクしてください。
元の投稿の内容・要点を活かしつつ、新しいタイプのテンプレート構造に合わせて再構成してください。
同じ文章のコピーにならないよう、表現や切り口を変えてください。

3.6 完成画面でのリメイク元表示

┌─────────────────────────────────────────────────────────────┐
│ ✅ 投稿が完成しました！ │
├─────────────────────────────────────────────────────────────┤
│ │
│ 🔄 リメイク元: 🔧 解決タイプ（2026-03-15） │
│ [元投稿を見る →] │
│ │
│ [キャプション表示] │
│ [画像表示] │
│ ... │
└─────────────────────────────────────────────────────────────┘

## 3.7 履歴での表示

リメイクで作成された投稿には、履歴一覧・詳細ページで「リメイク」バッジを表示する。

| バッジ      | 色                          | 条件                    |
| ----------- | --------------------------- | ----------------------- |
| 🔄 リメイク | オレンジ (bg-orange-500/20) | remake_source_id が存在 |

履歴詳細ページでは、リメイク元の投稿へのリンクも表示する。

## 4. AIリメイク提案機能

### 4.1 概要

AIが過去の投稿履歴を分析し、リメイクすると効果的な投稿を提案する機能。提案はDBに保存して管理する。

### 4.2 提案の表示箇所

| 表示箇所           | 対象         | 件数   | トリガー           |
| ------------------ | ------------ | ------ | ------------------ |
| 履歴詳細ページ     | その投稿のみ | 1〜2件 | ボタンを押して生成 |
| 投稿レポートページ | 全投稿対象   | 3〜5件 | ボタンを押して生成 |

### 4.3 提案の内容

各提案に含まれる情報。

| 項目             | 説明                       | 例                                               |
| ---------------- | -------------------------- | ------------------------------------------------ |
| 元投稿           | リメイク対象の投稿         | 「LINEの通知設定」の解決タイプ投稿               |
| 提案タイプ       | 変換先の投稿タイプ         | 💡 AI活用タイプ                                  |
| 提案プロフィール | 変換先のプロフィール       | ビジネス向け                                     |
| 提案理由         | なぜこのリメイクが効果的か | 「シニア向けの内容をビジネス層にも訴求できます」 |
| リメイクの方向性 | どんな切り口で書き換えるか | 「通知設定の問題をAI活用の観点から紹介」         |

4.4 履歴詳細ページでの提案UI

┌─────────────────────────────────────────────────────────────┐
│ 🔄 リメイク提案 [AIで提案を生成] │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌─ 提案 1 ───────────────────────────────────────────────┐ │
│ │ │ │
│ │ 💡 AI活用タイプ × ビジネス向けプロフィール │ │
│ │ │ │
│ │ 📝 提案理由 │ │
│ │ LINEの通知設定はスマホの基本操作です。これをAIアシスタ │ │
│ │ ントの活用という切り口で紹介すると、ビジネス層にも │ │
│ │ 「AIで業務の通知管理を効率化」という訴求ができます。 │ │
│ │ │ │
│ │ [この案でリメイク] [削除] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─ 提案 2 ───────────────────────────────────────────────┐ │
│ │ │ │
│ │ 📢 宣伝タイプ × シニア向けプロフィール │ │
│ │ │ │
│ │ 📝 提案理由 │ │
│ │ 「通知が来ない」は多くのシニアが抱える悩みです。 │ │
│ │ この解決力をアピールする宣伝投稿にリメイクすると、 │ │
│ │ 教室の信頼性向上につながります。 │ │
│ │ │ │
│ │ [この案でリメイク] [削除] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ 💡 「AIで提案を生成」ボタンで新しい提案を生成できます │
└─────────────────────────────────────────────────────────────┘

4.5 投稿レポートページでの提案UI

┌─────────────────────────────────────────────────────────────┐
│ 🔄 リメイクおすすめ [AIで提案を生成] │
├─────────────────────────────────────────────────────────────┤
│ │
│ 過去の投稿からリメイクすると効果的な投稿をAIが提案します。 │
│ │
│ ┌─ おすすめ 1 ────────────────────────────────────────────┐ │
│ │ │ │
│ │ 📌 元の投稿: 🔧「LINEの通知が来ない」(2026-03-15) │ │
│ │ ➡️ 💡 AI活用タイプ × ビジネス向け │ │
│ │ │ │
│ │ 📝 通知管理をAI活用の観点から紹介すると、ビジネス層 │ │
│ │ への訴求力が高まります。 │ │
│ │ │ │
│ │ [この案でリメイク] [元投稿を見る] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─ おすすめ 2 ────────────────────────────────────────────┐ │
│ │ ... │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ... (3〜5件) │
└─────────────────────────────────────────────────────────────┘

4.6 提案生成のAIプロンプト
履歴詳細ページ用（単一投稿対象）

あなたはSNS投稿のコンテンツストラテジストです。

以下の投稿をリメイク（別の投稿タイプ・プロフィールに変換）する提案を2件生成してください。

【元の投稿】
投稿タイプ: {postTypeName}
プロフィール: {profileName}
キャプション:

---

## {caption}

## 入力テキスト:

## {inputText}

【利用可能な投稿タイプ】
{postTypesList}

【利用可能なプロフィール】
{profilesList}

【生成ルール】

- 元の投稿と同じタイプ・プロフィールの組み合わせは避ける
- 各提案に以下を含める:
  - suggestedTypeSlug: 提案する投稿タイプのslug
  - suggestedProfileId: 提案するプロフィールのID
  - reason: なぜこのリメイクが効果的か（100文字程度）
  - direction: どんな切り口で書き換えるか（100文字程度）

【出力形式】
JSON配列で出力してください。

投稿レポートページ用（全投稿対象）

あなたはSNS投稿のコンテンツストラテジストです。

以下の投稿履歴を分析し、リメイクすると効果的な投稿を3〜5件提案してください。

【投稿履歴（直近の投稿）】
{recentPostsSummary}

【利用可能な投稿タイプ】
{postTypesList}

【利用可能なプロフィール】
{profilesList}

【選定基準】

- 別のターゲット層にも訴求できる内容を優先
- 投稿タイプを変えることで新しい切り口が生まれるものを選ぶ
- 同じ元投稿の重複提案は避ける
- 既にリメイク済みの投稿（remake_source_idが設定されている投稿）の元投稿は避ける

【生成ルール】

- 各提案に以下を含める:
  - sourcePostId: 元投稿のID
  - suggestedTypeSlug: 提案する投稿タイプのslug
  - suggestedProfileId: 提案するプロフィールのID
  - reason: なぜこのリメイクが効果的か（100文字程度）
  - direction: どんな切り口で書き換えるか（100文字程度）

【出力形式】
JSON配列で出力してください。

## 5. データベース変更

### 5.1 posts テーブル（カラム追加）

| カラム             | 型                                       | デフォルト | 説明               |
| ------------------ | ---------------------------------------- | ---------- | ------------------ |
| `remake_source_id` | UUID (FK → posts.id, ON DELETE SET NULL) | NULL       | リメイク元の投稿ID |

**SQL:**

-- カラム追加
ALTER TABLE posts
ADD COLUMN remake_source_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- インデックス追加
CREATE INDEX idx_posts_remake_source_id ON posts(remake_source_id);

注意:
・remake_source_id と related_post_id は独立して使用
・リメイク投稿でも、さらに別の related_post_id（関連投稿参照）を設定可能
・元投稿が削除された場合は ON DELETE SET NULL で NULL に

5.2 remake_suggestions テーブル（新規）
AIリメイク提案を保存するテーブル。

CREATE TABLE remake_suggestions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id TEXT NOT NULL,

-- 対象投稿
source_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

-- 提案内容
suggested_type_slug TEXT NOT NULL,
suggested_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
reason TEXT NOT NULL,
direction TEXT NOT NULL,

-- ステータス
is_used BOOLEAN NOT NULL DEFAULT FALSE,

-- 生成コンテキスト
generated_from TEXT NOT NULL DEFAULT 'detail', -- 'detail' | 'report'

-- メタデータ
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_remake_suggestions_user_id ON remake_suggestions(user_id);
CREATE INDEX idx_remake_suggestions_source_post_id ON remake_suggestions(source_post_id);

-- RLS
ALTER TABLE remake_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own remake suggestions"
ON remake_suggestions FOR ALL
USING ((SELECT auth.uid())::text = user_id::text);

5.3 ER図（リメイク関連）

posts
├── remake_source_id ──→ posts.id (自己参照)
├── related_post_id ──→ posts.id (自己参照、既存)
└── post_type_id ──→ post_types.id (既存)

remake_suggestions
├── source_post_id ──→ posts.id
├── suggested_profile_id ──→ profiles.id
└── user_id ──→ users.id (RLS用)

## 6. API設計

### 6.1 新規エンドポイント

| メソッド | パス                           | 説明                   |
| -------- | ------------------------------ | ---------------------- |
| POST     | `/api/remake/suggestions`      | リメイク提案をAI生成   |
| GET      | `/api/remake/suggestions`      | リメイク提案一覧取得   |
| PATCH    | `/api/remake/suggestions/[id]` | 提案更新（使用済み等） |
| DELETE   | `/api/remake/suggestions/[id]` | 提案削除               |

### 6.2 API仕様詳細

#### POST /api/remake/suggestions

リメイク提案をAI生成する。

Request:

{
sourcePostId?: string; // 特定投稿の提案（履歴詳細用）
context: 'detail' | 'report'; // 生成コンテキスト
}

・sourcePostId あり + context: 'detail': 指定投稿に対する提案を2件生成
・sourcePostId なし + context: 'report': 全投稿から候補を選んで3〜5件生成

Response:

{
suggestions: [
{
id: string;
sourcePostId: string;
suggestedTypeSlug: string;
suggestedTypeName: string;
suggestedTypeIcon: string;
suggestedProfileId: string | null;
suggestedProfileName: string | null;
reason: string;
direction: string;
isUsed: boolean;
generatedFrom: 'detail' | 'report';
createdAt: string;
}
];
}

## GET /api/remake/suggestions

提案一覧を取得する。

### Query Parameters

| パラメータ   | 型      | 必須 | 説明                                  |
| ------------ | ------- | ---- | ------------------------------------- |
| sourcePostId | string  | No   | 特定投稿の提案のみ取得                |
| context      | string  | No   | `detail` or `report` でフィルター     |
| includeUsed  | boolean | No   | 使用済みも含める（デフォルト: false） |

Response:

{
suggestions: RemakeSuggestion[];
}

PATCH /api/remake/suggestions/[id]
提案を更新する。

Request:

{
isUsed?: boolean;
}

DELETE /api/remake/suggestions/[id]
提案を削除する。

Response:

{
success: true;
}

6.3 既存API変更
POST /api/posts
リメイク元の記録フィールドを追加。

Request（追加フィールド）:

{
// 既存フィールド
postType: string;
postTypeId: string;
profileId: string;
inputText: string;
// ...

// 追加フィールド
remakeSourceId?: string; // リメイク元投稿ID
}

PATCH /api/posts/[id]
ホワイトリストに remake_source_id を追加。

GET /api/posts, GET /api/posts/[id]
レスポンスに remake_source_id と リメイク元投稿の基本情報を含める。

Response（追加フィールド）:

{
// 既存フィールド
// ...

// 追加フィールド
remake_source_id: string | null;
remake_source: { // リメイク元の基本情報（JOINで取得）
id: string;
post_type: string;
generated_caption: string; // 冒頭100文字程度
created_at: string;
} | null;
}

## 7. 画面設計

### 7.1 変更画面一覧

| 画面         | パス            | 変更内容                                        |
| ------------ | --------------- | ----------------------------------------------- |
| 履歴詳細     | `/history/[id]` | リメイクボタン追加 + リメイク提案セクション追加 |
| 投稿作成     | `/create`       | リメイクモード追加（URLパラメータで制御）       |
| 投稿レポート | `/reports`      | リメイクおすすめセクション（Part 2 で詳細記載） |

### 7.2 履歴詳細ページの変更

リメイクボタンの配置：既存のアクションボタン（編集、Instagram投稿等）の並びに「リメイク」ボタンを追加。

┌─────────────────────────────────────────────────────────────┐
│ 🔧 解決タイプ | 2026-03-15 │
│ │
│ [編集] [🔄 リメイク] [📸 Instagram投稿] [🗑️ 削除] │
│ │
│ ... （既存の投稿詳細表示） ... │
│ │
│ ┌─ 🔄 リメイク提案 ──────────────────── [AIで提案を生成] ──┐ │
│ │ │ │
│ │ （提案カードが表示される） │ │
│ │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ... （リメイク元情報があれば表示） ... │
│ │
│ ┌─ 🔄 リメイク元 ─────────────────────────────────────────┐ │
│ │ 🔧 解決タイプ | 2026-02-20 │ │
│ │ 「LINEの通知が来ない...」 [元投稿を見る] │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

7.3 投稿作成ページ（リメイクモード）のURL設計
/create?remakeFrom={postId}
/create?remakeFrom={postId}&suggestedType={typeSlug}&suggestedProfile={profileId}

| パラメータ         | 説明                                                 |
| ------------------ | ---------------------------------------------------- |
| `remakeFrom`       | リメイク元投稿ID（これがあるとリメイクモードになる） |
| `suggestedType`    | 提案された投稿タイプのslug（任意）                   |
| `suggestedProfile` | 提案されたプロフィールのID（任意）                   |

8. 型定義
   8.1 新規型定義

// src/types/remake.ts

export interface RemakeSuggestion {
id: string;
userId: string;
sourcePostId: string;
suggestedTypeSlug: string;
suggestedTypeName: string;
suggestedTypeIcon: string;
suggestedProfileId: string | null;
suggestedProfileName: string | null;
reason: string;
direction: string;
isUsed: boolean;
generatedFrom: 'detail' | 'report';
createdAt: string;
updatedAt: string;
}

export interface RemakeSuggestionRow {
id: string;
user_id: string;
source_post_id: string;
suggested_type_slug: string;
suggested_profile_id: string | null;
reason: string;
direction: string;
is_used: boolean;
generated_from: string;
created_at: string;
updated_at: string;
}

export function toRemakeSuggestion(
row: RemakeSuggestionRow,
typeName: string,
typeIcon: string,
profileName: string | null
): RemakeSuggestion;

8.2 既存型の変更

// src/types/create-flow.ts に追加

export interface CreateFormState {
// 既存フィールド
// ...

// 追加フィールド
isRemakeMode: boolean;
remakeSourceId: string | null;
remakeSourceCaption: string | null;
remakeSourcePostType: string | null;
}

// src/types/history-detail.ts に追加

export interface Post {
// 既存フィールド
// ...

// 追加フィールド
remake_source_id: string | null;
remake_source: {
id: string;
post_type: string;
generated_caption: string;
created_at: string;
} | null;
}

9. コンポーネント構成
   9.1 新規コンポーネント

src/components/
├── remake/
│ ├── remake-suggestions.tsx # リメイク提案セクション（履歴詳細用）
│ ├── remake-suggestion-card.tsx # 提案カード
│ ├── remake-suggestions-report.tsx # リメイクおすすめセクション（レポート用）
│ └── remake-source-info.tsx # リメイク元情報表示
├── create/
│ └── step-content-input-remake.tsx # リメイクモードの内容入力（元投稿参照表示）

## 9.2 変更コンポーネント

| コンポーネント                  | 変更内容                                              |
| ------------------------------- | ----------------------------------------------------- |
| `history/[id]/page.tsx`         | リメイクボタン + 提案セクション + リメイク元情報 追加 |
| `create/page.tsx`               | リメイクモード判定 + URLパラメータ処理 追加           |
| `create/step-post-type.tsx`     | 元タイプバッジ表示 追加                               |
| `create/step-content-input.tsx` | 元投稿キャプション参照表示 追加                       |
| `create/step-result.tsx`        | リメイク元情報表示 追加                               |
| `history/history-post-card.tsx` | リメイクバッジ表示 追加                               |

10. カスタムフック
    10.1 新規フック

// src/hooks/useRemakeSuggestions.ts

export function useRemakeSuggestions(sourcePostId?: string) {
// 提案一覧の取得
// 提案の生成（AI呼び出し）
// 提案の削除
// 提案の使用済みマーク
// ローディング状態管理
}

# Post Craft フェーズ5 要件定義書

---

## Part 1: 過去投稿リメイク機能（抜粋）

---

### 10.2 変更フック

| フック                  | 変更内容                         |
| ----------------------- | -------------------------------- |
| useContentGeneration.ts | リメイクモードの生成ロジック追加 |

---

### 11. 実装の注意点

#### 11.1 データの保全

- 既存の投稿履歴は絶対に削除しない
- `remake_source_id` は NULL 許可で追加し、既存データに影響を与えない
- リメイク元投稿が削除されても、リメイク投稿は残る（ON DELETE SET NULL）

#### 11.2 既存機能との共存

- リメイクモードでも「関連投稿参照」機能は独立して使用可能
- リメイクモードの判定は `CreateFormState.isRemakeMode` と URLパラメータ `remakeFrom` で行う
- リメイク提案は既存のアイデア提案（`post_ideas`）とは独立したテーブル・UIで管理

#### 11.3 後方互換性

- `remake_source_id` がない投稿は通常投稿として扱う
- 既存の投稿作成フローはそのまま動作する（リメイクモードはURLパラメータがある場合のみ）

---

### 12. テスト観点

#### 12.1 リメイク機能

| テスト項目       | 確認内容                                                  |
| ---------------- | --------------------------------------------------------- |
| リメイク開始     | 履歴詳細ページの「リメイク」ボタンで `/create` に遷移する |
| データ引き継ぎ   | 元投稿の入力テキスト・キャプションが正しくセットされる    |
| タイプ変更       | 別の投稿タイプを選択してキャプションが再生成される        |
| プロフィール変更 | 別のプロフィールを選択して必須ハッシュタグが反映される    |
| 画像再生成       | スタイル・アスペクト比を変更して画像が再生成される        |
| 新規保存         | リメイク投稿が新規投稿として保存される                    |
| リメイク元記録   | `remake_source_id` が正しく設定される                     |
| バッジ表示       | 履歴一覧・詳細ページでリメイクバッジが表示される          |
| 元投稿リンク     | 履歴詳細ページでリメイク元へのリンクが機能する            |
| 元投稿削除       | リメイク元が削除されてもリメイク投稿は残る                |

#### 12.2 リメイク提案

| テスト項目       | 確認内容                                                            |
| ---------------- | ------------------------------------------------------------------- |
| 履歴詳細での生成 | 「AIで提案を生成」ボタンで2件の提案が生成される                     |
| レポートでの生成 | 「AIで提案を生成」ボタンで3〜5件の提案が生成される                  |
| DB保存           | 生成された提案がDBに保存される                                      |
| 提案からリメイク | 「この案でリメイク」ボタンで正しいパラメータで `/create` に遷移する |
| 使用済みマーク   | リメイク実行後に提案が使用済みになる                                |
| 提案削除         | 不要な提案を削除できる                                              |

#### 12.3 既存機能への影響

| テスト項目   | 確認内容                                                  |
| ------------ | --------------------------------------------------------- |
| 通常投稿作成 | リメイクモードでない場合の投稿作成が正常に動作する        |
| 関連投稿参照 | リメイクモードでも関連投稿参照が独立して動作する          |
| 投稿履歴     | 既存の投稿が正常に表示される（`remake_source_id = NULL`） |
| アイデア提案 | 既存のアイデア提案機能が正常に動作する                    |

---

### 13. 用語集

| 用語           | 説明                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| リメイク       | 過去の投稿を別の投稿タイプ・プロフィールに変換して新規投稿を作成すること        |
| リメイク元     | リメイクの元になった投稿（`remake_source_id` で参照）                           |
| リメイク提案   | AIが提案するリメイク候補（`remake_suggestions` テーブルに保存）                 |
| リメイクモード | `/create` ページでリメイク元がセットされた状態                                  |
| 関連投稿参照   | 既存機能。投稿作成時に過去の投稿を参照し、導入文を生成する（`related_post_id`） |

---

### 14. 更新履歴

| 日付       | 内容                       | 担当   |
| ---------- | -------------------------- | ------ |
| 2026-03-22 | 初版作成（Phase 5 Part 1） | Claude |

---

<section_2>

Post Craft フェーズ5 要件定義書 Part 2: 投稿レポート
作成日: 2026-03-22 ステータス: 要件定義完了 フェーズ: Phase 5（過去投稿リメイク機能 + 投稿レポート）

---

### 1. この要件定義書の目的

#### 1.1 背景

42件の投稿履歴が蓄積されているが、投稿の傾向や偏りを把握する手段がない。投稿タイプ別の比率、プロフィール別の投稿数、投稿頻度、よく使うハッシュタグなどを可視化することで、投稿戦略の改善につなげたい。

#### 1.2 本書の位置づけ

| Part   | 機能                               | 要件定義書 |
| ------ | ---------------------------------- | ---------- |
| Part 1 | 過去投稿リメイク機能               | 別ファイル |
| Part 2 | 投稿レポート（分析ダッシュボード） | 本書       |
| Part 3 | 開発スケジュール・共通事項         | 別ファイル |

#### 1.3 変更しない部分

- 既存の分析機能（`/analysis`）— 競合分析・テンプレート自動生成のための分析
- 既存のダッシュボード（`/dashboard`）— 最近の投稿と統計表示
- 既存の投稿履歴データ

---

### 2. 機能要件

#### 2.1 機能一覧

| #   | 機能                       | 優先度 | 説明                                    |
| --- | -------------------------- | ------ | --------------------------------------- |
| 1   | 投稿レポートページ         | 必須   | サイドメニューに追加（📊 投稿レポート） |
| 2   | 投稿タイプ別分析           | 必須   | 投稿数・比率を円グラフで表示            |
| 3   | プロフィール別分析         | 必須   | 投稿数・比率を円グラフで表示            |
| 4   | 時系列投稿頻度             | 必須   | 週別・月別の投稿数を棒グラフで表示      |
| 5   | ハッシュタグランキング     | 必須   | よく使うハッシュタグのランキング表示    |
| 6   | 期間フィルター             | 必須   | 直近1ヶ月・3ヶ月・全期間の切り替え      |
| 7   | リメイクおすすめセクション | 必須   | AIリメイク提案の表示（Part 1 連携）     |

#### 2.2 技術スタック追加

| カテゴリ           | 技術     | 用途       |
| ------------------ | -------- | ---------- |
| チャートライブラリ | Recharts | グラフ描画 |

---

### 3. ページ設計

#### 3.1 ページ情報

| 項目          | 値                                                   |
| ------------- | ---------------------------------------------------- |
| パス          | `/reports`                                           |
| メニュー名    | 📊 投稿レポート                                      |
| メニュー位置  | サイドバーで 💡 アイデア の下                        |
| Server/Client | Client Component（期間フィルターでインタラクティブ） |

3.2 サイドメニューの変更

🏠 ダッシュボード
✏️ 投稿作成
📋 履歴
👤 キャラクター
🔍 分析
💡 アイデア
📊 投稿レポート ← 新規追加
⚙️ 設定

3.3 ページレイアウト

┌─────────────────────────────────────────────────────────────┐
│ 📊 投稿レポート │
│ │
│ 期間: [直近1ヶ月 ▼] [直近3ヶ月] [全期間] │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌─ 📈 サマリー ───────────────────────────────────────────┐ │
│ │ │ │
│ │ 総投稿数 投稿済み 未投稿 今月の投稿 │ │
│ │ 42 35 7 8 │ │
│ │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─ 投稿タイプ別 ─────────┐ ┌─ プロフィール別 ────────────┐ │
│ │ │ │ │ │
│ │ [円グラフ] │ │ [円グラフ] │ │
│ │ │ │ │ │
│ │ 🔧 解決: 15 (36%) │ │ 👵 シニア向け: 25 (60%) │ │
│ │ 💡 Tips: 10 (24%) │ │ 💼 ビジネス: 17 (40%) │ │
│ │ 📢 宣伝: 8 (19%) │ │ │ │
│ │ ✨ 実績: 5 (12%) │ │ │ │
│ │ 📖 お役立ち: 4 (9%) │ │ │ │
│ └─────────────────────────┘ └─────────────────────────────┘ │
│ │
│ ┌─ 📅 投稿頻度 ──────────────────────────────────────────┐ │
│ │ │ │
│ │ [棒グラフ: 週別 or 月別] │ │
│ │ │ │
│ │ 週別 / 月別 の切り替えタブ │ │
│ │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
│ ┌─ #️⃣ ハッシュタグランキング ────────────────────────────┐ │
│ │ │ │
│ │ 1. #パソコン教室 ████████████████████████ 35回 │ │
│ │ 2. #飯田市 ██████████████████████ 30回 │ │
│ │ 3. #AI活用 ████████████████ 22回 │ │
│ │ 4. #スマホ ██████████████ 20回 │ │
│ │ 5. #ChatGPT ████████████ 18回 │ │
│ │ ... │ │
│ │ TOP 15 を表示 │ │
│ │ │ │
└─────────────────────────────────────────────────
│ │
│ ┌─ 🔄 リメイクおすすめ ──────────────── [AIで提案を生成] ─┐ │
│ │ │ │
│ │ （Part 1 のリメイク提案セクション） │ │
│ │ │ │
│ └─────────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────┘

# 4. 各セクション仕様

## 4.1 サマリーカード

| カード値の算出 | アイコン                                        |
| -------------- | ----------------------------------------------- |
| 総投稿数       | 期間内の全投稿数 📝                             |
| 投稿済み       | `instagram_published = true` の投稿数 ✅        |
| 未投稿         | `instagram_published = false` の投稿数 ⏳       |
| 今月の投稿     | 当月の投稿数（期間フィルター無視、常に表示） 📅 |

## 4.2 投稿タイプ別分析

**表示形式:** 円グラフ（Recharts PieChart）+ 凡例リスト

**データ:**

- 投稿タイプごとの投稿数と比率
- 投稿タイプのアイコン + 名前で表示
- `post_type_id` が NULL（削除されたタイプ）の場合は「その他」にまとめる

色分け:

const TYPE_COLORS = [
'#3B82F6', // blue
'#10B981', // green
'#F59E0B', // amber
'#EF4444', // red
'#8B5CF6', // purple
'#EC4899', // pink
'#06B6D4', // cyan
'#F97316', // orange
'#6366F1', // indigo
'#14B8A6', // teal
];

4.3 プロフィール別分析
表示形式: 円グラフ（Recharts PieChart）+ 凡例リスト

データ:

・プロフィールごとの投稿数と比率
・プロフィールのアイコン + 名前で表示
・profile_id が NULL の場合は「未分類」にまとめる

4.4 時系列投稿頻度
表示形式: 棒グラフ（Recharts BarChart）+ 週別/月別切り替えタブ

週別表示:

・X軸: 週（例: 「3/10〜3/16」）
・Y軸: 投稿数
・期間フィルターに応じて表示範囲を調整

月別表示:

・X軸: 月（例: 「2026年1月」）
・Y軸: 投稿数
・期間フィルターに応じて表示範囲を調整

棒の色分け:

・単色（プライマリブルー #3B82F6）
・ホバー時にツールチップで詳細表示

4.5 ハッシュタグランキング
表示形式: 横棒グラフ風のランキングリスト

データ:

・全投稿の generated_hashtags を集計
・必須ハッシュタグを除外するオプション（トグル）
・TOP 15 を表示

UI:

┌─────────────────────────────────────────────────────────────┐
│#️⃣ ハッシュタグランキング │
│ │
│ □ 必須ハッシュタグを除外する │
│ │
│ 1. #パソコン教室 │
│ ████████████████████████████████████████ 35回 │
│ │
│ 2. #飯田市 │
│ ██████████████████████████████████ 30回 │
│ │
│ 3. #AI活用 │
│ ██████████████████████████ 22回 │
│ │
│ ... (TOP 15) │
└─────────────────────────────────────────────────

## 4.6 リメイクおすすめセクション

Part 1 で定義したリメイク提案セクション（投稿レポートページ版）を表示。詳細は Part 1 セクション 4.5 を参照。

## 5. 期間フィルター

### 5.1 フィルターオプション

| オプション | 値    | 説明                 |
| ---------- | ----- | -------------------- |
| 直近1ヶ月  | `1m`  | 現在日から30日前まで |
| 直近3ヶ月  | `3m`  | 現在日から90日前まで |
| 全期間     | `all` | 全投稿               |

### 5.2 フィルターの適用範囲

| セクション                                   | フィルター適用   |
| -------------------------------------------- | ---------------- |
| サマリーカード（総投稿数、投稿済み、未投稿） | ✅               |
| サマリーカード（今月の投稿）                 | ❌（常に当月）   |
| 投稿タイプ別分析                             | ✅               |
| プロフィール別分析                           | ✅               |
| 時系列投稿頻度                               | ✅               |
| ハッシュタグランキング                       | ✅               |
| リメイクおすすめ                             | ❌（全投稿対象） |

### 5.3 URL管理

期間フィルターは URL の `searchParams` で管理する。

/reports?period=1m
/reports?period=3m
/reports?period=all

デフォルトは `all`（全期間）。

## 6. データ取得

### 6.1 API設計

レポートデータは1つのAPIで一括取得する。

**GET /api/reports**

投稿レポート用の集計データを取得する。

**Query Parameters:**

| パラメータ | 型     | 必須 | 説明                                   |
| ---------- | ------ | ---- | -------------------------------------- |
| period     | string | No   | `1m`, `3m`, `all`（デフォルト: `all`） |

Response:

{
summary: {
totalPosts: number;
publishedPosts: number;
unpublishedPosts: number;
thisMonthPosts: number;
};

postTypeBreakdown: [
{
typeId: string | null;
typeName: string;
typeIcon: string;
count: number;
percentage: number;
}
];

profileBreakdown: [
{
profileId: string | null;
profileName: string;
profileIcon: string;
count: number;
percentage: number;
}
];

frequency: {
weekly: [
{
weekStart: string; // ISO date
weekEnd: string;
weekLabel: string; // "3/10〜3/16"
count: number;
}
];
monthly: [
{
month: string; // "2026-03"
monthLabel: string; // "2026年3月"
count: number;
}
];
};

hashtagRanking: [
{
hashtag: string;
count: number;
isRequired: boolean; // 必須ハッシュタグかどうか
}
];
}

6.2 集計ロジック
投稿タイプ別

SELECT
pt.id as type_id,
pt.name as type_name,
pt.icon as type_icon,
COUNT(p.id) as count
FROM posts p
LEFT JOIN post_types pt ON p.post_type_id = pt.id
WHERE p.user_id = $1
AND p.created_at >= $2 -- 期間フィルター
GROUP BY pt.id, pt.name, pt.icon
ORDER BY count DESC;

プロフィール別

SELECT
pr.id as profile_id,
pr.name as profile_name,
pr.icon as profile_icon,
COUNT(p.id) as count
FROM posts p
LEFT JOIN profiles pr ON p.profile_id = pr.id
WHERE p.user_id = $1
AND p.created_at >= $2
GROUP BY pr.id, pr.name, pr.icon
ORDER BY count DESC;

ハッシュタグ集計

// サーバーサイドで集計
function aggregateHashtags(posts: Post[]): HashtagCount[] {
const counts = new Map<string, number>();

for (const post of posts) {
for (const tag of post.generated_hashtags) {
const normalized = tag.startsWith('#') ? tag : `#${tag}`;
counts.set(normalized, (counts.get(normalized) || 0) + 1);
}
}

return Array.from(counts.entries())
.map(([hashtag, count]) => ({ hashtag, count }))
.sort((a, b) => b.count - a.count)
.slice(0, 15); // TOP 15
}

7. 画面設計（レスポンシブ）
   7.1 デスクトップ (lg: 1024px+)

┌──────────────────────────────────────────────┐
│ サマリーカード × 4（横並び） │
├──────────────────┬───────────────────────────┤
│ 投稿タイプ別 │ プロフィール別 │
│ (円グラフ) │ (円グラフ) │
├──────────────────┴───────────────────────────┤
│ 投稿頻度（棒グラフ） │
├──────────────────────────────────────────────┤
│ ハッシュタグランキング │
├──────────────────────────────────────────────┤
│ リメイクおすすめ │
└──────────────────────────────────────────────┘

7.2 モバイル (< 768px)

┌──────────────────────┐
│ サマリーカード × 4 │
│ (2×2グリッド) │
├──────────────────────┤
│ 投稿タイプ別 │
│ (円グラフ) │
├──────────────────────┤
│ プロフィール別 │
│ (円グラフ) │
├──────────────────────┤
│ 投稿頻度 │
│ (棒グラフ、横スクロール) │
├──────────────────────┤
│ ハッシュタグランキング │
├──────────────────────┤
│ リメイクおすすめ │
└──────────────────────┘

8. コンポーネント構成
   8.1 新規コンポーネント

src/components/
├── reports/
│ ├── reports-page-client.tsx # レポートページ本体（Client Component）
│ ├── period-filter.tsx # 期間フィルター
│ ├── summary-cards.tsx # サマリーカード × 4
│ ├── post-type-chart.tsx # 投稿タイプ別円グラフ
│ ├── profile-chart.tsx # プロフィール別円グラフ
│ ├── frequency-chart.tsx # 投稿頻度棒グラフ（週別/月別切り替え）
│ ├── hashtag-ranking.tsx # ハッシュタグランキング
│ └── reports-skeleton.tsx # ローディングスケルトン

8.2 新規ページ

src/app/(dashboard)/reports/
└── page.tsx # 投稿レポートページ

8.3 変更コンポーネント

コンポーネント 変更内容
dashboard/sidebar.tsx 📊 投稿レポートのメニュー項目追加
dashboard/mobile-nav.tsx 同上

9. 型定義
   9.1 新規型定義

// src/types/reports.ts

export type PeriodFilter = '1m' | '3m' | 'all';

export interface ReportSummary {
totalPosts: number;
publishedPosts: number;
unpublishedPosts: number;
thisMonthPosts: number;
}

export interface TypeBreakdown {
typeId: string | null;
typeName: string;
typeIcon: string;
count: number;
percentage: number;
}

export interface ProfileBreakdown {
profileId: string | null;
profileName: string;
profileIcon: string;
count: number;
percentage: number;
}

export interface WeeklyFrequency {
weekStart: string;
weekEnd: string;
weekLabel: string;
count: number;
}

export interface MonthlyFrequency {
month: string;
monthLabel: string;
count: number;
}

export interface FrequencyData {
weekly: WeeklyFrequency[];
monthly: MonthlyFrequency[];
}

export interface HashtagRank {
hashtag: string;
count: number;
isRequired: boolean;
}

export interface ReportData {
summary: ReportSummary;
postTypeBreakdown: TypeBreakdown[];
profileBreakdown: ProfileBreakdown[];
frequency: FrequencyData;
hashtagRanking: HashtagRank[];
}

10. Recharts 導入
    10.1 インストール

npm install recharts

## 10.2 使用コンポーネント

| Recharts コンポーネント                                         | 用途                                     |
| --------------------------------------------------------------- | ---------------------------------------- |
| `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`                  | 円グラフ（投稿タイプ別、プロフィール別） |
| `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid` | 棒グラフ（投稿頻度）                     |
| `ResponsiveContainer`                                           | レスポンシブ対応                         |

## 10.3 ダークテーマ対応

Recharts のデフォルトスタイルをダークテーマに合わせてカスタマイズする。

```typescript
// グラフ共通設定
const chartTheme = {
  textColor: '#94A3B8', // slate-400
  gridColor: 'rgba(255, 255, 255, 0.05)',
  tooltipBg: '#1E293B', // slate-800
  tooltipBorder: 'rgba(255, 255, 255, 0.1)',
};
```

## 11. ミドルウェア変更

`/reports` パスを認証必須に追加する。

```typescript
// src/middleware.ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/history/:path*',
    '/characters/:path*',
    '/settings/:path*',
    '/analysis/:path*',
    '/ideas/:path*',
    '/reports/:path*', // 追加
  ],
};
```

## 12. テスト観点

### 12.1 レポートページ

| テスト項目             | 確認内容                                      |
| ---------------------- | --------------------------------------------- |
| ページ表示             | `/reports` にアクセスしてレポートが表示される |
| サマリーカード         | 正しい数値が表示される                        |
| 投稿タイプ別           | 円グラフと凡例が正しく表示される              |
| プロフィール別         | 円グラフと凡例が正しく表示される              |
| 時系列頻度             | 棒グラフが正しく表示される                    |
| 週別/月別切り替え      | タブ切り替えでグラフが変わる                  |
| ハッシュタグランキング | TOP 15 が正しい順序で表示される               |
| 必須タグ除外           | トグルで必須ハッシュタグが除外される          |

### 12.2 期間フィルター

| テスト項目 | 確認内容                         |
| ---------- | -------------------------------- |
| デフォルト | 全期間で表示される               |
| 1ヶ月      | 直近30日の投稿のみ集計される     |
| 3ヶ月      | 直近90日の投稿のみ集計される     |
| URL管理    | `?period=1m` 等がURLに反映される |
| リロード   | URLのフィルターが維持される      |

### 12.3 レスポンシブ

| テスト項目   | 確認内容                                 |
| ------------ | ---------------------------------------- |
| デスクトップ | 2カラムレイアウトが正しく表示される      |
| モバイル     | 1カラムレイアウトに切り替わる            |
| グラフサイズ | 画面サイズに応じてグラフがリサイズされる |

### 12.4 リメイクおすすめ連携

| テスト項目   | 確認内容                            |
| ------------ | ----------------------------------- |
| 提案生成     | レポートページから提案が生成される  |
| リメイク遷移 | 提案から `/create` に正しく遷移する |

## 13. パフォーマンス考慮

### 13.1 データ量

| 項目           | 現在   | 将来想定 |
| -------------- | ------ | -------- |
| 投稿数         | 42件   | 〜500件  |
| 投稿タイプ数   | 最大10 | 10       |
| プロフィール数 | 最大5  | 5        |

42件の現時点ではパフォーマンス問題は発生しないが、将来の増加に備えてDBレベルでの集計を基本とする。

### 13.2 キャッシュ戦略

- レポートデータは `useState` + `useEffect` でクライアントサイドキャッシュ
- 期間フィルター変更時のみ再取得
- 投稿作成・削除後に自動リフレッシュは不要（手動リロードで最新化）

## 14. 更新履歴

| 日付       | 内容                       | 担当   |
| ---------- | -------------------------- | ------ |
| 2026-03-22 | 初版作成（Phase 5 Part 2） | Claude |

---

# Post Craft フェーズ5 要件定義書 Part 3: 開発スケジュール・共通事項

- **作成日:** 2026-03-22
- **ステータス:** 要件定義完了
- **フェーズ:** Phase 5（過去投稿リメイク機能 + 投稿レポート）

---

## 1. Phase 5 全体構成

| Part   | 内容                       | 要件定義書                        |
| ------ | -------------------------- | --------------------------------- |
| Part 1 | 過去投稿リメイク機能       | PostCraft_Phase5_Part1_Remake.md  |
| Part 2 | 投稿レポート               | PostCraft_Phase5_Part2_Reports.md |
| Part 3 | 開発スケジュール・共通事項 | 本書                              |

---

## 2. 開発スケジュール

### 2.1 フェーズ分け

| #   | 内容                                                         | 期間目安                  | 依存   |
| --- | ------------------------------------------------------------ | ------------------------- | ------ |
| 1   | DB変更（posts カラム追加 + remake_suggestions テーブル作成） | 0.5日                     | なし   |
| 2   | Recharts 導入 + チャート共通設定                             | 0.5日                     | なし   |
| 3   | レポートAPI（/api/reports）実装                              | 1日                       | #1     |
| 4   | レポートページUI（サマリー + グラフ4種）                     | 2日                       | #2, #3 |
| 5   | 期間フィルター実装                                           | 0.5日                     | #4     |
| 6   | リメイク基本機能（履歴詳細ボタン + /create リメイクモード）  | 2日                       | #1     |
| 7   | リメイク提案API（/api/remake/suggestions）実装               | 1日                       | #1     |
| 8   | リメイク提案UI（履歴詳細 + レポートページ）                  | 1.5日                     | #7     |
| 9   | 既存API変更（/api/posts の remake_source_id 対応）           | 0.5日                     | #1     |
| 10  | 履歴ページのリメイクバッジ + リメイク元表示                  | 0.5日                     | #9     |
| 11  | サイドメニュー・ミドルウェア更新                             | 0.5日                     | #4     |
| 12  | テスト・デバッグ                                             | 2日                       | 全て   |
|     | **合計**                                                     | **約12.5日（約2.5週間）** |        |

### 2.2 並行開発可能な作業

```
Week 1:
  ├── #1 DB変更 (0.5日)
  ├── #2 Recharts導入 (0.5日)
  ├── #3 レポートAPI (1日)        ← #1完了後
  ├── #6 リメイク基本機能 (2日)    ← #1完了後
  └── #9 既存API変更 (0.5日)      ← #1完了後

Week 2:
  ├── #4 レポートページUI (2日)    ← #2,#3完了後
  ├── #5 期間フィルター (0.5日)    ← #4完了後
  ├── #7 リメイク提案API (1日)     ← #1完了後
  ├── #8 リメイク提案UI (1.5日)    ← #7完了後
  ├── #10 履歴バッジ (0.5日)       ← #9完了後
  └── #11 メニュー更新 (0.5日)

Week 3:
  └── #12 テスト・デバッグ (2日)
```

---

## 3. 環境変数

Phase 5 で追加の環境変数は不要。既存の `GOOGLE_AI_API_KEY` でリメイク提案のAI生成に対応。

---

## 4. パッケージ追加

```bash
npm install recharts
```

他の追加パッケージは不要。

---

## 5. データベース変更まとめ

### 5.1 既存テーブル変更

| テーブル | 変更                        | SQL                                                                                           |
| -------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| posts    | remake_source_id カラム追加 | `ALTER TABLE posts ADD COLUMN remake_source_id UUID REFERENCES posts(id) ON DELETE SET NULL;` |

### 5.2 新規テーブル

| テーブル           | 説明                                         |
| ------------------ | -------------------------------------------- |
| remake_suggestions | AIリメイク提案（Part 1 セクション 5.2 参照） |

### 5.3 マイグレーション手順

```sql
-- Step 1: バックアップ
CREATE TABLE posts_backup_phase5 AS SELECT * FROM posts;

-- Step 2: posts テーブルにカラム追加
ALTER TABLE posts
ADD COLUMN remake_source_id UUID REFERENCES posts(id) ON DELETE SET NULL;

CREATE INDEX idx_posts_remake_source_id ON posts(remake_source_id);

-- Step 3: remake_suggestions テーブル作成
CREATE TABLE remake_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  source_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  suggested_type_slug TEXT NOT NULL,
  suggested_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  direction TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  generated_from TEXT NOT NULL DEFAULT 'detail',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_remake_suggestions_user_id ON remake_suggestions(user_id);
CREATE INDEX idx_remake_suggestions_source_post_id ON remake_suggestions(source_post_id);

-- Step 4: RLS
ALTER TABLE remake_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own remake suggestions"
  ON remake_suggestions FOR ALL
  USING ((SELECT auth.uid())::text = user_id::text);

-- Step 5: 検証
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'remake_source_id';

SELECT count(*) FROM remake_suggestions;
```

### 5.4 ロールバック手順

```sql
-- remake_suggestions テーブル削除
DROP TABLE IF EXISTS remake_suggestions;

-- posts カラム削除
ALTER TABLE posts DROP COLUMN IF EXISTS remake_source_id;

-- バックアップから復元（必要な場合）
-- DROP TABLE posts;
-- ALTER TABLE posts_backup_phase5 RENAME TO posts;
```

---

## 6. API一覧まとめ

### 6.1 新規API

| メソッド | パス                         | 説明                   | Part   |
| -------- | ---------------------------- | ---------------------- | ------ |
| GET      | /api/reports                 | レポート集計データ取得 | Part 2 |
| POST     | /api/remake/suggestions      | リメイク提案AI生成     | Part 1 |
| GET      | /api/remake/suggestions      | リメイク提案一覧取得   | Part 1 |
| PATCH    | /api/remake/suggestions/[id] | リメイク提案更新       | Part 1 |
| DELETE   | /api/remake/suggestions/[id] | リメイク提案削除       | Part 1 |

### 6.2 変更API

| メソッド | パス                        | 変更内容                            | Part   |
| -------- | --------------------------- | ----------------------------------- | ------ |
| POST     | /api/posts                  | remakeSourceId フィールド追加       | Part 1 |
| PATCH    | /api/posts/[id]             | remake_source_id ホワイトリスト追加 | Part 1 |
| GET      | /api/posts, /api/posts/[id] | remake_source JOIN追加              | Part 1 |

---

## 7. ファイル構成まとめ

### 7.1 新規ファイル

```
src/
├── app/(dashboard)/
│   └── reports/
│       └── page.tsx                         # 投稿レポートページ
│
├── api/
│   ├── reports/
│   │   └── route.ts                         # レポート集計API
│   └── remake/
│       └── suggestions/
│           ├── route.ts                     # 提案一覧・生成API
│           └── [id]/
│               └── route.ts                 # 提案更新・削除API
│
├── components/
│   ├── reports/
│   │   ├── reports-page-client.tsx          # レポートページ本体
│   │   ├── period-filter.tsx                # 期間フィルター
│   │   ├── summary-cards.tsx                # サマリーカード
│   │   ├── post-type-chart.tsx              # 投稿タイプ別円グラフ
│   │   ├── profile-chart.tsx                # プロフィール別円グラフ
│   │   ├── frequency-chart.tsx              # 投稿頻度棒グラフ
│   │   ├── hashtag-ranking.tsx              # ハッシュタグランキング
│   │   └── reports-skeleton.tsx             # ローディングスケルトン
│   └── remake/
│       ├── remake-suggestions.tsx           # 提案セクション（履歴詳細用）
│       ├── remake-suggestion-card.tsx       # 提案カード
│       ├── remake-suggestions-report.tsx    # 提案セクション（レポート用）
│       └── remake-source-info.tsx           # リメイク元情報表示
│
├── hooks/
│   └── useRemakeSuggestions.ts              # リメイク提案フック
│
├── types/
│   ├── remake.ts                            # リメイク関連型定義
│   └── reports.ts                           # レポート関連型定義
│
└── lib/
    └── remake-prompts.ts                    # リメイク提案AIプロンプト
```

### 7.2 変更ファイル

| ファイル                                     | 変更内容                                         |
| -------------------------------------------- | ------------------------------------------------ |
| src/app/(dashboard)/layout.tsx               | サイドバーに 📊 投稿レポート 追加                |
| src/app/(dashboard)/history/[id]/page.tsx    | リメイクボタン + 提案セクション + リメイク元情報 |
| src/app/(dashboard)/create/page.tsx          | リメイクモード判定 + URLパラメータ処理           |
| src/components/create/step-post-type.tsx     | 元タイプバッジ表示                               |
| src/components/create/step-content-input.tsx | 元投稿キャプション参照表示                       |
| src/components/create/step-result.tsx        | リメイク元情報表示                               |
| src/components/history/history-post-card.tsx | リメイクバッジ表示                               |
| src/components/dashboard/sidebar.tsx         | メニュー項目追加                                 |
| src/components/dashboard/mobile-nav.tsx      | メニュー項目追加                                 |
| src/hooks/useContentGeneration.ts            | リメイクモードの生成ロジック                     |
| src/types/create-flow.ts                     | CreateFormState にリメイクフィールド追加         |
| src/types/history-detail.ts                  | Post に remake_source_id 追加                    |
| src/types/supabase.ts                        | DB型定義更新                                     |
| src/middleware.ts                            | /reports パス追加                                |
| src/app/api/posts/route.ts                   | remakeSourceId 対応                              |
| src/app/api/posts/[id]/route.ts              | remake_source_id ホワイトリスト + JOIN           |

---

## 8. 認証ヘルパー追加

```typescript
// src/lib/api-utils.ts に追加

export async function requireRemakeSuggestionOwnership(
  id: string,
  userId: string,
): Promise<{ error?: NextResponse; suggestion?: RemakeSuggestionRow }> {
  // ...
}
```

---

## 9. 全体テスト観点まとめ

### 9.1 統合テスト

| テスト項目                    | 確認内容                                         |
| ----------------------------- | ------------------------------------------------ |
| リメイク → レポート           | リメイク投稿がレポートの集計に反映される         |
| 提案 → リメイク → 使用済み    | 提案からリメイクを実行すると提案が使用済みになる |
| 期間フィルター → 各グラフ     | フィルター変更で全グラフが更新される             |
| 投稿削除 → レポート           | 投稿削除後にレポートの数値が更新される           |
| リメイク元削除 → リメイク投稿 | リメイク元が削除されてもリメイク投稿は残る       |

### 9.2 エッジケース

| テスト項目             | 確認内容                                     |
| ---------------------- | -------------------------------------------- |
| 投稿0件                | レポートページで空状態が表示される           |
| 投稿タイプ削除済み     | 「その他」にまとめられる                     |
| プロフィール未設定     | 「未分類」にまとめられる                     |
| リメイクの連鎖         | A→B→C のようにリメイクを重ねても正常動作する |
| 提案のプロフィール削除 | ON DELETE SET NULL で NULL になる            |

---

## 10. 将来の拡張（Phase 6 以降）

| 機能                          | 説明                                                           |
| ----------------------------- | -------------------------------------------------------------- |
| Instagramエンゲージメント分析 | Graph API からいいね・コメント・リーチを取得してレポートに統合 |
| AIによる投稿戦略アドバイス    | レポートデータを元にAIが改善提案                               |
| リメイク自動提案通知          | 定期的にリメイク候補を通知                                     |
| エクスポート機能              | レポートデータをCSV/PDFでエクスポート                          |
| 類似投稿チェック              | 新規投稿作成時に過去投稿との類似度をチェック                   |

---

## 11. 用語集（Phase 5 全体）

| 用語           | 説明                                                                     |
| -------------- | ------------------------------------------------------------------------ |
| リメイク       | 過去の投稿を別の投稿タイプ・プロフィールに変換して新規投稿を作成すること |
| リメイク元     | リメイクの元になった投稿（remake_source_id で参照）                      |
| リメイク提案   | AIが提案するリメイク候補（remake_suggestions テーブルに保存）            |
| リメイクモード | /create ページでリメイク元がセットされた状態                             |
| 投稿レポート   | 投稿データの集計・可視化ページ（/reports）                               |
| 期間フィルター | レポートの集計期間を切り替える機能（1ヶ月/3ヶ月/全期間）                 |
| 関連投稿参照   | 既存機能。投稿作成時に過去投稿を参照する機能（related_post_id）          |

---

## 12. 関連ドキュメント

| ドキュメント                       | 説明                                       |
| ---------------------------------- | ------------------------------------------ |
| PostCraft_Phase5_Part1_Remake.md   | Part 1: 過去投稿リメイク機能               |
| PostCraft_Phase5_Part2_Reports.md  | Part 2: 投稿レポート                       |
| PostCraft_Phase5_Part3_Schedule.md | Part 3: 開発スケジュール・共通事項（本書） |
| PostCraft_Phase4_Spec.md           | Phase 4 完了時点の全体仕様書               |

---

## 13. 更新履歴

| 日付       | 内容                       | 担当   |
| ---------- | -------------------------- | ------ |
| 2026-03-22 | 初版作成（Phase 5 Part 3） | Claude |
