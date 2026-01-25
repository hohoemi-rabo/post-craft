import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { createServerClient } from '@/lib/supabase'

// Check if email is in the whitelist
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) || []
  return allowedEmails.includes(email)
}

// Upsert user to Supabase
async function upsertUser(user: {
  id?: string
  email?: string | null
  name?: string | null
  image?: string | null
}) {
  if (!user.email) return null

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        email: user.email,
        name: user.name || null,
        avatar_url: user.image || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
      }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting user:', error)
    return null
  }

  return data
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      // Check whitelist
      if (!isAllowedEmail(user.email)) {
        return '/unauthorized'
      }

      // Upsert user to Supabase
      const dbUser = await upsertUser(user)
      if (dbUser) {
        // Store Supabase user ID for later use
        user.id = dbUser.id
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
})
