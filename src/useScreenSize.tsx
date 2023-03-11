import React, { FC, useEffect } from 'react'

export interface ScreenSize {
  width: number
  height: number
  isMobile: boolean
}

function useScreenSize() {
  const [{ width, height, isMobile }, setSize] = React.useState<ScreenSize>({
    width: 0,
    height: 0,
    isMobile: true
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleResize() {
    setSize({
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768
    })
  }

  return { width, height, isMobile }
}

export default useScreenSize
