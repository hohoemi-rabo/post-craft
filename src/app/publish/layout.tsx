import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Instagram投稿 - Post Craft',
  description: 'Instagramに直接投稿',
}

export default function PublishLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {children}
    </div>
  )
}
