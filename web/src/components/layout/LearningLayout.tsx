'use client';

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface LearningLayoutProps {
  hero: ReactNode
  children: ReactNode
  footer?: ReactNode
  sidebar: ReactNode
  sidebarHeader?: ReactNode
  overlayTitle?: string
  overlayDescription?: string
  isSidebarOpen: boolean
  onSidebarClose: () => void
}

export function LearningLayout({
  hero,
  children,
  footer,
  sidebar,
  sidebarHeader,
  overlayTitle,
  overlayDescription,
  isSidebarOpen,
  onSidebarClose,
}: LearningLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {hero}

      <main className="container mx-auto px-4 py-12">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="space-y-6">
                {sidebarHeader}
                <nav aria-label={overlayTitle ?? 'Sidebar outline'} className="space-y-4">
                  {sidebar}
                </nav>
              </div>
            </div>
          </aside>

          <div className="space-y-12">
            {children}
          </div>
        </div>
      </main>

      {footer}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm py-16 px-4 lg:hidden"
          onClick={onSidebarClose}
        >
          <div
            className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                {overlayTitle && <h3 className="text-lg font-semibold text-gray-900">{overlayTitle}</h3>}
                {overlayDescription && (
                  <p className="mt-1 text-sm text-gray-600">{overlayDescription}</p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={onSidebarClose}>
                닫기
              </Button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <nav aria-label={overlayTitle ?? 'Sidebar outline'} className="space-y-4">
                {sidebar}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
