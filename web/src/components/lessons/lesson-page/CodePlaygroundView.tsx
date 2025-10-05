'use client';

import type { ComponentProps } from 'react';
import { LessonDescription } from '@/components/LessonDescription';
import { CodeEditor } from '@/components/CodeEditor';

interface TCodePlaygroundViewProps extends ComponentProps<typeof CodeEditor> {
  markdown: string;
}

export function CodePlaygroundView({ markdown, ...codeEditorProps }: TCodePlaygroundViewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
      <LessonDescription markdown={markdown} className="h-full" />
      <CodeEditor {...codeEditorProps} />
    </div>
  );
}
