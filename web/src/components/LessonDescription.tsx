import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type MarkdownBlock =
  | { type: 'heading'; level: number; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] };

export interface LessonDescriptionProps {
  title?: string;
  markdown: string;
  className?: string;
}

function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', content: paragraph.join(' ') });
      paragraph = [];
    }
  };

  const flushList = () => {
    if (list && list.length > 0) {
      blocks.push({ type: 'list', items: list });
    }
    list = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      blocks.push({ type: 'heading', level, content: headingMatch[2].trim() });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      if (!list) {
        list = [];
      }
      list.push(trimmed.replace(/^[-*]\s+/, '').trim());
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

const renderInline = (text: string, keyPrefix: string): ReactNode => {
  const parts = text.split(/(`[^`]*`)/g);
  let sequence = 0;

  const renderEmphasis = (segment: string, baseKey: string): ReactNode[] => {
    const nodes: ReactNode[] = [];
    const emphasisRegex = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = emphasisRegex.exec(segment))) {
      if (match.index > lastIndex) {
        nodes.push(<span key={`${baseKey}-${sequence++}`}>{segment.slice(lastIndex, match.index)}</span>);
      }

      if (match[1]) {
        nodes.push(<strong key={`${baseKey}-${sequence++}`}>{match[2]}</strong>);
      } else if (match[3]) {
        nodes.push(<em key={`${baseKey}-${sequence++}`}>{match[4]}</em>);
      }

      lastIndex = emphasisRegex.lastIndex;
    }

    if (lastIndex < segment.length) {
      nodes.push(<span key={`${baseKey}-${sequence++}`}>{segment.slice(lastIndex)}</span>);
    }

    return nodes;
  };

  // Use map instead of flatMap, then flatten the result
  return parts
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      if (part.startsWith('`') && part.endsWith('`')) {
        const codeContent = part.slice(1, -1);
        return (
          <code key={`${key}-code`} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-700">
            {codeContent}
          </code>
        );
      }

      if (!part) {
        return null;
      }

      return renderEmphasis(part, key);
    })
    .flat();
};

export function LessonDescription({ title, markdown, className }: LessonDescriptionProps) {
  const blocks = parseMarkdown(markdown);

  return (
    <div
      className={cn(
        'flex flex-1 flex-col bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-gray-800',
        className
      )}
    >
      {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
      <div className={cn('space-y-2', title && 'mt-4')}>
        {blocks.map((block, index) => {
          if (block.type === 'heading') {
            const HeadingTag = `h${Math.min(block.level + 1, 6)}`;
            return React.createElement(
              HeadingTag,
              { key: `heading-${index}`, className: 'font-semibold text-gray-900' },
              block.content
            );
          }

          if (block.type === 'list') {
            return (
              <ul key={`list-${index}`} className="list-disc space-y-2 pl-5 text-sm text-gray-700">
                {block.items.map((item, itemIndex) => (
                  <li key={`list-${index}-${itemIndex}`}>{renderInline(item, `list-${index}-${itemIndex}`)}</li>
                ))}
              </ul>
            );
          }

          return (
            <p key={`paragraph-${index}`} className="text-sm leading-6 text-gray-700">
              {renderInline(block.content, `paragraph-${index}`)}
            </p>
          );
        })}
      </div>
    </div>
  );
}
