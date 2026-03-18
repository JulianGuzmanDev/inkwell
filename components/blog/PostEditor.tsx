'use client'

import type { Post, Role } from '@/types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type PostStatus = 'draft' | 'pending' | 'published'

function parseJsonArrayFromResult(
  result: string,
  key: 'titles' | 'tags'
): string[] {
  try {
    const parsed = JSON.parse(result) as any
    const arr = parsed?.[key]
    if (Array.isArray(arr)) {
      return arr.map((x) => String(x)).filter(Boolean)
    }
  } catch {}

  return result
    .split('\n')
    .map((l) => l.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, '').trim())
    .filter(Boolean)
}

export default function PostEditor({
  role,
  post,
}: {
  role: Role
  post?: Pick<Post, 'id' | 'title' | 'slug' | 'content' | 'status'>
}) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const canPublish = role === 'admin' || role === 'editor'
  const isEdit = !!post?.id

  const [title, setTitle] = useState(post?.title || '')
  const [slug, setSlug] = useState(post?.slug || '')
  const [content, setContent] = useState(post?.content || '')
  const [isSlugManual, setIsSlugManual] = useState(!!post?.slug)
  const [status, setStatus] = useState<PostStatus>((post?.status as PostStatus) || 'draft')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState<string | null>(null)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([])
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(
    null
  )
  const [aiResult, setAiResult] = useState('')

  useEffect(() => {
    if (status === 'published' && !canPublish) {
      setStatus('pending')
    }
  }, [status, canPublish])

  useEffect(() => {
    if (!post) return
    setTitle(post.title || '')
    setSlug(post.slug || '')
    setContent(post.content || '')
    setStatus((post.status as PostStatus) || 'draft')
    setIsSlugManual(true)
  }, [post])

  const statusOptions = useMemo(() => {
    const base: { value: PostStatus; label: string }[] = [
      { value: 'draft', label: 'Borrador' },
      { value: 'pending', label: 'Pendiente' },
    ]
    if (canPublish) base.push({ value: 'published', label: 'Publicado' })
    return base
  }, [canPublish])

  function captureSelection() {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    if (start === end) {
      setSelectedRange(null)
      return
    }
    setSelectedRange({ start, end })
  }

  function getSelectedText() {
    if (!selectedRange) return ''
    const { start, end } = selectedRange
    return content.slice(start, end)
  }

  async function callAi(action: string) {
    setAiError(null)
    setAiLoading(true)
    setAiResult('')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          content,
          selectedText:
            action === 'formal' ||
            action === 'dynamic' ||
            action === 'clear' ||
            action === 'expand'
              ? getSelectedText()
              : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Error de IA')
      }

      const result = String(data?.result || '')

      if (action === 'suggest_title') {
        setTitleSuggestions(parseJsonArrayFromResult(result, 'titles').slice(0, 3))
      } else if (action === 'suggest_tags') {
        setTagSuggestions(parseJsonArrayFromResult(result, 'tags').slice(0, 12))
      } else {
        setAiResult(result)
      }
    } catch (e: any) {
      setAiError(e?.message || 'Error de IA')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSave() {
    setSaveError(null)
    setSaveOk(null)
    setSaving(true)
    try {
      const res = await fetch(isEdit ? `/api/posts/${post!.id}` : '/api/posts', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          content,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'No se pudo guardar')
      }
      setSaveOk(isEdit ? 'Post actualizado.' : 'Post creado.')
      router.push('/dashboard')
    } catch (e: any) {
      setSaveError(e?.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  function handleReplaceSelection() {
    if (!selectedRange) return
    const { start, end } = selectedRange
    const next = content.slice(0, start) + aiResult + content.slice(end)
    setContent(next)

    requestAnimationFrame(() => {
      const el = textareaRef.current
      if (!el) return
      const cursor = start + aiResult.length
      el.focus()
      el.setSelectionRange(cursor, cursor)
      setSelectedRange(null)
    })
  }

  return (
    <div className="min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
        {/* LEFT: Editor */}
        <section className="bg-[#111] border border-[#222] rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold">{isEdit ? 'Editar post' : 'Nuevo post'}</h3>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostStatus)}
                className="bg-[#0f0f0f] border border-[#222] rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 transition"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-sm font-medium hover:border-purple-500 transition disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>

          {saveError ? (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {saveError}
            </div>
          ) : null}
          {saveOk ? (
            <div className="mb-4 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
              {saveOk}
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (!isSlugManual) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/[^a-z0-9-]/g, '')
                    )
                  }
                }}
                placeholder="Título del post"
                type="text"
                className="w-full bg-[#0f0f0f] border border-[#222] rounded-xl px-4 py-3 text-xl font-semibold outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value)
                  setIsSlugManual(true)
                }}
                placeholder="slug-del-post"
                type="text"
                className="w-full bg-[#0f0f0f] border border-[#222] rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition text-gray-200 placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-2">
                El slug se genera automáticamente desde el título, pero lo podés editar.
              </p>
            </div>

            <div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onSelect={captureSelection}
                onKeyUp={captureSelection}
                onMouseUp={captureSelection}
                placeholder="Escribí tu post acá..."
                className="w-full bg-[#0f0f0f] border border-[#222] rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition min-h-[500px] resize-y text-gray-200 placeholder:text-gray-500"
              />
            </div>
          </div>
        </section>

        {/* RIGHT: AI Assistant */}
        <aside className="bg-[#111] border border-[#222] rounded-xl p-6 h-fit">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold">Asistente de IA</h3>
            {aiLoading ? <span className="text-xs text-gray-400">Pensando…</span> : null}
          </div>

          {aiError ? (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              {aiError}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => callAi('suggest_title')}
              disabled={aiLoading || !content.trim()}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm font-medium hover:border-purple-500 transition disabled:opacity-50"
            >
              Sugerir título
            </button>
            <button
              onClick={() => callAi('suggest_tags')}
              disabled={aiLoading || !content.trim()}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm font-medium hover:border-purple-500 transition disabled:opacity-50"
            >
              Sugerir tags
            </button>
          </div>

          {titleSuggestions.length ? (
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3">Sugerencias de título</p>
              <div className="space-y-2">
                {titleSuggestions.map((t, idx) => (
                  <button
                    key={`${t}-${idx}`}
                    onClick={() => setTitle(t)}
                    className="w-full text-left bg-[#0f0f0f] border border-[#222] rounded-lg px-4 py-3 text-sm hover:border-purple-500 transition"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {tagSuggestions.length ? (
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3">Tags sugeridos</p>
              <div className="flex flex-wrap gap-2">
                {tagSuggestions.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="text-xs bg-gray-500/10 text-gray-300 border border-gray-500/20 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-[#222] pt-6">
            <h4 className="text-sm font-semibold mb-2">Mejorar texto</h4>
            <p className="text-xs text-gray-500 mb-4">
              Seleccioná un párrafo y elegí cómo mejorarlo
            </p>

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => callAi('formal')}
                disabled={aiLoading || !getSelectedText().trim()}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm hover:border-purple-500 transition disabled:opacity-50"
              >
                Más formal
              </button>
              <button
                onClick={() => callAi('dynamic')}
                disabled={aiLoading || !getSelectedText().trim()}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm hover:border-purple-500 transition disabled:opacity-50"
              >
                Más dinámico
              </button>
              <button
                onClick={() => callAi('clear')}
                disabled={aiLoading || !getSelectedText().trim()}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm hover:border-purple-500 transition disabled:opacity-50"
              >
                Más claro
              </button>
              <button
                onClick={() => callAi('expand')}
                disabled={aiLoading || !getSelectedText().trim()}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm hover:border-purple-500 transition disabled:opacity-50"
              >
                Expandir idea
              </button>
            </div>

            <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Resultado</p>
              <div className="text-sm text-gray-200 whitespace-pre-wrap min-h-[120px]">
                {aiResult || (
                  <span className="text-gray-500">
                    Acá va a aparecer la versión mejorada del texto.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleReplaceSelection}
                  disabled={!aiResult.trim() || !selectedRange}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-sm font-medium hover:border-purple-500 transition disabled:opacity-50"
                >
                  Reemplazar selección
                </button>
                <button
                  onClick={() => handleCopy(aiResult)}
                  disabled={!aiResult.trim()}
                  className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-sm font-medium hover:border-purple-500 transition disabled:opacity-50"
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

