# Backend Rules

API Routes, Supabase, 認証のルール。

## API Routes

### ディレクトリ構造
```
app/api/
├── auth/
│   └── [...nextauth]/route.ts
├── characters/
│   ├── route.ts              # GET (list), POST (create)
│   ├── [id]/route.ts         # PUT, DELETE
│   └── analyze/route.ts      # POST (AI特徴抽出)
├── generate/
│   ├── caption/route.ts      # POST (文章生成)
│   ├── image/route.ts        # POST (画像生成)
│   └── scene/route.ts        # POST (シーン候補生成)
├── instagram/
│   ├── accounts/route.ts     # POST (FBトークン交換 + IGアカウント取得)
│   └── publish/route.ts      # POST (Instagram投稿: JSON or FormData)
├── posts/
│   ├── route.ts              # GET (list), POST (create)
│   ├── [id]/route.ts         # GET, PATCH (汎用更新: ホワイトリスト方式), DELETE
│   └── [id]/image/route.ts   # POST (画像アップロード/差し替え), PUT (画像レコード更新)
├── post-types/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE
│       └── duplicate/route.ts # POST (複製)
├── profiles/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE
│       ├── hashtags/route.ts # GET, PUT (プロフィール別必須ハッシュタグ)
│       └── system-prompt/route.ts # GET, PUT (システムプロンプト)
├── settings/
│   └── hashtags/route.ts     # GET, PUT (レガシー必須ハッシュタグ設定)
└── extract/route.ts          # POST (記事抽出)
```

### 基本パターン
```typescript
// app/api/xxx/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  // 1. 認証チェック
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. リクエストボディ取得
  const body = await request.json()

  // 3. バリデーション
  if (!body.required) {
    return NextResponse.json({ error: 'Missing required field' }, { status: 400 })
  }

  try {
    // 4. 処理実行
    const result = await someProcess(body)

    // 5. レスポンス
    return NextResponse.json(result)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### エラーハンドリング
```typescript
// 統一エラーレスポンス
interface APIError {
  error: string
  code?: string
  details?: unknown
}

// ステータスコード
// 400: Bad Request (バリデーションエラー)
// 401: Unauthorized (未認証)
// 403: Forbidden (権限なし)
// 404: Not Found
// 429: Too Many Requests (レート制限)
// 500: Internal Server Error
```

## Supabase

### クライアント設定
```typescript
// lib/supabase.ts

// ブラウザ用（公開キー）
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// サーバー用（サービスロールキー）
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 共通クエリ定数
```typescript
// lib/supabase.ts
export const POST_SELECT_QUERY = '*, post_images(*), post_type_ref:post_types(*)'
```

### テーブル操作
```typescript
// 取得（post_types JOIN 込み）
const { data, error } = await supabase
  .from('posts')
  .select(POST_SELECT_QUERY)
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// 挿入
const { data, error } = await supabase
  .from('posts')
  .insert({ user_id: userId, ... })
  .select()
  .single()

// 更新
const { error } = await supabase
  .from('posts')
  .update({ ... })
  .eq('id', postId)

// 削除
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

### Storage 操作
```typescript
// アップロード
const { data, error } = await supabase.storage
  .from('characters')
  .upload(`${userId}/${fileName}`, file, {
    contentType: 'image/png',
    upsert: false,
  })

// 公開URL取得
const { data } = supabase.storage
  .from('characters')
  .getPublicUrl(path)

// 削除
const { error } = await supabase.storage
  .from('characters')
  .remove([path])
```

### Row Level Security (RLS)
全テーブルで RLS 有効化必須:
```sql
-- ユーザーは自分のデータのみアクセス可
-- 注意: auth.uid() は (select auth.uid()) でラップすること（行ごとの再評価防止）
CREATE POLICY "Users can CRUD own data" ON posts
  FOR ALL USING ((select auth.uid())::text = user_id::text);
```

**RLS ベストプラクティス**:
- `(select auth.uid())` を使用（サブクエリでキャッシュされ、行ごとの再評価を防止）
- service_role は自動的に RLS をバイパスするため、service_role 用ポリシーは不要
- 新規テーブル作成時は必ず `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` を実行

## 認証 (NextAuth.js)

### 設定
```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // ホワイトリストチェック
      const allowed = process.env.ALLOWED_EMAILS?.split(',') || []
      return allowed.includes(user.email || '')
    },
    async session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
```

### API での認証チェック（ヘルパー関数使用）
```typescript
import { requireAuth, requirePostOwnership, requireCharacterOwnership, requireProfileOwnership, requirePostTypeOwnership } from '@/lib/api-utils'

// 認証のみ
export async function GET() {
  const { error, userId } = await requireAuth()
  if (error) return error
  // userId を使って処理続行
}

// 認証 + 投稿の所有権チェック
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError } = await requirePostOwnership(postId, userId)
  if (ownerError) return ownerError
  // 処理続行
}

// 認証 + キャラクターの所有権チェック
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: characterId } = await params
  const { error: authError, userId } = await requireAuth()
  if (authError) return authError

  const { error: ownerError, character } = await requireCharacterOwnership(characterId, userId)
  if (ownerError) return ownerError
  // character.image_url を使って Storage から削除など
}
```

### ヘルパー関数 (`lib/api-utils.ts`)

内部で `checkOwnership<T>()` ヘルパーを使い、4つの所有権チェック関数を提供。
戻り値は discriminated union 型で、`error` チェック後に data が non-null に絞り込まれる。

```typescript
// 認証チェック
export async function requireAuth()
// → { error: NextResponse, session: null, userId: null }
// → { error: null, session: Session, userId: string }

