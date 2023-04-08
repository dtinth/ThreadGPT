import { Suspense, lazy, memo } from "react";

import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { ReactMarkdownProps } from "react-markdown/lib/complex-types";

export type CodeBlockProps = Omit<DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>, "ref"> & ReactMarkdownProps

const LazyLoadedFullCodeBlock = lazy(() => import('./ColoredCodeBlock'));

export const CodeBlock = memo<CodeBlockProps>(props => (
  <Suspense fallback={<pre {...props} />}>
    <LazyLoadedFullCodeBlock {...props} />
  </Suspense>
));
