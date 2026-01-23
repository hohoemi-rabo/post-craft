# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**post-craft** is an Instagram post material auto-generation service that creates captions, hashtags, and images from blog article URLs. This is an MVP project for a single developer using Claude Code.

**Target**: Bloggers and writers who want to promote their articles on Instagram with minimal effort.

## Tech Stack

- **Framework**: Next.js 15.5.9 (App Router, React 19.1.0)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.17
- **Build Tool**: Turbopack (`--turbopack` flag in scripts)
- **Deployment**: Vercel
- **AI/Content**: OpenAI API (GPT-4) for caption/hashtag generation
- **Scraping**: @mozilla/readability + jsdom for article extraction
- **Image Generation**: @vercel/og (Satori-based OG image generation)
- **Analytics**: Google Analytics 4 via @next/third-parties
- **Utilities**: clsx + tailwind-merge, js-cookie (rate limiting)

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Task Management

**Todo Format**: All task tickets in `/docs` directory use the following format:
- `- [ ]` for pending tasks
- `- [×]` for completed tasks

**Example**:
```markdown
- [×] Completed task
- [ ] Pending task
```

**Ticket Files**: See `/docs` directory for detailed task breakdowns:
- `01-project-setup.md` - Initial project configuration
- `02-ui-components.md` - UI components and design system
- `03-top-page.md` - Landing page implementation
- `04-content-extraction.md` - Article scraping functionality
- `05-openai-integration.md` - OpenAI API integration
- `06-caption-hashtag-generation.md` - Content generation UI
- `07-image-generation.md` - Image generation feature
- `08-post-assist-flow.md` - Instagram posting assistance
- `09-responsive-design.md` - Mobile-first responsive design
- `10-cookie-rate-limiting.md` - Cookie-based rate limiting
- `11-error-handling.md` - Error handling improvements
- `12-analytics-deployment.md` - GA4 integration and deployment

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (Geist + Noto Sans JP)
│   ├── page.tsx                 # Landing page
│   ├── error.tsx                # Global error boundary
│   ├── globals.css              # Global styles
│   ├── generate/
│   │   ├── page.tsx             # URL input page
│   │   ├── manual/page.tsx      # Manual text input page
│   │   └── result/page.tsx      # Generation result page
│   ├── contact/page.tsx         # Contact page
│   ├── privacy/page.tsx         # Privacy policy page
│   └── api/
│       ├── extract/route.ts     # Article extraction API
│       ├── generate/route.ts    # OpenAI content generation API
│       └── og/route.tsx         # OG image generation API
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── spinner.tsx
│   │   ├── toast.tsx
│   │   └── modal.tsx
│   ├── layout/
│   │   ├── header.tsx
│   │   └── footer.tsx
│   ├── providers/providers.tsx  # Client providers wrapper
│   └── usage-indicator.tsx      # Rate limit usage display
└── lib/
    ├── utils.ts                 # cn() utility (clsx + tailwind-merge)
    ├── openai.ts                # OpenAI API client
    ├── api-client.ts            # Frontend API utilities
    ├── validation.ts            # Input validation
    ├── error-messages.ts        # Error message constants
    ├── rate-limiter.ts          # Cookie-based rate limiting
    └── analytics.ts             # GA4 event tracking
