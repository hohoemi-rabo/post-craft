'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  StepPostType,
  StepContentInput,
  StepImageSettings,
  StepGenerating,
  StepResult,
  ProgressIndicator,
} from '@/components/create'
import { type PostType } from '@/types/post'
import { type ImageStyle, type AspectRatio } from '@/lib/image-styles'

interface FormState {
  postType: PostType | null
  inputText: string
  sourceUrl: string
  imageStyle: ImageStyle
  aspectRatio: AspectRatio
  characterId: string | null
}

interface GeneratedResult {
  caption: string
  hashtags: string[]
  imageUrl: string
}

interface GenerationStep {
  id: string
  label: string
  status: 'pending' | 'loading' | 'complete' | 'error'
  error?: string
}

const INITIAL_STATE: FormState = {
  postType: null,
  inputText: '',
  sourceUrl: '',
  imageStyle: 'manga_male',
  aspectRatio: '9:16',
  characterId: null,
}

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE)
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)

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
  const handleImageSettingsSubmit = (
    style: ImageStyle,
    aspectRatio: AspectRatio,
    characterId: string | null
  ) => {
    setFormState((prev) => ({
      ...prev,
      imageStyle: style,
      aspectRatio,
      characterId,
    }))
    setStep(4)
    startGeneration(style, aspectRatio, characterId)
  }

  // Step 4: Generate content
  const startGeneration = async (
    style: ImageStyle,
    aspectRatio: AspectRatio,
    characterId: string | null
  ) => {
    const steps: GenerationStep[] = [
      { id: 'caption', label: '投稿文を生成中...', status: 'pending' },
      { id: 'scene', label: 'シーン説明を生成中...', status: 'pending' },
      { id: 'image', label: '画像を生成中...', status: 'pending' },
      { id: 'save', label: '保存中...', status: 'pending' },
    ]
    setGenerationSteps(steps)
    setGenerationProgress(0)

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
      setGenerationProgress(33)

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
        // Fallback scene description
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
        }),
      })

      if (!imageResponse.ok) {
        throw new Error('画像生成に失敗しました')
      }

      const imageData = await imageResponse.json()
      updateStepStatus('image', 'complete')
      setGenerationProgress(75)

      // Step 4: Save post
      updateStepStatus('save', 'loading')
      try {
        await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postType: formState.postType,
            inputText: formState.inputText,
            sourceUrl: formState.sourceUrl || null,
            generatedCaption: captionData.caption,
            generatedHashtags: captionData.hashtags || [],
            imageUrl: imageData.imageUrl,
            imageStyle: style,
            aspectRatio,
          }),
        })
        updateStepStatus('save', 'complete')
      } catch {
        // Don't fail the flow if save fails, just log it
        console.error('Failed to save post')
        updateStepStatus('save', 'complete') // Mark as complete anyway
      }
      setGenerationProgress(100)

      // Set result and move to step 5
      setGeneratedResult({
        caption: captionData.caption,
        hashtags: captionData.hashtags || [],
        imageUrl: imageData.imageUrl,
      })

      setTimeout(() => setStep(5), 500)
    } catch (error) {
      console.error('Generation error:', error)
      const currentStep = steps.find((s) => s.status === 'loading')
      if (currentStep) {
        updateStepStatus(
          currentStep.id,
          'error',
          error instanceof Error ? error.message : '生成に失敗しました'
        )
      }
    }
  }

  const updateStepStatus = (
    id: string,
    status: GenerationStep['status'],
    error?: string
  ) => {
    setGenerationSteps((prev) =>
      prev.map((step) =>
        step.id === id ? { ...step, status, error } : step
      )
    )
  }

  // Regenerate image
  const handleRegenerateImage = useCallback(async () => {
    if (!generatedResult || !formState.postType) return

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
    setFormState(INITIAL_STATE)
    setGeneratedResult(null)
    setGenerationSteps([])
    setGenerationProgress(0)
  }

  // Go back
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
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
        <ProgressIndicator currentStep={step} totalSteps={5} />

        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          {step === 1 && <StepPostType onSelect={handleSelectPostType} />}

          {step === 2 && formState.postType && (
            <StepContentInput
              postType={formState.postType}
              initialText={formState.inputText}
              initialUrl={formState.sourceUrl}
              onSubmit={handleContentSubmit}
              onBack={handleBack}
            />
          )}

          {step === 3 && (
            <StepImageSettings
              initialStyle={formState.imageStyle}
              initialAspectRatio={formState.aspectRatio}
              initialCharacterId={formState.characterId}
              onSubmit={handleImageSettingsSubmit}
              onBack={handleBack}
            />
          )}

          {step === 4 && (
            <StepGenerating
              steps={generationSteps}
              progress={generationProgress}
            />
          )}

          {step === 5 && generatedResult && (
            <StepResult
              caption={generatedResult.caption}
              hashtags={generatedResult.hashtags}
              imageUrl={generatedResult.imageUrl}
              aspectRatio={formState.aspectRatio}
              onRegenerateImage={handleRegenerateImage}
              onCreateNew={handleCreateNew}
              isRegenerating={isRegenerating}
            />
          )}
        </div>
      </div>
    </div>
  )
}
