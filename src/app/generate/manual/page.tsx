'use client'

import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

export default function ManualInputPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            記事を直接入力
          </h1>
          <p className="mt-4 text-text-secondary">
            ※この機能は次のチケット（04-content-extraction）で実装予定です
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
