'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      components={{
        // Custom rendering for markdown elements with Tailwind CSS classes
        strong: ({ children }) => (
          <strong className={`text-duech-blue font-bold ${className}`}>{children}</strong>
        ), // Bold text
        em: ({ children }) => <em className={`text-gray-800 italic ${className}`}>{children}</em>, // Italic text
        p: ({ children }) => <span className={`inline ${className}`}>{children}</span>, // Inline paragraph
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
