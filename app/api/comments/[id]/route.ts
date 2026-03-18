import { createClient } from '@/lib/supabase-server'
import type { Role } from '@/types'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  const role = (profile?.role || 'lector') as Role
  if (role !== 'admin' && role !== 'editor') {
    return Response.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { approved, rejected } = body as Partial<{
    approved: boolean
    rejected: boolean
  }>

  if (typeof approved !== 'boolean' && typeof rejected !== 'boolean') {
    return Response.json(
      { error: 'Debe incluir approved y/o rejected como boolean' },
      { status: 400 }
    )
  }

  const update: { approved?: boolean; rejected?: boolean } = {}
  if (typeof approved === 'boolean') update.approved = approved
  if (typeof rejected === 'boolean') update.rejected = rejected

  const { data: updated, error } = await supabase
    .from('comments')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return Response.json(
      { error: 'No se pudo actualizar el comentario', details: error.message },
      { status: 500 }
    )
  }

  return Response.json({ comment: updated }, { status: 200 })
}

