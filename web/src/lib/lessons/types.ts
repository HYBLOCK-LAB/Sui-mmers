export interface LessonChapter {
  slug: string;
  title: string;
  summary: string;
  markdown: string;
  readonly: boolean;
  codeTemplate?: string;
  codeSkeletone?: string;
}

export interface LessonDefinition {
  slug: string;
  title: string;
  summary: string;
  chapters: LessonChapter[];
}
