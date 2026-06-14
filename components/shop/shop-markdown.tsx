import ReactMarkdown from "react-markdown"

/**
 * Renders product description Markdown coming from the admin.
 * react-markdown does not render raw HTML by default, so this is XSS-safe
 * without an extra sanitizer. Styling matches the shop's muted body text.
 */
export function ShopMarkdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className ?? "max-w-3xl text-sm leading-7 text-gray-600"}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h2 className="mb-3 mt-6 text-lg font-semibold text-gray-900">{children}</h2>,
          h2: ({ children }) => <h2 className="mb-3 mt-6 text-lg font-semibold text-gray-900">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold text-gray-800">{children}</h3>,
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-gray-200 pl-4 italic text-gray-700">{children}</blockquote>
          ),
          hr: () => <hr className="my-6 border-gray-200" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
