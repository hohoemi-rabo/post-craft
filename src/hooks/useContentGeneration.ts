import { useState, useCallback } from 'react'
import type { CreateFormState, GeneratedResult, GenerationStep } from '@/types/create-flow'
import type { ImageStyle, AspectRatio } from '@/lib/image-styles'
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
            inputText: formState.inputText,
          }),
        })

        if (!captionResponse.ok) {
          throw new Error('キャプション生成に失敗しました')
        }

        const captionData = await captionResponse.json()
        setGeneratedCaption(captionData.caption)
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

        // Step 3: Save post
        updateStepStatus('save', 'loading')
        try {
          // Fetch hashtags from caption API response
          const captionResponse = await fetch('/api/generate/caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postType: formState.postType,
              inputText: formState.inputText,
            }),
          })
          const captionData = captionResponse.ok
            ? await captionResponse.json()
            : { hashtags: [] }

          const saveRes = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postType: formState.postType,
              inputText: formState.inputText,
              sourceUrl: formState.sourceUrl || null,
              generatedCaption: generatedCaption,
              generatedHashtags: captionData.hashtags || [],
              imageUrl: imageData.imageUrl,
              imageStyle,
              aspectRatio,
            }),
          })
          if (saveRes.ok) {
            const savedPost = await saveRes.json()
            setSavedPostId(savedPost.id)
          }
          updateStepStatus('save', 'complete')

          setGeneratedResult({
            caption: generatedCaption,
            hashtags: captionData.hashtags || [],
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
      generationSteps,
      initSteps,
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
            inputText: formState.inputText,
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
              postType: formState.postType,
              inputText: formState.inputText,
              sourceUrl: formState.sourceUrl || null,
              generatedCaption: captionData.caption,
              generatedHashtags: captionData.hashtags || [],
              imageUrl: imageUrl,
              imageStyle: skipImage ? null : style,
              aspectRatio: skipImage ? null : aspectRatio,
            }),
          })
          if (saveRes.ok) {
            const savedPost = await saveRes.json()
            setSavedPostId(savedPost.id)
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
    [generationSteps, initSteps, onStepChange, setGenerationProgress, updateStepStatus]
  )

  /**
   * 画像読み取りタイプの生成処理
   */
  const startImageReadGeneration = useCallback(
    async (
      imageBase64: string,
      imageMimeType: string,
      text: string,
      file: File,
      selectedAspectRatio: '1:1' | '4:5' | '16:9'
    ) => {
      const steps: GenerationStep[] = [
        { id: 'analyze', label: '画像を分析中...', status: 'pending' },
        { id: 'caption', label: '投稿文を生成中...', status: 'pending' },
        { id: 'upload', label: '画像をアップロード中...', status: 'pending' },
        { id: 'save', label: '保存中...', status: 'pending' },
      ]
      initSteps(steps)

      try {
        // Step 1 & 2: 画像分析 + キャプション生成（API内で同時実行）
        updateStepStatus('analyze', 'loading')
        updateStepStatus('caption', 'loading')

        const captionResponse = await fetch('/api/generate/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: 'image_read',
            inputText: text,
            imageBase64,
            imageMimeType,
          }),
        })

        if (!captionResponse.ok) {
          const errorData = await captionResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'キャプション生成に失敗しました')
        }

        const captionData = await captionResponse.json()
        updateStepStatus('analyze', 'complete')
        updateStepStatus('caption', 'complete')
        setGenerationProgress(50)

        // Step 3: 投稿を保存（画像URLはまだnull）
        updateStepStatus('upload', 'loading')

        const saveRes = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: 'image_read',
            inputText: text,
            sourceUrl: null,
            generatedCaption: captionData.caption,
            generatedHashtags: captionData.hashtags || [],
            imageUrl: null,
            imageStyle: 'uploaded',
            aspectRatio: selectedAspectRatio,
          }),
        })

        if (!saveRes.ok) {
          throw new Error('投稿の保存に失敗しました')
        }

        const savedPost = await saveRes.json()
        setSavedPostId(savedPost.id)
        setGenerationProgress(70)

        // Step 4: 画像をアップロード
        const uploadFormData = new FormData()
        uploadFormData.append('image', file)

        const uploadRes = await fetch(`/api/posts/${savedPost.id}/image`, {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadRes.ok) {
          throw new Error('画像のアップロードに失敗しました')
        }

        const { imageUrl } = await uploadRes.json()
        updateStepStatus('upload', 'complete')
        setGenerationProgress(90)

        // Step 5: 完了
        updateStepStatus('save', 'complete')
        setGenerationProgress(100)

        setGeneratedResult({
          caption: captionData.caption,
          hashtags: captionData.hashtags || [],
          imageUrl,
        })

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
    [generationSteps, initSteps, onStepChange, setGenerationProgress, updateStepStatus]
  )

  /**
   * 画像の再生成
   */
  const regenerateImage = useCallback(
    async (formState: CreateFormState) => {
      if (!generatedResult || !formState.postType || formState.skipImage) return

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
    startImageReadGeneration,
    regenerateImage,
    resetGeneration,
    setGeneratedCaption,
  }
}
