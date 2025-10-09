'use client'

import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Spinner from '@/components/ui/spinner'

export default function GeneratePage() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url')

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-text-secondary">
            記事を解析しています...
          </p>
          {url && (
            <p className="mt-2 text-sm text-text-secondary">
              {url}
            </p>
          )}
          <p className="mt-4 text-xs text-text-secondary">
            ※この機能は次のチケット（04-content-extraction）で実装予定です
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
