'use client'

import { useState } from 'react'
import Script from 'next/script'
import { Header } from '@/components/dashboard/header'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { InstagramPublishProvider } from '@/components/providers/instagram-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <InstagramPublishProvider>
      <Script
        src="https://connect.facebook.net/ja_JP/sdk.js"
        strategy="afterInteractive"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 h-[calc(100vh-4rem)] sticky top-16 border-r border-white/10 bg-slate-900/30">
            <Sidebar />
          </aside>

          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
              <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-900 z-50 shadow-xl">
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                  <span className="text-lg font-bold text-white">Post Craft</span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-slate-400 hover:text-white"
                    aria-label="メニューを閉じる"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
              </aside>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-4rem)] pb-20 lg:pb-0">
            <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>
    </InstagramPublishProvider>
  )
}
