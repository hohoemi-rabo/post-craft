# チケット #16: 投稿タイプ・テンプレート

> Phase 2 コンテンツ構造
> 優先度: 高
> 参照: SPEC-PHASE2.md セクション 3
> **ステータス: 完了**

---

## 概要

4種類の投稿タイプとそれぞれのテンプレート構造を実装する。
ユーザーが投稿タイプを選択すると、対応するテンプレートが適用される。

---

## 投稿タイプ一覧

| タイプID | タイプ名 | ターゲット | 用途 |
|---------|---------|-----------|------|
| `solution` | 🔧 解決タイプ | シニア層 | 質問→解決方法 |
| `promotion` | 📢 宣伝タイプ | ビジネス層 | AI実務サポート告知 |
| `tips` | 💡 Tips/知識タイプ | ビジネス層 | AIの便利な使い方 |
| `showcase` | ✨ 実績/事例タイプ | ビジネス層 | 成果物・事例紹介 |

---

## タスク一覧

### 1. 型定義作成
- [x] `types/post.ts` 作成
  - PostType, PostTypeConfig, TemplateData
  - ImageStyle, ImageStyleConfig
  - AspectRatio, AspectRatioConfig

### 2. 投稿タイプ定数定義
- [x] `lib/post-types.ts` 作成
  - POST_TYPES（4種類の設定）
  - IMAGE_STYLES（4種類の画像スタイル）
  - ASPECT_RATIOS（2種類のアスペクト比）

### 3. テンプレート定義
- [x] `lib/templates.ts` 作成
- [x] 解決タイプテンプレート
- [x] 宣伝タイプテンプレート
- [x] Tips/知識タイプテンプレート
- [x] 実績/事例タイプテンプレート

### 4. テンプレート適用関数
- [x] `applyTemplate()` - テンプレートにデータを適用
- [x] `validateTemplateData()` - バリデーション
- [x] `getFieldsForType()` - フィールド一覧取得
- [x] `getTemplatePreview()` - プレビュー取得

### 5. 投稿タイプ選択コンポーネント
- [x] `components/create/post-type-selector.tsx` 作成
- [x] カード形式で4タイプを表示
- [x] 選択状態のハイライト
- [x] タイプ説明・ターゲット表示

### 6. テンプレートフォームコンポーネント
- [x] `components/create/template-form.tsx` 作成
- [x] 必須・任意フィールドの表示
- [x] エラー表示

### 7. テンプレートプレビューコンポーネント
- [x] `components/create/template-preview.tsx` 作成
- [x] リアルタイムプレビュー
- [x] 文字数カウント・範囲表示

---

## 完了条件

- [x] 4種類の投稿タイプが定義されている
- [x] 各タイプのテンプレートが定義されている
- [x] テンプレート適用関数が動作する
- [x] 投稿タイプ選択 UI コンポーネントが作成されている
- [x] バリデーションが動作する

---

## 作成されたファイル

| ファイル | 説明 |
|---------|------|
| `src/types/post.ts` | 投稿関連の型定義 |
| `src/lib/post-types.ts` | 投稿タイプ・画像スタイル定数 |
| `src/lib/templates.ts` | テンプレート定義・適用関数 |
| `src/components/create/post-type-selector.tsx` | タイプ選択UI |
| `src/components/create/template-form.tsx` | 入力フォーム |
| `src/components/create/template-preview.tsx` | プレビュー |
| `src/components/create/index.ts` | エクスポート |

---

## 依存関係

- なし（並行して実施可能）

## 後続タスク

- #17 Gemini 文章生成
- #21 投稿作成フロー
