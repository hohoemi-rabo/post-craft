'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  StepProfileSelect,
  StepPostType,
  StepContentInput,
  StepImageSettings,
  StepCatchphrase,
  StepGenerating,
  StepResult,
  ProgressIndicator,
} from '@/components/create'
import { StepImageReadInput } from '@/components/create/step-image-read-input'
import { isBuiltinPostType } from '@/types/post'
import type { Placeholder } from '@/types/post-type'
import type { ProfileDB } from '@/types/profile'
import { type ImageStyle, type AspectRatio, type BackgroundType } from '@/lib/image-styles'
import { type CreateFormState, INITIAL_FORM_STATE } from '@/types/create-flow'
import { useContentGeneration } from '@/hooks/useContentGeneration'
import { useProfiles } from '@/hooks/useProfiles'
import type { RelatedPostData } from '@/components/create/related-post-selector'

export default function CreatePage() {
  const [step, setStep] = useState(0) // 0 = profile select (or auto-skip)
  const [formState, setFormState] = useState<CreateFormState>(INITIAL_FORM_STATE)
  const { hasMultipleProfiles, isLoading: isLoadingProfiles, defaultProfile } = useProfiles()

  // Auto-select profile and skip to step 1 when only one profile
  useEffect(() => {
    if (!isLoadingProfiles && !hasMultipleProfiles && defaultProfile && step === 0) {
      setFormState((prev) => ({ ...prev, profileId: defaultProfile.id }))
      setStep(1)
    }
  }, [isLoadingProfiles, hasMultipleProfiles, defaultProfile, step])

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
  const baseSteps = formState.flowType === 'image_read' ? 4 : formState.skipImage ? 5 : 6

  // Check for URL params (profileId, remakeFrom)
  const [remakeLoading, setRemakeLoading] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlProfileId = params.get('profileId')
    const remakeFrom = params.get('remakeFrom')
    const suggestedType = params.get('suggestedType')
    const suggestedProfile = params.get('suggestedProfile')

    if (remakeFrom) {
      // リメイクモード: 元投稿データ + 提案タイプ情報を取得
      setRemakeLoading(true)
      const fetches: Promise<Response>[] = [fetch(`/api/posts/${remakeFrom}`)]
      // suggestedType がある場合、投稿タイプ一覧も取得してスキップ
      if (suggestedType) {
        const profileParam = suggestedProfile ? `?profileId=${suggestedProfile}` : ''
        fetches.push(fetch(`/api/post-types${profileParam}`))
      }
      Promise.all(fetches)
        .then(async ([postRes, typesRes]) => {
          const post = postRes.ok ? await postRes.json() : null
          if (!post) { setRemakeLoading(false); return }

          const newState: Partial<CreateFormState> = {
            isRemakeMode: true,
            remakeSourceId: post.id,
            remakeSourceCaption: post.generated_caption,
            remakeSourcePostType: post.post_type_ref?.name || post.post_type,
            inputText: post.input_text || '',
            ...(suggestedProfile && { profileId: suggestedProfile }),
          }

          // 提案タイプが指定されている場合、タイプ選択をスキップ
          if (suggestedType && typesRes?.ok) {
            const typesData = await typesRes.json()
            const types = typesData.postTypes || typesData || []
            const matchedType = types.find((t: { slug: string }) => t.slug === suggestedType)
            if (matchedType) {
              const builtinType = isBuiltinPostType(matchedType.slug) ? matchedType.slug : null
              newState.postType = builtinType
              newState.postTypeId = matchedType.id
              newState.postTypeName = matchedType.name
              newState.inputMode = matchedType.inputMode || matchedType.input_mode || 'memo'
              newState.flowType = matchedType.flowType || (matchedType.flow_type === 'image_read' ? 'image_read' : 'standard')
              setCurrentPlaceholders(matchedType.placeholders || [])
            }
          }

          setFormState((prev) => ({ ...prev, ...newState }))

          if (suggestedType && newState.postTypeId) {
            setStep(2) // タイプ選択スキップ → 内容入力へ
          } else if (suggestedProfile) {
            setStep(1) // プロフィール選択スキップ → タイプ選択へ
          }
          setRemakeLoading(false)
        })
        .catch(() => setRemakeLoading(false))
    } else if (urlProfileId) {
      setFormState((prev) => ({ ...prev, profileId: urlProfileId }))
      setStep(1)
    }
  }, [])

  // Check for reuse data from history page
  useEffect(() => {
    const reuseData = sessionStorage.getItem('reusePost')
    if (reuseData) {
      try {
        const { postType, inputText, ideaId } = JSON.parse(reuseData)
        setFormState((prev) => ({
          ...prev,
          ...(postType && { postType }),
          inputText,
          ...(ideaId && { ideaId }),
        }))
        setStep(postType ? 2 : 1) // postType があればステップ2、なければステップ1(タイプ選択)
      } catch {
        // Ignore parse errors
      }
      sessionStorage.removeItem('reusePost')
    }
  }, [])

  // Track placeholders for current post type (used in fields mode)
  const [currentPlaceholders, setCurrentPlaceholders] = useState<Placeholder[]>([])

  // Step 0: Select profile (only when multiple profiles)
  const handleSelectProfile = useCallback((profile: ProfileDB) => {
    setFormState((prev) => ({ ...prev, profileId: profile.id }))
    setStep(1)
  }, [])

  // Step 1: Select post type
  const handleSelectPostType = (postTypeId: string, slug: string, name: string, inputMode: 'fields' | 'memo' = 'fields', placeholders: Placeholder[] = [], flowType: 'standard' | 'image_read' = 'standard') => {
    const builtinType = isBuiltinPostType(slug) ? slug : null
    setFormState((prev) => ({
      ...prev,
      postType: builtinType,
      postTypeId,
      postTypeName: name,
      inputMode,
      flowType,
    }))
    setCurrentPlaceholders(placeholders)
    setStep(2)
  }

  // Step 2: Submit content
  const handleContentSubmit = (text: string, url: string, relatedPost?: RelatedPostData | null) => {
    setFormState((prev) => ({
      ...prev,
      inputText: text,
      sourceUrl: url,
      relatedPostId: relatedPost?.id || null,
      relatedPostCaption: relatedPost?.caption || null,
      relatedPostHashtags: relatedPost?.hashtags || null,
      relatedPostImageStyle: relatedPost?.imageStyle || null,
      relatedPostAspectRatio: relatedPost?.aspectRatio || null,
      relatedPostBackgroundType: null, // Not stored in DB
    }))
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
    setStep(hasMultipleProfiles ? 0 : 1)
    setFormState(INITIAL_FORM_STATE)
    resetGeneration()
  }

  // Go back
  const handleBack = () => {
    if (step === 1 && hasMultipleProfiles) {
      setStep(0)
    } else if (step > 1) {
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
    startImageReadGeneration(imageBase64, imageMimeType, text, file, selectedAspectRatio, formState)
  }

  // Determine which step to render
  const renderStep = () => {
    // Step 0: Profile selection (only for multiple profiles)
    if (step === 0) {
      if (isLoadingProfiles) {
        return (
          <div className="flex justify-center py-12">
            <span className="animate-spin inline-block w-8 h-8 border-2 border-white/30 border-t-white rounded-full" />
          </div>
        )
      }
      return <StepProfileSelect onSelect={handleSelectProfile} />
    }

    // image_read タイプ専用フロー: 1->2(画像+メモ)->3(生成)->4(結果)
    if (formState.flowType === 'image_read') {
      switch (step) {
        case 1:
          return <StepPostType profileId={formState.profileId} remakeSourcePostType={formState.remakeSourcePostType} onSelect={handleSelectPostType} />
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
              remakeSourceId={formState.remakeSourceId}
              remakeSourcePostType={formState.remakeSourcePostType}
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
          return <StepPostType profileId={formState.profileId} remakeSourcePostType={formState.remakeSourcePostType} onSelect={handleSelectPostType} />
        case 2:
          return (formState.postType || formState.postTypeId) ? (
            <StepContentInput
              postType={formState.postType}
              postTypeName={formState.postTypeName}
              initialText={formState.inputText}
              initialUrl={formState.sourceUrl}
              initialRelatedPostId={formState.relatedPostId}
              inputMode={formState.inputMode}
              placeholders={currentPlaceholders}
              remakeSourceCaption={formState.remakeSourceCaption}
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
              relatedPostImageStyle={formState.relatedPostImageStyle}
              relatedPostAspectRatio={formState.relatedPostAspectRatio}
              relatedPostBackgroundType={formState.relatedPostBackgroundType}
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
              remakeSourceId={formState.remakeSourceId}
              remakeSourcePostType={formState.remakeSourcePostType}
            />
          ) : null
        default:
          return null
      }
    } else {
      // Normal flow: 1->2->3->4(catchphrase)->5(generating)->6(result)
      switch (step) {
        case 1:
          return <StepPostType profileId={formState.profileId} remakeSourcePostType={formState.remakeSourcePostType} onSelect={handleSelectPostType} />
        case 2:
          return (formState.postType || formState.postTypeId) ? (
            <StepContentInput
              postType={formState.postType}
              postTypeName={formState.postTypeName}
              initialText={formState.inputText}
              initialUrl={formState.sourceUrl}
              initialRelatedPostId={formState.relatedPostId}
              inputMode={formState.inputMode}
              placeholders={currentPlaceholders}
              remakeSourceCaption={formState.remakeSourceCaption}
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
              relatedPostImageStyle={formState.relatedPostImageStyle}
              relatedPostAspectRatio={formState.relatedPostAspectRatio}
              relatedPostBackgroundType={formState.relatedPostBackgroundType}
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
          {formState.isRemakeMode ? '🔄 リメイク投稿を作成' : '新規作成'}
        </h1>
        <p className="text-slate-400">
          {formState.isRemakeMode
            ? '投稿タイプやプロフィールを変えて、新しい投稿を作りましょう'
            : 'Instagram投稿素材を作成します'}
        </p>
      </div>

      {/* リメイクモード: 元投稿の概要 */}
      {formState.isRemakeMode && formState.remakeSourceCaption && (
        <div className="max-w-2xl mx-auto p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-orange-400">🔄 元の投稿</span>
            {formState.remakeSourcePostType && (
              <span className="text-xs text-slate-400">{formState.remakeSourcePostType}</span>
            )}
          </div>
          <p className="text-sm text-slate-300 line-clamp-2">
            {formState.remakeSourceCaption.slice(0, 100)}
            {formState.remakeSourceCaption.length > 100 ? '...' : ''}
          </p>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {step > 0 && (
          <ProgressIndicator currentStep={step} totalSteps={baseSteps} flowType={formState.flowType} />
        )}

        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
          {renderStep()}
        </div>
      </div>
    </div>
  )
}