```

## Key Technical Details

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json)

### Fonts
- **Default**: Geist Sans and Geist Mono (via next/font)
- **Japanese**: Noto Sans JP (via next/font/google)

### TypeScript Configuration
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler

### Tailwind CSS
- Content paths: `./src/app/**`, `./src/components/**`, `./src/pages/**`
- CSS variables: `--background`, `--foreground`
- Custom font families using Geist variables

## Architecture & Design System (from Requirements)

### Color Palette
```
Primary: #3B82F6 (Blue)
Background: #FFFFFF (White)
Text Primary: #1F2937 (Dark Gray)
Text Secondary: #6B7280 (Gray)
Border: #E5E7EB (Light Gray)
Success: #10B981 (Green)
Error: #EF4444 (Red)
```

### Image Generation Backgrounds
```
#1E293B (Dark Navy)
#334155 (Gray)
#F5F5F5 (Light Gray)
```

### Design Inspiration
Modern & chic styling inspired by Notion, Linear, and Vercel - generous whitespace, calm color scheme.

## Implemented Features

1. **URL Input & Content Extraction** (`/generate`)
   - @mozilla/readability + jsdom for article scraping
   - Fallback to manual text input (`/generate/manual`, max 10,000 chars)

2. **AI-Powered Content Generation** (`/api/generate`)
   - Caption: 100-150 chars, business tone, no emojis
   - Hashtags: 10 tags (8 content-related + 2 generic), Japanese-focused
   - Model: GPT-4, temperature: 0.7, max_tokens: 500

3. **Image Generation** (`/api/og`)
   - Size: 1080×1080px (square)
   - Tech: @vercel/og (Satori)
   - Font: Noto Sans JP
   - Background: Random from 3 preset colors
   - Text color: Auto-select based on background (white/black)

4. **Post Assist Flow** (`/generate/result`)
   - Image download button
   - Copy caption + hashtags to clipboard
   - Open Instagram (app on mobile via `instagram://camera`, web on desktop)

## API Endpoints

### POST /api/extract
Extract article content from URL.
```
Request: { url: string }
Response: { title: string, content: string, excerpt: string }
Error: { error: string }
```

### POST /api/generate
Generate caption and hashtags using OpenAI.
```
Request: { content: string, title?: string }
Response: { caption: string, hashtags: string[] }
Error: { error: string }
```

### GET /api/og
Generate OG image with title text.
```
Query: ?title=string&bg=string
Response: PNG image (1080×1080)
```

## Rate Limiting

- **MVP Phase**: Cookie-based limit (5 generations/day)
- **Future**: User authentication with tiered plans

## Performance Targets

- Total processing time: < 60 seconds
- Image generation: < 3 seconds
- API timeout: 30 seconds max

## Error Handling Strategy

- Invalid URL → Prompt for valid URL
- Scraping failure → Auto-redirect to manual input
- API failure → Show retry button (max 3 attempts)
- Timeout → Display "Processing is taking longer..." with retry option

## Development Notes

- **Do NOT use** Zustand, database, or authentication in MVP
- Minimize Framer Motion usage (keep animations minimal)
- Google Analytics 4 is integrated via `@next/third-parties` (see `lib/analytics.ts`)
- Mobile-first responsive design (1-column layout on mobile)
- Minimum touch target: 44×44px

### Environment Variables
```
OPENAI_API_KEY=sk-...              # Required: OpenAI API key
NEXT_PUBLIC_GA_ID=G-...            # Optional: Google Analytics 4 ID
NEXT_PUBLIC_APP_URL=https://...    # Optional: App URL for OG images
```

## Testing & Deployment

- No automated tests in MVP scope
- Deploy to Vercel
- Closed beta testing with selected users
- Feedback collection via GitHub Issues

## Next.js 15 App Router Best Practices

> Based on Next.js 15.x official documentation (Context7 MCP)

### Server Components vs Client Components

**Default to Server Components** - All components in the `app` directory are Server Components by default. Only add `'use client'` when you need:
- Interactive event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React hooks (useState, useEffect, useContext, etc.)

**Client Component Pattern** - Use `'use client'` directive at the top of file:
```tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

**Safe Browser API Access** - Use `useEffect` to access browser APIs:
```tsx
'use client'

import { useEffect } from 'react'

export default function ClientComponent() {
  useEffect(() => {
    // Safe: runs only in browser after hydration
    console.log(window.innerHeight)
  }, [])

  return <div>...</div>
}
```

### Data Fetching in Server Components

**Fetch with caching options**:
```tsx
export default async function Page() {
  // Static (cached until manual invalidation) - Default in Next.js 15
  const staticData = await fetch('https://...', { cache: 'force-cache' })

  // Dynamic (refetch on every request)
  const dynamicData = await fetch('https://...', { cache: 'no-store' })

  // Revalidate (cached with time-based invalidation)
  const revalidatedData = await fetch('https://...', {
    next: { revalidate: 60 },  // 60 seconds
  })

  // Tagged for on-demand revalidation
  const taggedData = await fetch('https://...', {
    next: { tags: ['posts'] },
  })

  return <div>...</div>
}
```

**Parallel fetching** to avoid waterfalls:
```tsx
export default async function Page() {
  const [posts, users] = await Promise.all([
    fetch('https://api.example.com/posts'),
    fetch('https://api.example.com/users')
  ])

  return <div>...</div>
}
```

### Server Actions (Mutations)

**Define Server Action** with `'use server'` directive:
```tsx
// app/actions.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title')
  // ... save to database

  // Revalidate cache after mutation
  revalidatePath('/posts')      // Invalidate specific path
  revalidateTag('posts')        // Invalidate all fetches tagged 'posts'
}
```

**Use in form**:
```tsx
export default function Page() {
  async function handleSubmit(formData: FormData) {
    'use server'

    const rawFormData = {
      title: formData.get('title'),
      content: formData.get('content'),
    }

    // mutate data, then revalidate cache
  }

  return <form action={handleSubmit}>...</form>
}
```

### Route Handlers (API Routes)

**Basic Route Handler**:
```tsx
// app/api/generate/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  // ... call OpenAI, external API, etc.
  return Response.json({ data })
}
```

**Cookie Management** in Route Handlers:
```tsx
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = await cookies()

  const token = cookieStore.get('token')     // Read cookie
  cookieStore.set('session', 'value')        // Set cookie
  cookieStore.delete('old-cookie')           // Delete cookie

  return new Response('Hello', {
    status: 200,
    headers: { 'Set-Cookie': `token=${token?.value}` },
  })
}
```

### Streaming and Loading States

**Suspense for streaming**:
```tsx
import { Suspense } from 'react'
import BlogList from '@/components/BlogList'
import BlogListSkeleton from '@/components/BlogListSkeleton'

export default function BlogPage() {
  return (
    <div>
      {/* Sent to client immediately */}
      <header>
        <h1>Welcome to the Blog</h1>
      </header>
      <main>
        {/* Streamed with fallback */}
        <Suspense fallback={<BlogListSkeleton />}>
          <BlogList />
        </Suspense>
      </main>
    </div>
  )
}
```

**loading.tsx** for route-level loading:
```tsx
// app/generate/loading.tsx
export default function Loading() {
  return <LoadingSkeleton />
}
```

### Error Handling

**Two categories of errors**:
1. **Expected errors** - Return as values, use `useActionState`
2. **Unexpected errors** - Use error boundaries (`error.tsx`)

**error.tsx** for route-level error boundaries:
```tsx
'use client'  // Error components must be Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)  // Log to error reporting service
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Dynamic Routes

