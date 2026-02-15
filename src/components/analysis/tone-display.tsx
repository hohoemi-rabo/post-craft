import type { InstagramAnalysisResult } from '@/types/analysis'
import { InfoItem } from './analysis-report'

interface ToneDisplayProps {
  tone: InstagramAnalysisResult['tone_analysis']
}

export function ToneDisplay({ tone }: ToneDisplayProps) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-lg font-bold text-white mb-4">トーン・文体</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoItem label="主なトーン" value={tone.primary_tone} />
        <InfoItem label="フォーマル度" value={`${tone.formality_level} / 5`} />
        <InfoItem label="絵文字の使い方" value={tone.emoji_usage} />
        <InfoItem label="文章スタイル" value={tone.sentence_style} />
        <InfoItem label="一人称" value={tone.first_person} />
        <InfoItem label="CTA スタイル" value={tone.call_to_action_style} />
      </div>

      {tone.sample_phrases.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-sm font-medium text-white/80 mb-2">特徴的なフレーズ:</p>
          <div className="flex flex-wrap gap-2">
            {tone.sample_phrases.map((phrase, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-purple-500/15 text-purple-300 text-xs rounded-full"
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
