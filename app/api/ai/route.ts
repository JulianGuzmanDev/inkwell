import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase-server'

type AiAction =
  | 'suggest_title'
  | 'suggest_tags'
  | 'formal'
  | 'dynamic'
  | 'clear'
  | 'expand'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function systemPrompt() {
  return [
    'Sos un asistente de escritura para un blog.',
    'Respondés SIEMPRE en español rioplatense (Argentina), natural y claro.',
    'No uses insultos ni contenido dañino.',
    'Si faltan datos, hacé la mejor suposición posible sin pedir aclaraciones.',
  ].join('\n')
}

function buildUserPrompt(params: {
  action: AiAction
  content: string
  selectedText?: string
}) {
  const content = params.content?.trim() || ''
  const selected = params.selectedText?.trim() || ''

  switch (params.action) {
    case 'suggest_title':
      return [
        'Generá 3 títulos atractivos para este post.',
        'Devolvé SOLO un JSON válido con esta forma: {"titles":["...","...","..."]}.',
        'No agregues texto extra.',
        '',
        'POST:',
        content,
      ].join('\n')

    case 'suggest_tags':
      return [
        'Sugerí entre 6 y 10 tags cortos (1 a 2 palabras) relevantes para este post.',
        'Devolvé SOLO un JSON válido con esta forma: {"tags":["tag1","tag2",...]}',
        'No agregues texto extra.',
        '',
        'POST:',
        content,
      ].join('\n')

    case 'formal':
    case 'dynamic':
    case 'clear':
    case 'expand': {
      const modeLabel =
        params.action === 'formal'
          ? 'más formal'
          : params.action === 'dynamic'
            ? 'más dinámico'
            : params.action === 'clear'
              ? 'más claro'
              : 'expandir la idea'

      return [
        `Reescribí el texto seleccionado para que quede ${modeLabel}.`,
        'Devolvé SOLO el texto reescrito (sin comillas, sin explicaciones).',
        '',
        'CONTEXTO (post completo, por si ayuda):',
        content,
        '',
        'TEXTO SELECCIONADO:',
        selected || '(vacío)',
      ].join('\n')
    }
  }
}

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

  const { action, content, selectedText } = body as Partial<{
    action: AiAction
    content: string
    selectedText: string
  }>

  if (
    action !== 'suggest_title' &&
    action !== 'suggest_tags' &&
    action !== 'formal' &&
    action !== 'dynamic' &&
    action !== 'clear' &&
    action !== 'expand'
  ) {
    return Response.json({ error: 'Acción inválida' }, { status: 400 })
  }

  if (!content || typeof content !== 'string') {
    return Response.json({ error: 'Falta content' }, { status: 400 })
  }

  if (
    (action === 'formal' ||
      action === 'dynamic' ||
      action === 'clear' ||
      action === 'expand') &&
    (!selectedText || typeof selectedText !== 'string' || !selectedText.trim())
  ) {
    return Response.json(
      { error: 'Seleccioná un párrafo para mejorar' },
      { status: 400 }
    )
  }

  if (!process.env.GROQ_API_KEY) {
    return Response.json(
      { error: 'Falta configurar GROQ_API_KEY' },
      { status: 500 }
    )
  }

  const userPrompt = buildUserPrompt({ action, content, selectedText })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: action === 'suggest_title' || action === 'suggest_tags' ? 0.7 : 0.4,
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: userPrompt },
      ],
    })

    const result = completion.choices?.[0]?.message?.content?.trim() || ''
    return Response.json({ result })
  } catch (e: any) {
    return Response.json(
      { error: 'Error llamando a la IA', details: e?.message || String(e) },
      { status: 500 }
    )
  }
}