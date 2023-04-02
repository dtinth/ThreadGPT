import { memo, useEffect, useRef } from "react"

import Prism from "prismjs"

import { ReactMarkdownProps } from "react-markdown/lib/complex-types"

const ColoredCodeBlock = memo<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLPreElement>, HTMLPreElement>, "ref"> &
ReactMarkdownProps>(props => {
  const preElement = useRef<HTMLPreElement>(null)

  useEffect(() => {
    if (preElement.current !== null) {
      Prism.highlightAllUnder(preElement.current)
    }
  }, [preElement])

  return (
    <pre ref={preElement} {...props} />
  )
})

export default ColoredCodeBlock
