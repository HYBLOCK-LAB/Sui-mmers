import Link from 'next/link';
import { LESSONS, getLessonRoute } from '@/lib/lessons';

interface SidebarProps {
  showHeader?: boolean;
  activeLessonSlug?: string;
  activeChapterSlug?: string;
  onNavigate?: () => void;
}

export function Sidebar({ showHeader = true, activeLessonSlug, activeChapterSlug, onNavigate }: SidebarProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Sui-mmers Course Guide</p>
          <h2 className="mt-1 text-base font-bold text-gray-900">Session Roadmap</h2>
        </div>
      )}
      <nav aria-label="Sui-mmers course outline" className="space-y-4">
        {LESSONS.map((lesson, lessonIndex) => (
          <section key={lesson.slug} className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{lesson.title}</h3>
              <p className="text-xs text-gray-500">{lesson.summary}</p>
            </div>
            <ol className="space-y-2 border-l border-gray-200 pl-4 text-sm text-gray-700">
              {lesson.chapters.map((chapter, chapterIndex) => {
                const href = getLessonRoute(lesson.slug, chapter.slug);
                const isActive = lesson.slug === activeLessonSlug && chapter.slug === activeChapterSlug;

                return (
                  <li key={chapter.slug}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={`flex items-start gap-2 rounded-md px-2 py-1 transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex-1 leading-5">{chapter.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </nav>
    </div>
  );
}
