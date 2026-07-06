'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'

interface CtaLinkProps {
  authedHref: string
  authedLabel: string
}

const CTA_CLASS =
  'inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-xl hover:from-purple-700 hover:via-pink-600 hover:to-orange-500 shadow-lg hover:shadow-xl transition-all duration-300'

export function CtaLink({ authedHref, authedLabel }: CtaLinkProps) {
  const { data: session } = useSession()

  return session ? (
    <Link href={authedHref} className={CTA_CLASS}>
      {authedLabel}
    </Link>
  ) : (
    <Link href="/login" className={CTA_CLASS}>
      無料で始める
    </Link>
  )
}
