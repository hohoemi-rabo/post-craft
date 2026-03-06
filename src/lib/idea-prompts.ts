interface IdeaPromptInput {
  profileName: string
  profileDescription: string | null
  systemPrompt: string | null
  postTypes: { icon: string; name: string; description: string | null }[]
  pastCaptions: string[]
  existingIdeaTitles: string[]
  aiInstructions?: string
}

export function buildIdeaGenerationPrompt(input: IdeaPromptInput): string {
  const parts: string[] = []

  parts.push('あなたはInstagram投稿のコンテンツプランナーです。')
  parts.push('以下のプロフィール情報と過去の投稿履歴を基に、新しい投稿アイデアを5つ提案してください。')
  parts.push('')

  parts.push('【プロフィール情報】')
  parts.push(`名前: ${input.profileName}`)
  if (input.profileDescription) {
    parts.push(`説明: ${input.profileDescription}`)
  }
  if (input.systemPrompt) {
    parts.push(`トーン・方針: ${input.systemPrompt}`)
  }
  parts.push('')

  if (input.postTypes.length > 0) {
    parts.push('【利用可能な投稿タイプ】')
    for (const pt of input.postTypes) {
      const desc = pt.description ? `: ${pt.description}` : ''
      parts.push(`- ${pt.icon} ${pt.name}${desc}`)
    }
    parts.push('')
  }

  if (input.pastCaptions.length > 0) {
    parts.push(`【過去の投稿 (${input.pastCaptions.length}件)】`)
    for (let i = 0; i < input.pastCaptions.length; i++) {
      const caption = input.pastCaptions[i].substring(0, 100)
      parts.push(`${i + 1}. ${caption}...`)
    }
    parts.push('')
  }

  if (input.existingIdeaTitles.length > 0) {
    parts.push('【既存のアイデア（重複回避）】')
    for (const title of input.existingIdeaTitles) {
      parts.push(`- ${title}`)
    }
    parts.push('')
  }

  if (input.aiInstructions) {
    parts.push('【追加指示】')
    parts.push(input.aiInstructions)
    parts.push('')
  }

  parts.push('【出力ルール】')
  parts.push('- 過去の投稿・既存アイデアと重複しない、新しい切り口のアイデアを5つ提案')
  parts.push('- 各アイデアには「title」（20文字以内の簡潔なタイトル）と「description」（具体的な内容説明、15行程度）を含める')
  parts.push('- descriptionには、投稿の構成案、伝えたいポイント、想定読者への訴求点を含める')
  parts.push('- 利用可能な投稿タイプに合った内容にする')
  parts.push('- プロフィールのトーンに合わせた提案にする')
  parts.push('- 日本語で出力する')
  parts.push('')
  parts.push('以下のJSON形式で出力してください（JSONのみ、説明不要）:')
  parts.push('[')
  parts.push('  { "title": "アイデアのタイトル", "description": "具体的な内容説明..." },')
  parts.push('  ...')
  parts.push(']')

  return parts.join('\n')
}
