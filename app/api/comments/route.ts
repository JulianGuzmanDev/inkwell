import { createClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'No autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { post_id, content } = body as Partial<{
    post_id: string
    content: string
  }>

  const cleanContent = (content || '').trim()

  if (!post_id || !cleanContent) {
    return Response.json(
      { error: 'post_id y contenido son obligatorios' },
      { status: 400 }
    )
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id,
      content: cleanContent,
      approved: false,
      user_id: user.id,
    })
    .select('*')
    .single()

  if (error) {
    return Response.json(
      { error: 'No se pudo crear el comentario', details: error.message },
      { status: 500 }
    )
  }

  return Response.json({ comment }, { status: 201 })
}

