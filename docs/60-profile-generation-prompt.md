# チケット #60: プロフィール自動生成プロンプト

> Phase 4C | 優先度: 高 | 依存: #58

## 概要

分析結果（Instagram分析・ブログ分析の片方または両方）からプロフィール情報を自動生成するプロンプトと関数を実装する。`src/lib/generation-prompts.ts` に新規ファイルを作成し、Gemini Flash を使用して `GeneratedProfile` 型の構造化 JSON を返す。パフォーマンス目標はプロフィール + 投稿タイプ生成合計で 20 秒以内。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/lib/generation-prompts.ts` | 新規作成 |
| `src/types/analysis.ts` | 更新（`GeneratedProfile` 型を追加） |

## 変更内容

### 1. GeneratedProfile 型定義

`src/types/analysis.ts` に以下の型を追加する（既存ファイルがなければ新規作成）:

```typescript
/**
 * 分析結果から自動生成されるプロフィールデータ
 */
export interface GeneratedProfile {
  name: string              // 例: '〇〇和菓子店 Instagram'
  icon: string              // 絵文字アイコン（例: '🍡'）
  description: string       // プロフィール説明文
  system_prompt_memo: string  // 分析サマリーをメモとして保存
  system_prompt: string     // AI用システムプロンプト（自動生成）
  required_hashtags: string[]  // 必須ハッシュタグ（分析結果から抽出）
}
```

### 2. プロフィール生成関数

`src/lib/generation-prompts.ts` に `generateProfile` 関数を作成:

```typescript
import { geminiFlash, parseJsonResponse } from '@/lib/gemini'
import type { GeneratedProfile } from '@/types/analysis'

// Instagram分析結果と Blog分析結果の型（SPEC-PHASE4.md の 5.1.2, 5.2.2 参照）
import type { InstagramAnalysisResult, BlogAnalysisResult } from '@/types/analysis'

/**
 * 分析結果からプロフィールを自動生成する
 * @param instagram - Instagram分析結果（オプション）
 * @param blog - ブログ分析結果（オプション）
 * @param sourceDisplayName - 分析対象の表示名（例: '〇〇和菓子店'）
 * @returns GeneratedProfile
 * @throws 少なくとも1つの分析結果が必要
 */
