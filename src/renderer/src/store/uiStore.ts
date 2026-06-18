import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'dark' | 'light'

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  toggleTheme: () => void
  setSidebarCollapsed: (v: boolean) => void
}

export function applyTheme(theme: Theme): void {
  document.body.classList.toggle('light', theme === 'light')
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      toggleTheme: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
        applyTheme(next)
      },
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v })
    }),
    {
      name: 'lmts-ui',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      }
    }
  )
)
