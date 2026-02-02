'use client'

import Image from 'next/image'
import type { InstagramAccount } from '@/types/instagram'

interface AccountSelectorProps {
  accounts: InstagramAccount[]
  onSelect: (account: InstagramAccount) => void
}

export function AccountSelector({ accounts, onSelect }: AccountSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white text-center">
        投稿するアカウントを選択
      </h2>
      <div className="space-y-3">
        {accounts.map((account) => (
          <button
            key={account.igAccountId}
            onClick={() => onSelect(account)}
            className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all duration-200"
          >
            {account.igProfilePictureUrl ? (
              <Image
                src={account.igProfilePictureUrl}
                alt={account.igUsername}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">
                {account.igUsername.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <p className="text-white font-medium">@{account.igUsername}</p>
              <p className="text-slate-400 text-sm">{account.pageName}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
