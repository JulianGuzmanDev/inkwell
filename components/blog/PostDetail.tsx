'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Comment {
  id: string
  content: string
  created_at: string
  author_email: string
}

interface PostDetailProps {
  post: {
    id: string
    title: string
    content: string
    created_at: string
  }
  author: {
    name: string | null
    email: string
  }
  comments: Comment[]
  isAuthenticated: boolean
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export default function PostDetail({
  post,
  author,
  comments,
  isAuthenticated,
}: PostDetailProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localComments, setLocalComments] = useState<Comment[]>(comments)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: post.id,
          content: trimmed,
        }),
      })

      if (!res.ok) {
        console.error('Error al crear comentario')
        return
      }

      setContent('')
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <main className="max-w-3xl mx-auto px-6 py-10">
        <article className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          <div className="text-sm text-gray-400 mb-6">
            <span>
              Por {author.name || author.email} · {formatDate(post.created_at)}
            </span>
          </div>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
            {post.content}
          </div>
        </article>

        <section className="border-t border-[#222] pt-8">
          <h2 className="text-xl font-semibold mb-4">Comentarios</h2>

          {/* Lista de comentarios */}
          {localComments.length === 0 ? (
            <p className="text-sm text-gray-500 mb-6">
              No hay comentarios todavía.
            </p>
          ) : (
            <ul className="space-y-4 mb-6">
              {localComments.map((comment) => (
                <li
                  key={comment.id}
                  className="bg-[#111] border border-[#222] rounded-lg p-4"
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {comment.author_email} · {formatDate(comment.created_at)}
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Formulario de comentario */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                className="w-full bg-[#111] border border-[#333] rounded-lg p-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                rows={4}
                placeholder="Escribí tu comentario..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Comentar'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-400">
              Iniciá sesión para comentar.
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

