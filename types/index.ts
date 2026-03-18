export type Role = 'admin' | 'editor' | 'autor' | 'lector'

export interface Profile {
  id: string
  user_id: string
  role: Role
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  title: string
  slug: string
  content: string
  status: 'draft' | 'pending' | 'published'
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  approved: boolean
  created_at: string
}