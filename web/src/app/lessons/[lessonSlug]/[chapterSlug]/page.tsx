import { notFound } from 'next/navigation';
import { LearningLayout } from '@/components/layout/LearningLayout';
import { LessonPageClient } from '@/components/lessons/LessonPageClient';
import { LESSONS, getChapter, getNextChapter } from '@/lib/lessons';

interface LessonChapterPageProps {
  params: Promise<{ lessonSlug: string; chapterSlug: string }>;
}

export default async function LessonChapterPage({ params }: LessonChapterPageProps) {
  const { lessonSlug, chapterSlug } = await params;
  const chapterInfo = getChapter(lessonSlug, chapterSlug);

  if (!chapterInfo) {
    notFound();
  }

  const { lesson, chapter } = chapterInfo;
  const nextChapter = getNextChapter(lessonSlug, chapterSlug);

  return (
    <LearningLayout>
      <LessonPageClient
        lessonSlug={lesson.slug}
        lessonTitle={lesson.title}
        chapterSlug={chapter.slug}
        chapterTitle={chapter.title}
        chapterSummary={chapter.summary}
        markdown={chapter.markdown}
        codeTemplate={chapter.codeTemplate}
        nextLessonSlug={nextChapter?.lesson.slug}
        nextChapterSlug={nextChapter?.chapter.slug}
        nextChapterTitle={nextChapter?.chapter.title}
      />
    </LearningLayout>
  );
}

export function generateStaticParams() {
  return LESSONS.flatMap((lesson) =>
    lesson.chapters.map((chapter) => ({
      lessonSlug: lesson.slug,
      chapterSlug: chapter.slug,
    }))
  );
}
