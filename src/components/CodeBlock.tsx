import { Suspense, lazy, memo } from "react"

import { ReactMarkdownProps } from "react-markdown/lib/complex-types"

const LazyLoadedFullCodeBlock = lazy(() => import('./ColoredCodeBlock'))

export const CodeBlock = memo<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLPreElement>, HTMLPreElement>, "ref"> &
ReactMarkdownProps>(props => {
  return (
    <Suspense fallback={<pre {...props} />}>
      <LazyLoadedFullCodeBlock {...props} />
    </Suspense>
  )
})
