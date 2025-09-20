import Link from 'next/link';
import { LearningLayout } from '@/components/layout/LearningLayout';
import { LESSONS, getLessonRoute } from '@/lib/lessons';

export default function LessonsIndexPage() {
  return (
    <LearningLayout>
      <div className="space-y-12">
        <header className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">Lesson library</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse every lesson and jump into the chapter that matches your progress.
          </p>
        </header>

        <div className="flex flex-col gap-4 space-y-8">
          {LESSONS.map((lesson) => {
            const firstChapter = lesson.chapters[0];

            return (
              <section key={lesson.slug} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Lesson</p>
                    <h2 className="text-xl font-semibold text-gray-900">{lesson.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{lesson.summary}</p>
                  </div>
                  {firstChapter ? (
                    <Link
                      href={getLessonRoute(lesson.slug, firstChapter.slug)}
                      className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      Start lesson
                    </Link>
                  ) : null}
                </div>

                <ol className="mt-6 space-y-4 border-t border-gray-200 pt-4 text-sm text-gray-700">
                  {lesson.chapters.map((chapter, index) => (
                    <li
                      key={chapter.slug}
                      className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-400">Chapter {index + 1}</p>
                        <h3 className="text-base font-semibold text-gray-900">{chapter.title}</h3>
                        <p className="text-sm text-gray-600">{chapter.summary}</p>
                      </div>
                      <Link
                        href={getLessonRoute(lesson.slug, chapter.slug)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        View chapter
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      </div>
    </LearningLayout>
  );
}
