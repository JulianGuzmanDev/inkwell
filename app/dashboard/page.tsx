import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/blog/DashboardClient'
import type { Role } from '@/types'

export default async function Dashboard() {
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

  let adminTotalPosts = 0
  let adminTotalUsers = 0
  let adminPendingPosts = 0
  let adminTotalComments = 0

  let editorPublishedPosts = 0
  let editorPendingPosts = 0
  let editorTotalComments = 0

  let autorMyDrafts = 0
  let autorMyPublished = 0
  let autorMyPending = 0

  if (role === 'admin') {
    const [{ count: totalPosts }, { count: totalUsers }, { count: pendingPosts }, { count: totalComments }] =
      await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.from('comments').select('*', { count: 'exact', head: true }),
      ])

    adminTotalPosts = totalPosts || 0
    adminTotalUsers = totalUsers || 0
    adminPendingPosts = pendingPosts || 0
    adminTotalComments = totalComments || 0
  } else if (role === 'editor') {
    const [{ count: publishedPosts }, { count: pendingPosts }, { count: totalComments }] = await Promise.all([
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
    ])

    editorPublishedPosts = publishedPosts || 0
    editorPendingPosts = pendingPosts || 0
    editorTotalComments = totalComments || 0
  } else if (role === 'autor') {
    const [
      { count: myDrafts },
      { count: myPublished },
      { count: myPending },
    ] = await Promise.all([
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('status', 'draft'),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('status', 'published'),
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', user.id)
        .eq('status', 'pending'),
    ])

    autorMyDrafts = myDrafts || 0
    autorMyPublished = myPublished || 0
    autorMyPending = myPending || 0
  }

  return (
    <DashboardClient
      userEmail={user.email || ''}
      userName={user.user_metadata?.name || user.email?.split('@')[0] || ''}
      role={role}
      adminTotalPosts={adminTotalPosts}
      adminTotalUsers={adminTotalUsers}
      adminPendingPosts={adminPendingPosts}
      adminTotalComments={adminTotalComments}
      editorPublishedPosts={editorPublishedPosts}
      editorPendingPosts={editorPendingPosts}
      editorTotalComments={editorTotalComments}
      autorMyDrafts={autorMyDrafts}
      autorMyPublished={autorMyPublished}
      autorMyPending={autorMyPending}
    />
  )
}