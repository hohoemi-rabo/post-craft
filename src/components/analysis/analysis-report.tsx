import { PostTypeChart } from './post-type-chart'
import { ToneDisplay } from './tone-display'
import { HashtagDisplay } from './hashtag-display'
import { PostingPattern } from './posting-pattern'
import type { InstagramAnalysisResult, BlogAnalysisResult } from '@/types/analysis'

interface AnalysisReportProps {
  sourceType: string
  result: InstagramAnalysisResult | BlogAnalysisResult
}

export function AnalysisReport({ sourceType, result }: AnalysisReportProps) {
  if (sourceType === 'instagram') {
    const ig = result as InstagramAnalysisResult
    return (
      <div className="space-y-6">
        <SummarySection
          summary={ig.summary}
          keyFactors={ig.key_success_factors}
        />
        <PostTypeChart distribution={ig.post_type_distribution} />
        <ToneDisplay tone={ig.tone_analysis} />
        <HashtagDisplay strategy={ig.hashtag_strategy} />
        <PostingPattern pattern={ig.posting_pattern} />
      </div>
    )
  }

  // ブログ分析
  const blog = result as BlogAnalysisResult
  return (
    <div className="space-y-6">
      <SummarySection summary={blog.summary} />
      <BlogContentStrengths strengths={blog.content_strengths} />
      <BlogReusableContent items={blog.reusable_content} />
      <BlogProfileMaterial material={blog.profile_material} />
    </div>
  )
}

// ── サマリーセクション ──

function SummarySection({
  summary,
  keyFactors,
}: {
  summary: string
  keyFactors?: string[]
}) {
  return (
    <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-3">総合サマリー</h2>
      <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{summary}</p>

      {keyFactors && keyFactors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-medium text-white mb-2">成功要因:</p>
          <ol className="list-decimal list-inside space-y-1">
            {keyFactors.map((factor, i) => (
              <li key={i} className="text-sm text-white/80">{factor}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

// ── ブログ: コンテンツの強み ──

function BlogContentStrengths({ strengths }: { strengths: BlogAnalysisResult['content_strengths'] }) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">コンテンツの強み</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem label="ターゲット層" value={strengths.target_audience} />
        <InfoItem label="独自の価値" value={strengths.unique_value} />
        <InfoItem label="文章スタイル" value={strengths.writing_style} />
      </div>
      {strengths.main_topics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-medium text-white/80 mb-2">主なトピック:</p>
          <div className="flex flex-wrap gap-2">
            {strengths.main_topics.map((topic, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-500/10 text-blue-300 text-xs rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

// ── ブログ: 再利用可能コンテンツ ──

function BlogReusableContent({ items }: { items: BlogAnalysisResult['reusable_content'] }) {
  if (!items || items.length === 0) return null

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">Instagram投稿に転用できるコンテンツ</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 bg-white/5 rounded-xl">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-medium text-white">{item.original_title}</p>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full whitespace-nowrap">
                {item.suggested_post_type}
              </span>
            </div>
            <p className="text-xs text-white/60 mb-2">{item.suggested_caption_outline}</p>
            {item.suggested_hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.suggested_hashtags.map((tag, j) => (
                  <span key={j} className="text-xs text-blue-300">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// ── ブログ: プロフィール素材 ──

function BlogProfileMaterial({ material }: { material: BlogAnalysisResult['profile_material'] }) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">プロフィール素材</h2>
      <InfoItem label="ブランドメッセージ" value={material.brand_message} />
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-white/80 mb-2">専門領域:</p>
          <div className="flex flex-wrap gap-2">
            {material.expertise_areas.map((area, i) => (
              <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs rounded-full">
                {area}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-white/80 mb-2">トーンキーワード:</p>
          <div className="flex flex-wrap gap-2">
            {material.tone_keywords.map((kw, i) => (
              <span key={i} className="px-3 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── 共通: InfoItem ──

export function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-white/5 rounded-xl">
      <p className="text-xs text-white/60 mb-0.5">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  )
}
