import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

const components: Components = {
  h1: (props) => (
    <h1 className="mt-0 mb-4 text-2xl font-bold text-text-primary" {...props} />
  ),
  h2: (props) => <h2 className="mt-6 mb-3 text-xl font-bold text-text-primary" {...props} />,
  h3: (props) => <h3 className="mt-5 mb-2 text-lg font-bold text-text-primary" {...props} />,
  h4: (props) => <h4 className="mt-4 mb-2 text-base font-bold text-text-primary" {...props} />,
  h5: (props) => <h5 className="mt-4 mb-2 text-sm font-bold text-text-primary" {...props} />,
  h6: (props) => <h6 className="mt-4 mb-2 text-sm font-bold text-text-secondary" {...props} />,
  p: (props) => <p className="mb-4 leading-relaxed text-text-primary" {...props} />,
  a: (props) => <a className="text-accent underline" target="_blank" rel="noreferrer" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mb-4 border-l-4 border-border pl-4 text-text-secondary italic"
      {...props}
    />
  ),
  ul: (props) => <ul className="mb-4 list-disc space-y-1 pl-6 text-text-primary" {...props} />,
  ol: (props) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-text-primary" {...props} />,
  li: (props) => <li className="text-text-primary" {...props} />,
  code: ({ className, children, ...rest }) =>
    className ? (
      <code className={`font-mono text-sm ${className}`} {...rest}>
        {children}
      </code>
    ) : (
      <code
        className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm text-text-primary"
        {...rest}
      >
        {children}
      </code>
    ),
  pre: (props) => (
    <pre className="mb-4 overflow-x-auto rounded-md bg-surface p-4 text-text-primary" {...props} />
  ),
  hr: (props) => <hr className="my-6 border-border" {...props} />,
  table: (props) => (
    <div className="mb-4 overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-surface" {...props} />,
  tr: (props) => <tr className="border-b border-border last:border-0" {...props} />,
  th: (props) => (
    <th className="px-3 py-2 text-left font-bold whitespace-nowrap text-text-primary" {...props} />
  ),
  td: (props) => <td className="px-3 py-2 align-top text-text-primary" {...props} />,
}

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div
      className="h-full overflow-y-auto px-4 pt-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
