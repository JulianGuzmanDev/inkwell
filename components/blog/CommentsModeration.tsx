'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@/types'

type ModerationComment = {
  id: string
  content: string
  created_at: string
  approved: boolean
  rejected: boolean
  userEmail: string
  postTitle: string
  postSlug: string
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export default function CommentsModeration({
  role,
  comments,
}: {
  role: Role
  comments: ModerationComment[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({})

  const pending = useMemo(
    () => comments.filter((c) => !c.approved && !c.rejected),
    [comments]
  )
  const approved = useMemo(
    () => comments.filter((c) => c.approved),
    [comments]
  )
  const rejected = useMemo(
    () => comments.filter((c) => c.rejected),
    [comments]
  )

  const patchComment = async (
    id: string,
    patch: { approved?: boolean; rejected?: boolean }
  ) => {
    setIsUpdating((s) => ({ ...s, [id]: true }))
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })

      if (!res.ok) {
        console.error('No se pudo actualizar el comentario')
        return
      }

      router.refresh()
    } finally {
      setIsUpdating((s) => ({ ...s, [id]: false }))
    }
  }

  const list =
    tab === 'pending' ? pending : tab === 'approved' ? approved : rejected

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="h-16 border-b border-[#222] flex items-center justify-between px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Inkwell
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500 hidden sm:inline">
            {role === 'admin' ? 'Administrador' : 'Editor'}
          </span>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition"
          >
            ← Volver al dashboard
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Moderación de comentarios</h2>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              tab === 'pending'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-[#111] text-gray-300 border-[#222] hover:border-purple-500/40'
            }`}
          >
            Pendientes ({pending.length})
          </button>
          <button
            onClick={() => setTab('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              tab === 'approved'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-[#111] text-gray-300 border-[#222] hover:border-purple-500/40'
            }`}
          >
            Aprobados ({approved.length})
          </button>
          <button
            onClick={() => setTab('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
              tab === 'rejected'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                : 'bg-[#111] text-gray-300 border-[#222] hover:border-purple-500/40'
            }`}
          >
            Rechazados ({rejected.length})
          </button>
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-gray-500">
            {tab === 'pending'
              ? 'No hay comentarios pendientes.'
              : tab === 'approved'
                ? 'No hay comentarios aprobados.'
                : 'No hay comentarios rechazados.'}
          </p>
        ) : (
          <div className="space-y-4">
            {list.map((c) => (
              <div
                key={c.id}
                className="bg-[#111] border border-[#222] rounded-xl p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="text-sm text-gray-300">{c.userEmail}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(c.created_at)}
                  </div>
                </div>

                <div className="text-sm mb-3">
                  <span className="text-gray-500">En </span>
                  {c.postSlug ? (
                    <Link
                      href={`/post/${c.postSlug}`}
                      className="text-purple-300 hover:text-purple-200 underline underline-offset-4"
                    >
                      {c.postTitle}
                    </Link>
                  ) : (
                    <span className="text-gray-300">{c.postTitle}</span>
                  )}
                </div>

                <p className="text-sm text-gray-200 whitespace-pre-wrap mb-4">
                  {c.content}
                </p>

                <div className="flex flex-wrap gap-2">
                  {tab === 'pending' ? (
                    <>
                      <button
                        onClick={() =>
                          patchComment(c.id, { approved: true, rejected: false })
                        }
                        disabled={!!isUpdating[c.id]}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600/15 text-green-300 border border-green-600/30 hover:bg-green-600/25 transition disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() =>
                          patchComment(c.id, { approved: false, rejected: true })
                        }
                        disabled={!!isUpdating[c.id]}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600/15 text-red-300 border border-red-600/30 hover:bg-red-600/25 transition disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </>
                  ) : tab === 'approved' ? (
                    <button
                      onClick={() =>
                        patchComment(c.id, {
                          approved: false,
                          rejected: false,
                        })
                      }
                      disabled={!!isUpdating[c.id]}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-500/10 text-gray-300 border border-gray-500/20 hover:bg-gray-500/20 transition disabled:opacity-50"
                    >
                      Desaprobar
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

