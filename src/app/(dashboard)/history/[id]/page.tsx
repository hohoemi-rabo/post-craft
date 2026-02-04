'use client'

import { useEffect, useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { POST_TYPES } from '@/lib/post-types'
import type { PostType } from '@/types/post'
import { InstagramPublishModal } from '@/components/publish/instagram-publish-modal'
import { ImageUploader } from '@/components/ui/image-uploader'
import { useToast } from '@/components/ui/toast'
import { PostTypeChangeModal } from '@/components/history/post-edit-modal'
import { ImageRegenerateModal } from '@/components/history/image-regenerate-modal'

interface PostImage {
  id: string
  image_url: string
  image_style: string | null
  aspect_ratio: string | null
}

interface Post {
  id: string
  post_type: PostType
  input_text: string
  source_url: string | null
  generated_caption: string
  generated_hashtags: string[]
  created_at: string
  post_images: PostImage[]
  instagram_published: boolean
  instagram_published_at: string | null
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { showToast } = useToast()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedHashtags, setCopiedHashtags] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editedCaption, setEditedCaption] = useState('')
  const [editedHashtags, setEditedHashtags] = useState<string[]>([])
  const [editedInputText, setEditedInputText] = useState('')
  const [editedPostType, setEditedPostType] = useState<PostType>('solution')
  const [newHashtagInput, setNewHashtagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isRegeneratingCaption, setIsRegeneratingCaption] = useState(false)
  const [showTypeChangeModal, setShowTypeChangeModal] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [showImageReplace, setShowImageReplace] = useState(false)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatHashtag = (tag: string) => {
    return tag.startsWith('#') ? tag : `#${tag}`
  }

  // --- Copy handlers ---
  const handleCopyCaption = async () => {
    if (!post) return
    await navigator.clipboard.writeText(post.generated_caption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }

  const handleCopyHashtags = async () => {
    if (!post) return
    const hashtagsText = post.generated_hashtags.map(formatHashtag).join('\n')
    await navigator.clipboard.writeText(hashtagsText)
    setCopiedHashtags(true)
    setTimeout(() => setCopiedHashtags(false), 2000)
  }

  const handleCopyAll = async () => {
    if (!post) return
    const hashtagsText = post.generated_hashtags.map(formatHashtag).join('\n')
    const text = `${post.generated_caption}\n\n${hashtagsText}`
    await navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `post-craft-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (response.ok) {
        router.push('/history')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const getFullCaption = () => {
    if (!post) return ''
    const hashtagsText = post.generated_hashtags.map(formatHashtag).join('\n')
    return `${post.generated_caption}\n\n${hashtagsText}`
  }

  const handleReuse = () => {
    if (!post) return
    sessionStorage.setItem(
      'reusePost',
      JSON.stringify({
        postType: post.post_type,
        inputText: post.input_text,
      })
    )
    router.push('/create')
  }

  // --- Edit mode handlers ---
  const handleStartEdit = () => {
    if (!post) return
    setEditedCaption(post.generated_caption)
    setEditedHashtags([...post.generated_hashtags])
    setEditedInputText(post.input_text)
    setEditedPostType(post.post_type)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setShowImageReplace(false)
  }

  const handleSave = async () => {
    if (!post) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_type: editedPostType,
          input_text: editedInputText,
          generated_caption: editedCaption,
          generated_hashtags: editedHashtags,
        }),
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        setIsEditing(false)
        setShowImageReplace(false)
        showToast('保存しました', 'success')
      } else {
        showToast('保存に失敗しました', 'error')
      }
    } catch (error) {
      console.error('Save error:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // --- Caption regeneration ---
  const handleRegenerateCaption = async () => {
    setIsRegeneratingCaption(true)
    try {
      const response = await fetch('/api/generate/caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postType: editedPostType,
          inputText: editedInputText,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEditedCaption(data.caption)
        if (data.hashtags) {
          setEditedHashtags(data.hashtags)
        }
        showToast('キャプションを再生成しました', 'success')
      } else {
        showToast('キャプション再生成に失敗しました', 'error')
      }
    } catch (error) {
      console.error('Caption regeneration error:', error)
      showToast('キャプション再生成に失敗しました', 'error')
    } finally {
      setIsRegeneratingCaption(false)
    }
  }

  // --- Post type change ---
  const handleChangeType = async (newType: PostType, regenerateCaption: boolean) => {
    setEditedPostType(newType)
    setShowTypeChangeModal(false)

    if (regenerateCaption) {
      setIsRegeneratingCaption(true)
      try {
        const response = await fetch('/api/generate/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: newType,
            inputText: editedInputText,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setEditedCaption(data.caption)
          if (data.hashtags) {
            setEditedHashtags(data.hashtags)
          }
          showToast('キャプションを再生成しました', 'success')
        } else {
          showToast('キャプション再生成に失敗しました', 'error')
        }
      } catch (error) {
        console.error('Caption regeneration error:', error)
        showToast('キャプション再生成に失敗しました', 'error')
      } finally {
        setIsRegeneratingCaption(false)
      }
    }
  }

  // --- Hashtag editing ---
  const handleAddHashtag = () => {
    const input = newHashtagInput.trim().replace(/^#+/, '')
    if (!input) return

    const normalizedInput = input.startsWith('#') ? input : input
    if (editedHashtags.some((t) => t.replace(/^#/, '') === normalizedInput)) {
      showToast('このハッシュタグは既に追加されています', 'info')
      return
    }

    setEditedHashtags([...editedHashtags, normalizedInput])
    setNewHashtagInput('')
  }

  const handleRemoveHashtag = (index: number) => {
    setEditedHashtags(editedHashtags.filter((_, i) => i !== index))
  }

  // --- Image handlers ---
  const handleImageReplaceComplete = (url: string) => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            post_images: [
              {
                id: crypto.randomUUID(),
                image_url: url,
                image_style: 'uploaded',
                aspect_ratio: '1:1',
              },
            ],
          }
        : prev
    )
    setShowImageReplace(false)
    showToast('画像を差し替えました', 'success')
  }

  const handleImageRegenerated = (newImageUrl: string) => {
    setPost((prev) => {
      if (!prev) return prev
      const updatedImages = prev.post_images.length > 0
        ? prev.post_images.map((img, i) =>
            i === 0 ? { ...img, image_url: newImageUrl } : img
          )
        : [{ id: crypto.randomUUID(), image_url: newImageUrl, image_style: null, aspect_ratio: '1:1' }]
      return { ...prev, post_images: updatedImages }
    })
    showToast('画像を再生成しました', 'success')
  }

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

  const displayPostType = isEditing ? editedPostType : post.post_type
  const typeConfig = POST_TYPES[displayPostType]
  const firstImage = post.post_images?.[0]
  const aspectRatio = firstImage?.aspect_ratio || '1:1'
  const aspectClass = aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-square'

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
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartEdit}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors text-sm"
          >
            ✏️ 編集
          </button>
        )}
      </div>

      {/* Post info */}
      <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
        <span className="text-2xl">{typeConfig?.icon}</span>
        <div className="flex-1">
          <p className="font-medium text-white">{typeConfig?.name}</p>
          <p className="text-xs text-slate-400">{formatDate(post.created_at)}</p>
        </div>
        {isEditing && (
          <button
            onClick={() => setShowTypeChangeModal(true)}
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
          {firstImage && !showImageReplace ? (
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
                onClick={() => handleDownloadImage(firstImage.image_url)}
                className="w-full max-w-sm mx-auto block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                ⬇️ 画像をダウンロード
              </button>
              {isEditing && (
                <div className="flex gap-2 max-w-sm mx-auto">
                  <button
                    onClick={() => setShowImageReplace(true)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
                  >
                    📷 画像を差し替え
                  </button>
                  <button
                    onClick={() => setShowRegenerateModal(true)}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
                  >
                    🔄 AI画像再生成
                  </button>
                </div>
              )}
            </>
          ) : showImageReplace ? (
            <div className="space-y-2">
              <ImageUploader
                postId={post.id}
                onUploadComplete={handleImageReplaceComplete}
                replace
              />
              <button
                onClick={() => setShowImageReplace(false)}
                className="w-full max-w-sm mx-auto block px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-lg transition-colors"
              >
                キャンセル
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <ImageUploader
                postId={post.id}
                onUploadComplete={(url) => {
                  setPost((prev) =>
                    prev
                      ? {
                          ...prev,
                          post_images: [
                            ...prev.post_images,
                            {
                              id: crypto.randomUUID(),
                              image_url: url,
                              image_style: 'uploaded',
                              aspect_ratio: '1:1',
                            },
                          ],
                        }
                      : prev
                  )
                }}
              />
              {isEditing && (
                <button
                  onClick={() => setShowRegenerateModal(true)}
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
              {isEditing ? (
                <button
                  onClick={handleRegenerateCaption}
                  disabled={isRegeneratingCaption}
                  className="text-xs px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isRegeneratingCaption ? '生成中...' : '🤖 AIで再生成'}
                </button>
              ) : (
                <button
                  onClick={handleCopyCaption}
                  className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                >
                  {copiedCaption ? '✅ コピーしました' : '📋 コピー'}
                </button>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editedCaption}
                onChange={(e) => setEditedCaption(e.target.value)}
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
              {!isEditing && (
                <button
                  onClick={handleCopyHashtags}
                  className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                >
                  {copiedHashtags ? '✅ コピーしました' : '📋 コピー'}
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHashtagInput}
                    onChange={(e) => setNewHashtagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddHashtag()
                      }
                    }}
                    placeholder="ハッシュタグを追加..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddHashtag}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors"
                  >
                    追加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editedHashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full"
                    >
                      {formatHashtag(tag)}
                      <button
                        onClick={() => handleRemoveHashtag(index)}
                        className="hover:text-red-400 transition-colors ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500">{editedHashtags.length}個</p>
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
          {(post.input_text || isEditing) && (
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-slate-300">元のメモ</h2>
              {isEditing ? (
                <textarea
                  value={editedInputText}
                  onChange={(e) => setEditedInputText(e.target.value)}
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
      {!isEditing && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={handleCopyAll}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
            >
              {copiedAll ? '✅ コピーしました' : '📋 すべてコピー'}
            </button>
            {firstImage ? (
              <button
                onClick={() => setShowPublishModal(true)}
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
              onClick={handleReuse}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
            >
              🔄 このテンプレートで新規作成
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
            >
              🗑️ 削除
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">投稿を削除</h3>
            <p className="text-slate-400 text-sm mb-6">
              この投稿を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
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
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          caption={getFullCaption()}
          imageUrl={firstImage.image_url}
          postId={post.id}
          onPublishSuccess={() => {
            setPost((prev) =>
              prev
                ? {
                    ...prev,
                    instagram_published: true,
                    instagram_published_at: new Date().toISOString(),
                  }
                : prev
            )
          }}
        />
      )}

      {/* Post type change modal */}
      <PostTypeChangeModal
        open={showTypeChangeModal}
        onClose={() => setShowTypeChangeModal(false)}
        currentType={editedPostType}
        onChangeType={handleChangeType}
        isRegenerating={isRegeneratingCaption}
      />

      {/* Image regenerate modal */}
      <ImageRegenerateModal
        open={showRegenerateModal}
        onClose={() => setShowRegenerateModal(false)}
        postId={post.id}
        postType={isEditing ? editedPostType : post.post_type}
        caption={isEditing ? editedCaption : post.generated_caption}
        currentStyle={firstImage?.image_style || null}
        currentAspectRatio={firstImage?.aspect_ratio || null}
        onRegenerated={handleImageRegenerated}
      />
    </div>
  )
}
