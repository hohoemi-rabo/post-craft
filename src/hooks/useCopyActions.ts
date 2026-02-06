import { useState, useCallback } from 'react'
import { formatHashtag } from '@/types/history-detail'

interface CopyTarget {
  caption: string
  hashtags: string[]
}

/**
 * コピー機能のカスタムフック
 */
export function useCopyActions(target: CopyTarget | null) {
  const [copiedCaption, setCopiedCaption] = useState(false)
  const [copiedHashtags, setCopiedHashtags] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  const copyCaption = useCallback(async () => {
    if (!target) return
    await navigator.clipboard.writeText(target.caption)
    setCopiedCaption(true)
    setTimeout(() => setCopiedCaption(false), 2000)
  }, [target])

  const copyHashtags = useCallback(async () => {
    if (!target) return
    const hashtagsText = target.hashtags.map(formatHashtag).join('\n')
    await navigator.clipboard.writeText(hashtagsText)
    setCopiedHashtags(true)
    setTimeout(() => setCopiedHashtags(false), 2000)
  }, [target])

  const copyAll = useCallback(async () => {
    if (!target) return
    const hashtagsText = target.hashtags.map(formatHashtag).join('\n')
    const text = `${target.caption}\n\n${hashtagsText}`
    await navigator.clipboard.writeText(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }, [target])

  const getFullCaption = useCallback(() => {
    if (!target) return ''
    const hashtagsText = target.hashtags.map(formatHashtag).join('\n')
    return `${target.caption}\n\n${hashtagsText}`
  }, [target])

  return {
    copiedCaption,
    copiedHashtags,
    copiedAll,
    copyCaption,
    copyHashtags,
    copyAll,
    getFullCaption,
  }
}
