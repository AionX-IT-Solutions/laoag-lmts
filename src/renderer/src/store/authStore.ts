import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../types'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser) => void
  logout: () => void
  hasPrivilege: (privilege: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      hasPrivilege: (privilege) => {
        const user = get().user
        if (!user) return false
        if (user.role === 'Admin') return true
        return user.privileges.includes(privilege)
      }
    }),
    { name: 'lmts-auth' }
  )
)
