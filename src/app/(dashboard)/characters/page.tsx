'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CharacterForm, type CharacterFormData } from '@/components/characters/character-form'
import type { Character } from '@/types/supabase'

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters')
      if (response.ok) {
        const data = await response.json()
        setCharacters(data)
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCharacters()
  }, [])

  const handleSubmit = async (data: CharacterFormData) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('description', data.description)
      formData.append('isDefault', data.isDefault.toString())
      if (data.imageFile) {
        formData.append('image', data.imageFile)
      }

      const url = editingCharacter
        ? `/api/characters/${editingCharacter.id}`
        : '/api/characters'
      const method = editingCharacter ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to save character')
      }

      await fetchCharacters()
      setShowForm(false)
      setEditingCharacter(null)
    } catch (error) {
      console.error('Failed to save character:', error)
      alert('保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete character')
      }

      setCharacters(characters.filter((c) => c.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete character:', error)
      alert('削除に失敗しました')
    }
  }

  const handleEdit = (character: Character) => {
    setEditingCharacter(character)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCharacter(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-8 bg-white/5 rounded-lg w-48 animate-pulse" />
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            キャラクター
          </h1>
          <p className="text-slate-400">
            画像生成に使用するキャラクターを管理します
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span className="hidden sm:inline">新規登録</span>
          </button>
        )}
      </div>

      {showForm ? (
        <div className="max-w-xl mx-auto p-6 bg-white/5 border border-white/10 rounded-2xl">
          <h2 className="text-xl font-bold text-white mb-6">
            {editingCharacter ? 'キャラクター編集' : 'キャラクター登録'}
          </h2>
          <CharacterForm
            character={editingCharacter || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
          />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {characters.map((character) => (
            <div
              key={character.id}
              className="relative p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              {/* Default badge */}
              {character.is_default && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  デフォルト
                </div>
              )}

              {/* Image */}
              <div className="w-full aspect-square relative mb-3 bg-white/5 rounded-lg overflow-hidden">
                {character.image_url ? (
                  <Image
                    src={character.image_url}
                    alt={character.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-slate-600">
                    👤
                  </div>
                )}
              </div>

              {/* Name */}
              <h3 className="font-bold text-white mb-1 truncate">
                {character.name}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                {character.description}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(character)}
                  className="flex-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-sm rounded-lg transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => setDeleteConfirm(character.id)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg transition-colors"
                >
                  削除
                </button>
              </div>

              {/* Delete confirmation */}
              {deleteConfirm === character.id && (
                <div className="absolute inset-0 bg-slate-900/95 rounded-xl flex flex-col items-center justify-center p-4">
                  <p className="text-white text-sm text-center mb-4">
                    「{character.name}」を削除しますか？
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleDelete(character.id)}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg"
                    >
                      削除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add new card */}
          {characters.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="p-4 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl flex flex-col items-center justify-center min-h-[200px] transition-colors"
            >
              <div className="text-4xl mb-2">+</div>
              <p className="text-slate-400 text-sm">キャラクターを追加</p>
            </button>
          )}
        </div>
      )}

      {characters.length === 0 && !showForm && (
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">
            まだキャラクターが登録されていません
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            最初のキャラクターを登録
          </button>
        </div>
      )}
    </div>
  )
}
