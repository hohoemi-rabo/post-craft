# チケット #42: システムプロンプト設定画面

> Phase 3 Revised | 優先度: 中 | 依存: #40

## 概要

`/settings/system-prompt` ページを新規作成する。メモ書き入力、AI生成、手動編集、保存の機能を持つ。サイドバーと設定トップページにリンクを追加する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/app/(dashboard)/settings/system-prompt/page.tsx` | 新規作成 |
| `src/components/settings/system-prompt-editor.tsx` | 新規作成 |
| `src/components/dashboard/sidebar.tsx` | 更新（サブアイテム追加） |
| `src/app/(dashboard)/settings/page.tsx` | 更新（ナビカード追加） |

## 画面構成

SPEC-PHASE3-REVISED.md セクション2.1の画面イメージに準拠。

### ページ (`/settings/system-prompt`)

- パンくず: 設定 > システムプロンプト
- 見出し + 説明文（「全ての投稿タイプに共通で適用されるAIへの指示を設定します。」）
- `SystemPromptEditor` コンポーネントを配置

### SystemPromptEditor コンポーネント

**セクション1: メモ書き入力**
- `textarea`（プレースホルダー: 「あなたのサービスや投稿の方向性をメモ書きで入力してください」）
- 「AIで生成」ボタン → `POST /api/generate/system-prompt` 呼び出し
- ローディング表示（生成中）

**セクション2: 生成されたシステムプロンプト**
- `textarea`（手動編集可能）
- 初回ロード: `GET /api/settings/system-prompt` から取得
- ヒントテキスト: 「生成後に手動で編集することもできます」

**保存ボタン**
- `PUT /api/settings/system-prompt` で保存
- 成功時にトースト通知

### サイドバー変更

設定サブアイテムに「システムプロンプト」を先頭に追加:

```typescript
subItems: [
  { href: '/settings/system-prompt', label: 'システムプロンプト', icon: '📋' },
  { href: '/settings/post-types', label: '投稿タイプ', icon: '📝' },
  { href: '/settings/hashtags', label: 'ハッシュタグ', icon: '#️⃣' },
]
```

### 設定トップページ変更

ナビカードに「システムプロンプト」カードを追加。

## 受入条件

- `/settings/system-prompt` ページが表示される
- メモ書き入力からAIでシステムプロンプトが生成される
- 生成後に手動編集ができる
- 保存が正常に動作する
- 初回表示時にデフォルトの SYSTEM_PROMPT が表示される
- サイドバーに「システムプロンプト」が表示される
- 設定トップページにナビカードが表示される
- ローディング・エラー状態が適切に表示される
- モバイル表示が正常

## TODO

- [x] `src/app/(dashboard)/settings/system-prompt/page.tsx` を作成
  - [x] パンくず + 見出し + 説明文
  - [x] `SystemPromptEditor` を配置
- [x] `src/components/settings/system-prompt-editor.tsx` を作成
  - [x] 初回ロード: `GET /api/settings/system-prompt`
  - [x] メモ書き入力 textarea
  - [x] 「AIで生成」ボタン + ローディング
  - [x] 生成結果 textarea（手動編集可能）
  - [x] 「保存」ボタン → `PUT /api/settings/system-prompt`
  - [x] トースト通知（成功/エラー）
- [x] `src/components/dashboard/sidebar.tsx` 更新
  - [x] 設定サブアイテムに「システムプロンプト」追加
- [x] `src/app/(dashboard)/settings/page.tsx` 更新
  - [x] ナビカードに「システムプロンプト」追加
- [x] モバイル対応確認
- [x] `npm run build` 成功を確認
