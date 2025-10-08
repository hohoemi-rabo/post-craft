# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**post-craft** is an Instagram post material auto-generation service that creates captions, hashtags, and images from blog article URLs. This is an MVP project for a single developer using Claude Code.

**Target**: Bloggers and writers who want to promote their articles on Instagram with minimal effort.

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router, React 19.1.0)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.4.17
- **Build Tool**: Turbopack (`--turbopack` flag in scripts)
- **Deployment**: Vercel
- **Future Integrations**:
  - OpenAI API (GPT-4) for content generation
  - @mozilla/readability + jsdom for article extraction
  - @vercel/og or Canvas API for image generation

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
└── app/                    # Next.js App Router
    ├── layout.tsx         # Root layout (Geist fonts configured)
    ├── page.tsx           # Home page
    └── globals.css        # Global styles
```

## Key Technical Details

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json)

### Fonts
- **Default**: Geist Sans and Geist Mono (Google Fonts)
- **Japanese support required**: Noto Sans JP (per requirements - not yet implemented)

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

## Core Features to Implement

1. **URL Input & Content Extraction**
   - Use @mozilla/readability + jsdom for article scraping
   - Fallback to manual text input (max 10,000 chars) on failure

2. **AI-Powered Content Generation** (via OpenAI API)
   - Caption: 100-150 chars, business tone, no emojis
   - Hashtags: 10 tags (8 content-related + 2 generic), Japanese-focused
   - Model: GPT-4, temperature: 0.7, max_tokens: 500

3. **Image Generation**
   - Size: 1080×1080px (square)
   - Tech: @vercel/og or Canvas API
   - Font: Noto Sans JP
   - Background: Random from 3 preset colors
   - Text color: Auto-select based on background (white/black)

4. **Post Assist Flow**
   - Auto-download generated image
   - Copy caption + hashtags to clipboard
   - Open Instagram (app on mobile via `instagram://camera`, web on desktop)

## API Endpoints (Planned)

```
POST /api/generate
Request: { url: string } | { content: string }
Response: {
  caption: string,
  hashtags: string[],
  imageUrl: string
}
Error: { error: string, code: number }
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
- Google Analytics 4 will be added in Week 4
- Mobile-first responsive design (1-column layout on mobile)
- Minimum touch target: 44×44px

## Testing & Deployment

- No automated tests in MVP scope
- Deploy to Vercel
- Closed beta testing with selected users
- Feedback collection via GitHub Issues

## Next.js 15 App Router Best Practices

### Server Components vs Client Components

**Default to Server Components** - All components in the `app` directory are Server Components by default. Only add `'use client'` when you need:
- Interactive event handlers (onClick, onChange, etc.)
- Browser APIs (localStorage, window, etc.)
- React hooks (useState, useEffect, useContext, etc.)

**Composition Pattern** - Keep Client Component boundaries minimal to optimize bundle size:
```tsx
// ✅ Good: Server Component wraps Client Component
// app/page.tsx (Server Component)
export default async function Page() {
  const data = await fetch('https://api.example.com/data')
  const posts = await data.json()
  return <InteractiveList posts={posts} />  // Pass data as props
}

// app/interactive-list.tsx (Client Component)
'use client'
export default function InteractiveList({ posts }) {
  const [selected, setSelected] = useState(null)
  // ... interactive logic
}
```

### Data Fetching Strategies

**Server Components** - Fetch data directly in async components:
```tsx
// app/page.tsx
export default async function Page() {
  // Parallel fetching
  const [posts, users] = await Promise.all([
    fetch('https://api.example.com/posts'),
    fetch('https://api.example.com/users')
  ])

  return <div>...</div>
}
```

**Caching Options** with `fetch`:
```tsx
// Static (cached until manual invalidation) - Default
fetch('https://...', { cache: 'force-cache' })

// Dynamic (refetch on every request)
fetch('https://...', { cache: 'no-store' })

// Revalidate (cached with time-based invalidation)
fetch('https://...', { next: { revalidate: 60 } })  // 60 seconds

// Tagged for on-demand revalidation
fetch('https://...', { next: { tags: ['posts'] } })
```

**For non-fetch requests** (ORMs, databases):
```tsx
import { unstable_cache } from 'next/cache'

const getCachedData = unstable_cache(
  async () => db.select().from(posts),
  ['posts-key'],
  { revalidate: 3600, tags: ['posts'] }
)
```

**Route Handlers** - Use for API endpoints, NOT for fetching from Server Components:
```tsx
// ✅ Good: Client Component → Route Handler → Backend
// app/api/generate/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  // ... call OpenAI, database, etc.
  return Response.json({ data })
}

