interface PostSummary {
  id: string
  postType: string
  postTypeName: string
  profileName: string | null
  caption: string
  createdAt: string
}

interface PostTypeInfo {
  slug: string
  name: string
  icon: string
}

interface ProfileInfo {
  id: string
  name: string
  icon: string
}

/**
 * 履歴詳細ページ用: 単一投稿に対するリメイク提案プロンプト（2件）
 */
export function buildDetailSuggestionPrompt(
  post: PostSummary,
  postTypes: PostTypeInfo[],
  profiles: ProfileInfo[]
): string {
  const parts: string[] = []

  parts.push('あなたはSNS投稿のコンテンツストラテジストです。')
  parts.push('以下の投稿をリメイク（別の投稿タイプ・プロフィールに変換）する提案を2件生成してください。')
  parts.push('')

  parts.push('【元の投稿】')
  parts.push(`投稿タイプ: ${post.postTypeName}`)
  parts.push(`プロフィール: ${post.profileName || '未設定'}`)
  parts.push(`キャプション:`)
  parts.push('---')
  parts.push(post.caption.slice(0, 500))
  parts.push('---')
  parts.push('')

  parts.push('【利用可能な投稿タイプ】')
  for (const pt of postTypes) {
    parts.push(`- ${pt.icon} ${pt.name} (slug: ${pt.slug})`)
  }
  parts.push('')

  parts.push('【利用可能なプロフィール】')
  for (const p of profiles) {
    parts.push(`- ${p.icon} ${p.name} (id: ${p.id})`)
  }
  parts.push('')

  parts.push('【生成ルール】')
  parts.push('- 元の投稿と同じタイプ・プロフィールの組み合わせは避ける')
  parts.push('- 各提案に以下を含める:')
  parts.push('  - suggestedTypeSlug: 提案する投稿タイプのslug')
  parts.push('  - suggestedProfileId: 提案するプロフィールのID')
  parts.push('  - reason: なぜこのリメイクが効果的か（100文字程度）')
  parts.push('  - direction: どんな切り口で書き換えるか（100文字程度）')
  parts.push('')

  parts.push('【出力形式】')
  parts.push('JSON配列で出力してください。余計な説明は不要です。')
  parts.push('[')
  parts.push('  { "suggestedTypeSlug": "...", "suggestedProfileId": "...", "reason": "...", "direction": "..." }')
  parts.push(']')

  return parts.join('\n')
}

/**
 * 投稿レポートページ用: 全投稿からリメイク候補を選んで提案（3〜5件）
 */
export function buildReportSuggestionPrompt(
  recentPosts: PostSummary[],
  postTypes: PostTypeInfo[],
  profiles: ProfileInfo[]
): string {
  const parts: string[] = []

  parts.push('あなたはSNS投稿のコンテンツストラテジストです。')
  parts.push('以下の投稿履歴を分析し、リメイクすると効果的な投稿を3〜5件提案してください。')
  parts.push('')

  parts.push('【投稿履歴（直近の投稿）】')
  for (const post of recentPosts.slice(0, 20)) {
    parts.push(`- [${post.id}] ${post.postTypeName} | ${post.profileName || '未設定'} | ${post.caption.slice(0, 60)}...`)
  }
  parts.push('')

  parts.push('【利用可能な投稿タイプ】')
  for (const pt of postTypes) {
    parts.push(`- ${pt.icon} ${pt.name} (slug: ${pt.slug})`)
  }
  parts.push('')

  parts.push('【利用可能なプロフィール】')
  for (const p of profiles) {
    parts.push(`- ${p.icon} ${p.name} (id: ${p.id})`)
  }
  parts.push('')

  parts.push('【選定基準】')
  parts.push('- 別のターゲット層にも訴求できる内容を優先')
  parts.push('- 投稿タイプを変えることで新しい切り口が生まれるものを選ぶ')
  parts.push('- 同じ元投稿の重複提案は避ける')
  parts.push('')

  parts.push('【生成ルール】')
  parts.push('- 各提案に以下を含める:')
  parts.push('  - sourcePostId: 元投稿のID')
  parts.push('  - suggestedTypeSlug: 提案する投稿タイプのslug')
  parts.push('  - suggestedProfileId: 提案するプロフィールのID')
  parts.push('  - reason: なぜこのリメイクが効果的か（100文字程度）')
  parts.push('  - direction: どんな切り口で書き換えるか（100文字程度）')
  parts.push('')

  parts.push('【出力形式】')
  parts.push('JSON配列で出力してください。余計な説明は不要です。')
  parts.push('[')
  parts.push('  { "sourcePostId": "...", "suggestedTypeSlug": "...", "suggestedProfileId": "...", "reason": "...", "direction": "..." }')
  parts.push(']')

  return parts.join('\n')
}
