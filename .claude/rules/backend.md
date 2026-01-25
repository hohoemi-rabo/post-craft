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
├── posts/
│   ├── route.ts              # GET (list), POST (create)
│   └── [id]/route.ts         # GET, DELETE
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

### テーブル操作
```typescript
// 取得
const { data, error } = await supabase
  .from('posts')
  .select('*, post_images(*)')
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
CREATE POLICY "Users can CRUD own data" ON posts
  FOR ALL USING (auth.uid()::text = user_id::text);
```

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

### API での認証チェック
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
