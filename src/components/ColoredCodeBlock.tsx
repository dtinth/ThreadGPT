import { memo, useMemo } from "react"

import { SyntaxHighlighter } from './SyntaxHighlighter'
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism'

import type { CodeProps } from "react-markdown/lib/ast-to-react"

const ColoredCodeBlock = memo<CodeProps>(props => {
  const expectedLanguage = useMemo(() => {
    let truncatedLang = (props.className ?? '').replace('language-', '')

    switch (truncatedLang) {
      case 'js':
        return 'javascript'
      case 'typescript':
        return 'javascript'
      default:
        return truncatedLang
    }
  }, [props.className])

  return (
    <SyntaxHighlighter language={expectedLanguage} style={okaidia}>
      {props.children as string}
    </SyntaxHighlighter>
  )
})

export default ColoredCodeBlock
