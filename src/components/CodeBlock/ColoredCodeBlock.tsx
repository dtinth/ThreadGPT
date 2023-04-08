import { ReactElement, memo, useMemo } from "react";

import { SyntaxHighlighter } from 'src/components/CodeBlock/SyntaxHighlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';

import type { CodeBlockProps } from './CodeBlock';

const ColoredCodeBlock = memo<CodeBlockProps>(props => {
	const expectedLanguage = useMemo(() => {
		const truncatedLang = ((props.children[0] as ReactElement).props?.className ?? '').replace('language-', '');

		switch (truncatedLang) {
		case 'js':
			return 'javascript';
		case 'ts':
			return 'javascript';
		case 'typescript':
			return 'javascript';
		default:
			return truncatedLang;
		}
	}, [props.className]);

	return (
		<SyntaxHighlighter language={expectedLanguage} style={okaidia}>
			{(props.children[0] as ReactElement).props.children as string}
		</SyntaxHighlighter>
	);
});

export default ColoredCodeBlock;
