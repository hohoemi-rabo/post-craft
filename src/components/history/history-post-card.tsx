import Image from 'next/image'
import Link from 'next/link'
import { IMAGE_STYLES } from '@/lib/image-styles'
import type { Post } from '@/types/history-detail'
import { formatDate } from '@/types/history-detail'
import { HistoryDeleteButton } from './history-delete-button'

interface HistoryPostCardProps {
  post: Post
}

export function HistoryPostCard({ post }: HistoryPostCardProps) {
  const typeIcon = post.post_type_ref?.icon || '📝'
  const typeName = post.post_type_ref?.name || post.post_type || '不明なタイプ'
  const firstImage = post.post_images?.[0]
  const truncatedCaption = post.generated_caption.length > 80
    ? post.generated_caption.slice(0, 80) + '...'
    : post.generated_caption

  return (
    <div className="relative p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-white/5 rounded-lg overflow-hidden">
          {firstImage ? (
            <div className="relative w-full h-full">
              <Image
                src={firstImage.image_url}
                alt="Post thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-slate-600">
              🖼️
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-lg">{typeIcon}</span>
            <span className="text-sm font-medium text-white">{typeName}</span>
            {firstImage?.style && IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES] && (
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                {IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES].icon}{' '}
                {IMAGE_STYLES[firstImage.style as keyof typeof IMAGE_STYLES].name}
              </span>
            )}
            {post.profile_ref && (
              <span className="px-2 py-0.5 bg-blue-600/15 text-blue-400 text-xs rounded-full">
                {post.profile_ref.icon} {post.profile_ref.name}
              </span>
            )}
            <span className="text-xs text-slate-500">
              {formatDate(post.created_at)}
            </span>
            {post.instagram_published ? (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                ✅ 投稿済み
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-xs rounded-full">
                ⏳ 未投稿
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 line-clamp-2">{truncatedCaption}</p>
          <div className="flex gap-2 mt-3">
            <Link
              href={`/history/${post.id}`}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
            >
              詳細
            </Link>
            <HistoryDeleteButton postId={post.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
