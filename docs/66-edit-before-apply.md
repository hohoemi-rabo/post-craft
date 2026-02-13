# チケット #66: 編集してから適用機能

> Phase 4C | 優先度: 中 | 依存: #63

## 概要

生成プレビューページの「編集してから適用」ボタンを押した際に、プロフィールと投稿タイプの全フィールドをインライン編集できる機能を実装する。編集モードではプロフィールの名前・アイコン・説明・システムプロンプト・必須ハッシュタグが直接編集可能になり、投稿タイプカードではテンプレート構造・プレースホルダー・文字数・type_prompt が編集可能になる。編集後の「適用」ボタンで編集済みデータを適用 API (#64) に送信する。

## 対象ファイル

| ファイル | 操作 |
|---------|------|
| `src/components/analysis/generation-preview.tsx` | 更新（編集モード状態を追加） |
| `src/components/analysis/profile-preview.tsx` | 更新（編集モード対応） |
| `src/components/analysis/posttype-preview-card.tsx` | 更新（編集モード対応） |

## 変更内容

### 1. 編集モード状態管理

`generation-preview.tsx` に編集モードの状態を追加:

```typescript
const [isEditMode, setIsEditMode] = useState(false)
const [editedProfile, setEditedProfile] = useState<GeneratedProfile | null>(null)
const [editedPostTypes, setEditedPostTypes] = useState<GeneratedPostType[]>([])

// 編集モード開始
function handleStartEdit() {
  setIsEditMode(true)
  setEditedProfile({ ...profile! })
  setEditedPostTypes(postTypes.map((pt) => ({ ...pt })))
}

// 編集モード終了
function handleCancelEdit() {
  setIsEditMode(false)
  setEditedProfile(null)
  setEditedPostTypes([])
}

// 編集済みデータで適用
async function handleApplyWithEdits() {
  // 確認ダイアログ後に適用 API を呼ぶ（#65 の handleApply を拡張）
  // body に profile と postTypes のオーバーライドを含める
  const res = await fetch(`/api/analysis/${analysisId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      configId,
      profile: editedProfile,
      postTypes: editedPostTypes,
    }),
  })
  // ... エラーハンドリングは #65 と同様
}
```

### 2. 「編集してから適用」ボタンの実装

```typescript
<Button
  variant="secondary"
  onClick={handleStartEdit}
  disabled={isPending || isApplied || isEditMode}
>
  編集してから適用
</Button>

{/* 編集モード中のアクションバー */}
{isEditMode && (
  <div className="sticky bottom-4 z-40 bg-slate-800/95 backdrop-blur rounded-xl border border-white/10 p-4 flex justify-between items-center shadow-lg">
    <p className="text-sm text-slate-400">
      編集中 - 変更を確認してから適用してください
    </p>
    <div className="flex gap-3">
      <Button variant="ghost" onClick={handleCancelEdit}>
        編集を取り消す
      </Button>
      <Button
        variant="primary"
        onClick={() => setShowConfirmDialog(true)}
        disabled={isPending}
      >
        {isPending ? '適用中...' : '編集を適用する'}
      </Button>
    </div>
  </div>
)}
```

### 3. ProfilePreview 編集モード対応

`profile-preview.tsx` に編集モード props を追加:

```typescript
interface ProfilePreviewProps {
  profile: GeneratedProfile
  isEditMode?: boolean
  onUpdate?: (updated: GeneratedProfile) => void
}

