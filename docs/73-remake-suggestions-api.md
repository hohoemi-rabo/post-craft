# 73: リメイク提案API

**ステータス**: 完了
**Phase**: 5
**依存**: #68, #69

## 概要

AIリメイク提案の生成・取得・更新・削除APIを実装する。

## 作業内容

### 新規: /api/remake/suggestions/route.ts

#### POST（提案生成）
- `{ sourcePostId?, context: 'detail' | 'report' }`
- detail: 指定投稿に対する提案を2件生成
- report: 全投稿から候補を選んで3〜5件生成
- 利用可能な投稿タイプ・プロフィール一覧をプロンプトに含める
- 生成結果を remake_suggestions テーブルに保存

#### GET（一覧取得）
- `?sourcePostId=xxx` で特定投稿の提案を取得
- `?context=detail|report` でフィルター
- `?includeUsed=true` で使用済みも含める
- 投稿タイプ名・アイコン、プロフィール名を別途取得して付与

### 新規: /api/remake/suggestions/[id]/route.ts

#### PATCH（更新）
- `{ isUsed?: boolean }` で使用済みマーク

#### DELETE（削除）
- 提案を削除

### 新規: src/lib/remake-prompts.ts
- 履歴詳細用プロンプト（単一投稿 → 2件提案）
- レポート用プロンプト（全投稿 → 3〜5件提案）

## Todo

- [x] src/lib/remake-prompts.ts 作成
- [x] POST /api/remake/suggestions 実装（detail + report）
- [x] GET /api/remake/suggestions 実装
- [x] PATCH /api/remake/suggestions/[id] 実装
- [x] DELETE /api/remake/suggestions/[id] 実装
- [x] ビルド確認
