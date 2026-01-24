# チケット #16: 投稿タイプ・テンプレート

> Phase 2 コンテンツ構造
> 優先度: 高
> 参照: SPEC-PHASE2.md セクション 3

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
- [ ] `types/post.ts` 作成
  ```typescript
  export type PostType = 'solution' | 'promotion' | 'tips' | 'showcase';

  export interface PostTypeConfig {
    id: PostType;
    name: string;
    icon: string;
    description: string;
    target: string;
    charRange: { min: number; max: number };
    requiredFields: string[];
    optionalFields: string[];
    hashtagTrend: string[];
  }

  export interface TemplateData {
    [key: string]: string;
  }
  ```

### 2. 投稿タイプ定数定義
- [ ] `lib/post-types.ts` 作成
  ```typescript
  export const POST_TYPES: Record<PostType, PostTypeConfig> = {
    solution: {
      id: 'solution',
      name: '🔧 解決タイプ',
      icon: '🔧',
      description: 'シニアからの質問と解決方法を紹介',
      target: 'シニア層',
      charRange: { min: 200, max: 300 },
      requiredFields: ['question', 'step1', 'step2', 'step3'],
      optionalFields: ['tip'],
      hashtagTrend: ['#パソコン教室', '#シニア', '#スマホ教室', '#飯田市'],
    },
    // ... 他のタイプ
  };
  ```

### 3. テンプレート定義
- [ ] `lib/templates.ts` 作成
- [ ] 解決タイプテンプレート
  ```typescript
  export const SOLUTION_TEMPLATE = `📱 シニアからの質問
「{question}」

💡 解決方法
① {step1}
② {step2}
③ {step3}

✨ ワンポイント
{tip}

---
📍パソコン・スマホ ほほ笑みラボ（飯田市）`;
  ```

- [ ] 宣伝タイプテンプレート
- [ ] Tips/知識タイプテンプレート
- [ ] 実績/事例タイプテンプレート

### 4. テンプレート適用関数
- [ ] `lib/templates.ts` にテンプレート適用関数追加
  ```typescript
  export function applyTemplate(
    type: PostType,
    data: TemplateData
  ): string {
    const template = TEMPLATES[type];
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value || '');
    }

    // 空の任意フィールドを含む行を削除
    result = result.replace(/^.*\{\w+\}.*$/gm, '');
    result = result.replace(/\n{3,}/g, '\n\n');

    return result.trim();
  }
  ```

### 5. 投稿タイプ選択コンポーネント
- [ ] `components/create/post-type-selector.tsx` 作成
- [ ] カード形式で4タイプを表示
- [ ] 選択状態のハイライト
- [ ] タイプ説明・ターゲット表示

### 6. テンプレートプレビューコンポーネント
- [ ] `components/create/template-preview.tsx` 作成
- [ ] 選択されたタイプのテンプレート構造を表示
- [ ] 入力フィールドのプレースホルダー表示

### 7. バリデーション
- [ ] 必須フィールドのチェック関数
- [ ] 文字数制限チェック関数
  ```typescript
  export function validateTemplateData(
    type: PostType,
    data: TemplateData
  ): { valid: boolean; errors: string[] } {
    const config = POST_TYPES[type];
    const errors: string[] = [];

    // 必須フィールドチェック
    for (const field of config.requiredFields) {
      if (!data[field]?.trim()) {
        errors.push(`${field} は必須です`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
  ```

---

## UI 設計

### 投稿タイプ選択画面
```
┌─────────────────────────────────────────────┐
│  どんな投稿を作りますか？                      │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │     🔧      │  │     📢      │          │
│  │ 解決タイプ   │  │ 宣伝タイプ   │          │
│  │ シニア向け   │  │ビジネス向け  │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │     💡      │  │     ✨      │          │
│  │ Tipsタイプ  │  │ 実績タイプ   │          │
│  │ビジネス向け  │  │ビジネス向け  │          │
│  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────┘
```

---

## 完了条件

- [ ] 4種類の投稿タイプが定義されている
- [ ] 各タイプのテンプレートが定義されている
- [ ] テンプレート適用関数が動作する
- [ ] 投稿タイプ選択 UI が表示される
- [ ] バリデーションが動作する

---

## 技術メモ

### テンプレート変数
- `{variable}` 形式でプレースホルダーを定義
- 任意フィールドは空の場合、その行ごと削除

### ハッシュタグ傾向
- 各タイプに推奨ハッシュタグを定義
- AI 生成時のヒントとして使用

---

## 依存関係

- なし（並行して実施可能）

## 後続タスク

- #17 Gemini 文章生成
- #21 投稿作成フロー
