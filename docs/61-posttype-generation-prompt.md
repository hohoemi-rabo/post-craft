# チケット #61: 投稿タイプ自動生成プロンプト

> Phase 4C | 優先度: 高 | 依存: #58

## 概要

Instagram分析の `post_type_distribution` を中心に、エンゲージメントの高い投稿カテゴリから 3〜5 種の投稿タイプを自動生成するプロンプトと関数を実装する。`src/lib/generation-prompts.ts` に追加し、Gemini Flash を使用して `GeneratedPostType[]` 型の構造化 JSON を返す。生成されるテンプレートは PostCraft の既存フォーマット（`template_structure` + `placeholders`）に完全に適合する必要がある。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/generation-prompts.ts` | 更新（投稿タイプ生成関数を追加） |
| `src/types/analysis.ts` | 更新（`GeneratedPostType` 型を追加） |

## 変更内容

### 1. GeneratedPostType 型定義

`src/types/analysis.ts` に以下の型を追加:

```typescript
/**
 * 分析結果から自動生成される投稿タイプデータ
 */
export interface GeneratedPostType {
  name: string              // 例: '季節の和菓子紹介'
  slug: string              // URL安全な英語スラッグ（例: 'seasonal-wagashi'）
  description: string       // 投稿タイプの説明（50文字以内）
  icon: string              // 絵文字アイコン
  template_structure: string // テンプレート本体（プレースホルダー付き）
  placeholders: Array<{
    key: string             // テンプレート内の変数名（例: 'product_name'）
    label: string           // UIに表示するラベル（例: '商品名'）
    placeholder: string     // 入力欄のプレースホルダーテキスト
    required: boolean       // 必須かどうか
  }>
  input_mode: 'fields' | 'memo'  // 入力方式
  min_length: number        // 最小文字数（200〜300）
  max_length: number        // 最大文字数（300〜500）
  type_prompt: string       // タイプ別AIプロンプト（キャプション生成時の追加指示）
}
```

### 2. 投稿タイプ生成関数

```typescript
import type { GeneratedPostType, InstagramAnalysisResult, BlogAnalysisResult } from '@/types/analysis'

/**
 * 分析結果から投稿タイプを自動生成する（3〜5種）
 * @param instagram - Instagram分析結果（オプション）
 * @param blog - ブログ分析結果（オプション）
 * @param sourceDisplayName - 分析対象の表示名
 * @returns GeneratedPostType[]（3〜5個）
 * @throws 少なくとも1つの分析結果が必要
 */
