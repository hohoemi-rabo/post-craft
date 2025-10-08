# 02. UIコンポーネント・デザインシステム

## 概要
共通UIコンポーネントの作成とデザインシステムの構築

## 担当週
Week 1

## タスク

- [ ] カラーパレット定義（Tailwind config）
- [ ] Typography設定（フォントサイズ、行間）
- [ ] ボタンコンポーネント
- [ ] 入力フィールドコンポーネント
- [ ] テキストエリアコンポーネント
- [ ] カードコンポーネント
- [ ] ローディングスピナー
- [ ] トーストメッセージ
- [ ] モーダルコンポーネント

## デザイン仕様

### カラーパレット
```typescript
// tailwind.config.ts
colors: {
  primary: '#3B82F6',
  background: '#FFFFFF',
  'text-primary': '#1F2937',
  'text-secondary': '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  error: '#EF4444',
}
```

### 画像生成用背景色
```typescript
const bgColors = [
  '#1E293B', // Dark Navy
  '#334155', // Gray
  '#F5F5F5', // Light Gray
]
```

### タッチターゲット
- 最小サイズ: 44×44px（モバイル）

## ディレクトリ構造
```
src/
├── components/
│   ├── ui/              # 共通UIコンポーネント
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── spinner.tsx
│   │   ├── toast.tsx
│   │   └── modal.tsx
│   └── ...
```

## 参考
- REQUIREMENTS.md: 4. UI/UXデザイン
- CLAUDE.md: Architecture & Design System
