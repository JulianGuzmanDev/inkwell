import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { Role } from '@/types'
import PostsManagement from '@/components/blog/PostsManagement'

type PostRow = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'pending' | 'published'
  created_at: string
  authorEmail: string
  authorId: string
}

export default async function PostsPage() {
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

  let postsQuery = supabase
    .from('posts')
    .select('id, title, slug, status, created_at, author_id')
    .order('created_at', { ascending: false })

  if (role === 'autor') {
    postsQuery = postsQuery.eq('author_id', user.id)
  }

  const { data: posts } = await postsQuery

  const rows: PostRow[] =
    posts && posts.length > 0
      ? await Promise.all(
          posts.map(async (p) => {
            const { data: author } = await supabase
              .from('profiles')
              .select('user_email')
              .eq('user_id', p.author_id)
              .single()

            return {
              id: p.id,
              title: p.title,
              slug: p.slug,
              status: p.status,
              created_at: p.created_at,
              authorEmail: author?.user_email || 'Usuario',
              authorId: p.author_id,
            }
          })
        )
      : []

  return <PostsManagement role={role} posts={rows} />
}

