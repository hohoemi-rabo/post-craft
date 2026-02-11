'use client'

import { useEffect, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type AspectRatio, getAspectClass } from '@/lib/image-styles'
import { InstagramPublishModal } from '@/components/publish/instagram-publish-modal'
import { ImageUploader } from '@/components/ui/image-uploader'
import { PostTypeChangeModal } from '@/components/history/post-edit-modal'
import { ImageRegenerateModal } from '@/components/history/image-regenerate-modal'
import { AspectRatioCropModal } from '@/components/history/aspect-ratio-crop-modal'
import { type Post, formatDate, formatHashtag } from '@/types/history-detail'
import { usePostEdit } from '@/hooks/usePostEdit'
import { useCopyActions } from '@/hooks/useCopyActions'
import { usePostActions } from '@/hooks/usePostActions'
import { usePostImageHandlers } from '@/hooks/usePostImageHandlers'

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Edit mode hook
  const editHook = usePostEdit(id, post, setPost)

  // Copy actions hook
  const copyTarget = post
    ? { caption: post.generated_caption, hashtags: post.generated_hashtags }
    : null
  const copyActions = useCopyActions(copyTarget)

  // Post actions hook
  const postActions = usePostActions(id, post)

  // Image handlers hook
  const imageHandlers = usePostImageHandlers(setPost, editHook.setShowImageReplace)

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${id}`)
        if (response.ok) {
          const data = await response.json()
          setPost(data)
        } else {
          router.push('/history')
        }
      } catch (error) {
        console.error('Failed to fetch post:', error)
        router.push('/history')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPost()
  }, [id, router])

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-white/5 rounded-lg w-32 animate-pulse" />
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
        <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!post) {
    return null
  }

  const typeIcon = editHook.isEditing
    ? editHook.editedPostTypeIcon
    : (post.post_type_ref?.icon || '📝')
  const typeName = editHook.isEditing
    ? editHook.editedPostTypeName
    : (post.post_type_ref?.name || post.post_type || '不明なタイプ')
  const firstImage = post.post_images?.[0]
  const aspectRatio = firstImage?.aspect_ratio || '1:1'
  const aspectClass = getAspectClass(aspectRatio as AspectRatio)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/history"
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          ← 戻る
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">投稿詳細</h1>
        </div>
        {editHook.isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={editHook.cancelEdit}
              disabled={editHook.isSaving}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={editHook.saveChanges}
              disabled={editHook.isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {editHook.isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        ) : (
          <button
            onClick={editHook.startEdit}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors text-sm"
          >
            ✏️ 編集
          </button>
        )}
      </div>

      {/* Post info */}
      <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
        <span className="text-2xl">{typeIcon}</span>
        <div className="flex-1">
          <p className="font-medium text-white">{typeName}</p>
          <p className="text-xs text-slate-400">{formatDate(post.created_at)}</p>
        </div>
        {editHook.isEditing && (
          <button
            onClick={() => editHook.setShowTypeChangeModal(true)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
          >
            📝 変更
          </button>
        )}
        {post.instagram_published ? (
          <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs rounded-full whitespace-nowrap">
            ✅ 投稿済み
          </span>
        ) : (
          <span className="px-2.5 py-1 bg-white/5 text-slate-400 text-xs rounded-full whitespace-nowrap">
            ⏳ 未投稿
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image section */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-slate-300">生成画像</h2>
          {firstImage && !editHook.showImageReplace ? (
            <>
              <div
                className={`relative ${aspectClass} max-w-sm mx-auto bg-white/5 border border-white/10 rounded-xl overflow-hidden`}
              >
                <Image
                  src={firstImage.image_url}
                  alt="Generated image"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <button
                onClick={() => postActions.downloadImage(firstImage.image_url)}
                className="w-full max-w-sm mx-auto block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                ⬇️ 画像をダウンロード
              </button>
              {editHook.isEditing && (
                <div className="space-y-2 max-w-sm mx-auto">
                  <div className="flex gap-2">
                    <button
                      onClick={() => editHook.setShowImageReplace(true)}
                      className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
                    >
                      📷 差し替え
                    </button>
                    <button
                      onClick={() => editHook.setShowAspectRatioModal(true)}
                      className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
                    >
                      📐 比率変更
                    </button>
                    <button
                      onClick={() => editHook.setShowRegenerateModal(true)}
                      className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
                    >
                      🔄 AI再生成
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    現在: {firstImage?.aspect_ratio || '1:1'}
                  </p>
                </div>
              )}
            </>
          ) : editHook.showImageReplace ? (
            <div className="space-y-2">
              <ImageUploader
                postId={post.id}
                onUploadComplete={imageHandlers.handleImageReplaceComplete}
                replace
                initialAspectRatio={(firstImage?.aspect_ratio as AspectRatio) || '1:1'}
              />
              <button
                onClick={() => editHook.setShowImageReplace(false)}
                className="w-full max-w-sm mx-auto block px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <ImageUploader
                postId={post.id}
                onUploadComplete={imageHandlers.handleImageAdded}
              />
              {editHook.isEditing && (
                <button
                  onClick={() => editHook.setShowRegenerateModal(true)}
                  className="w-full max-w-sm mx-auto block px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
                >
                  🔄 AI画像再生成
                </button>
              )}
            </div>
          )}
        </div>

        {/* Text section */}
        <div className="space-y-4">
          {/* Caption */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">投稿文</h2>
              {editHook.isEditing ? (
                <button
                  onClick={editHook.regenerateCaption}
                  disabled={editHook.isRegeneratingCaption}
                  className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  {editHook.isRegeneratingCaption ? '生成中...' : '🤖 AIで再生成'}
                </button>
              ) : (
                <button
                  onClick={copyActions.copyCaption}
                  className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                >
                  {copyActions.copiedCaption ? '✅ コピーしました' : '📋 コピー'}
                </button>
              )}
            </div>
            {editHook.isEditing ? (
              <textarea
                value={editHook.editedCaption}
                onChange={(e) => editHook.setEditedCaption(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              />
            ) : (
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-sm text-white whitespace-pre-wrap">
                  {post.generated_caption}
                </p>
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-300">ハッシュタグ</h2>
              {!editHook.isEditing && (
                <button
                  onClick={copyActions.copyHashtags}
                  className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                >
                  {copyActions.copiedHashtags ? '✅ コピーしました' : '📋 コピー'}
                </button>
              )}
            </div>
            {editHook.isEditing ? (
              <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editHook.newHashtagInput}
                    onChange={(e) => editHook.setNewHashtagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        editHook.addHashtag()
                      }
                    }}
                    placeholder="ハッシュタグを追加..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={editHook.addHashtag}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors"
                  >
                    追加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editHook.editedHashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                    >
                      {formatHashtag(tag)}
                      <button
                        onClick={() => editHook.removeHashtag(index)}
                        className="hover:text-red-400 transition-colors ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500">{editHook.editedHashtags.length}個</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-4 bg-white/5 border border-white/10 rounded-xl">
                {post.generated_hashtags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                  >
                    {formatHashtag(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Source memo */}
          {(post.input_text || editHook.isEditing) && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-slate-300">元のメモ</h2>
              {editHook.isEditing ? (
                <textarea
                  value={editHook.editedInputText}
                  onChange={(e) => editHook.setEditedInputText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                />
              ) : (
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-xs text-slate-400 whitespace-pre-wrap">
                    {post.input_text}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons (hidden in edit mode) */}
      {!editHook.isEditing && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={copyActions.copyAll}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
            >
              {copyActions.copiedAll ? '✅ コピーしました' : '📋 すべてコピー'}
            </button>
            {firstImage ? (
              <button
                onClick={() => postActions.setShowPublishModal(true)}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors"
              >
                📱 Instagramに投稿
              </button>
            ) : (
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-colors text-center"
              >
                📱 Instagram を開く
              </a>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 border-t border-white/10 pt-6">
            <button
              onClick={postActions.reusePost}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              🔄 このテンプレートで新規作成
            </button>
            <button
              onClick={() => postActions.setShowDeleteConfirm(true)}
              className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
            >
              🗑️ 削除
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {postActions.showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">投稿を削除</h3>
            <p className="text-slate-400 text-sm mb-6">
              この投稿を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => postActions.setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={postActions.deletePost}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instagram publish modal */}
      {firstImage && (
        <InstagramPublishModal
          isOpen={postActions.showPublishModal}
          onClose={() => postActions.setShowPublishModal(false)}
          caption={copyActions.getFullCaption()}
          imageUrl={firstImage.image_url}
          postId={post.id}
          aspectRatio={(firstImage.aspect_ratio || '1:1') as AspectRatio}
          onPublishSuccess={imageHandlers.handleInstagramPublishSuccess}
        />
      )}

      {/* Post type change modal */}
      <PostTypeChangeModal
        open={editHook.showTypeChangeModal}
        onClose={() => editHook.setShowTypeChangeModal(false)}
        currentTypeSlug={editHook.editedPostType}
        currentTypeIcon={editHook.editedPostTypeIcon}
        currentTypeName={editHook.editedPostTypeName}
        onChangeType={editHook.changeType}
        isRegenerating={editHook.isRegeneratingCaption}
      />

      {/* Image regenerate modal */}
      <ImageRegenerateModal
        open={editHook.showRegenerateModal}
        onClose={() => editHook.setShowRegenerateModal(false)}
        postId={post.id}
        postType={editHook.isEditing ? editHook.editedPostType : post.post_type}
        caption={editHook.isEditing ? editHook.editedCaption : post.generated_caption}
        currentStyle={firstImage?.style || null}
        currentAspectRatio={firstImage?.aspect_ratio || null}
        onRegenerated={imageHandlers.handleImageRegenerated}
      />

      {/* Aspect ratio crop modal */}
      {firstImage && (
        <AspectRatioCropModal
          open={editHook.showAspectRatioModal}
          onClose={() => editHook.setShowAspectRatioModal(false)}
          postId={post.id}
          currentImageUrl={firstImage.image_url}
          currentAspectRatio={(firstImage.aspect_ratio as AspectRatio) || '1:1'}
          onCropComplete={imageHandlers.handleAspectRatioCropComplete}
        />
      )}
    </div>
  )
}
