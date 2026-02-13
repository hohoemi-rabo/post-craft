# チケット #53: サイドバーに分析メニュー追加

> Phase 4A | 優先度: 低 | 依存: なし

## 概要

ダッシュボードのサイドバーとモバイルナビゲーションに「分析」メニュー項目を追加する。既存の「📋 履歴」と「👤 キャラクター」の間に配置する。合わせて `middleware.ts` の matcher に `/analysis/:path*` を追加し、分析ページへの未認証アクセスをリダイレクトする。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/dashboard/sidebar.tsx` | 更新（分析メニュー追加） |
| `src/components/dashboard/mobile-nav.tsx` | 更新（分析メニュー追加） |
| `middleware.ts` | 更新（matcher に `/analysis/:path*` 追加） |

## 変更内容

### 1. サイドバー (`src/components/dashboard/sidebar.tsx`)

`navItems` 配列の「投稿履歴」と「キャラクター」の間に分析メニューを追加:

```typescript
const navItems: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '🏠' },
  { href: '/create', label: '新規作成', icon: '✏️' },
  { href: '/history', label: '投稿履歴', icon: '📋' },
  { href: '/analysis', label: '分析', icon: '🔍' },  // ← NEW
  { href: '/characters', label: 'キャラクター', icon: '👤' },
  {
    href: '/settings',
    label: '設定',
    icon: '⚙️',
    subItems: [
      { href: '/settings/profiles', label: 'プロフィール', icon: '👥' },
      { href: '/settings/post-types', label: '投稿タイプ', icon: '📝' },
    ],
  },
]
```

### 2. モバイルナビゲーション (`src/components/dashboard/mobile-nav.tsx`)

`navItems` 配列に分析メニューを追加。モバイルではアイコンとラベルのみの表示:

```typescript
const navItems = [
  { href: '/dashboard', label: 'ホーム', icon: '🏠' },
  { href: '/create', label: '作成', icon: '✏️' },
  { href: '/history', label: '履歴', icon: '📋' },
  { href: '/analysis', label: '分析', icon: '🔍' },  // ← NEW
  { href: '/characters', label: 'キャラ', icon: '👤' },
  { href: '/settings', label: '設定', icon: '⚙️' },
]
```

**注意**: モバイルナビはアイテム数が6つになる。既存の `justify-around` レイアウトで問題なく表示されるか確認すること。画面幅が狭い場合にアイコンが詰まりすぎないよう、必要に応じて `gap` や `px` を調整する。

### 3. ミドルウェア (`middleware.ts`)

`matcher` に `/analysis/:path*` を追加:

```typescript
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/history/:path*',
    '/analysis/:path*',  // ← NEW
    '/characters/:path*',
    '/settings/:path*',
  ],
}
```

## 受入条件

- デスクトップのサイドバーに「🔍 分析」メニューが「📋 投稿履歴」と「👤 キャラクター」の間に表示される
- サイドバーの「分析」メニュークリックで `/analysis` に遷移する
- `/analysis` 配下のページ（`/analysis/new` 等）でサイドバーの「分析」がアクティブ表示になる
- モバイルナビに「🔍 分析」メニューが表示される
- モバイルナビで6アイテムが画面幅に収まって表示される
- 未認証ユーザーが `/analysis` にアクセスするとログインページにリダイレクトされる
- 既存のナビゲーション（ダッシュボード、作成、履歴、キャラクター、設定）に影響がない
- `npm run build` が成功する

## TODO

- [ ] `src/components/dashboard/sidebar.tsx` の `navItems` に分析メニューを追加
- [ ] `src/components/dashboard/mobile-nav.tsx` の `navItems` に分析メニューを追加
- [ ] モバイルナビで6アイテムのレイアウトを確認・調整
- [ ] `middleware.ts` の `matcher` に `/analysis/:path*` を追加
- [ ] デスクトップのサイドバー表示確認（アクティブ状態含む）
- [ ] モバイルナビの表示確認（各画面幅）
- [ ] 未認証アクセスのリダイレクト動作確認
- [ ] 既存ナビゲーションへの影響がないことを確認
- [ ] `npm run build` 成功を確認
