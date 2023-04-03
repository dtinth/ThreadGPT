import { memo, useMemo } from "react"

import SyntaxHighlighter from 'react-syntax-highlighter'
import { monokaiSublime } from 'react-syntax-highlighter/dist/esm/styles/hljs'

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
  // const codeElement = useRef<HTMLPreElement>(null)

  // useEffect(() => {
  //   console.log(props.children[0].props.className)
  //   if (preElement.current !== null) {
  //     Prism.highlightAllUnder(codeElement.current)
  //   }
  // }, [codeElement])

  return (
    <SyntaxHighlighter language={expectedLanguage} style={monokaiSublime}>
      {props.children as string}
    </SyntaxHighlighter>
  )
})

export default ColoredCodeBlock
