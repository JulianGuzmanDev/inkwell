import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { Role } from '@/types'
import CommentsModeration from '@/components/blog/CommentsModeration'

type ModerationComment = {
  id: string
  content: string
  created_at: string
  approved: boolean
  rejected: boolean
  userEmail: string
  postTitle: string
  postSlug: string
}

export default async function CommentsPage() {
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
  if (role === 'lector' || role === 'autor') {
    redirect('/dashboard')
  }

  // Intenta join (requiere relaciones FK en Supabase). Si no existen, hacemos fallback abajo.
  const { data: joined } = await supabase
    .from('comments')
    .select(
      'id, content, created_at, approved, rejected, user_id, post_id, posts(title, slug), profiles(user_email)'
    )
    .order('created_at', { ascending: false })

  let comments: ModerationComment[] = []

  if (joined && joined.length > 0) {
    comments = joined.map((row: any) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      approved: row.approved,
      rejected: row.rejected,
      userEmail: row.profiles?.user_email || 'Usuario',
      postTitle: row.posts?.title || 'Post',
      postSlug: row.posts?.slug || '',
    }))
  } else {
    const { data: rawComments } = await supabase
      .from('comments')
      .select('id, content, created_at, approved, rejected, user_id, post_id')
      .order('created_at', { ascending: false })

    const commentRows = rawComments || []

    comments = await Promise.all(
      commentRows.map(async (c) => {
        const [{ data: post }, { data: author }] = await Promise.all([
          supabase
            .from('posts')
            .select('title, slug')
            .eq('id', c.post_id)
            .single(),
          supabase
            .from('profiles')
            .select('user_email')
            .eq('user_id', c.user_id)
            .single(),
        ])

        return {
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          approved: c.approved,
          rejected: c.rejected,
          userEmail: author?.user_email || 'Usuario',
          postTitle: post?.title || 'Post',
          postSlug: post?.slug || '',
        }
      })
    )
  }

  return <CommentsModeration role={role} comments={comments} />
}