export function ProfilePreview({ profile, isEditMode = false, onUpdate }: ProfilePreviewProps) {
  // 表示モードと編集モードを切り替え

  if (!isEditMode) {
    // 既存の表示ロジック（変更なし）
    return (/* 既存コード */)
  }

  // 編集モード
  return (
    <div className="bg-slate-800/50 rounded-xl border border-blue-500/30 p-6 space-y-4">
      {/* 名前 + アイコン */}
      <div className="flex gap-3">
        <div>
          <label className="block text-sm text-slate-400 mb-1">アイコン</label>
          <input
            type="text"
            value={profile.icon}
            onChange={(e) => onUpdate?.({ ...profile, icon: e.target.value })}
            className="w-16 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-2xl text-center"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-1">プロフィール名</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onUpdate?.({ ...profile, name: e.target.value })}
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
          />
        </div>
      </div>

      {/* 説明 */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">説明</label>
        <input
          type="text"
          value={profile.description}
          onChange={(e) => onUpdate?.({ ...profile, description: e.target.value })}
          className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white"
        />
      </div>

      {/* 必須ハッシュタグ（追加/削除） */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">必須ハッシュタグ</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {profile.required_hashtags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full"
            >
              #{tag}
              <button
                onClick={() => {
                  const updated = profile.required_hashtags.filter((_, i) => i !== index)
                  onUpdate?.({ ...profile, required_hashtags: updated })
                }}
                className="ml-1 text-blue-400 hover:text-red-400"
              >
                x
              </button>
            </span>
          ))}
        </div>
        {/* 新規タグ追加 */}
        <HashtagInput
          onAdd={(tag) => {
            onUpdate?.({
              ...profile,
              required_hashtags: [...profile.required_hashtags, tag],
            })
          }}
        />
      </div>

      {/* システムプロンプト */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">システムプロンプト</label>
        <textarea
          value={profile.system_prompt}
          onChange={(e) => onUpdate?.({ ...profile, system_prompt: e.target.value })}
          className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[200px] resize-y"
        />
      </div>
    </div>
  )
}
```

### 4. ハッシュタグ入力コンポーネント

```typescript
function HashtagInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const [value, setValue] = useState('')

  function handleAdd() {
    const tag = value.trim().replace(/^#/, '')
    if (tag) {
      onAdd(tag)
      setValue('')
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
        placeholder="タグを追加..."
        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
      />
      <button
        onClick={handleAdd}
        disabled={!value.trim()}
        className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-sm rounded-lg hover:bg-blue-500/30 disabled:opacity-50"
      >
        追加
      </button>
    </div>
  )
}
```

### 5. PostTypePreviewCard 編集モード対応

`posttype-preview-card.tsx` に編集モード props を追加:

```typescript
interface PostTypePreviewCardProps {
  postType: GeneratedPostType
  index: number
  isEditMode?: boolean
  onUpdate?: (updated: GeneratedPostType) => void
  onDelete?: () => void
}

export function PostTypePreviewCard({
  postType,
  index,
  isEditMode = false,
  onUpdate,
  onDelete,
}: PostTypePreviewCardProps) {
  // 編集モード時は常に展開
  const [isExpanded, setIsExpanded] = useState(isEditMode)

  // 編集モードの場合、展開時に編集フィールドを表示
  // ...

  return (
    <div className={`bg-slate-800/50 rounded-xl border ${isEditMode ? 'border-blue-500/30' : 'border-white/10'} overflow-hidden`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4">
        {/* ... 既存のヘッダー表示 */}
        {isEditMode && onDelete && (
          <button
            onClick={onDelete}
            className="ml-2 text-red-400 hover:text-red-300 text-sm"
            title="この投稿タイプを削除"
          >
            削除
          </button>
        )}
      </div>

      {/* 展開時の詳細（編集モード） */}
      {isExpanded && isEditMode && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5">
          {/* 名前・アイコン・説明 */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">名前</label>
              <input
                type="text"
                value={postType.name}
                onChange={(e) => onUpdate?.({ ...postType, name: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">アイコン</label>
              <input
                type="text"
                value={postType.icon}
                onChange={(e) => onUpdate?.({ ...postType, icon: e.target.value })}
                className="w-16 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xl text-center"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">説明</label>
            <input
              type="text"
              value={postType.description}
              onChange={(e) => onUpdate?.({ ...postType, description: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>

          {/* テンプレート構造 */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">テンプレート構造</label>
            <textarea
              value={postType.template_structure}
              onChange={(e) => onUpdate?.({ ...postType, template_structure: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono min-h-[200px] resize-y"
            />
          </div>

          {/* プレースホルダー（追加/削除/編集） */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              プレースホルダー（{postType.placeholders.length}個）
            </label>
            {postType.placeholders.map((ph, phIndex) => (
              <div key={phIndex} className="flex gap-2 items-center mb-2">
                <input
                  type="text"
                  value={ph.key}
                  onChange={(e) => {
                    const updated = [...postType.placeholders]
                    updated[phIndex] = { ...ph, key: e.target.value }
                    onUpdate?.({ ...postType, placeholders: updated })
                  }}
                  className="w-24 bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs font-mono text-slate-300"
                  placeholder="key"
                />
                <input
                  type="text"
                  value={ph.label}
                  onChange={(e) => {
                    const updated = [...postType.placeholders]
                    updated[phIndex] = { ...ph, label: e.target.value }
                    onUpdate?.({ ...postType, placeholders: updated })
                  }}
                  className="flex-1 bg-slate-900 border border-white/10 rounded px-2 py-1 text-sm text-white"
                  placeholder="ラベル"
                />
                <button
                  onClick={() => {
                    const updated = postType.placeholders.filter((_, i) => i !== phIndex)
                    onUpdate?.({ ...postType, placeholders: updated })
                  }}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const updated = [
                  ...postType.placeholders,
                  { key: '', label: '', placeholder: '', required: false },
                ]
                onUpdate?.({ ...postType, placeholders: updated })
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              + プレースホルダーを追加
            </button>
          </div>

          {/* 文字数設定 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">最小文字数</label>
              <input
                type="number"
                value={postType.min_length}
                onChange={(e) => onUpdate?.({ ...postType, min_length: parseInt(e.target.value) || 200 })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                min={100}
                max={500}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">最大文字数</label>
              <input
                type="number"
                value={postType.max_length}
                onChange={(e) => onUpdate?.({ ...postType, max_length: parseInt(e.target.value) || 400 })}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                min={200}
                max={1000}
              />
            </div>
          </div>

          {/* type_prompt */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">AIプロンプト（type_prompt）</label>
            <textarea
              value={postType.type_prompt}
              onChange={(e) => onUpdate?.({ ...postType, type_prompt: e.target.value })}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-h-[100px] resize-y"
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

### 6. 投稿タイプの削除

```typescript
// GenerationPreview 内
function handleDeletePostType(index: number) {
  if (editedPostTypes.length <= 3) {
    showToast({ type: 'error', message: '投稿タイプは最低3個必要です' })
    return
  }
  const updated = editedPostTypes.filter((_, i) => i !== index)
  setEditedPostTypes(updated)
}
```

### 7. props の受け渡し

```typescript
// GenerationPreview 内の ProfilePreview に編集 props を追加
<ProfilePreview
  profile={isEditMode ? editedProfile! : profile!}
  isEditMode={isEditMode}
  onUpdate={isEditMode ? setEditedProfile : undefined}
/>

// PostTypePreviewCard に編集 props を追加
{(isEditMode ? editedPostTypes : postTypes).map((postType, index) => (
  <PostTypePreviewCard
    key={postType.slug + (isEditMode ? '-edit' : '')}
    postType={postType}
    index={index}
    isEditMode={isEditMode}
    onUpdate={isEditMode ? (updated) => {
      const newPostTypes = [...editedPostTypes]
      newPostTypes[index] = updated
      setEditedPostTypes(newPostTypes)
    } : undefined}
    onDelete={isEditMode ? () => handleDeletePostType(index) : undefined}
  />
))}
```

## 受入条件

- 「編集してから適用」ボタンクリックで編集モードに切り替わる
- 編集モードでプロフィールの全フィールドが編集可能になる
  - 名前、アイコン、説明、システムプロンプト、必須ハッシュタグ
- 必須ハッシュタグの追加/削除ができる
- 編集モードで投稿タイプの全フィールドが編集可能になる
  - 名前、アイコン、説明、テンプレート構造、プレースホルダー、文字数、type_prompt
- プレースホルダーの追加/削除/編集ができる
- 投稿タイプの削除ができる（最低3個を下回る場合はエラー表示）
- 「編集を取り消す」で元のデータに戻る
- 「編集を適用する」で編集済みデータが適用 API に送信される
- 編集モード中はスティッキーなアクションバーが下部に表示される
- 編集モードではカードのボーダーが青色に変わり編集中であることが視覚的に分かる
- レスポンシブデザイン（モバイル対応）
- `npm run build` が成功する

## TODO

- [ ] 編集モード状態管理を `generation-preview.tsx` に追加
- [ ] `handleStartEdit()`, `handleCancelEdit()` を実装
- [ ] スティッキーアクションバーを実装
- [ ] `profile-preview.tsx` に編集モード UI を追加
- [ ] ハッシュタグ入力コンポーネント（`HashtagInput`）を実装
- [ ] `posttype-preview-card.tsx` に編集モード UI を追加
- [ ] プレースホルダーの追加/削除/編集 UI を実装
- [ ] 投稿タイプ削除機能を実装（最低3個制限）
- [ ] 編集済みデータで適用 API を呼ぶ処理を実装
- [ ] 編集モードの視覚的フィードバック（ボーダー色変更等）を実装
- [ ] レスポンシブデザインを確認
- [ ] `npm run build` 成功を確認
