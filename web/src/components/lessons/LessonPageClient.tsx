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
  codeSkeletone?: string;
  readOnly?: boolean;
  nextLessonSlug?: string;
  nextChapterSlug?: string;
  nextChapterTitle?: string;
  previousLessonSlug?: string;
  previousChapterSlug?: string;
  previousChapterTitle?: string;
}

export function LessonPageClient({
  lessonSlug,
  lessonTitle,
  chapterSlug,
  chapterTitle,
  chapterSummary,
  markdown,
  codeTemplate,
  codeSkeletone,
  readOnly,
  nextLessonSlug,
  nextChapterSlug,
  nextChapterTitle,
  previousLessonSlug,
  previousChapterSlug,
  previousChapterTitle,
}: LessonPageClientProps) {
  const { setActive } = useLessonNavigation();

  useEffect(() => {
    setActive(lessonSlug, chapterSlug);
    return () => setActive(undefined, undefined);
  }, [lessonSlug, chapterSlug, setActive]);

  const nextHref = nextLessonSlug && nextChapterSlug ? getLessonRoute(nextLessonSlug, nextChapterSlug) : null;
  const previousHref =
    previousLessonSlug && previousChapterSlug ? getLessonRoute(previousLessonSlug, previousChapterSlug) : null;

  const showEditor = Boolean(codeTemplate);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{lessonTitle}</p>
        <h1 className="text-3xl font-bold text-gray-900">{chapterTitle}</h1>
        <p className="text-sm text-gray-600">{chapterSummary}</p>
      </div>

      {showEditor ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <LessonDescription markdown={markdown} className="h-full" />
          <CodeEditor codeTemplate={codeTemplate} codeSkeletone={codeSkeletone} readOnly={readOnly} />
        </div>
      ) : (
        <LessonDescription markdown={markdown} />
      )}

      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        {/* <Button variant="ghost" asChild>
          <Link href="/lessons">All lessons</Link>
        </Button> */}
        {previousHref ? (
          <Button asChild>
            <Link href={previousHref}>Previous: {previousChapterTitle ?? 'Continue'} </Link>
          </Button>
        ) : (
          <div />
        )}
        <Button asChild variant="secondary">
          <Link href="/gameplay">Head to the gameplay console</Link>
        </Button>
        {nextHref ? (
          <Button asChild>
            <Link href={nextHref}>Next: {nextChapterTitle ?? 'Continue'} </Link>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
