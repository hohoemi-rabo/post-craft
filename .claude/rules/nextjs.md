# Next.js 15 Rules

Next.js 15.x App Router のベストプラクティス。

## Server Components vs Client Components

### デフォルトは Server Components
`app` ディレクトリのコンポーネントはデフォルトで Server Components。
`'use client'` は以下の場合のみ追加:
- イベントハンドラ (onClick, onChange等)
- ブラウザAPI (localStorage, window等)
- React hooks (useState, useEffect, useContext等)

```tsx
// Client Component パターン
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### ブラウザAPI の安全なアクセス
```tsx
'use client'

import { useEffect } from 'react'

export default function ClientComponent() {
  useEffect(() => {
    // ブラウザでのみ実行
    console.log(window.innerHeight)
  }, [])

  return <div>...</div>
}
```

## Data Fetching

### Server Components でのフェッチ
```tsx
export default async function Page() {
  // 静的 (デフォルト - キャッシュ)
  const staticData = await fetch('https://...', { cache: 'force-cache' })

  // 動的 (毎回リクエスト)
  const dynamicData = await fetch('https://...', { cache: 'no-store' })

  // 時間ベース再検証
  const revalidatedData = await fetch('https://...', {
    next: { revalidate: 60 },  // 60秒
  })

  // タグベース再検証
  const taggedData = await fetch('https://...', {
    next: { tags: ['posts'] },
  })

  return <div>...</div>
}
```

### 並列フェッチ（ウォーターフォール回避）
```tsx
export default async function Page() {
  const [posts, users] = await Promise.all([
    fetch('https://api.example.com/posts'),
    fetch('https://api.example.com/users')
  ])

  return <div>...</div>
}
```

## Server Actions

### 定義
```tsx
// app/actions.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  // ... DB保存

  revalidatePath('/posts')      // パス再検証
  revalidateTag('posts')        // タグ再検証
}
```

### フォームでの使用
```tsx
export default function Page() {
  async function handleSubmit(formData: FormData) {
    'use server'

    const rawFormData = {
      title: formData.get('title'),
      content: formData.get('content'),
    }
    // mutate data
  }

  return <form action={handleSubmit}>...</form>
}
```

## Route Handlers (API Routes)

### 基本パターン
```tsx
// app/api/generate/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ data })
}
```

### Cookie 管理 (Next.js 15: 非同期)
```tsx
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = await cookies()

  const token = cookieStore.get('token')     // 読み取り
  cookieStore.set('session', 'value')        // 設定
  cookieStore.delete('old-cookie')           // 削除

  return new Response('Hello')
}
```

## Streaming & Loading

### Suspense
```tsx
import { Suspense } from 'react'
import BlogList from '@/components/BlogList'
import BlogListSkeleton from '@/components/BlogListSkeleton'

export default function BlogPage() {
  return (
    <div>
      <header><h1>Blog</h1></header>
      <main>
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogList />
        </Suspense>
      </main>
    </div>
  )
}
```

### loading.tsx
```tsx
// app/generate/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}
```

## Error Handling

### error.tsx (Client Component 必須)
```tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>エラーが発生しました</h2>
      <button onClick={() => reset()}>再試行</button>
    </div>
  )
}
```

## Dynamic Routes

### Next.js 15: params は Promise
```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts', {
    cache: 'force-cache',
  }).then(res => res.json())

  return posts.map((post) => ({ slug: post.slug }))
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>  // Next.js 15 で Promise
}) {
  const { slug } = await params
  const post = await fetch(`https://api.example.com/posts/${slug}`)
    .then(res => res.json())
  return <article>{post.content}</article>
}
```

## Metadata

### 静的
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Post Craft',
  description: 'Instagram投稿素材を自動生成',
}
```

### 動的
```tsx
import type { Metadata, ResolvingMetadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}, parent: ResolvingMetadata): Promise<Metadata> {
  const { id } = await params
  const post = await fetch(`https://api.example.com/posts/${id}`)
    .then(res => res.json())

  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

## Headers & Cookies (Server Components)

```tsx
import { headers, cookies } from 'next/headers'

export default async function Page() {
  const headersList = await headers()
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')

  return <div>Theme: {theme?.value}</div>
}
```

## Route Segment Config

```tsx
// 動的レンダリング強制
export const dynamic = 'force-dynamic'

// 再検証間隔
export const revalidate = 3600  // 1時間

// 動的パラメータ制御
export const dynamicParams = true  // true = オンデマンド, false = 404
```

## パフォーマンス Tips

1. **並列フェッチ** - `Promise.all()` でウォーターフォール回避
2. **Client Component 最小化** - `'use client'` は深い位置に
3. **画像最適化** - `next/image` + LCP画像に `priority`
4. **フォント最適化** - `next/font` 使用
5. **Streaming** - Suspense で段階的レンダリング
