import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import PostEditor from '@/components/blog/PostEditor'
import type { Role } from '@/types'

export default async function NewPostPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const role = profile.role as Role

  if (role === 'lector') {
    redirect('/dashboard')
  }

  if (role !== 'admin' && role !== 'editor' && role !== 'autor') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="h-16 border-b border-[#222] flex items-center justify-between px-6">
        <a
          href="/dashboard"
          className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
        >
          Inkwell
        </a>
        <a
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition"
        >
          ← Volver al dashboard
        </a>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <PostEditor role={role} />
      </main>
    </div>
  )
}

