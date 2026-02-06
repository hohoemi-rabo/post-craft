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
import { type CreateFormState, INITIAL_FORM_STATE } from '@/types/create-flow'
import { useContentGeneration } from '@/hooks/useContentGeneration'

export default function CreatePage() {
  const [step, setStep] = useState(1)
  const [formState, setFormState] = useState<CreateFormState>(INITIAL_FORM_STATE)

  const {
    generatedCaption,
    generatedResult,
    savedPostId,
    isRegenerating,
    generationSteps,
    generationProgress,
    generateCaptionFirst,
    startGenerationWithCaption,
    startGeneration,
    startImageReadGeneration,
    regenerateImage,
    resetGeneration,
    setGeneratedCaption,
  } = useContentGeneration({ onStepChange: setStep })

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
    const newFormState = {
      ...formState,
      imageStyle: style,
      aspectRatio,
      characterId,
      skipImage,
      useCharacterImage,
      backgroundType,
    }
    setFormState(newFormState)

    if (skipImage) {
      // Skip catchphrase step, go directly to generation
      setStep(4)
      startGeneration(newFormState, style, aspectRatio, characterId, skipImage, useCharacterImage, '')
    } else {
      // First generate caption, then show catchphrase step
      setStep(4)
      await generateCaptionFirst(newFormState)
    }
  }

  // Step 4: Submit catchphrase (only when not skipImage)
  const handleCatchphraseSubmit = (catchphrase: string) => {
    const newFormState = { ...formState, catchphrase }
    setFormState(newFormState)
    setStep(5)
    startGenerationWithCaption(newFormState, catchphrase)
  }

  // Regenerate image
  const handleRegenerateImage = useCallback(() => {
    regenerateImage(formState)
  }, [formState, regenerateImage])

  // Create new post
  const handleCreateNew = () => {
    setStep(1)
    setFormState(INITIAL_FORM_STATE)
    resetGeneration()
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
