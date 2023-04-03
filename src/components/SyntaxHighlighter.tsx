import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'

/**
 * hljs langs
 */
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import c from 'react-syntax-highlighter/dist/esm/languages/hljs/c'
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp'
import rust from 'react-syntax-highlighter/dist/esm/languages/hljs/rust'
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java'
import go from 'react-syntax-highlighter/dist/esm/languages/hljs/go'

SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('javascript', js)
SyntaxHighlighter.registerLanguage('c', c)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('rust', rust)
SyntaxHighlighter.registerLanguage('go', go)

export { SyntaxHighlighter }
