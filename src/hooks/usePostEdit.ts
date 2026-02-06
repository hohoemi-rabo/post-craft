import { useState, useCallback } from 'react'
import type { Post } from '@/types/history-detail'
import type { PostType } from '@/types/post'
import { useToast } from '@/components/ui/toast'

/**
 * 投稿編集モードのカスタムフック
 */
export function usePostEdit(
  postId: string,
  initialPost: Post | null,
  onPostUpdate: (post: Post) => void
) {
  const { showToast } = useToast()

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editedCaption, setEditedCaption] = useState('')
  const [editedHashtags, setEditedHashtags] = useState<string[]>([])
  const [editedInputText, setEditedInputText] = useState('')
  const [editedPostType, setEditedPostType] = useState<PostType>('solution')
  const [newHashtagInput, setNewHashtagInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isRegeneratingCaption, setIsRegeneratingCaption] = useState(false)

  // Modal states
  const [showTypeChangeModal, setShowTypeChangeModal] = useState(false)
  const [showRegenerateModal, setShowRegenerateModal] = useState(false)
  const [showImageReplace, setShowImageReplace] = useState(false)
  const [showAspectRatioModal, setShowAspectRatioModal] = useState(false)

  /**
   * 編集モードを開始
   */
  const startEdit = useCallback(() => {
    if (!initialPost) return
    setEditedCaption(initialPost.generated_caption)
    setEditedHashtags([...initialPost.generated_hashtags])
    setEditedInputText(initialPost.input_text)
    setEditedPostType(initialPost.post_type)
    setIsEditing(true)
  }, [initialPost])

  /**
   * 編集をキャンセル
   */
  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setShowImageReplace(false)
  }, [])

  /**
   * 変更を保存
   */
  const saveChanges = useCallback(async () => {
    if (!initialPost) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
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
        onPostUpdate(updatedPost)
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
  }, [
    postId,
    initialPost,
    editedPostType,
    editedInputText,
    editedCaption,
    editedHashtags,
    onPostUpdate,
    showToast,
  ])

  /**
   * キャプションを再生成
   */
  const regenerateCaption = useCallback(async () => {
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
  }, [editedPostType, editedInputText, showToast])

  /**
   * 投稿タイプを変更
   */
  const changeType = useCallback(
    async (newType: PostType, regenerate: boolean) => {
      setEditedPostType(newType)
      setShowTypeChangeModal(false)

      if (regenerate) {
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
    },
    [editedInputText, showToast]
  )

  /**
   * ハッシュタグを追加
   */
  const addHashtag = useCallback(() => {
    const input = newHashtagInput.trim().replace(/^#+/, '')
    if (!input) return

    const normalizedInput = input.startsWith('#') ? input : input
    if (editedHashtags.some((t) => t.replace(/^#/, '') === normalizedInput)) {
      showToast('このハッシュタグは既に追加されています', 'info')
      return
    }

    setEditedHashtags([...editedHashtags, normalizedInput])
    setNewHashtagInput('')
  }, [newHashtagInput, editedHashtags, showToast])

  /**
   * ハッシュタグを削除
   */
  const removeHashtag = useCallback(
    (index: number) => {
      setEditedHashtags(editedHashtags.filter((_, i) => i !== index))
    },
    [editedHashtags]
  )

  return {
    // Edit state
    isEditing,
    editedCaption,
    editedHashtags,
    editedInputText,
    editedPostType,
    newHashtagInput,
    isSaving,
    isRegeneratingCaption,

    // Modal states
    showTypeChangeModal,
    showRegenerateModal,
    showImageReplace,
    showAspectRatioModal,

    // Setters
    setEditedCaption,
    setEditedInputText,
    setNewHashtagInput,
    setShowTypeChangeModal,
    setShowRegenerateModal,
    setShowImageReplace,
    setShowAspectRatioModal,

    // Actions
    startEdit,
    cancelEdit,
    saveChanges,
    regenerateCaption,
    changeType,
    addHashtag,
    removeHashtag,
  }
}
