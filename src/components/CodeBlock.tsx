import { Suspense, lazy, memo } from "react"

import type { CodeProps } from "react-markdown/lib/ast-to-react"

const LazyLoadedFullCodeBlock = lazy(() => import('./ColoredCodeBlock'))

export const CodeBlock = memo<CodeProps>(props => {
  return (
    <Suspense fallback={<code {...props} />}>
      <LazyLoadedFullCodeBlock {...props} />
    </Suspense>
  )
})
