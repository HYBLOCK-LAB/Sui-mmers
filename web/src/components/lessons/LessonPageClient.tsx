'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/CodeEditor';
import { LessonDescription } from '@/components/LessonDescription';
import { getLessonRoute } from '@/lib/lessons';
import { useLessonNavigation } from '@/components/layout/LearningLayout';

interface LessonPageClientProps {
  lessonSlug: string;
  lessonTitle: string;
  chapterSlug: string;
  chapterTitle: string;
  chapterSummary: string;
  markdown: string;
  codeTemplate?: string;
  nextLessonSlug?: string;
  nextChapterSlug?: string;
  nextChapterTitle?: string;
}

export function LessonPageClient({
  lessonSlug,
  lessonTitle,
  chapterSlug,
  chapterTitle,
  chapterSummary,
  markdown,
  codeTemplate,
  nextLessonSlug,
  nextChapterSlug,
  nextChapterTitle,
}: LessonPageClientProps) {
  const { setActive } = useLessonNavigation();

  useEffect(() => {
    setActive(lessonSlug, chapterSlug);
    return () => setActive(undefined, undefined);
  }, [lessonSlug, chapterSlug, setActive]);

  const nextHref = nextLessonSlug && nextChapterSlug ? getLessonRoute(nextLessonSlug, nextChapterSlug) : null;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{lessonTitle}</p>
        <h1 className="text-3xl font-bold text-gray-900">{chapterTitle}</h1>
        <p className="text-sm text-gray-600">{chapterSummary}</p>
      </div>

      {codeTemplate ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <LessonDescription markdown={markdown} className="h-full" />
          <CodeEditor codeTemplate={codeTemplate} />
        </div>
      ) : (
        <LessonDescription markdown={markdown} />
      )}

      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <Button variant="ghost" asChild>
          <Link href="/lessons">All lessons</Link>
        </Button>
        {nextHref ? (
          <Button asChild>
            <Link href={nextHref}>Next: {nextChapterTitle ?? 'Continue'} </Link>
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link href="/gameplay">Head to the gameplay console</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