**Next.js 15: `params` is now a Promise**:
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
  params: Promise<{ slug: string }>  // Promise in Next.js 15
}) {
  const { slug } = await params
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(res => res.json())
  return <article>{post.content}</article>
}
```

### Metadata

**Static metadata**:
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Post Craft',
  description: 'ブログ記事からInstagram投稿素材を自動生成',
  openGraph: {
    title: 'Post Craft',
    description: 'ブログ記事からInstagram投稿素材を自動生成',
    url: 'https://post-craft.vercel.app',
    siteName: 'Post Craft',
    locale: 'ja_JP',
    type: 'website',
  },
}
```

**Dynamic metadata** with `generateMetadata`:
```tsx
import type { Metadata, ResolvingMetadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}, parent: ResolvingMetadata): Promise<Metadata> {
  const { id } = await params
  const post = await fetch(`https://api.example.com/posts/${id}`).then(res => res.json())

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      ...(await parent).openGraph,
      images: post.image,
    },
  }
}
```

### Cookies and Headers in Server Components

**Access request data** (Next.js 15: these are now async):
```tsx
import { headers, cookies } from 'next/headers'

export default async function Page() {
  const headersList = await headers()
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')

  return <div>Theme: {theme?.value}</div>
}
```

### Route Segment Config

```tsx
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Revalidate interval
export const revalidate = 3600  // 1 hour

// Control static param behavior
export const dynamicParams = true  // true = on-demand render, false = 404
```

### Performance Tips

1. **Parallel data fetching** - Use `Promise.all()` to avoid waterfalls
2. **Minimize Client Components** - Push `'use client'` as deep as possible
3. **Image optimization** - Always use `next/image` with `priority` for LCP images
4. **Font optimization** - Use `next/font` (Geist + Noto Sans JP configured)
5. **Streaming** - Use Suspense boundaries for progressive rendering

## Future Phases

- **Phase 2**: User auth, paid plans, generation history
- **Phase 3**: Multiple templates, image editing, emoji tone options, multi-platform (Twitter/Facebook)
- **Phase 4**: Enterprise plans, API offering, team features