export async function generateProfile(
  instagram: InstagramAnalysisResult | null,
  blog: BlogAnalysisResult | null,
  sourceDisplayName: string
): Promise<GeneratedProfile> {
  if (!instagram && !blog) {
    throw new Error('少なくとも1つの分析結果が必要です')
  }

  const prompt = buildProfileGenerationPrompt(instagram, blog, sourceDisplayName)
  const result = await geminiFlash.generateContent(prompt)
  const text = result.response.text()
  return parseJsonResponse<GeneratedProfile>(text)
}
```

### 3. プロンプト構築関数

```typescript
function buildProfileGenerationPrompt(
  instagram: InstagramAnalysisResult | null,
  blog: BlogAnalysisResult | null,
  sourceDisplayName: string
): string {
  const sections: string[] = []

  sections.push(`あなたはSNSマーケティングの専門家です。以下の分析結果に基づいて、Instagram投稿用のプロフィール設定を生成してください。`)
  sections.push(`対象: ${sourceDisplayName}`)

  if (instagram) {
    sections.push(`
【Instagram競合分析結果】
- トーン・文体: ${instagram.tone_analysis.primary_tone}（フォーマル度: ${instagram.tone_analysis.formality_level}/5）
- 文体の特徴: ${instagram.tone_analysis.sentence_style}
- 一人称: ${instagram.tone_analysis.first_person}
- 特徴的フレーズ: ${instagram.tone_analysis.sample_phrases.join('、')}
- CTA形式: ${instagram.tone_analysis.call_to_action_style}
- 絵文字使用: ${instagram.tone_analysis.emoji_usage}
- 推奨ハッシュタグ: ${instagram.hashtag_strategy.recommended_tags.join(', ')}
- 高エンゲージメントタグ: ${instagram.hashtag_strategy.top_performing_tags.join(', ')}
- 成功要因: ${instagram.key_success_factors.join('、')}
- 総合サマリー: ${instagram.summary}`)
  }

  if (blog) {
    sections.push(`
【ブログ分析結果】
- 主要テーマ: ${blog.content_strengths.main_topics.join('、')}
- 独自の価値: ${blog.content_strengths.unique_value}
- ターゲット読者: ${blog.content_strengths.target_audience}
- 文体の特徴: ${blog.content_strengths.writing_style}
- 専門分野: ${blog.profile_material.expertise_areas.join('、')}
- トーンキーワード: ${blog.profile_material.tone_keywords.join('、')}
- ブランドメッセージ案: ${blog.profile_material.brand_message}
- 総合サマリー: ${blog.summary}`)
  }

  sections.push(`
【出力要件】
以下のJSON形式で出力してください。JSONのみを出力し、説明文やマークダウンは含めないでください。

{
  "name": "（表示名 + Instagram など用途を含む短い名前。15文字以内）",
  "icon": "（業種・雰囲気に合った絵文字1つ）",
  "description": "（プロフィールの説明。何のためのプロフィールか50文字以内で）",
  "system_prompt_memo": "（分析結果のサマリー。業種、強み、ターゲット、トーンを簡潔に200文字以内で）",
  "system_prompt": "（AI用のシステムプロンプト。以下の要素を含む詳細な指示文、300〜600文字）",
  "required_hashtags": ["（必須ハッシュタグ3〜5個。#記号なし。ブランド名、地域、業種を含む）"]
}

【system_prompt に含めるべき要素】
1. 業種・専門分野の明示（例: 「あなたは飯田市の和菓子店のInstagram投稿を作成するAIアシスタントです」）
2. トーン・文体の指定（分析結果のtone_analysisを反映。フォーマル度、絵文字使用量、文体の特徴）
3. ターゲット層の明示（Instagram分析とブログ分析の結果を統合）
4. ブランドメッセージの反映（ブログ分析のprofile_materialから）
5. 投稿の基本構造指示（共感→情報→CTAの流れなど、分析で判明した成功パターン）
6. 禁止事項（捏造禁止、過度な誇張禁止）

【注意】
- system_prompt は PostCraft のキャプション生成AI（Gemini Flash）への指示文として使用される
- required_hashtags は毎回の投稿に自動で付与される必須タグ
- 分析結果に含まれる具体的な数値やフレーズを活用すること`)

  return sections.join('\n')
}
```

### 4. エラーハンドリング

- JSON パースに失敗した場合は最大2回リトライ（`generateWithRetry` パターンを参考）
- `required_hashtags` が空配列の場合は最低限のデフォルト（業種名）を設定
- `system_prompt` が300文字未満の場合は警告ログを出力

## 受入条件

- `generateProfile()` が `InstagramAnalysisResult` のみで正常に `GeneratedProfile` を返す
- `generateProfile()` が `BlogAnalysisResult` のみで正常に `GeneratedProfile` を返す
- `generateProfile()` が両方の分析結果で正常に `GeneratedProfile` を返す
- 両方 `null` の場合にエラーがスローされる
- 生成された `system_prompt` が 300〜600 文字の範囲内である
- 生成された `required_hashtags` が 3〜5 個の範囲内である
- レスポンスが有効な JSON として解析できる
- `npm run build` が成功する

## TODO

- [x] `src/types/analysis.ts` に `GeneratedProfile` 型を追加
- [x] `src/lib/generation-prompts.ts` を新規作成
- [x] `generateProfile()` 関数を実装
- [x] `buildProfileGenerationPrompt()` プロンプト構築関数を実装
- [ ] Instagram分析のみのケースをテスト（実データで検証予定）
- [ ] ブログ分析のみのケースをテスト（実データで検証予定）
- [ ] 両方の分析結果を渡すケースをテスト（実データで検証予定）
- [x] JSON パース失敗時のリトライロジックを実装 → `generateWithRetry(prompt, 3, 60000)` で3回リトライ
- [x] バリデーション → プロンプト内で文字数・配列長を指定（300〜600文字、3〜5個）
- [x] `npm run build` 成功を確認
