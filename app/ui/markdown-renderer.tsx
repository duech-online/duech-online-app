'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom styling for markdown elements
        strong: ({ children }) => <strong className="text-duech-blue font-bold">{children}</strong>,
        em: ({ children }) => <em className="text-gray-800 italic">{children}</em>,
        p: ({ children }) => <span className="inline">{children}</span>,
        // Handle links if they exist in definitions
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-duech-blue hover:text-duech-gold underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        // Handle code if it exists
        code: ({ children }) => (
          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm text-gray-800">
            {children}
          </code>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