// 投稿の所有権チェック
export async function requirePostOwnership(postId, userId)
// → { error: NextResponse, post: null } | { error: null, post: { id, user_id } }

// キャラクターの所有権チェック
export async function requireCharacterOwnership(characterId, userId)
// → { error: NextResponse, character: null } | { error: null, character: { id, user_id, image_url } }

// プロフィールの所有権チェック（ProfileRow 型）
export async function requireProfileOwnership(profileId, userId)
// → { error: NextResponse, profile: null } | { error: null, profile: ProfileRow }

// 投稿タイプの所有権チェック（PostTypeRow 型）
export async function requirePostTypeOwnership(postTypeId, userId)
// → { error: NextResponse, postType: null } | { error: null, postType: PostTypeRow }
```

### レガシーパターン（直接チェック）
```typescript
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  // ...
}
```

### ミドルウェア
```typescript
// middleware.ts
import { auth } from '@/lib/auth'

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/dashboard')) {
    return Response.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/create/:path*', '/history/:path*'],
}
```

## Instagram投稿 (Facebook Graph API)

### アーキテクチャ
```
[ダッシュボード]
  InstagramPublishProvider (Context)
    → FB SDK初期化 + ログイン状態管理
    → InstagramPublishModal (モーダル)
      → FBログイン → アカウント選択 → 確認 → 投稿

[API]
  /api/instagram/accounts  → トークン交換 + アカウント取得
  /api/instagram/publish   → メディアコンテナ作成 → ポーリング → 公開

[ライブラリ]
  lib/instagram.ts → Graph API v21.0 ラッパー関数
```

### Publish API のリクエスト形式
```typescript
// ダッシュボードから（JSON: 画像URL直接指定）
POST /api/instagram/publish
Content-Type: application/json
{ imageUrl, caption, igAccountId, accessToken }

// スタンドアロンページから（FormData: ファイルアップロード）
POST /api/instagram/publish
Content-Type: multipart/form-data
image(File), caption, igAccountId, accessToken
```

### 投稿ステータス管理
```
posts テーブル:
  instagram_published      boolean  DEFAULT false
  instagram_media_id       text     NULL
  instagram_published_at   timestamptz NULL
```
- 投稿成功時に InstagramPublishModal → PATCH `/api/posts/[id]` でステータス更新
- 履歴一覧・詳細に「✅ 投稿済み」/「⏳ 未投稿」バッジ表示

### 画像アップロード・差し替え・再生成
```typescript
// POST /api/posts/[id]/image (FormData: image, replace?)
// → replace=true: 既存画像を Storage + post_images から削除してから新規作成
// → replace=false (デフォルト): 新規作成のみ
// → Supabase Storage generated-images/{userId}/uploaded/{timestamp}.{ext}
// → post_images レコード作成 (style: 'uploaded')
// → レスポンス: { imageUrl: string }

// PUT /api/posts/[id]/image (JSON: imageUrl, style, aspectRatio, prompt)
// → 既存 post_images レコードを検索
// → 古い画像を Storage から削除
// → post_images レコードを UPDATE（なければ INSERT）
// → レスポンス: { imageUrl: string }
```
- StepResult・履歴詳細のImageUploaderコンポーネントから呼び出し
- アップロード後は通常のInstagram投稿フローが利用可能
- PUT は画像再生成モーダル（ImageRegenerateModal）から呼び出し

### 投稿の汎用更新 (PATCH)
```typescript
// PATCH /api/posts/[id] (JSON)
// ホワイトリスト方式で更新可能フィールドを制限:
// - post_type, post_type_id, input_text, generated_caption, generated_hashtags
// - instagram_published, instagram_media_id, related_post_id
// instagram_published=true の場合 instagram_published_at を自動設定
// 更新後は POST_SELECT_QUERY を含む完全なデータを返す
```

### Facebook SDK の注意点
- `FB.login` のコールバックに `async` 関数を渡してはいけない（"Expression is of type asyncfunction" エラー）
- 非同期処理は `.then()` チェーンで対応
- HTTPS 必須（localhost では `--experimental-https` オプションが必要）

## キャプション/ハッシュタグ生成ルール

**必須**: 新規作成・履歴編集を問わず、キャプションやハッシュタグを生成・再生成する際は、必ず選択中プロフィールの `system_prompt` を取得して AI プロンプトに含めること。

- **呼び出し側**: `/api/generate/caption` へのリクエストに `profileId` を必ず含める
- **API 側**: `profileId` があれば `profiles` テーブルから `system_prompt` + `required_hashtags` を取得
- **フォールバック**: `profileId` がない場合は `user_settings` テーブルから取得（レガシー互換）
- **対象シーン**:
  - 新規投稿作成時のキャプション生成（`useContentGeneration`）
  - 履歴編集でのキャプション再生成（`usePostEdit.regenerateCaption`）
  - 履歴編集での投稿タイプ変更＋再生成（`usePostEdit.changeType`）
- **後処理**: キャプション生成後、ハッシュタグ行と表紙タイトル案を自動除去（`cleanGeneratedCaption`）。詳細は `.claude/rules/ai.md` の「キャプション生成の後処理」参照

## パフォーマンス

### タイムアウト
```typescript
// API タイムアウト: 30秒
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 30000)

try {
  const response = await fetch(url, { signal: controller.signal })
} finally {
  clearTimeout(timeout)
}
```

### リトライ
```typescript
async function fetchWithRetry(url: string, options: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options)
      if (res.ok) return res
      if (res.status < 500) throw new Error('Client error')
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}
```

### 目標値
| 項目 | 目標 |
|------|------|
| 文章生成 | 5秒以内 |
| 画像生成 | 30秒以内 |
| API レスポンス | 3秒以内 |
