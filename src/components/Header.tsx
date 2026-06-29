'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Shield, Search, Menu, X, LogOut } from 'lucide-react'
import { useAppStore } from '@/store/app'

export function Header() {
  const router = useRouter()
  const {
    isAdminLoggedIn,
    setSearchQuery,
    setSelectedCategory,
    setView,
    goHome,
    setAdminLoggedIn,
    searchQuery,
  } = useAppStore()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSearchQuery(searchInput.trim())
    setSelectedCategory(null)
    goHome()
  }

  const handleAdminClick = () => {
    setView(isAdminLoggedIn ? 'admin-dashboard' : 'admin-login')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setAdminLoggedIn(false)
    goHome()
  }

  const handleLogoClick = () => {
    setSearchQuery('')
    setSearchInput('')
    setSelectedCategory(null)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 shrink-0 group cursor-pointer"
          >
            <div className="bg-orange-500 p-1.5 rounded-lg group-hover:bg-orange-600 transition-colors">
              <Play className="size-5 text-white fill-white" />
            </div>
            <span className="text-orange-500 font-bold text-2xl tracking-tight">
              YouFet
            </span>
          </button>

          {/* Desktop Search */}
          <form
            onSubmit={handleSearch}
            className="hidden sm:flex flex-1 max-w-xl mx-4"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all"
              />
            </div>
          </form>

          {/* Right side - Admin button + Mobile menu */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdminClick}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 transition-all text-sm font-medium cursor-pointer"
            >
              <Shield className="size-4" />
              <span className="hidden sm:inline">
                {isAdminLoggedIn ? 'Dashboard' : 'Admin'}
              </span>
            </button>

            {isAdminLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm font-medium cursor-pointer"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden flex items-center justify-center p-2 rounded-lg text-gray-300 hover:text-orange-400 hover:bg-orange-500/10 transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search - collapsed below header */}
        {mobileMenuOpen && (
          <div className="sm:hidden pb-4 animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                  className="w-full h-10 pl-10 pr-4 rounded-full bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all"
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  )
}
