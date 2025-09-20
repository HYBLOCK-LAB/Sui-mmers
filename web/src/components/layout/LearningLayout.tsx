'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { Sidebar } from './SideBar'

interface SidebarContextValue {
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  toggleSidebar: () => void
  activeLessonSlug?: string
  activeChapterSlug?: string
  setActive: (lessonSlug?: string, chapterSlug?: string) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a LearningLayout')
  }
  return context
}

export function useLessonNavigation() {
  const context = useSidebar()
  const setActive = useCallback(
    (lessonSlug?: string, chapterSlug?: string) => {
      context.setActive(lessonSlug, chapterSlug)
    },
    [context]
  )

  return {
    activeLessonSlug: context.activeLessonSlug,
    activeChapterSlug: context.activeChapterSlug,
    setActive,
  }
}

export function LearningLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeLessonSlug, setActiveLessonSlug] = useState<string | undefined>()
  const [activeChapterSlug, setActiveChapterSlug] = useState<string | undefined>()

  const openSidebar = useCallback(() => setIsSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), [])

  const setActive = useCallback((lessonSlug?: string, chapterSlug?: string) => {
    setActiveLessonSlug(lessonSlug)
    setActiveChapterSlug(chapterSlug)
  }, [])

  const providerValue = useMemo(
    () => ({
      isSidebarOpen,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      activeLessonSlug,
      activeChapterSlug,
      setActive,
    }),
    [isSidebarOpen, openSidebar, closeSidebar, toggleSidebar, activeLessonSlug, activeChapterSlug, setActive]
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('overflow-hidden')
      if (isSidebarOpen) {
        document.documentElement.classList.add('overflow-hidden')
      }
      return () => document.documentElement.classList.remove('overflow-hidden')
    }
  }, [isSidebarOpen])

  return (
    <SidebarContext.Provider value={providerValue}>
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-12 lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Sidebar
                showHeader
                activeLessonSlug={activeLessonSlug}
                activeChapterSlug={activeChapterSlug}
                onNavigate={closeSidebar}
              />
            </div>
          </aside>

          <div>{children}</div>
        </div>

        <MobileSidebar />
      </div>
    </SidebarContext.Provider>
  )
}

function MobileSidebar() {
  const { isSidebarOpen, closeSidebar, activeLessonSlug, activeChapterSlug } = useSidebar()

  if (!isSidebarOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm py-16 px-4 lg:hidden"
      onClick={closeSidebar}
    >
      <div
        className="max-w-lg w-full bg-white/90 rounded-2xl shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Sui-mmers Course Guide</p>
            <p className="mt-1 text-sm text-gray-600">Follow the session roadmap to keep your Move & Sui study on track.</p>
          </div>
          <Button variant="outline" size="sm" onClick={closeSidebar}>
            Close
          </Button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <Sidebar
            showHeader={false}
            activeLessonSlug={activeLessonSlug}
            activeChapterSlug={activeChapterSlug}
            onNavigate={closeSidebar}
          />
        </div>
      </div>
    </div>
  )
}
