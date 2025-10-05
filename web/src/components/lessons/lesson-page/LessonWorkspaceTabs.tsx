'use client';

interface TLessonWorkspaceTabsProps {
  activeTab: 'code' | 'preview';
  onSelect: (tab: 'code' | 'preview') => void;
}

const buildClassName = (current: 'code' | 'preview', active: 'code' | 'preview') =>
  `flex-1 rounded-md border px-3 py-2 text-sm font-medium transition ${
    current === active
      ? 'border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm'
      : 'border-transparent text-gray-500 bg-gray-100 hover:bg-gray-200 hover:text-gray-700'
  }`;

export function LessonWorkspaceTabs({ activeTab, onSelect }: TLessonWorkspaceTabsProps) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={buildClassName('code', activeTab)} onClick={() => onSelect('code')}>
        Code Playground
      </button>
      <button type="button" className={buildClassName('preview', activeTab)} onClick={() => onSelect('preview')}>
        Minting Preview
      </button>
    </div>
  );
}
