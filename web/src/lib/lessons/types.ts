export interface LessonChapter {
  slug: string
  title: string
  summary: string
  markdown: string
  codeTemplate?: string
}

export interface LessonDefinition {
  slug: string
  title: string
  summary: string
  chapters: LessonChapter[]
}
