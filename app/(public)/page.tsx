import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export default async function Home() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, content, slug, created_at, author_id')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const postsWithAuthors =
    posts && posts.length > 0
      ? await Promise.all(
          posts.map(async (post) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, full_name, user_email')
              .eq('user_id', post.author_id)
              .single()

            const authorName =
              profile?.display_name ||
              profile?.full_name ||
              profile?.user_email ||
              'Autor desconocido'

            return {
              ...post,
              authorName,
            }
          })
        )
      : []

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#222]">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            Inkwell
          </h1>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg border border-purple-500/50 text-sm font-medium text-purple-300 hover:bg-purple-500/10 transition"
          >
            Ingresar
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {postsWithAuthors.length === 0 ? (
          <p className="text-center text-gray-500">
            No hay posts publicados todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {postsWithAuthors.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                className="group bg-[#111] border border-[#222] rounded-xl p-5 hover:border-purple-500/60 transition flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2 group-hover:text-purple-300 transition">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-400 mb-3">
                    {post.content.length > 150
                      ? post.content.slice(0, 150) + '...'
                      : post.content}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <span>{post.authorName}</span>
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
