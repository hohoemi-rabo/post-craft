# チケット #25: データ移行

> Phase 3 | 優先度: 高 | 依存: #24

## 概要

既存7投稿タイプを `post_types` テーブルに挿入し、既存投稿の `post_type_id` を設定し、必須ハッシュタグを `user_settings` に登録する。

⚠️ **既存の投稿履歴は絶対に残す。慎重なデータ移行を行う。**

SPEC-PHASE3.md セクション 6 に準拠。

## データソース

| ソース | 内容 |
|--------|------|
| `src/lib/post-types.ts` の `POST_TYPES` | 7タイプの基本情報（name, icon, description, charRange, requiredFields 等） |
| `src/lib/templates.ts` の `TEMPLATES` | 7タイプのテンプレート構造 |
| `src/lib/templates.ts` の `FIELD_LABELS` | プレースホルダーのラベル |
| `src/app/api/generate/caption/route.ts` L225 | 必須ハッシュタグ4個 |

## 移行手順

### Step 1: バックアップ
```sql
CREATE TABLE posts_backup AS SELECT * FROM posts;
```

### Step 2: 7タイプを post_types に挿入

各タイプの `template_structure` は `TEMPLATES` から、`placeholders` は `requiredFields` + `FIELD_LABELS` から JSONB 化して挿入。

移行対象タイプ:
1. solution（解決タイプ）- min:200, max:300, 変数5個
2. promotion（宣伝タイプ）- min:200, max:400, 変数5個
3. tips（AI活用タイプ）- min:200, max:350, 変数5個
4. showcase（実績タイプ）- min:200, max:400, 変数4個
5. useful（お役立ちタイプ）- min:200, max:350, 変数7個
6. howto（使い方タイプ）- min:300, max:500, 変数11個
7. image_read（画像読み取り）- min:200, max:400, 変数3個

### Step 3: 既存投稿の紐付け
```sql
UPDATE posts p
SET post_type_id = pt.id
FROM post_types pt
WHERE p.post_type = pt.slug AND p.user_id = pt.user_id;
```

### Step 4: 必須ハッシュタグを登録
```sql
INSERT INTO user_settings (user_id, required_hashtags)
VALUES ('USER_ID', ARRAY['#ほほ笑みラボ', '#飯田市', '#パソコン教室', '#スマホ']);
```

### Step 5: 検証

```sql
-- NULLの投稿がないことを確認
SELECT COUNT(*) FROM posts WHERE post_type_id IS NULL AND user_id = 'USER_ID';

-- 全タイプの件数確認
SELECT pt.name, COUNT(p.id) FROM post_types pt
LEFT JOIN posts p ON p.post_type_id = pt.id
GROUP BY pt.name;
```

## ロールバック手順

```sql
ALTER TABLE posts DROP COLUMN post_type_id;
DROP TABLE IF EXISTS post_types;
DROP TABLE IF EXISTS user_settings;
```

## 受入条件

- 7タイプが `post_types` テーブルに正しく存在する
- 全既存投稿の `post_type_id` が設定されている（NULLゼロ）
- `user_settings` に必須ハッシュタグ4個が登録されている
- 既存投稿の他カラム（caption, hashtags, input_text等）が一切変更されていない
- ロールバック手順がドキュメント化されている

## TODO

- [x] バックアップテーブル `posts_backup` を作成
- [x] 7タイプの投稿タイプデータを準備（template_structure, placeholders JSONB）
- [x] `post_types` テーブルに7タイプを INSERT
- [x] 既存投稿の `post_type_id` を紐付け UPDATE（13件全て紐付け完了）
- [x] `user_settings` に必須ハッシュタグを INSERT（4個）
- [x] 検証SQL: 全投稿に `post_type_id` が設定されていることを確認（NULL: 0）
- [x] 検証SQL: 7タイプが正しく存在することを確認
- [x] 検証: 既存投稿の他カラムが変更されていないことを確認（posts_backup: 13件）
- [x] ロールバック手順をドキュメント化
