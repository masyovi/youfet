'use client'

import { Play } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-800 bg-black/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-1 rounded-md">
              <Play className="size-3 text-white fill-white" />
            </div>
            <span className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} YouFet. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="hover:text-orange-400 transition-colors cursor-pointer">
              About
            </span>
            <span className="hover:text-orange-400 transition-colors cursor-pointer">
              Privacy
            </span>
            <span className="hover:text-orange-400 transition-colors cursor-pointer">
              Contact
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
