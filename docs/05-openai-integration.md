# 05. OpenAI API統合

## 概要
OpenAI APIの設定とプロンプトエンジニアリング

## 担当週
Week 2

## タスク

- [×] OpenAI SDKインストール
- [×] API Key設定（環境変数）
- [×] APIクライアント作成
- [×] プロンプト設計
- [×] トークン削減最適化
- [×] エラーハンドリング
- [×] リトライロジック（最大3回）
- [×] タイムアウト設定（30秒）
- [×] コスト管理（月額上限設定）

## 技術詳細

### 必須パッケージ
```bash
npm install openai
```

### プロンプト設計
```typescript
const systemPrompt = `
あなたはInstagram投稿用のコンテンツを生成する専門家です。
以下の記事からInstagram投稿用の要素を生成してください：

1. タイトル（20文字以内）
2. 要約文（100-150文字、改行なし）
3. ハッシュタグ（10個、日本語中心）

トーン：ビジネス寄り、シンプル、絵文字なし

出力形式（JSON）：
{
  "title": "記事タイトル",
  "caption": "要約文",
  "hashtags": ["ハッシュタグ1", "ハッシュタグ2", ...]
}
`
```

### API実装例
```typescript
// lib/openai.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generatePostContent(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content },
      ],
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')
    return result
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw error
  }
}
```

### コスト管理
- 月額上限: 1,000円
- モデル: GPT-4
- トークン制限: max_tokens: 500

## 参考
- REQUIREMENTS.md: 3.2.2 AI要約・キャプション生成, 6. API仕様
- CLAUDE.md: Core Features - AI-Powered Content Generation
