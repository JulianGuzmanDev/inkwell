import { createClient } from '@/lib/supabase-server'
import type { Role } from '@/types'

type PostStatus = 'draft' | 'pending' | 'published'

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
  if (role !== 'admin' && role !== 'editor' && role !== 'autor') {
    return Response.json({ error: 'Sin permisos' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { title, slug, content, status } = body as Partial<{
    title: string
    slug: string
    content: string
    status: PostStatus
  }>

  const hasAnyField =
    typeof title === 'string' ||
    typeof slug === 'string' ||
    typeof content === 'string' ||
    typeof status === 'string'

  if (!hasAnyField) {
    return Response.json({ error: 'Sin cambios' }, { status: 400 })
  }

  if (typeof status !== 'undefined') {
    if (status !== 'draft' && status !== 'pending' && status !== 'published') {
      return Response.json({ error: 'status inválido' }, { status: 400 })
    }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, status')
    .eq('id', id)
    .single()

  if (!post) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  if (role === 'autor') {
    if (post.author_id !== user.id) {
      return Response.json({ error: 'Sin permisos' }, { status: 403 })
    }
    if (status === 'published') {
      return Response.json(
        { error: 'Un autor no puede publicar directamente' },
        { status: 403 }
      )
    }
  }

  const update: Record<string, any> = {}
  if (typeof title === 'string') update.title = title.trim()
  if (typeof slug === 'string') update.slug = slug.trim()
  if (typeof content === 'string') update.content = content.trim()
  if (typeof status !== 'undefined') update.status = status

  if (typeof update.title === 'string' && !update.title) {
    return Response.json({ error: 'El título es obligatorio' }, { status: 400 })
  }
  if (typeof update.content === 'string' && !update.content) {
    return Response.json({ error: 'El contenido es obligatorio' }, { status: 400 })
  }
  if (typeof update.slug === 'string' && !update.slug) {
    return Response.json({ error: 'El slug es obligatorio' }, { status: 400 })
  }

  if (role === 'autor' && typeof update.status !== 'undefined') {
    if (update.status !== 'draft' && update.status !== 'pending') {
      return Response.json({ error: 'status inválido' }, { status: 400 })
    }
  }

  const { data: updated, error } = await supabase
    .from('posts')
    .update(update)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    return Response.json(
      { error: 'No se pudo actualizar el post', details: error.message },
      { status: 500 }
    )
  }

  return Response.json({ post: updated }, { status: 200 })
}

export async function DELETE(
  _req: Request,
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
  if (role !== 'admin' && role !== 'editor' && role !== 'autor') {
    return Response.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, status')
    .eq('id', id)
    .single()

  if (!post) {
    return Response.json({ error: 'Post no encontrado' }, { status: 404 })
  }

  if (role === 'autor') {
    if (post.author_id !== user.id) {
      return Response.json({ error: 'Sin permisos' }, { status: 403 })
    }
    if (post.status !== 'draft') {
      return Response.json(
        { error: 'Un autor solo puede eliminar borradores' },
        { status: 403 }
      )
    }
  }

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    return Response.json(
      { error: 'No se pudo eliminar el post', details: error.message },
      { status: 500 }
    )
  }

  return Response.json({ success: true }, { status: 200 })
}

