'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Role } from '@/types'

type UserRow = {
  id: string
  userId: string
  email: string
  role: Role
  createdAt: string
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function roleLabel(role: Role) {
  switch (role) {
    case 'admin':
      return 'Administrador'
    case 'editor':
      return 'Editor'
    case 'autor':
      return 'Autor'
    case 'lector':
      return 'Lector'
    default:
      return role
  }
}

function roleBadge(role: Role) {
  switch (role) {
    case 'admin':
      return 'bg-red-500/10 text-red-300 border border-red-500/30'
    case 'editor':
      return 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
    case 'autor':
      return 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
    case 'lector':
    default:
      return 'bg-gray-500/10 text-gray-300 border border-gray-500/30'
  }
}

export default function UsersManagement({
  currentUserId,
  users,
}: {
  currentUserId: string
  users: UserRow[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [roles, setRoles] = useState<Record<string, Role>>(
    () =>
      users.reduce(
        (acc, u) => {
          acc[u.id] = u.role
          return acc
        },
        {} as Record<string, Role>
      ) || {}
  )

  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((u) => u.role === 'admin').length
    const editors = users.filter((u) => u.role === 'editor').length
    const autores = users.filter((u) => u.role === 'autor').length
    const lectores = users.filter((u) => u.role === 'lector').length
    return { total, admins, editors, autores, lectores }
  }, [users])

  const handleSaveRole = async (user: UserRow) => {
    const newRole = roles[user.id]
    if (!newRole || newRole === user.role) return

    setSaving((s) => ({ ...s, [user.id]: true }))
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        console.error('No se pudo actualizar el rol')
        return
      }
      router.refresh()
    } finally {
      setSaving((s) => ({ ...s, [user.id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="h-16 border-b border-[#222] flex items-center justify-between px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Inkwell
        </h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          ← Volver al dashboard
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Gestión de usuarios</h2>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <Stat label="Usuarios" value={stats.total} />
          <Stat label="Admins" value={stats.admins} />
          <Stat label="Editores" value={stats.editors} />
          <Stat label="Autores" value={stats.autores} />
          <Stat label="Lectores" value={stats.lectores} />
        </section>

        {users.length === 0 ? (
          <p className="text-sm text-gray-500">No hay usuarios para mostrar.</p>
        ) : (
          <div className="overflow-x-auto border border-[#222] rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-[#111] border-b border-[#222]">
                <tr className="text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Se unió</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {users.map((u) => {
                  const isSelf = u.userId === currentUserId
                  return (
                    <tr key={u.id} className="bg-[#0d0d0d]">
                      <td className="px-4 py-3 text-gray-200">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${roleBadge(
                            u.role
                          )}`}
                        >
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={roles[u.id] || u.role}
                            onChange={(e) =>
                              setRoles((prev) => ({
                                ...prev,
                                [u.id]: e.target.value as Role,
                              }))
                            }
                            disabled={isSelf || !!saving[u.id]}
                            className="bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-xs outline-none focus:border-purple-500 transition text-gray-200 disabled:opacity-50"
                          >
                            <option value="admin">Administrador</option>
                            <option value="editor">Editor</option>
                            <option value="autor">Autor</option>
                            <option value="lector">Lector</option>
                          </select>
                          <button
                            onClick={() => handleSaveRole(u)}
                            disabled={isSelf || !!saving[u.id]}
                            className="px-3 py-2 rounded-lg text-xs font-medium bg-purple-600/80 hover:bg-purple-500 disabled:opacity-50"
                          >
                            Guardar
                          </button>
                          {isSelf && (
                            <span className="text-[10px] text-gray-500">
                              No podés cambiar tu propio rol.
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-semibold text-white">{value}</p>
    </div>
  )
}

