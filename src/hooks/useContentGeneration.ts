import { useState, useCallback } from 'react'
import type { CreateFormState, GeneratedResult, GenerationStep, UploadedImage } from '@/types/create-flow'
import type { ImageStyle, AspectRatio } from '@/lib/image-styles'
import { compositeTextOnImage, blobToFile, base64ToBlob, getOutputDimensions } from '@/lib/canvas-text-overlay'
import { useGenerationSteps } from './useGenerationSteps'

interface UseContentGenerationOptions {
  onStepChange: (step: number) => void
}

/**
 * 投稿コンテンツ生成のカスタムフック
 *
 * キャプション生成、画像生成、保存などの生成フロー全体を管理する
 */
export function useContentGeneration({ onStepChange }: UseContentGenerationOptions) {
  const [generatedCaption, setGeneratedCaption] = useState<string>('')
  const [generatedHashtagsFromCaption, setGeneratedHashtagsFromCaption] = useState<string[]>([])
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null)
  const [savedPostId, setSavedPostId] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const {
    generationSteps,
    generationProgress,
    setGenerationProgress,
    updateStepStatus,
    initSteps,
    resetSteps,
  } = useGenerationSteps()

  // アイデアを使用済みにする（投稿保存成功後に呼び出し）
  const markIdeaAsUsed = useCallback(async (ideaId: string | null) => {
    if (!ideaId) return
    try {
      await fetch(`/api/ideas/${ideaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isUsed: true }),
      })
    } catch {
      // アイデアの更新失敗は投稿保存に影響させない
    }
  }, [])

  /**
   * キャプションのみを先に生成（キャッチコピー確認画面用）
   */
  const generateCaptionFirst = useCallback(
    async (formState: CreateFormState) => {
      try {
        const captionResponse = await fetch('/api/generate/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: formState.postType,
            postTypeId: formState.postTypeId,
            profileId: formState.profileId || undefined,
            inputText: formState.inputText,
            relatedPostCaption: formState.relatedPostCaption || undefined,
            relatedPostHashtags: formState.relatedPostHashtags || undefined,
            remakeSourceCaption: formState.remakeSourceCaption || undefined,
            remakeSourcePostType: formState.remakeSourcePostType || undefined,
          }),
        })

        if (!captionResponse.ok) {
          throw new Error('キャプション生成に失敗しました')
        }

        const captionData = await captionResponse.json()
        setGeneratedCaption(captionData.caption)
        setGeneratedHashtagsFromCaption(captionData.hashtags || [])
      } catch (error) {
        console.error('Caption generation error:', error)
        alert('キャプション生成に失敗しました。もう一度お試しください。')
        onStepChange(3) // Go back to image settings
      }
    },
    [onStepChange]
  )

  /**
   * キャッチコピー確認後の生成処理
   */
  const startGenerationWithCaption = useCallback(
    async (formState: CreateFormState, catchphrase: string) => {
      const { imageStyle, aspectRatio, characterId, useCharacterImage } = formState

      const steps: GenerationStep[] = [
        { id: 'scene', label: 'シーン説明を生成中...', status: 'pending' },
        { id: 'image', label: '画像を生成中...', status: 'pending' },
        { id: 'save', label: '保存中...', status: 'pending' },
      ]
      initSteps(steps)

      try {
        // Step 1: Generate scene description
        updateStepStatus('scene', 'loading')
        let sceneDescription = ''
        try {
          const sceneResponse = await fetch('/api/generate/scene', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caption: generatedCaption,
              postType: formState.postType,
              postTypeName: formState.postTypeName,
            }),
          })
          if (sceneResponse.ok) {
            const sceneData = await sceneResponse.json()
            sceneDescription = sceneData.sceneDescription
          } else {
            throw new Error('Scene generation failed')
          }
        } catch {
          sceneDescription = '親しみやすい雰囲気でスマートフォンやパソコンを使っている様子'
        }
        updateStepStatus('scene', 'complete')
        setGenerationProgress(33)

        // Step 2: Generate image
        updateStepStatus('image', 'loading')
        const imageResponse = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style: imageStyle,
            aspectRatio,
            characterId,
            sceneDescription,
            useCharacterImage,
            catchphrase,
            backgroundType: formState.backgroundType,
          }),
        })

        if (!imageResponse.ok) {
          throw new Error('画像生成に失敗しました')
        }

        const imageData = await imageResponse.json()
        updateStepStatus('image', 'complete')
        setGenerationProgress(66)

        // Step 3: Save post (use hashtags cached from generateCaptionFirst)
        updateStepStatus('save', 'loading')
        try {
          const saveRes = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postType: formState.postType || formState.postTypeName || 'custom',
              postTypeId: formState.postTypeId,
              profileId: formState.profileId || null,
              inputText: formState.inputText,
              sourceUrl: formState.sourceUrl || null,
              generatedCaption: generatedCaption,
              generatedHashtags: generatedHashtagsFromCaption,
              imageUrl: imageData.imageUrl,
              imageStyle,
              aspectRatio,
              relatedPostId: formState.relatedPostId || null,
              remakeSourceId: formState.remakeSourceId || null,
            }),
          })
          if (saveRes.ok) {
            const savedPost = await saveRes.json()
            setSavedPostId(savedPost.id)
            markIdeaAsUsed(formState.ideaId)
          }
          updateStepStatus('save', 'complete')

          setGeneratedResult({
            caption: generatedCaption,
            hashtags: generatedHashtagsFromCaption,
            imageUrl: imageData.imageUrl,
          })
        } catch {
          console.error('Failed to save post')
          updateStepStatus('save', 'complete')
          setGeneratedResult({
            caption: generatedCaption,
            hashtags: [],
            imageUrl: imageData.imageUrl,
          })
        }
        setGenerationProgress(100)

        setTimeout(() => onStepChange(6), 500)
      } catch (error) {
        console.error('Generation error:', error)
        const currentStep = generationSteps.find((s) => s.status === 'loading')
        if (currentStep) {
          updateStepStatus(
            currentStep.id,
            'error',
            error instanceof Error ? error.message : '生成に失敗しました'
          )
        }
      }
    },
    [
      generatedCaption,
      generatedHashtagsFromCaption,
      generationSteps,
      initSteps,
      markIdeaAsUsed,
      onStepChange,
      setGenerationProgress,
      updateStepStatus,
    ]
  )

  /**
   * 通常の生成処理（skipImage対応）
   */
  const startGeneration = useCallback(
    async (
      formState: CreateFormState,
      style: ImageStyle,
      aspectRatio: AspectRatio,
      characterId: string | null,
      skipImage: boolean,
      useCharacterImage: boolean,
      catchphrase: string
    ) => {
      const steps: GenerationStep[] = skipImage
        ? [
            { id: 'caption', label: '投稿文を生成中...', status: 'pending' },
            { id: 'save', label: '保存中...', status: 'pending' },
          ]
        : [
            { id: 'caption', label: '投稿文を生成中...', status: 'pending' },
            { id: 'scene', label: 'シーン説明を生成中...', status: 'pending' },
            { id: 'image', label: '画像を生成中...', status: 'pending' },
            { id: 'save', label: '保存中...', status: 'pending' },
          ]
      initSteps(steps)

      try {
        // Step 1: Generate caption
        updateStepStatus('caption', 'loading')
        const captionResponse = await fetch('/api/generate/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: formState.postType,
            postTypeId: formState.postTypeId,
            profileId: formState.profileId || undefined,
            inputText: formState.inputText,
            relatedPostCaption: formState.relatedPostCaption || undefined,
            relatedPostHashtags: formState.relatedPostHashtags || undefined,
            remakeSourceCaption: formState.remakeSourceCaption || undefined,
            remakeSourcePostType: formState.remakeSourcePostType || undefined,
          }),
        })

        if (!captionResponse.ok) {
          const errorData = await captionResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'キャプション生成に失敗しました')
        }

        const captionData = await captionResponse.json()
        updateStepStatus('caption', 'complete')
        setGenerationProgress(skipImage ? 50 : 25)

        let imageUrl: string | null = null

        if (!skipImage) {
          // Step 2: Generate scene description
          updateStepStatus('scene', 'loading')
          let sceneDescription = ''
          try {
            const sceneResponse = await fetch('/api/generate/scene', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                caption: captionData.caption,
                postType: formState.postType,
                postTypeName: formState.postTypeName,
              }),
            })
            if (sceneResponse.ok) {
              const sceneData = await sceneResponse.json()
              sceneDescription = sceneData.sceneDescription
            } else {
              throw new Error('Scene generation failed')
            }
          } catch {
            sceneDescription = '親しみやすい雰囲気でスマートフォンやパソコンを使っている様子'
          }
          updateStepStatus('scene', 'complete')
          setGenerationProgress(50)

          // Step 3: Generate image
          updateStepStatus('image', 'loading')
          const imageResponse = await fetch('/api/generate/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              style,
              aspectRatio,
              characterId,
              sceneDescription,
              useCharacterImage,
              catchphrase,
              backgroundType: formState.backgroundType,
            }),
          })

          if (!imageResponse.ok) {
            throw new Error('画像生成に失敗しました')
          }

          const imageData = await imageResponse.json()
          imageUrl = imageData.imageUrl
          updateStepStatus('image', 'complete')
          setGenerationProgress(75)
        }

        // Final Step: Save post
        updateStepStatus('save', 'loading')
        try {
          const saveRes = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postType: formState.postType || formState.postTypeName || 'custom',
              postTypeId: formState.postTypeId,
              profileId: formState.profileId || null,
              inputText: formState.inputText,
              sourceUrl: formState.sourceUrl || null,
              generatedCaption: captionData.caption,
              generatedHashtags: captionData.hashtags || [],
              imageUrl: imageUrl,
              imageStyle: skipImage ? null : style,
              aspectRatio: skipImage ? null : aspectRatio,
              relatedPostId: formState.relatedPostId || null,
              remakeSourceId: formState.remakeSourceId || null,
            }),
          })
          if (saveRes.ok) {
            const savedPost = await saveRes.json()
            setSavedPostId(savedPost.id)
            markIdeaAsUsed(formState.ideaId)
          }
          updateStepStatus('save', 'complete')
        } catch {
          console.error('Failed to save post')
          updateStepStatus('save', 'complete')
        }
        setGenerationProgress(100)

        setGeneratedResult({
          caption: captionData.caption,
          hashtags: captionData.hashtags || [],
          imageUrl: imageUrl,
        })

        setTimeout(() => onStepChange(skipImage ? 5 : 6), 500)
      } catch (error) {
        console.error('Generation error:', error)
        const currentStep = generationSteps.find((s) => s.status === 'loading')
        if (currentStep) {
          updateStepStatus(
            currentStep.id,
            'error',
            error instanceof Error ? error.message : '生成に失敗しました'
          )
        }
      }
    },
    [generationSteps, initSteps, markIdeaAsUsed, onStepChange, setGenerationProgress, updateStepStatus]
  )

  /**
   * 画像読み取りタイプ: キャプションのみ生成（キャッチコピー確認画面用）
   */
  const startImageReadCaptionOnly = useCallback(
    async (
      images: UploadedImage[],
      text: string,
      currentFormState: CreateFormState
    ) => {
      try {
        const captionResponse = await fetch('/api/generate/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: currentFormState.postType || 'image_read',
            postTypeId: currentFormState.postTypeId,
            profileId: currentFormState.profileId,
            inputText: text,
            images: images.map(({ base64, mimeType }) => ({ base64, mimeType })),
            relatedPostCaption: currentFormState.relatedPostCaption || undefined,
            relatedPostHashtags: currentFormState.relatedPostHashtags || undefined,
          }),
        })

        if (!captionResponse.ok) {
          const errorData = await captionResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'キャプション生成に失敗しました')
        }

        const captionData = await captionResponse.json()
        setGeneratedCaption(captionData.caption)
        setGeneratedHashtagsFromCaption(captionData.hashtags || [])
      } catch (error) {
        console.error('Caption generation error:', error)
        alert('キャプション生成に失敗しました。もう一度お試しください。')
        onStepChange(2)
      }
    },
    [onStepChange]
  )

  /**
   * 画像読み取りタイプ: キャッチコピー確定後の合成・保存処理
   */
  const startImageReadWithCatchphrase = useCallback(
    async (
      catchphrase: string,
      currentFormState: CreateFormState
    ) => {
      const imgs = currentFormState.uploadedImages
      if (!imgs || imgs.length === 0) {
        alert('画像が見つかりません。もう一度画像を選択してください。')
        onStepChange(2)
        return
      }

      const steps: GenerationStep[] = [
        { id: 'composite', label: 'キャッチコピーを合成中...', status: 'pending' },
        { id: 'save', label: '投稿を保存中...', status: 'pending' },
        ...imgs.map((_, i) => ({
          id: `upload-${i}`,
          label: imgs.length > 1 ? `画像をアップロード中 (${i + 1}/${imgs.length})...` : '画像をアップロード中...',
          status: 'pending' as const,
        })),
      ]
      initSteps(steps)

      try {
        // Step 1: Canvas でテキスト合成（1枚目のみ = カルーセルの表紙）
        updateStepStatus('composite', 'loading')
        const aspectRatio = currentFormState.imageReadAspectRatio || '1:1'
        const { width, height } = getOutputDimensions(aspectRatio)
        const imageDataUrl = `data:${imgs[0].mimeType};base64,${imgs[0].base64}`
        const compositedBlob = await compositeTextOnImage(imageDataUrl, catchphrase, width, height)
        const compositedFile = blobToFile(compositedBlob, `composited-${Date.now()}.jpg`)
        updateStepStatus('composite', 'complete')
        setGenerationProgress(33)

        // Step 2: 投稿を保存
        updateStepStatus('save', 'loading')
        const saveRes = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: currentFormState.postType || 'image_read',
            postTypeId: currentFormState.postTypeId,
            profileId: currentFormState.profileId,
            inputText: currentFormState.inputText,
            sourceUrl: null,
            generatedCaption: generatedCaption,
            generatedHashtags: generatedHashtagsFromCaption,
            imageUrl: null,
            imageStyle: 'uploaded',
            aspectRatio,
            relatedPostId: currentFormState.relatedPostId || null,
          }),
        })

        if (!saveRes.ok) {
          throw new Error('投稿の保存に失敗しました')
        }

        const savedPost = await saveRes.json()
        setSavedPostId(savedPost.id)
        markIdeaAsUsed(currentFormState.ideaId)
        updateStepStatus('save', 'complete')
        setGenerationProgress(60)

        // Step 3: 画像を順次アップロード（直列 = post_images の挿入順 = カルーセル投稿順を保証）
        let firstImageUrl: string | null = null
        for (let i = 0; i < imgs.length; i++) {
          updateStepStatus(`upload-${i}`, 'loading')
          const uploadFormData = new FormData()
          uploadFormData.append('aspectRatio', aspectRatio)

          if (i === 0) {
            // 1枚目: キャッチコピー合成済み画像 + 元画像（再合成モーダル用に post_images.prompt へ保存される）
            uploadFormData.append('image', compositedFile)
            const originalBlob = base64ToBlob(imgs[0].base64, imgs[0].mimeType)
            const originalFile = blobToFile(originalBlob, `original-${Date.now()}.jpg`)
            uploadFormData.append('originalImage', originalFile)
          } else {
            // 2枚目以降: クロップ済み画像をそのままアップロード
            const blob = base64ToBlob(imgs[i].base64, imgs[i].mimeType)
            uploadFormData.append('image', blobToFile(blob, `upload-${Date.now()}-${i}.jpg`))
          }

          const uploadRes = await fetch(`/api/posts/${savedPost.id}/image`, {
            method: 'POST',
            body: uploadFormData,
          })

          if (!uploadRes.ok) {
            throw new Error(imgs.length > 1 ? `画像のアップロードに失敗しました（${i + 1}枚目）` : '画像のアップロードに失敗しました')
          }

          const { imageUrl } = await uploadRes.json()
          if (i === 0) {
            firstImageUrl = imageUrl
          }
          updateStepStatus(`upload-${i}`, 'complete')
          setGenerationProgress(60 + Math.round((40 * (i + 1)) / imgs.length))
        }

        setGeneratedResult({
          caption: generatedCaption,
          hashtags: generatedHashtagsFromCaption,
          imageUrl: firstImageUrl,
        })

        setTimeout(() => onStepChange(5), 500)
      } catch (error) {
        console.error('Generation error:', error)
        const currentStep = generationSteps.find((s) => s.status === 'loading')
        if (currentStep) {
          updateStepStatus(
            currentStep.id,
            'error',
            error instanceof Error ? error.message : '生成に失敗しました'
          )
        }
      }
    },
    [
      generatedCaption,
      generatedHashtagsFromCaption,
      generationSteps,
      initSteps,
      markIdeaAsUsed,
      onStepChange,
      setGenerationProgress,
      updateStepStatus,
    ]
  )

  /**
   * フォーム入力＋画像読み取りタイプ（flow_type='image_read_fields'）の生成処理
   *
   * フォーム情報（inputText）と任意の画像を AI に渡してキャプション生成、
   * 投稿を保存し、画像があればそのまま投稿の1枚目として保存する。
   * キャッチコピー合成・AI画像生成は行わない。
   */
  const startFieldsImageRead = useCallback(
    async (
      currentFormState: CreateFormState,
      imageBase64: string | null,
      imageMimeType: string | null,
      file: File | null
    ) => {
      const hasImage = !!(file && imageBase64 && imageMimeType)
      const steps: GenerationStep[] = hasImage
        ? [
            { id: 'caption', label: '投稿文を生成中...', status: 'pending' },
            { id: 'save', label: '投稿を保存中...', status: 'pending' },
            { id: 'upload', label: '画像をアップロード中...', status: 'pending' },
          ]
        : [
            { id: 'caption', label: '投稿文を生成中...', status: 'pending' },
            { id: 'save', label: '投稿を保存中...', status: 'pending' },
          ]
      initSteps(steps)

      try {
        // Step 1: キャプション生成（画像があれば解析も実行）
        updateStepStatus('caption', 'loading')
        const captionResponse = await fetch('/api/generate/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: currentFormState.postType,
            postTypeId: currentFormState.postTypeId,
            profileId: currentFormState.profileId || undefined,
            inputText: currentFormState.inputText,
            ...(hasImage ? { imageBase64, imageMimeType } : {}),
            relatedPostCaption: currentFormState.relatedPostCaption || undefined,
            relatedPostHashtags: currentFormState.relatedPostHashtags || undefined,
            remakeSourceCaption: currentFormState.remakeSourceCaption || undefined,
            remakeSourcePostType: currentFormState.remakeSourcePostType || undefined,
          }),
        })

        if (!captionResponse.ok) {
          const errorData = await captionResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'キャプション生成に失敗しました')
        }

        const captionData = await captionResponse.json()
        const caption = captionData.caption
        const hashtags = captionData.hashtags || []
        updateStepStatus('caption', 'complete')
        setGenerationProgress(hasImage ? 33 : 50)

        // Step 2: 投稿を保存
        updateStepStatus('save', 'loading')
        const saveRes = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: currentFormState.postType || currentFormState.postTypeName || 'custom',
            postTypeId: currentFormState.postTypeId,
            profileId: currentFormState.profileId || null,
            inputText: currentFormState.inputText,
            sourceUrl: null,
            generatedCaption: caption,
            generatedHashtags: hashtags,
            imageUrl: null,
            imageStyle: hasImage ? 'uploaded' : null,
            aspectRatio: null,
            relatedPostId: currentFormState.relatedPostId || null,
            remakeSourceId: currentFormState.remakeSourceId || null,
          }),
        })

        if (!saveRes.ok) {
          throw new Error('投稿の保存に失敗しました')
        }

        const savedPost = await saveRes.json()
        setSavedPostId(savedPost.id)
        markIdeaAsUsed(currentFormState.ideaId)
        updateStepStatus('save', 'complete')
        setGenerationProgress(hasImage ? 66 : 100)

        // Step 3: 画像があればそのまま投稿画像として保存（合成なし）
        let imageUrl: string | null = null
        if (hasImage) {
          updateStepStatus('upload', 'loading')
          const uploadFormData = new FormData()
          uploadFormData.append('image', file!)

          const uploadRes = await fetch(`/api/posts/${savedPost.id}/image`, {
            method: 'POST',
            body: uploadFormData,
          })

          if (!uploadRes.ok) {
            throw new Error('画像のアップロードに失敗しました')
          }

          const uploadData = await uploadRes.json()
          imageUrl = uploadData.imageUrl
          updateStepStatus('upload', 'complete')
          setGenerationProgress(100)
        }

        setGeneratedResult({ caption, hashtags, imageUrl })
        setTimeout(() => onStepChange(4), 500)
      } catch (error) {
        console.error('Generation error:', error)
        const currentStep = generationSteps.find((s) => s.status === 'loading')
        if (currentStep) {
          updateStepStatus(
            currentStep.id,
            'error',
            error instanceof Error ? error.message : '生成に失敗しました'
          )
        }
      }
    },
    [generationSteps, initSteps, markIdeaAsUsed, onStepChange, setGenerationProgress, updateStepStatus]
  )

  /**
   * 画像の再生成
   */
  const regenerateImage = useCallback(
    async (formState: CreateFormState) => {
      if (!generatedResult || (!formState.postType && !formState.postTypeId) || formState.skipImage) return

      setIsRegenerating(true)

      try {
        let sceneDescription = '親しみやすい雰囲気でスマートフォンやパソコンを使っている様子'
        try {
          const sceneResponse = await fetch('/api/generate/scene', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              caption: generatedResult.caption,
              postType: formState.postType,
              postTypeName: formState.postTypeName,
            }),
          })
          if (sceneResponse.ok) {
            const sceneData = await sceneResponse.json()
            sceneDescription = sceneData.sceneDescription
          }
        } catch {
          // Use fallback
        }

        const imageResponse = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            style: formState.imageStyle,
            aspectRatio: formState.aspectRatio,
            characterId: formState.characterId,
            sceneDescription,
            useCharacterImage: formState.useCharacterImage,
            catchphrase: formState.catchphrase,
            backgroundType: formState.backgroundType,
          }),
        })

        if (!imageResponse.ok) {
          throw new Error('画像の再生成に失敗しました')
        }

        const imageData = await imageResponse.json()
        setGeneratedResult((prev) =>
          prev ? { ...prev, imageUrl: imageData.imageUrl } : null
        )
      } catch (error) {
        console.error('Regeneration error:', error)
        alert('画像の再生成に失敗しました')
      } finally {
        setIsRegenerating(false)
      }
    },
    [generatedResult]
  )

  /**
   * 全ての生成状態をリセット
   */
  const resetGeneration = useCallback(() => {
    setGeneratedCaption('')
    setGeneratedHashtagsFromCaption([])
    setGeneratedResult(null)
    setSavedPostId(null)
    resetSteps()
  }, [resetSteps])

  return {
    // State
    generatedCaption,
    generatedResult,
    savedPostId,
    isRegenerating,
    generationSteps,
    generationProgress,

    // Actions
    generateCaptionFirst,
    startGenerationWithCaption,
    startGeneration,
    startImageReadCaptionOnly,
    startImageReadWithCatchphrase,
    startFieldsImageRead,
    regenerateImage,
    resetGeneration,
    setGeneratedCaption,
  }
}
