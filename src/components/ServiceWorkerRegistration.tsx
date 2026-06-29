'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    // Skip SW registration in development to avoid stale-cache conflicts
    // with Turbopack HMR (cached JS chunks break Fast Refresh).
    if (process.env.NODE_ENV === 'development') {
      // Proactively unregister any existing SW + clear caches in dev so a
      // previously-registered production SW can't serve stale assets.
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .then(() => {
          if ('caches' in window) {
            return caches.keys().then((keys) =>
              Promise.all(keys.map((k) => caches.delete(k)))
            )
          }
        })
        .catch(() => {})
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope)
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  }, [])

  return null
}
