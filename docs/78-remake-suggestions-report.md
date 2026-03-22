# 78: レポートページのリメイクおすすめセクション

**ステータス**: 未着手
**Phase**: 5
**依存**: #73, #77

## 概要

投稿レポートページに「リメイクおすすめ」セクションを追加する。全投稿からAIが3〜5件のリメイク候補を提案する。

## 作業内容

### 新規: src/components/remake/remake-suggestions-report.tsx
- レポートページ用のリメイク提案セクション
- 「AIで提案を生成」ボタン
- 各提案カードに元投稿の概要 + 提案先タイプ・プロフィール + 理由
- 「この案でリメイク」→ `/create?remakeFrom={postId}&suggestedType={slug}&suggestedProfile={profileId}`
- 「元投稿を見る」→ `/history/{postId}`

### レポートページとの統合
- reports-page-client.tsx の最下部にリメイクおすすめセクション配置
- 期間フィルターの影響を受けない（全投稿対象）
- `useRemakeSuggestions` フックを `context: 'report'` で使用

## Todo

- [ ] remake-suggestions-report.tsx 作成
- [ ] reports-page-client.tsx にセクション追加
- [ ] 提案カードのUI（元投稿概要 + 提案内容 + アクション）
- [ ] ビルド確認
