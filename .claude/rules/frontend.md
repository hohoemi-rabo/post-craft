# Frontend Rules

React, Tailwind CSS, UIコンポーネントのルール。

## コンポーネント設計

### ディレクトリ構造
```
components/
├── ui/           # 汎用UIコンポーネント (button, input, card等)
├── layout/       # レイアウト (header, footer, sidebar)
├── dashboard/    # ダッシュボード専用
├── create/       # 投稿作成専用
├── history/      # 履歴編集モーダル (post-edit-modal, image-regenerate-modal)
├── characters/   # キャラクター管理専用
├── settings/     # 設定 (post-type-list, post-type-form, profile-list, profile-form)
└── providers/    # Context Providers
```

### 命名規則
- ファイル: `kebab-case.tsx` (例: `post-type-selector.tsx`)
- コンポーネント: `PascalCase` (例: `PostTypeSelector`)
- Props型: `コンポーネント名Props` (例: `ButtonProps`)

## Tailwind CSS

### content 設定
```typescript
// tailwind.config.ts
content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"]
```
**注意**: `src/lib/` にも Tailwind クラスを返す関数がある（`getAspectClass` 等）。
`content` に `src/` 配下全体を含めないと、動的に生成されるクラスが CSS に出力されない。

### カラーパレット
```css
/* 現在のダークテーマ */
--background: slate-950 → slate-900 グラデーション
--text-primary: white
--text-secondary: slate-400
--border: white/10
--primary: blue-500
--success: green-500
--error: red-500
```

### レスポンシブ
```
モバイル: < 768px (デフォルト)
タブレット: md (768px+)
デスクトップ: lg (1024px+)
```

モバイルファースト設計：
```tsx
// ✅ Good
<div className="flex flex-col md:flex-row">

// ❌ Bad
<div className="flex flex-row md:flex-col">
```

### タッチターゲット
最小サイズ: 44×44px
```tsx
<button className="min-h-[44px] min-w-[44px] p-3">
```

## UIコンポーネント

### Button
```tsx
import { Button } from '@/components/ui/button'

<Button variant="primary">送信</Button>
<Button variant="secondary">キャンセル</Button>
<Button variant="ghost">閉じる</Button>
<Button disabled loading>処理中...</Button>
```

### Input / Textarea
```tsx
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

<Input placeholder="URL" error={errors.url} />
<Textarea maxLength={10000} showCount />
```

### Card
```tsx
import { Card } from '@/components/ui/card'

<Card>
  <Card.Header>タイトル</Card.Header>
  <Card.Content>内容</Card.Content>
</Card>
```

### Toast
```tsx
import { useToast } from '@/components/ui/toast'

const { showToast } = useToast()
showToast({ type: 'success', message: '保存しました' })
showToast({ type: 'error', message: 'エラーが発生しました' })
```

## フォント

```tsx
// next/font で設定済み
import { Poppins, M_PLUS_Rounded_1c } from 'next/font/google'

// 英語: Poppins
// 日本語: M PLUS Rounded 1c
```

## アイコン

絵文字を使用（外部ライブラリ不要）:
```tsx
// 投稿タイプ（DB管理: post_types テーブルの icon カラム）
// ビルトインデフォルト: 🔧📢💡✨📖🛠️📸
// ユーザーが設定画面で自由に変更可能

// ナビゲーション
🏠 ダッシュボード
✏️ 新規作成
📋 履歴
👤 キャラクター
⚙️ 設定
```

## 状態管理

React Context + useState を使用（Zustand は使わない）:
```tsx
// providers/providers.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>
  )
}
```

## カスタムフック

### ディレクトリ構造
```
hooks/
├── useContentGeneration.ts   # 投稿作成の生成ロジック
├── useGenerationSteps.ts     # 生成ステップ進捗管理
├── usePostEdit.ts            # 履歴詳細の編集モード
├── useCopyActions.ts         # コピー機能
├── usePostActions.ts         # 投稿アクション
├── usePostImageHandlers.ts   # 画像ハンドラ
├── usePostTypes.ts           # 投稿タイプ CRUD・並び替え・有効/無効
├── useProfiles.ts            # プロフィール CRUD・並び替え
└── useUserSettings.ts        # ユーザー設定（必須ハッシュタグ等）
```

### 命名規則
- ファイル: `use[機能名].ts` (例: `usePostEdit.ts`)
- フック: `use[機能名]` (例: `usePostEdit`)
- 戻り値の型を明示する

### 使用例
```tsx
// 履歴詳細ページでの使用
const editHook = usePostEdit(id, post, setPost)
const copyActions = useCopyActions(copyTarget)
const postActions = usePostActions(id, post)
const imageHandlers = usePostImageHandlers(setPost, editHook.setShowImageReplace)

// フックからの値・関数を使用
{editHook.isEditing && <EditMode />}
<button onClick={copyActions.copyCaption}>コピー</button>
```

### 設計原則
- 1つのフックは1つの責務に集中
- ページコンポーネントは500行以下を目標
- 複雑なロジックはフックに抽出して再利用可能に

## アニメーション

最小限に抑える（Framer Motion は使わない）:
```tsx
// Tailwind の transition を使用
<div className="transition-all duration-200 hover:scale-105">
```

## アクセシビリティ

```tsx
// ラベル必須
<label htmlFor="email">メールアドレス</label>
<input id="email" type="email" aria-describedby="email-error" />
<span id="email-error" role="alert">{error}</span>

// フォーカス表示
<button className="focus:ring-2 focus:ring-blue-500 focus:outline-none">
```
