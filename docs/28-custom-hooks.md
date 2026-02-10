# チケット #28: カスタムフック

> Phase 3 | 優先度: 高 | 依存: #26, #27

## 概要

設定画面・投稿作成画面で使用するカスタムフック `usePostTypes` と `useUserSettings` を実装する。API との通信、状態管理、エラーハンドリングをカプセル化する。

既存フック（`useContentGeneration`, `usePostEdit` 等）のパターンに従う。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/hooks/usePostTypes.ts` | 新規作成 |
| `src/hooks/useUserSettings.ts` | 新規作成 |

## フック仕様

### usePostTypes

```typescript
function usePostTypes() {
  return {
    // データ
    postTypes: PostTypeDB[]
    count: number
    maxCount: number  // 10
    isLoading: boolean
    error: string | null

    // アクション
    refresh: () => Promise<void>
    createPostType: (data: PostTypeFormData) => Promise<PostTypeDB>
    updatePostType: (id: string, data: Partial<PostTypeFormData>) => Promise<void>
    deletePostType: (id: string) => Promise<{ affectedPosts: number }>
    duplicatePostType: (id: string) => Promise<PostTypeDB>
    reorderPostTypes: (items: { id: string; sortOrder: number }[]) => Promise<void>
    toggleActive: (id: string, isActive: boolean) => Promise<void>

    // フィルタ
    activePostTypes: PostTypeDB[]  // isActive === true のみ
  }
}
```

### useUserSettings

```typescript
function useUserSettings() {
  return {
    // データ
    settings: UserSettings | null
    isLoading: boolean
    error: string | null

    // アクション
    refresh: () => Promise<void>
    updateHashtags: (hashtags: string[]) => Promise<{ generatedCount: number }>
    updateSettings: (data: Partial<UserSettings>) => Promise<void>

    // 計算値
    requiredHashtags: string[]
    generatedHashtagCount: number  // 10 - requiredHashtags.length
  }
}
```

## 受入条件

- 両フックがデータの取得・更新を正しく行える
- ローディング状態が適切に管理される
- エラー時にエラーメッセージが設定される
- `activePostTypes` が有効なタイプのみ返す
- `generatedHashtagCount` が正しく計算される

## TODO

- [x] `src/hooks/usePostTypes.ts` を作成
  - [x] 一覧取得（初回ロード）
  - [x] 作成・更新・削除・複製アクション
  - [x] 並び替えアクション
  - [x] 有効/無効切り替え
  - [x] `activePostTypes` フィルタ
  - [x] ローディング・エラー状態管理
- [x] `src/hooks/useUserSettings.ts` を作成
  - [x] 設定取得（初回ロード）
  - [x] ハッシュタグ更新アクション
  - [x] `generatedHashtagCount` 計算
  - [x] ローディング・エラー状態管理
- [x] 動作確認（`npm run build` 成功）
