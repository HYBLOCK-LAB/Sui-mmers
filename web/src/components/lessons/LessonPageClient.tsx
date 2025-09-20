'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/CodeEditor';
import { LessonDescription } from '@/components/LessonDescription';
import { getLessonRoute } from '@/lib/lessons';
import { useLessonNavigation } from '@/components/layout/LearningLayout';
import {
  DeploymentConfigurator,
  DeploymentPreview,
  createDefaultDeploymentConfig,
} from '@/components/lessons/DeploymentConfigurator';
import type { DeploymentConfig } from '@/components/lessons/DeploymentConfigurator';

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
  isFinalChapter?: boolean;
  nextLessonSlug?: string;
  nextChapterSlug?: string;
  nextChapterTitle?: string;
  previousLessonSlug?: string;
  previousChapterSlug?: string;
  previousChapterTitle?: string;
}

type WorkspaceTab = 'code' | 'preview';

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
  isFinalChapter = false,
  nextLessonSlug,
  nextChapterSlug,
  nextChapterTitle,
  previousLessonSlug,
  previousChapterSlug,
  previousChapterTitle,
}: LessonPageClientProps) {
  const { setActive } = useLessonNavigation();
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('code');
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>(() => createDefaultDeploymentConfig());

  useEffect(() => {
    setActive(lessonSlug, chapterSlug);
    return () => setActive(undefined, undefined);
  }, [lessonSlug, chapterSlug, setActive]);

  const showEditor = Boolean(codeTemplate);
  const isDeploymentChapter = isFinalChapter && showEditor;

  useEffect(() => {
    setWorkspaceTab('code');
    if (isDeploymentChapter) {
      setDeploymentConfig(createDefaultDeploymentConfig());
    }
  }, [lessonSlug, chapterSlug, isDeploymentChapter]);

  const handleConfigChange = (updates: Partial<DeploymentConfig>) => {
    setDeploymentConfig((prev) => ({ ...prev, ...updates }));
  };

  const nextHref = nextLessonSlug && nextChapterSlug ? getLessonRoute(nextLessonSlug, nextChapterSlug) : null;
  const previousHref =
    previousLessonSlug && previousChapterSlug ? getLessonRoute(previousLessonSlug, previousChapterSlug) : null;

  const effectiveCodeSkeletone = isDeploymentChapter ? undefined : codeSkeletone;
  const effectiveReadOnly = isDeploymentChapter ? true : readOnly;

  const tabClassName = (tab: WorkspaceTab) =>
    `flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
      workspaceTab === tab
        ? 'border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm'
        : 'border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700'
    }`;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">{lessonTitle}</p>
        <h1 className="text-3xl font-bold text-gray-900">{chapterTitle}</h1>
        <p className="text-sm text-gray-600">{chapterSummary}</p>
      </div>

      {showEditor ? (
        isDeploymentChapter ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
            <DeploymentConfigurator
              markdown={markdown}
              config={deploymentConfig}
              onConfigChange={handleConfigChange}
              lessonSlug={lessonSlug}
              chapterSlug={chapterSlug}
            />
            <div className="space-y-4 self-start">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={tabClassName('code')}
                  onClick={() => setWorkspaceTab('code')}
                >
                  Code Playground
                </button>
                <button
                  type="button"
                  className={tabClassName('preview')}
                  onClick={() => setWorkspaceTab('preview')}
                >
                  Deployment Preview
                </button>
              </div>
              {workspaceTab === 'code' ? (
                <CodeEditor codeTemplate={codeTemplate} readOnly={effectiveReadOnly} />
              ) : (
                <DeploymentPreview config={deploymentConfig} lessonSlug={lessonSlug} chapterSlug={chapterSlug} />
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
            <LessonDescription markdown={markdown} className="h-full" />
            <CodeEditor codeTemplate={codeTemplate} codeSkeletone={effectiveCodeSkeletone} readOnly={effectiveReadOnly} />
          </div>
        )
      ) : (
        <LessonDescription markdown={markdown} />
      )}

      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
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
