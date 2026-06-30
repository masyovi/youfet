'use client'

import { useAppStore } from '@/store/app'
import { HomePage } from '@/components/HomePage'
import { VideoPlayer } from '@/components/VideoPlayer'
import { AdminLogin } from '@/components/AdminLogin'
import { AdminDashboard } from '@/components/AdminDashboard'

function CurrentView() {
  const currentView = useAppStore((state) => state.currentView)

  if (currentView === 'watch') return <VideoPlayer />
  if (currentView === 'admin-login') return <AdminLogin />
  if (currentView === 'admin-dashboard') return <AdminDashboard />
  return <HomePage />
}

export default function Home() {
  const currentView = useAppStore((state) => state.currentView)

  return (
    <div key={currentView}>
      <CurrentView />
    </div>
  )
}
