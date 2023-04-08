import { ReactNode, createContext } from 'react';
import { IndentSizes, getIndentSizes } from 'src/useThreadIndent';

interface Indent {
  depth: number
  children?: ReactNode
}

const IndentSizesContext = createContext<IndentSizes>(getIndentSizes(false));

function Indent({ ...props }: Indent) {
  return (
    <div className="d-flex">
      <IndentSizesContext.Consumer>
        {({ margin }) =>
          Array.from({ length: Math.max(0, props.depth) }, (_, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{ margin: `0 ${margin}`, width: 2, background: '#fff3' }}
            />
          ))
        }
      </IndentSizesContext.Consumer>
      <div className="flex-grow-1">{props.children}</div>
    </div>
  );
}

export { Indent, IndentSizesContext};