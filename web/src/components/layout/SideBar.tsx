const SESSION_DATA = [
  {
    id: 'session-1',
    title: 'Session 1 · Intro to Sui & Move',
    summary: 'Design the Swimmer NFT and mint your first swimmer.',
    lessons: [
      { lessonNumber: 1, title: 'Lesson 1 · Swimmer struct basics' },
      { lessonNumber: 2, title: 'Lesson 2 · mint_swimmer function' },
      { lessonNumber: 3, title: 'Lesson 3 · Lazy progress updates' },
    ],
  },
  {
    id: 'session-2',
    title: 'Session 2 · PTB & item interactions',
    summary: 'Create TunaCan items and coordinate them with Programmable Transaction Blocks.',
    lessons: [
      { lessonNumber: 4, title: 'Lesson 4 · TunaCan struct & mint_tuna' },
      { lessonNumber: 5, title: 'Lesson 5 · eat_tuna PTB flow' },
    ],
  },
];

interface SidebarProps {
  showHeader?: boolean;
}

export function Sidebar({ showHeader = true }: SidebarProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Sui-mmers Course Guide</p>
          <h2 className="mt-1 text-base font-bold text-gray-900">Session Roadmap</h2>
        </div>
      )}
      <nav aria-label="Sui-mmers course outline" className="space-y-4">
        {SESSION_DATA.map((session) => (
          <section key={session.id} className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{session.title}</h3>
              <p className="text-xs text-gray-500">{session.summary}</p>
            </div>
            <ol className="space-y-2 border-l border-gray-200 pl-4 text-sm text-gray-700">
              {session.lessons.map((lesson) => (
                <li key={lesson.lessonNumber} className="flex gap-2">
                  <span className="text-xs font-medium text-gray-400">
                    {lesson.lessonNumber.toString().padStart(2, '0')}
                  </span>
                  <span className="flex-1 leading-5">{lesson.title}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </nav>
    </div>
  );
}
