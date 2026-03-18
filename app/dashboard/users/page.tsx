import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { Role } from '@/types'
import UsersManagement from '@/components/blog/UsersManagement'

type UserRow = {
  id: string
  userId: string
  email: string
  role: Role
  createdAt: string
}

export default async function UsersPage() {
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
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: rows } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const users: UserRow[] =
    rows?.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      email: row.email || 'sin-email',
      role: row.role as Role,
      createdAt: row.created_at,
    })) ?? []

  return <UsersManagement currentUserId={user.id} users={users} />
}

