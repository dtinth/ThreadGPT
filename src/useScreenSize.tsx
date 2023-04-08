import { useEffect, useState } from 'react';

export interface ScreenSize {
  width: number
  height: number
  isMobile: boolean
}

export function isUndefined(value: unknown): value is undefined {
	return typeof value === 'undefined';
}

function useScreenSize() {
	const [{ width, height, isMobile }, setSize] = useState<ScreenSize>({
		width: isUndefined(window) ? 0 : window.innerWidth,
		height: isUndefined(window) ? 0 : window.innerHeight,
		isMobile: isUndefined(window) ?  true : window.innerWidth < 768
	});

	useEffect(() => {
		if (isUndefined(window)) return;

		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);

		function handleResize() {
			setSize({
				width: window.innerWidth,
				height: window.innerHeight,
				isMobile: window.innerWidth < 768
			});
		}
	}, []);

	return { width, height, isMobile };
}

export default useScreenSize;
