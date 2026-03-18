'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@/types'
import Link from 'next/link'

type PostRow = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'pending' | 'published'
  created_at: string
  authorEmail: string
  authorId: string
}

type Tab = 'all' | 'published' | 'pending' | 'draft'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function statusBadge(status: PostRow['status']) {
  switch (status) {
    case 'published':
      return 'bg-green-500/10 text-green-300 border border-green-500/20'
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
    case 'draft':
    default:
      return 'bg-gray-500/10 text-gray-300 border border-gray-500/20'
  }
}

function statusLabel(status: PostRow['status']) {
  switch (status) {
    case 'published':
      return 'Publicado'
    case 'pending':
      return 'Pendiente'
    case 'draft':
    default:
      return 'Borrador'
  }
}

export default function PostsManagement({
  role,
  posts,
}: {
  role: Role
  posts: PostRow[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [postsState, setPosts] = useState<PostRow[]>(posts)

  const canModerate = role === 'admin' || role === 'editor'

  const filtered = useMemo(() => {
    if (tab === 'all') return postsState
    return postsState.filter((p) => p.status === tab)
  }, [postsState, tab])

  const patchStatus = async (id: string, status: PostRow['status']) => {
    setBusy((s) => ({ ...s, [id]: true }))
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        console.error('No se pudo actualizar el post')
        return
      }
      router.refresh()
    } finally {
      setBusy((s) => ({ ...s, [id]: false }))
    }
  }

  const deletePost = async (id: string) => {
    if (!window.confirm('¿Eliminar este post? Esta acción no se puede deshacer.')) {
      return
    }

    setBusy((s) => ({ ...s, [id]: true }))
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        console.error('No se pudo eliminar el post')
        return
      }
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setBusy((s) => ({ ...s, [id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="h-16 border-b border-[#222] flex items-center justify-between px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Inkwell
        </h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-white transition"
        >
          ← Volver al dashboard
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold">Gestión de posts</h2>
          <Link
            href="/dashboard/posts/new"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium transition"
          >
            Escribir nuevo post
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton tabId="all" active={tab === 'all'} onClick={() => setTab('all')}>
            Todos ({postsState.length})
          </TabButton>
          <TabButton
            tabId="published"
            active={tab === 'published'}
            onClick={() => setTab('published')}
          >
            Publicados (
            {postsState.filter((p) => p.status === 'published').length})
          </TabButton>
          <TabButton
            tabId="pending"
            active={tab === 'pending'}
            onClick={() => setTab('pending')}
          >
            Pendientes ({postsState.filter((p) => p.status === 'pending').length})
          </TabButton>
          <TabButton
            tabId="draft"
            active={tab === 'draft'}
            onClick={() => setTab('draft')}
          >
            Borradores ({postsState.filter((p) => p.status === 'draft').length})
          </TabButton>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-500">No hay posts para mostrar.</p>
        ) : (
          <div className="overflow-x-auto border border-[#222] rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-[#111] border-b border-[#222]">
                <tr className="text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">Título</th>
                  <th className="px-4 py-3 font-medium">Autor</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {filtered.map((p) => (
                  <tr key={p.id} className="bg-[#0d0d0d]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{p.title}</div>
                      <div className="text-xs text-gray-500">{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{p.authorEmail}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadge(
                          p.status
                        )}`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {canModerate && p.status !== 'published' && (
                          <button
                            onClick={() => patchStatus(p.id, 'published')}
                            disabled={!!busy[p.id]}
                            className="px-3 py-2 rounded-lg text-xs font-medium bg-green-600/15 text-green-300 border border-green-600/30 hover:bg-green-600/25 transition disabled:opacity-50"
                          >
                            Publicar
                          </button>
                        )}
                        {canModerate && p.status === 'published' && (
                          <button
                            onClick={() => patchStatus(p.id, 'draft')}
                            disabled={!!busy[p.id]}
                            className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-500/10 text-gray-200 border border-gray-500/20 hover:bg-gray-500/20 transition disabled:opacity-50"
                          >
                            Despublicar
                          </button>
                        )}

                        <button
                          onClick={() => router.push(`/dashboard/posts/${p.id}/edit`)}
                          className="px-3 py-2 rounded-lg text-xs font-medium bg-[#111] text-gray-200 border border-[#222] hover:border-purple-500/40 transition"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => deletePost(p.id)}
                          disabled={!!busy[p.id]}
                          className="px-3 py-2 rounded-lg text-xs font-medium bg-red-600/15 text-red-300 border border-red-600/30 hover:bg-red-600/25 transition disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  tabId: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
        active
          ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
          : 'bg-[#111] text-gray-300 border-[#222] hover:border-purple-500/40'
      }`}
    >
      {children}
    </button>
  )
}

