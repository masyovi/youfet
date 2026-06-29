import { create } from 'zustand'

export type AppView = 'home' | 'watch' | 'admin-login' | 'admin-dashboard'

interface AppState {
  currentView: AppView
  selectedVideoId: string | null
  selectedCategoryId: string | null
  isAdminLoggedIn: boolean
  searchQuery: string

  setView: (view: AppView) => void
  setSelectedVideo: (videoId: string) => void
  setSelectedCategory: (categoryId: string | null) => void
  setAdminLoggedIn: (loggedIn: boolean) => void
  setSearchQuery: (query: string) => void
  goHome: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'home',
  selectedVideoId: null,
  selectedCategoryId: null,
  isAdminLoggedIn: false,
  searchQuery: '',

  setView: (view) => set({ currentView: view }),
  setSelectedVideo: (videoId) => set({ selectedVideoId: videoId, currentView: 'watch' }),
  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
  setAdminLoggedIn: (loggedIn) => set({ isAdminLoggedIn: loggedIn }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  goHome: () => set({ currentView: 'home', selectedVideoId: null }),
}))
