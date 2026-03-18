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
    .select('id, user_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return Response.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { role } = body as Partial<{ role: Role }>

  if (role !== 'admin' && role !== 'editor' && role !== 'autor' && role !== 'lector') {
    return Response.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const { data: target } = await supabase
    .from('profiles')
    .select('id, user_id, role, created_at')
    .eq('id', id)
    .single()

  if (!target) {
    return Response.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  if (target.user_id === user.id) {
    return Response.json(
      { error: 'No podés cambiar tu propio rol' },
      { status: 400 }
    )
  }

  const { data: updated, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)
    .select('id, user_id, role, created_at')
    .single()

  if (error) {
    return Response.json(
      { error: 'No se pudo actualizar el rol', details: error.message },
      { status: 500 }
    )
  }

  return Response.json({ profile: updated }, { status: 200 })
}

