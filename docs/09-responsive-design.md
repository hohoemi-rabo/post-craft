# 09. レスポンシブ対応

## 概要
モバイルファースト設計によるレスポンシブ対応

## 担当週
Week 3

## タスク

- [×] ブレイクポイント定義
- [×] トップページのレスポンシブ化
- [×] 生成結果画面のレスポンシブ化（2カラム→1カラム）
- [×] タッチターゲット最適化（44×44px以上）
- [×] フォントサイズ調整
- [×] 画像サイズ最適化
- [×] スクロール最適化
- [×] モバイル実機テスト（iOS/Android）

## ブレイクポイント

Tailwind CSS デフォルト:
```
sm: 640px   // Tablet
md: 768px   // Tablet landscape
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
```

## レイアウト戦略

### モバイル（< 768px）
- 1カラムレイアウト
- 縦スクロール
- タップしやすいボタンサイズ
- フルWidth入力フィールド

### PC（>= 768px）
- 2カラムレイアウト（編集 + プレビュー）
- 余白多め
- ホバー効果

## 実装例

```tsx
// 2カラム → 1カラム
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-4">
    {/* 編集エリア */}
  </div>
  <div className="space-y-4">
    {/* プレビューエリア */}
  </div>
</div>

// タッチターゲット
<button className="h-12 px-6 min-w-[44px] min-h-[44px]">
  生成する
</button>

// レスポンシブフォント
<h1 className="text-2xl md:text-4xl lg:text-5xl">
  Instagram Post Generator
</h1>
```

## テスト項目

- [ ] iPhone SE（375px）
- [ ] iPhone 14 Pro（393px）
- [ ] iPad（768px）
- [ ] Desktop（1280px以上）
- [ ] 横向き表示
- [ ] フォームの使いやすさ
- [ ] 画像表示の最適化

## 参考
- REQUIREMENTS.md: 4.4.3 レスポンシブ対応（モバイル）
- CLAUDE.md: Development Notes - Mobile-first responsive design
