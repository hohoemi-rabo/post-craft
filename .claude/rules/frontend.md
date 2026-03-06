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
├── history/      # 履歴一覧・編集 (post-list, post-list-client, post-card, post-detail-client, filter, delete-button, skeleton等)
├── analysis/     # 分析機能 (wizard, report, generation-preview, profile-preview, posttype-preview-card等)
├── characters/   # キャラクター管理 (characters-client等)
├── settings/     # 設定 (post-type-list, post-type-form, profile-list, profile-detail-client等)
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
import Button from '@/components/ui/button'

<Button variant="primary">送信</Button>
<Button variant="secondary">キャンセル</Button>
<Button variant="ghost">閉じる</Button>
<Button loading>処理中...</Button>  {/* loading 中は自動で disabled + スピナー表示 */}
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
showToast('保存しました', 'success')
showToast('エラーが発生しました', 'error')
```

### 投稿バッジ表示（ダッシュボード・履歴共通）
投稿一覧で表示するバッジは、ダッシュボード（最近の投稿）と履歴ページで統一:
```tsx
// 投稿タイプ: アイコン + 名前
<span className="text-lg">{typeIcon}</span>
<span className="text-sm font-medium text-white">{typeName}</span>

// 画像スタイル（紫）
<span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">...</span>

// プロフィール（青）
<span className="px-2 py-0.5 bg-blue-600/15 text-blue-400 text-xs rounded-full">...</span>

// 投稿済み（緑）/ 未投稿（グレー）
<span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">✅ 投稿済み</span>
<span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded-full">⏳ 未投稿</span>
```

データ取得には `POST_SELECT_QUERY` を使用し、`post_type_ref`, `profile_ref`, `post_images` を JOIN で取得すること。

### 履歴一覧の Server Component + 「もっと見る」構成
履歴一覧 (`/history`) は Server Component で初回20件を取得し、Client Component で追加読み込みを管理:
```
page.tsx (Server) → ヘッダー + フィルター即表示
  └── <Suspense fallback={<HistorySkeleton />}>
       └── HistoryPostList (Server async: 初回20件をSupabase直接クエリ)
            └── HistoryPostListClient (Client: 追加読み込み管理)
                 ├── HistoryPostCard × N
                 │    └── HistoryDeleteButton (Client: postId のみ)
                 └── 「もっと見る」ボタン → /api/posts で追加20件取得
```

- フィルターは URL `searchParams` で管理（`?postType=tips`）
- 「もっと見る」ボタンで `/api/posts` から20件ずつ追加取得
- 削除後は `router.refresh()` で Server Component を再実行（追加読み込み分はリセット）
- `<Suspense key={postType}>` でフィルター変更時にスケルトン再表示

### 詳細ページの Server Component + Client Component 分割
個別データの詳細ページは Server Component でデータ取得し、Client Component にprops で渡す:
```
page.tsx (Server) → auth() + Supabase直接クエリ + notFound()
  └── XxxClient (Client: initialData を props で受け取り)
       └── useState(initialData) でローカル管理
```

**実装例**:
| ページ | Server Component | Client Component |
|--------|-----------------|-----------------|
| `/history/[id]` | `page.tsx` (POST_SELECT_QUERY) | `post-detail-client.tsx` |
| `/settings/profiles/[id]` | `page.tsx` (toProfileDB) | `profile-detail-client.tsx` |
| `/characters` | `page.tsx` (characters list) | `characters-client.tsx` |
| `/settings/post-types/[id]` | `page.tsx` (toPostTypeDB) | 既存 `PostTypeForm` |

**ルール**:
- `useEffect` + `fetch` でのクライアントサイドデータフェッチは禁止（Server Component で取得）
- ミューテーション後は `router.refresh()` で Server Component を再実行
- Client Component には `initialData` を props で渡し、`useState(initialData)` で管理

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
