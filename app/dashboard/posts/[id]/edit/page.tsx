import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { Role } from '@/types'
import PostEditor from '@/components/blog/PostEditor'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, slug, content, status, author_id')
    .eq('id', id)
    .single()

  if (!post) {
    redirect('/dashboard/posts')
  }

  if (role === 'autor' && post.author_id !== user.id) {
    redirect('/dashboard/posts')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="h-16 border-b border-[#222] flex items-center justify-between px-6">
        <a
          href="/dashboard"
          className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
        >
          Inkwell
        </a>
        <a
          href="/dashboard/posts"
          className="text-sm text-gray-400 hover:text-white transition"
        >
          ← Volver a posts
        </a>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <PostEditor
          role={role}
          post={{
            id: post.id,
            title: post.title,
            slug: post.slug,
            content: post.content,
            status: post.status,
          }}
        />
      </main>
    </div>
  )
}

