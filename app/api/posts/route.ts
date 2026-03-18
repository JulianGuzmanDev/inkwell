import { createClient } from '@/lib/supabase-server'
import type { Role } from '@/types'

type PostStatus = 'draft' | 'pending' | 'published'

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return Response.json({ error: 'Perfil no encontrado' }, { status: 403 })
  }

  const role = profile.role as Role
  if (role !== 'admin' && role !== 'editor' && role !== 'autor') {
    return Response.json({ error: 'Sin permisos para crear posts' }, { status: 403 })
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

  const cleanTitle = (title || '').trim()
  const cleanContent = (content || '').trim()

  if (!cleanTitle) {
    return Response.json({ error: 'El título es obligatorio' }, { status: 400 })
  }

  if (!cleanContent) {
    return Response.json({ error: 'El contenido es obligatorio' }, { status: 400 })
  }

  const cleanSlug = (slug || '').trim()
  const finalSlug = cleanSlug ? slugify(cleanSlug) : slugify(cleanTitle)

  if (!finalSlug) {
    return Response.json({ error: 'El slug es obligatorio' }, { status: 400 })
  }

  const desiredStatus: PostStatus =
    status === 'published' || status === 'pending' || status === 'draft'
      ? status
      : 'draft'

  const finalStatus: PostStatus =
    desiredStatus === 'published' && role !== 'admin' && role !== 'editor'
      ? 'pending'
      : desiredStatus

  const { data: created, error } = await supabase
    .from('posts')
    .insert({
      title: cleanTitle,
      slug: finalSlug,
      content: cleanContent,
      status: finalStatus,
      author_id: user.id,
    })
    .select('*')
    .single()

  if (error) {
    return Response.json(
      { error: 'No se pudo crear el post', details: error.message },
      { status: 500 }
    )
  }

  return Response.json({ post: created }, { status: 201 })
}

