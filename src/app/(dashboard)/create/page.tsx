'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  StepPostType,
  StepContentInput,
  StepImageSettings,
  StepCatchphrase,
  StepGenerating,
  StepResult,
  ProgressIndicator,
} from '@/components/create'
import { StepImageReadInput } from '@/components/create/step-image-read-input'
import { type PostType } from '@/types/post'
import { type ImageStyle, type AspectRatio, type BackgroundType } from '@/lib/image-styles'
import {
  type CreateFormState,
  type GeneratedResult,
  type GenerationStep,
  INITIAL_FORM_STATE,
} from '@/types/create-flow'
import { useGenerationSteps } from '@/hooks/useGenerationSteps'

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [formState, setFormState] = useState<CreateFormState>(INITIAL_FORM_STATE)
  const [generatedCaption, setGeneratedCaption] = useState<string>('')
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null)
  const {
    generationSteps,
    generationProgress,
    setGenerationProgress,
    updateStepStatus,
    initSteps,
    resetSteps,
  } = useGenerationSteps()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [savedPostId, setSavedPostId] = useState<string | null>(null)

  // Calculate total steps based on postType and skipImage
  const totalSteps = formState.postType === 'image_read' ? 4 : formState.skipImage ? 5 : 6

  // Check for reuse data from history page
  useEffect(() => {
    const reuseData = sessionStorage.getItem('reusePost')
    if (reuseData) {
      try {
        const { postType, inputText } = JSON.parse(reuseData)
        setFormState((prev) => ({
          ...prev,
          postType,
          inputText,
        }))
        setStep(2) // Skip to content input step
      } catch {
        // Ignore parse errors
      }
      sessionStorage.removeItem('reusePost')
    }
  }, [])

  // Step 1: Select post type
  const handleSelectPostType = (type: PostType) => {
    setFormState((prev) => ({ ...prev, postType: type }))
    setStep(2)
  }

  // Step 2: Submit content
  const handleContentSubmit = (text: string, url: string) => {
    setFormState((prev) => ({ ...prev, inputText: text, sourceUrl: url }))
    setStep(3)
  }

  // Step 3: Submit image settings
  const handleImageSettingsSubmit = async (
    style: ImageStyle,
    aspectRatio: AspectRatio,
    characterId: string | null,
    skipImage: boolean,
    useCharacterImage: boolean,
    backgroundType: BackgroundType
  ) => {
    setFormState((prev) => ({
      ...prev,
      imageStyle: style,
      aspectRatio,
      characterId,
      skipImage,
      useCharacterImage,
      backgroundType,
    }))

    if (skipImage) {
      // Skip catchphrase step, go directly to generation
      setStep(4)
      startGeneration(style, aspectRatio, characterId, skipImage, useCharacterImage, '')
    } else {
      // First generate caption, then show catchphrase step
      setStep(4)
      await generateCaptionFirst()
    }
  }

  // Generate caption first (for catchphrase step)
  const generateCaptionFirst = async () => {
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
      setStep(3) // Go back to image settings
    }
  }

  // Step 4: Submit catchphrase (only when not skipImage)
  const handleCatchphraseSubmit = (catchphrase: string) => {
    setFormState((prev) => ({ ...prev, catchphrase }))
    setStep(5)
    startGenerationWithCaption(catchphrase)
  }

  // Start generation with pre-generated caption
  const startGenerationWithCaption = async (catchphrase: string) => {
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
        // Fetch hashtags from caption API response (stored earlier)
        const captionResponse = await fetch('/api/generate/caption', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: formState.postType,
            inputText: formState.inputText,
          }),
        })
        const captionData = captionResponse.ok ? await captionResponse.json() : { hashtags: [] }

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

      setTimeout(() => setStep(6), 500)
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
  }

  // Start generation (for skipImage case)
  const startGeneration = async (
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

      setTimeout(() => setStep(skipImage ? 5 : 6), 500)
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
  }

  // Regenerate image
  const handleRegenerateImage = useCallback(async () => {
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
  }, [generatedResult, formState])

  // Create new post
  const handleCreateNew = () => {
    setStep(1)
    setFormState(INITIAL_FORM_STATE)
    setGeneratedCaption('')
    setGeneratedResult(null)
    resetSteps()
    setSavedPostId(null)
  }

  // Go back
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Handle back from catchphrase step
  const handleCatchphraseBack = () => {
    setStep(3)
    setGeneratedCaption('')
  }

  // image_read タイプ用: 画像アップロード + メモ入力後の処理
  const handleImageReadSubmit = async (
    imageBase64: string,
    imageMimeType: string,
    text: string,
    file: File,
    selectedAspectRatio: '1:1' | '4:5' | '16:9'
  ) => {
    setFormState((prev) => ({
      ...prev,
      inputText: text,
      uploadedImageFile: file,
      uploadedImageBase64: imageBase64,
      uploadedImageMimeType: imageMimeType,
      imageReadAspectRatio: selectedAspectRatio,
    }))
    setStep(3)
    startImageReadGeneration(imageBase64, imageMimeType, text, file, selectedAspectRatio)
  }

  // image_read タイプ用: 生成処理
  const startImageReadGeneration = async (
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

      setTimeout(() => setStep(4), 500)
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
  }

  // Determine which step to render
  const renderStep = () => {
    // image_read タイプ専用フロー: 1->2(画像+メモ)->3(生成)->4(結果)
    if (formState.postType === 'image_read') {
      switch (step) {
        case 1:
          return <StepPostType onSelect={handleSelectPostType} />
        case 2:
          return (
            <StepImageReadInput
              onSubmit={handleImageReadSubmit}
              onBack={handleBack}
            />
          )
        case 3:
          return (
            <StepGenerating
              steps={generationSteps}
              progress={generationProgress}
            />
          )
        case 4:
          return generatedResult ? (
            <StepResult
              caption={generatedResult.caption}
              hashtags={generatedResult.hashtags}
              imageUrl={generatedResult.imageUrl}
              aspectRatio={formState.imageReadAspectRatio}
              onRegenerateImage={undefined}
              onCreateNew={handleCreateNew}
              postId={savedPostId ?? undefined}
              isRegenerating={false}
            />
          ) : null
        default:
          return null
      }
    }

    if (formState.skipImage) {
      // skipImage flow: 1->2->3->4(generating)->5(result)
      switch (step) {
        case 1:
          return <StepPostType onSelect={handleSelectPostType} />
        case 2:
          return formState.postType ? (
            <StepContentInput
              postType={formState.postType}
              initialText={formState.inputText}
              initialUrl={formState.sourceUrl}
              onSubmit={handleContentSubmit}
              onBack={handleBack}
            />
          ) : null
        case 3:
          return (
            <StepImageSettings
              initialStyle={formState.imageStyle}
              initialAspectRatio={formState.aspectRatio}
              initialCharacterId={formState.characterId}
              initialSkipImage={formState.skipImage}
              initialUseCharacterImage={formState.useCharacterImage}
              initialBackgroundType={formState.backgroundType}
              onSubmit={handleImageSettingsSubmit}
              onBack={handleBack}
            />
          )
        case 4:
          return (
            <StepGenerating
              steps={generationSteps}
              progress={generationProgress}
            />
          )
        case 5:
          return generatedResult ? (
            <StepResult
              caption={generatedResult.caption}
              hashtags={generatedResult.hashtags}
              imageUrl={generatedResult.imageUrl}
              aspectRatio={formState.aspectRatio}
              onRegenerateImage={undefined}
              onCreateNew={handleCreateNew}
              postId={savedPostId ?? undefined}
              isRegenerating={isRegenerating}
            />
          ) : null
        default:
          return null
      }
    } else {
      // Normal flow: 1->2->3->4(catchphrase)->5(generating)->6(result)
      switch (step) {
        case 1:
          return <StepPostType onSelect={handleSelectPostType} />
        case 2:
          return formState.postType ? (
            <StepContentInput
              postType={formState.postType}
              initialText={formState.inputText}
              initialUrl={formState.sourceUrl}
              onSubmit={handleContentSubmit}
              onBack={handleBack}
            />
          ) : null
        case 3:
          return (
            <StepImageSettings
              initialStyle={formState.imageStyle}
              initialAspectRatio={formState.aspectRatio}
              initialCharacterId={formState.characterId}
              initialSkipImage={formState.skipImage}
              initialUseCharacterImage={formState.useCharacterImage}
              initialBackgroundType={formState.backgroundType}
              onSubmit={handleImageSettingsSubmit}
              onBack={handleBack}
            />
          )
        case 4:
          return generatedCaption ? (
            <StepCatchphrase
              caption={generatedCaption}
              onSubmit={handleCatchphraseSubmit}
              onBack={handleCatchphraseBack}
            />
          ) : (
            <StepGenerating
              steps={[{ id: 'caption', label: '投稿文を生成中...', status: 'loading' }]}
              progress={50}
            />
          )
        case 5:
          return (
            <StepGenerating
              steps={generationSteps}
              progress={generationProgress}
            />
          )
        case 6:
          return generatedResult ? (
            <StepResult
              caption={generatedResult.caption}
              hashtags={generatedResult.hashtags}
              imageUrl={generatedResult.imageUrl}
              aspectRatio={formState.aspectRatio}
              onRegenerateImage={handleRegenerateImage}
              onCreateNew={handleCreateNew}
              isRegenerating={isRegenerating}
              postId={savedPostId ?? undefined}
            />
          ) : null
        default:
          return null
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          新規作成
        </h1>
        <p className="text-slate-400">Instagram投稿素材を作成します</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <ProgressIndicator currentStep={step} totalSteps={totalSteps} />

        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
