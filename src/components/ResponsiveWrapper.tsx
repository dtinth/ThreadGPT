import { ReactNode } from 'react';
import useScreenSize from 'src/useScreenSize';
import useThreadIndent from 'src/useThreadIndent';
import { IndentSizesContext } from 'src/components/Indent';

interface ResponsiveWrapper {
  children: ReactNode
}
function ResponsiveWrapper(props: ResponsiveWrapper) {
	const { isMobile } = useScreenSize();
	const indentSizes = useThreadIndent(isMobile);
	return (
		<IndentSizesContext.Provider value={indentSizes}>
			<div className={`${isMobile ? 'p-2' : 'p-4'}`}>{props.children}</div>
		</IndentSizesContext.Provider>
	);
}

export {
	ResponsiveWrapper,
};