// ❌ Bad: Server Component → Route Handler (unnecessary extra request)
```

### Streaming and Loading States

**Use Suspense boundaries** for progressive rendering:
```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <SlowComponent />
      </Suspense>
      <Suspense fallback={<Skeleton />}>
        <AnotherSlowComponent />
      </Suspense>
    </div>
  )
}
```

**loading.tsx** for route-level loading states:
```
app/
├── dashboard/
│   ├── loading.tsx    # Shown while page.tsx loads
│   └── page.tsx
```

### Dynamic Routes and Static Generation

**Dynamic segments**:
```
app/blog/[slug]/page.tsx  → /blog/hello-world
```

**Pre-render with `generateStaticParams`**:
```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(res => res.json())
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(res => res.json())
  return <article>{post.content}</article>
}
```

**Route Segment Config** for cache control:
```tsx
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Revalidate interval
export const revalidate = 3600  // 1 hour

// Control static param behavior
export const dynamicParams = true  // true = on-demand render, false = 404
```

### Cache Revalidation

**Time-based**:
```tsx
export const revalidate = 60  // Revalidate page every 60 seconds
```

**On-demand** (in Server Actions or Route Handlers):
```tsx
'use server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function createPost(data: FormData) {
  // ... save to database

  revalidatePath('/posts')              // Invalidate specific path
  revalidateTag('posts')                 // Invalidate all fetches tagged 'posts'
}
```

### Layouts and Templates

**Layouts persist** across navigations (state preserved):
```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div>
      <Sidebar />  {/* Persists, won't re-render */}
      {children}
    </div>
  )
}
```

**Access request data** in Server Components:
```tsx
import { headers, cookies } from 'next/headers'

export default async function Page() {
  const headersList = await headers()
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')

  return <div>Theme: {theme?.value}</div>
}
```

### Performance Optimization

1. **Parallel data fetching** - Use `Promise.all()` to avoid waterfalls
2. **Preloading** - Call data functions early to start fetching:
   ```tsx
   import { preload } from './data'

   export default function Page() {
     preload('blog-posts')  // Start fetching immediately
     return <Posts />
   }
   ```
3. **Image optimization** - Always use `next/image`:
   ```tsx
   import Image from 'next/image'

   <Image
     src="/image.jpg"
     alt="Description"
     width={1080}
     height={1080}
     priority  // For LCP images
   />
   ```
4. **Font optimization** - Use `next/font` (already configured with Geist)
5. **Minimize Client Components** - Push `'use client'` as deep as possible

### Security Best Practices

**Prevent data leakage** with taint APIs:
```tsx
import { experimental_taintObjectReference } from 'react'

export async function getUser() {
  const user = await db.query.users.findFirst()
  experimental_taintObjectReference(
    'Do not pass user object to client',
    user
  )
  return user
}
```

**Server Actions authorization**:
```tsx
'use server'
import { auth } from '@/lib/auth'

export async function deletePost(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  // ... perform action
}
```

### Error Handling

**error.tsx** for route-level error boundaries:
```tsx
'use client'  // Error components must be Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**Expected errors** in Server Components:
```tsx
export default async function Page() {
  const res = await fetch('https://api.example.com/data')

  if (!res.ok) {
    return <div>Failed to load data</div>
  }

  const data = await res.json()
  return <div>{data.message}</div>
}
```

### Navigation

**Use Link for client-side navigation**:
```tsx
import Link from 'next/link'

<Link href="/dashboard" prefetch={false}>  {/* Disable prefetch if needed */}
  Dashboard
</Link>
```

**Programmatic navigation** in Client Components:
```tsx
'use client'
import { useRouter } from 'next/navigation'

export default function Component() {
  const router = useRouter()

  const handleClick = () => {
    router.push('/dashboard')
    router.refresh()  // Re-fetch Server Component data
  }
}
```

### Metadata

**Static metadata**:
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Instagram Post Generator',
  description: 'Generate Instagram posts from blog URLs',
}
```

**Dynamic metadata**:
```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await fetch(`https://api.example.com/posts/${params.id}`)
  return {
    title: post.title,
    description: post.excerpt,
  }
}
```

## Future Phases

- **Phase 2**: User auth, paid plans, generation history
- **Phase 3**: Multiple templates, image editing, emoji tone options, multi-platform (Twitter/Facebook)
- **Phase 4**: Enterprise plans, API offering, team features
