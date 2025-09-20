import { lessonsData } from '@/lib/lessons/data';
import type { LessonDefinition, LessonChapter } from '@/lib/lessons/types';

export type { LessonDefinition, LessonChapter };

export const LESSONS: LessonDefinition[] = lessonsData;

export function getLesson(slug: string): LessonDefinition | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
}

export function getChapter(
  lessonSlug: string,
  chapterSlug: string
):
  | {
      lesson: LessonDefinition;
      chapter: LessonChapter;
      chapterIndex: number;
      lessonIndex: number;
    }
  | undefined {
  const lessonIndex = LESSONS.findIndex((lesson) => lesson.slug === lessonSlug);
  if (lessonIndex === -1) return undefined;
  const lesson = LESSONS[lessonIndex];
  const chapterIndex = lesson.chapters.findIndex((chapter) => chapter.slug === chapterSlug);
  if (chapterIndex === -1) return undefined;
  return { lesson, chapter: lesson.chapters[chapterIndex], chapterIndex, lessonIndex };
}

export function getNextChapter(
  lessonSlug: string,
  chapterSlug: string
): { lesson: LessonDefinition; chapter: LessonChapter } | null {
  const current = getChapter(lessonSlug, chapterSlug);
  if (!current) return null;
  const { lesson, chapterIndex, lessonIndex } = current;

  if (chapterIndex + 1 < lesson.chapters.length) {
    return { lesson, chapter: lesson.chapters[chapterIndex + 1] };
  }

  const nextLesson = LESSONS[lessonIndex + 1];
  if (!nextLesson || nextLesson.chapters.length === 0) {
    return null;
  }

  return { lesson: nextLesson, chapter: nextLesson.chapters[0] };
}

export function getPreviousChapter(
  lessonSlug: string,
  chapterSlug: string
): { lesson: LessonDefinition; chapter: LessonChapter } | null {
  const current = getChapter(lessonSlug, chapterSlug);
  if (!current) return null;

  const { lesson, chapterIndex, lessonIndex } = current;
  if (chapterIndex > 0) {
    return { lesson, chapter: lesson.chapters[chapterIndex - 1] };
  }

  const previousLesson = LESSONS[lessonIndex - 1];

  if (!previousLesson || previousLesson.chapters.length === 0) {
    return null;
  }

  const lastChapterOfPreviousLesson = previousLesson.chapters[previousLesson.chapters.length - 1];

  return { lesson: previousLesson, chapter: lastChapterOfPreviousLesson };
}

export function getLessonRoute(lessonSlug: string, chapterSlug: string): string {
  return `/lessons/${lessonSlug}/${chapterSlug}`;
}

export function getAllLessonRoutes(): { lessonSlug: string; chapterSlug: string }[] {
  return LESSONS.flatMap((lesson) =>
    lesson.chapters.map((chapter) => ({ lessonSlug: lesson.slug, chapterSlug: chapter.slug }))
  );
}
