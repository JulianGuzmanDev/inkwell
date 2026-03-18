'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Role } from '@/types'
import { useState } from 'react'

interface DashboardClientProps {
  userEmail: string
  userName: string
  role: Role
  adminTotalPosts: number
  adminTotalUsers: number
  adminPendingPosts: number
  adminTotalComments: number
  editorPublishedPosts: number
  editorPendingPosts: number
  editorTotalComments: number
  autorMyDrafts: number
  autorMyPublished: number
  autorMyPending: number
}

export default function DashboardClient({
  userEmail,
  userName,
  role,
  adminTotalPosts,
  adminTotalUsers,
  adminPendingPosts,
  adminTotalComments,
  editorPublishedPosts,
  editorPendingPosts,
  editorTotalComments,
  autorMyDrafts,
  autorMyPublished,
  autorMyPending,
}: DashboardClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400 border border-red-500/20'
      case 'editor':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
      case 'autor':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      case 'lector':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    }
  }

  const getRoleLabel = (role: Role) => {
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Fixed Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[#222] bg-[#0a0a0a]">
        <div className="h-full flex items-center justify-between px-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Inkwell
          </h1>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm text-white/90">{userName}</span>
              <span className="text-xs text-gray-400">{userEmail}</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-screen pt-16">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Section Title with Role Badge */}
          <div className="flex items-center gap-3 mb-8">
            <h2 className="text-2xl font-bold">Panel de control</h2>
            <span
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${getRoleBadgeStyle(
                role
              )}`}
            >
              {getRoleLabel(role)}
            </span>
          </div>

          {/* Role-based Content */}
          {role === 'admin' && (
            <AdminDashboard
              totalPosts={adminTotalPosts}
              totalUsers={adminTotalUsers}
              pendingPosts={adminPendingPosts}
              totalComments={adminTotalComments}
            />
          )}
          {role === 'editor' && (
            <EditorDashboard
              publishedPosts={editorPublishedPosts}
              pendingPosts={editorPendingPosts}
              totalComments={editorTotalComments}
            />
          )}
          {role === 'autor' && (
            <AutorDashboard
              myDrafts={autorMyDrafts}
              myPublished={autorMyPublished}
              myPending={autorMyPending}
            />
          )}
          {role === 'lector' && <LectorDashboard />}
        </div>
      </main>
    </div>
  )
}

function AdminDashboard({
  totalPosts,
  totalUsers,
  pendingPosts,
  totalComments,
}: {
  totalPosts: number
  totalUsers: number
  pendingPosts: number
  totalComments: number
}) {
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Posts totales" value={totalPosts} />
        <StatCard label="Usuarios totales" value={totalUsers} />
        <StatCard label="Posts pendientes" value={pendingPosts} />
        <StatCard label="Comentarios totales" value={totalComments} />
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <QuickLink label="Gestionar usuarios" />
          <QuickLink label="Gestionar posts" />
          <QuickLink label="Moderar comentarios" />
        </div>
      </div>
    </div>
  )
}

function EditorDashboard({
  publishedPosts,
  pendingPosts,
  totalComments,
}: {
  publishedPosts: number
  pendingPosts: number
  totalComments: number
}) {
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Posts publicados" value={publishedPosts} />
        <StatCard label="Posts pendientes" value={pendingPosts} />
        <StatCard label="Comentarios" value={totalComments} />
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <QuickLink label="Ver posts pendientes" />
          <QuickLink label="Escribir nuevo post" />
          <QuickLink label="Moderar comentarios" />
        </div>
      </div>
    </div>
  )
}

function AutorDashboard({
  myDrafts,
  myPublished,
  myPending,
}: {
  myDrafts: number
  myPublished: number
  myPending: number
}) {
  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Mis borradores" value={myDrafts} />
        <StatCard label="Mis posts publicados" value={myPublished} />
        <StatCard label="Posts pendientes" value={myPending} />
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Acciones rápidas</h3>
        <div className="flex flex-wrap gap-3">
          <QuickLink label="Escribir nuevo post" />
          <QuickLink label="Mis posts" />
        </div>
      </div>
    </div>
  )
}

function LectorDashboard() {
  return (
    <div>
      <div className="max-w-md">
        <h3 className="text-lg font-semibold mb-2">Bienvenido a Inkwell</h3>
        <p className="text-gray-400 text-sm mb-6">
          Gracias por ser parte de nuestra comunidad de lectores
        </p>

        <div className="flex flex-wrap gap-3">
          <QuickLink label="Ver posts publicados" />
        </div>

        <p className="text-gray-500 text-xs mt-6">
          Contactá al admin para obtener rol de autor
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl p-6">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function QuickLink({ label }: { label: string }) {
  return (
    <a
      href="#"
      className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm font-medium hover:border-purple-500 transition"
    >
      {label}
    </a>
  )
}
