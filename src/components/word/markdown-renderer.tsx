'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        // Custom rendering for markdown elements with Tailwind CSS classes
        strong: ({ children }) => <strong className="text-duech-blue font-bold">{children}</strong>, // Bold text
        em: ({ children }) => <em className="text-gray-800 italic">{children}</em>, // Italic text
        p: ({ children }) => <span className="inline">{children}</span>, // Inline paragraph
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
