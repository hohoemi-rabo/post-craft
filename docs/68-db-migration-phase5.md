# 68: Phase 5 DBマイグレーション

**ステータス**: 完了
**Phase**: 5
**依存**: なし

## 概要

Phase 5 に必要なDB変更を実施する。

## 作業内容

### posts テーブル
- `remake_source_id` カラム追加（UUID FK → posts.id, ON DELETE SET NULL）
- インデックス作成

### remake_suggestions テーブル（新規）
- AIリメイク提案を保存するテーブル
- カラム: id, user_id, source_post_id, suggested_type_slug, suggested_profile_id, reason, direction, is_used, generated_from, created_at, updated_at
- RLS有効化、インデックス作成

### 型定義更新
- `src/types/supabase.ts` に remake_suggestions の Row/Insert/Update 型追加
- posts の Row に `remake_source_id` 追加

## Todo

- [x] posts テーブルに remake_source_id カラム追加
- [x] remake_suggestions テーブル作成
- [x] RLS ポリシー設定
- [x] インデックス作成
- [x] supabase.ts 型定義更新
- [x] ビルド確認
