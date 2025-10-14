'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Renders markdown content using custom styled components for various markdown elements.
 *
 * @param content - The markdown string to be rendered.
 * @returns A React element rendering the markdown with custom styles for strong, em, paragraph, link, and code elements.
 *
 * @remarks
 * - Uses `ReactMarkdown` with the `remarkGfm` plugin for GitHub Flavored Markdown support.
 * - Customizes the rendering of markdown elements to apply specific Tailwind CSS classes.
 * - Support for **bold**, _italic_, and plain text.
 * 
 * @example
 * ```tsx
 * <MarkdownRenderer content="**Bold Text** and _Italic Text_." />
 * ```
 * should render:
 * **Bold Text** and _Italic Text_.
 */
export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