export async function generatePostTypes(
  instagram: InstagramAnalysisResult | null,
  blog: BlogAnalysisResult | null,
  sourceDisplayName: string
): Promise<GeneratedPostType[]> {
  if (!instagram && !blog) {
    throw new Error('少なくとも1つの分析結果が必要です')
  }

  const prompt = buildPostTypeGenerationPrompt(instagram, blog, sourceDisplayName)
  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()
  const postTypes = parseJsonResponse<GeneratedPostType[]>(text)

  // バリデーション: 3〜5個に制限
  if (postTypes.length < 3) {
    throw new Error('生成された投稿タイプが3個未満です')
  }
  return postTypes.slice(0, 5)
}
```

### 3. プロンプト構築関数

```typescript
function buildPostTypeGenerationPrompt(
  instagram: InstagramAnalysisResult | null,
  blog: BlogAnalysisResult | null,
  sourceDisplayName: string
): string {
  const sections: string[] = []

  sections.push(`あなたはSNSマーケティングの専門家です。以下の分析結果に基づいて、Instagram投稿用の投稿タイプ（テンプレート）を3〜5種類生成してください。`)
  sections.push(`対象: ${sourceDisplayName}`)

  if (instagram) {
    // 投稿タイプ分布をエンゲージメント順にソート
    const sortedTypes = [...instagram.post_type_distribution.types]
      .sort((a, b) => b.avg_engagement - a.avg_engagement)

    sections.push(`
【Instagram競合分析 - 投稿タイプ傾向】
${sortedTypes.map((t, i) => `${i + 1}. ${t.category}（${t.percentage}% / エンゲージメント: ${t.avg_engagement}%）
   代表例: ${t.example_caption}`).join('\n')}

推奨配分: ${instagram.post_type_distribution.recommendation}

【トーン・文体の参考】
- トーン: ${instagram.tone_analysis.primary_tone}
- 文体: ${instagram.tone_analysis.sentence_style}
- CTA形式: ${instagram.tone_analysis.call_to_action_style}`)
  }

  if (blog) {
    sections.push(`
【ブログ分析 - コンテンツの強み】
- 主要テーマ: ${blog.content_strengths.main_topics.join('、')}
- 独自の価値: ${blog.content_strengths.unique_value}
- ターゲット読者: ${blog.content_strengths.target_audience}

【SNS転用可能なコンテンツ例】
${blog.reusable_content.slice(0, 5).map((c, i) => `${i + 1}. 「${c.original_title}」→ ${c.suggested_post_type}`).join('\n')}`)
  }

  sections.push(`
【PostCraft テンプレート構造の参考例】

■ 商品紹介タイプの例:
\`\`\`
【{title}】

{product_description}

✨ ポイント
{point1}
{point2}
{point3}

---
📍{footer_message}
\`\`\`

■ お役立ちタイプの例:
\`\`\`
【{title}】

{topic}を使うと…
✨ {benefit1}
✨ {benefit2}
✨ {benefit3}

例えば…
{example}

---
📍{footer_message}
\`\`\`

【出力要件】
以下のJSON配列形式で3〜5個の投稿タイプを出力してください。JSONのみを出力し、説明文やマークダウンは含めないでください。

[
  {
    "name": "（日本語の投稿タイプ名。10文字以内）",
    "slug": "（英語のURL安全なスラッグ。ハイフン区切り）",
    "description": "（投稿タイプの用途説明。50文字以内）",
    "icon": "（業種と内容に合った絵文字1つ）",
    "template_structure": "（テンプレート本体。プレースホルダーは {key} 形式。改行を含む。絵文字を適度に使用）",
    "placeholders": [
      {
        "key": "（テンプレート内の変数名。snake_case）",
        "label": "（UIに表示するラベル。日本語）",
        "placeholder": "（入力欄のプレースホルダー。具体例を含む）",
        "required": true
      }
    ],
    "input_mode": "memo または fields",
    "min_length": 200,
    "max_length": 400,
    "type_prompt": "（キャプション生成時のAIへの追加指示。このタイプ特有の注意点やスタイルを100〜200文字で）"
  }
]

【生成ルール】
1. エンゲージメントが高い投稿カテゴリを優先して投稿タイプを生成する
2. template_structure はPostCraftの既存テンプレート形式に従う（絵文字、区切り線 --- 、フッター📍を含む）
3. placeholders の key は template_structure 内の {key} と一致させる
4. input_mode は、フィールドが4個以上なら 'fields'、3個以下または自由記述が適切なら 'memo' にする
5. type_prompt はキャプション生成AI（Gemini Flash）への追加指示として使用される。テンプレートの意図やトーンの注意点を含める
6. slug は業種に関連する英語で、グローバルにユニークになるようにする
7. min_length は 200〜300、max_length は 300〜500 の範囲で設定する
8. 各投稿タイプの template_structure にハッシュタグ行を含めないこと（ハッシュタグは別途自動生成される）`)

  return sections.join('\n')
}
```

### 4. slug 生成のバリデーション

生成された slug に対して以下のバリデーションを行う:

```typescript
function validateSlug(slug: string): string {
  // 英数字とハイフンのみ許可
  let cleaned = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!cleaned) {
    cleaned = `custom-type-${Date.now()}`
  }
  return cleaned
}
```

### 5. エラーハンドリング

- JSON パースに失敗した場合は最大2回リトライ
- 生成された投稿タイプが3個未満の場合はエラー
- `template_structure` 内の `{key}` と `placeholders[].key` の整合性チェック
- `input_mode` が不正な値の場合は `'memo'` にフォールバック

## 受入条件

- `generatePostTypes()` が Instagram 分析結果のみで 3〜5 個の `GeneratedPostType` を返す
- `generatePostTypes()` が ブログ分析結果のみで 3〜5 個の `GeneratedPostType` を返す
- `generatePostTypes()` が両方の分析結果で 3〜5 個の `GeneratedPostType` を返す
- 両方 `null` の場合にエラーがスローされる
- 生成された `template_structure` 内の `{key}` が全て `placeholders` に定義されている
- 生成された `slug` が英数字とハイフンのみで構成されている
- 生成された `type_prompt` が 100 文字以上である
- `input_mode` が `'fields'` または `'memo'` のいずれかである
- `npm run build` が成功する

## TODO

- [ ] `src/types/analysis.ts` に `GeneratedPostType` 型を追加
- [ ] `src/lib/generation-prompts.ts` に `generatePostTypes()` 関数を追加
- [ ] `buildPostTypeGenerationPrompt()` プロンプト構築関数を実装
- [ ] PostCraft 既存テンプレート形式に適合するプロンプトを設計
- [ ] エンゲージメント順ソートロジックを実装
- [ ] slug バリデーション関数を実装
- [ ] `template_structure` と `placeholders` の整合性チェックを実装
- [ ] Instagram 分析のみのケースをテスト
- [ ] ブログ分析のみのケースをテスト
- [ ] 両方の分析結果を渡すケースをテスト
- [ ] `npm run build` 成功を確認
