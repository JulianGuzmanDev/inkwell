import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import PostDetail from '@/components/blog/PostDetail'

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, content, created_at, author_id, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!post) {
    notFound()
  }

  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('display_name, full_name, user_email, user_id')
    .eq('user_id', post.author_id)
    .single()

  const author = {
    name:
      authorProfile?.display_name ||
      authorProfile?.full_name ||
      authorProfile?.user_email ||
      null,
    email: authorProfile?.user_email || 'Autor desconocido',
  }

  const { data: commentsData } = await supabase
    .from('comments')
    .select('id, content, created_at, user_id, approved')
    .eq('post_id', post.id)
    .eq('approved', true)
    .order('created_at', { ascending: true })

  const commentsWithAuthors =
    commentsData && commentsData.length > 0
      ? await Promise.all(
          commentsData.map(async (comment) => {
            const { data: commentAuthor } = await supabase
              .from('profiles')
              .select('user_email, display_name, full_name, user_id')
              .eq('user_id', comment.user_id)
              .single()

            return {
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              author_email:
                commentAuthor?.user_email ||
                commentAuthor?.display_name ||
                commentAuthor?.full_name ||
                'Usuario',
            }
          })
        )
      : []

  return (
    <PostDetail
      post={{
        id: post.id,
        title: post.title,
        content: post.content,
        created_at: post.created_at,
      }}
      author={author}
      comments={commentsWithAuthors}
      isAuthenticated={!!user}
    />
  )
}
