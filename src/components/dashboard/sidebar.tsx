'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: string
  subItems?: { href: string; label: string; icon: string }[]
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '🏠' },
  { href: '/create', label: '新規作成', icon: '✏️' },
  { href: '/history', label: '投稿履歴', icon: '📋' },
  { href: '/analysis', label: '分析', icon: '🔍' },
  { href: '/characters', label: 'キャラクター', icon: '👤' },
  {
    href: '/settings',
    label: '設定',
    icon: '⚙️',
    subItems: [
      { href: '/settings/profiles', label: 'プロフィール', icon: '👥' },
      { href: '/settings/post-types', label: '投稿タイプ', icon: '📝' },
    ],
  },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col h-full">
      <div className="flex-1 py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const isSubExpanded = item.subItems && isActive

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>

                {/* Sub navigation */}
                {isSubExpanded && item.subItems && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`)
                      return (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                              isSubActive
                                ? 'bg-white/10 text-blue-400'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className="text-base">{sub.icon}</span>
                            <span className="font-medium">{sub.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
