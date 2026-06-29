'use client'

import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ArrowLeft, Lock, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app'
import { toast } from 'sonner'

export function AdminLogin() {
  const { goHome, setAdminLoggedIn, setView } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const message = data.message || 'Login failed'
        setError(message)
        return
      }

      setAdminLoggedIn(true)
      setView('admin-dashboard')
      toast.success('Login successful! Welcome, Admin.')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-black/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2">
              <div className="bg-orange-500 p-2 rounded-xl">
                <Play className="size-5 text-white fill-white" />
              </div>
              <span className="text-orange-500 font-bold text-xl">YouFet</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-lg px-3.5 py-2.5">
                    <AlertCircle className="size-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Username
              </label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError('') }}
                disabled={loading}
                className={`bg-gray-800 text-white placeholder:text-gray-500 h-11 focus-visible:ring-orange-500/30 ${
                  error
                    ? 'border-red-500 focus-visible:border-red-500'
                    : 'border-gray-700 focus-visible:border-orange-500'
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  disabled={loading}
                  className={`bg-gray-800 text-white placeholder:text-gray-500 h-11 pl-10 focus-visible:ring-orange-500/30 ${
                    error
                      ? 'border-red-500 focus-visible:border-red-500'
                      : 'border-gray-700 focus-visible:border-orange-500'
                  }`}
                />
              </div>
            </div>

            <motion.div
              key={error || 'submit'}
              animate={error ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base transition-all"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <button
              onClick={goHome}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              Back to Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
