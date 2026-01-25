# チケット #15: ダッシュボード・レイアウト

> Phase 2 UI 基盤
> 優先度: 高
> 参照: SPEC-PHASE2.md セクション 7
> **ステータス: 完了**

---

## 概要

認証済みユーザー向けのダッシュボードと共通レイアウトを実装する。
サイドナビゲーションまたはヘッダーナビゲーションで各機能へアクセスできるようにする。

---

## タスク一覧

### 1. ダッシュボードレイアウト作成
- [x] `/app/(dashboard)/layout.tsx` 作成
- [x] 認証チェック（middlewareで実装済み）
- [x] ユーザー情報表示
- [x] ナビゲーション配置

### 2. サイドナビゲーション実装
- [x] `components/dashboard/sidebar.tsx` 作成
- [x] ナビゲーションリンク（🏠 🏠 ✏️ 📋 👤 ⚙️）
- [x] 現在のパスをハイライト表示
- [x] モバイル時のハンバーガーメニュー

### 3. ヘッダー実装（ダッシュボード用）
- [x] `components/dashboard/header.tsx` 作成
- [x] ロゴ（トップページへのリンク）
- [x] ユーザーアバター・名前表示
- [x] ログアウトボタン
- [x] モバイル時のメニュートグル

### 4. ダッシュボードホーム実装
- [x] `/app/(dashboard)/dashboard/page.tsx` 作成
- [x] ウェルカムメッセージ
- [x] クイックアクション
- [x] 統計情報（総投稿数）
- [x] 最近の投稿（3件）

### 5. 設定ページ実装
- [x] `/app/(dashboard)/settings/page.tsx` 作成
- [x] アカウント情報表示
- [x] ログアウトボタン

### 6. レスポンシブ対応
- [x] デスクトップ: サイドバー固定 + メインコンテンツ
- [x] タブレット: サイドバー折りたたみ可能
- [x] モバイル: ボトムナビゲーション

### 7. ローディング・エラー状態
- [x] `/app/(dashboard)/loading.tsx` 作成
- [x] `/app/(dashboard)/error.tsx` 作成

---

## 完了条件

- [x] ダッシュボードレイアウトが表示される
- [x] ナビゲーションで各ページに遷移できる
- [x] ユーザー情報が表示される
- [x] ログアウトが動作する
- [x] レスポンシブ対応されている
- [x] ローディング・エラー状態が適切に表示される

---

## 作成されたファイル

| ファイル | 説明 |
|---------|------|
| `src/app/(dashboard)/layout.tsx` | ダッシュボード共通レイアウト |
| `src/app/(dashboard)/loading.tsx` | ローディング状態 |
| `src/app/(dashboard)/error.tsx` | エラー状態 |
| `src/app/(dashboard)/dashboard/page.tsx` | ダッシュボードホーム |
| `src/app/(dashboard)/settings/page.tsx` | 設定ページ |
| `src/app/(dashboard)/create/page.tsx` | 新規作成（プレースホルダー） |
| `src/app/(dashboard)/history/page.tsx` | 投稿履歴（プレースホルダー） |
| `src/app/(dashboard)/characters/page.tsx` | キャラクター（プレースホルダー） |
| `src/components/dashboard/sidebar.tsx` | サイドナビゲーション |
| `src/components/dashboard/header.tsx` | ヘッダー |
| `src/components/dashboard/mobile-nav.tsx` | モバイルボトムナビ |
| `src/components/dashboard/index.ts` | エクスポート |

---

## 依存関係

- #14 Google OAuth 認証 ✅

## 後続タスク

- #21 投稿作成フロー
- #20 投稿履歴管理
- #18 キャラクター管理
