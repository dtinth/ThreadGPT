import { useEffect, useState } from 'react'
import useScreenSize from './useScreenSize'

const ICON_SIZE = 32
const VERTICAL_LINE_SIZE = 2
const INDENT_SIZE = ICON_SIZE / 2 - VERTICAL_LINE_SIZE

export type CssUnit = 'px' | 'rem' | 'em' | 'vw' | 'vh' | 'vmin' | 'vmax'

interface IndentSizes {
  iconSize: number
  margin: number
}

function useThreadIndent(): { [P in keyof IndentSizes]: `${number}${CssUnit}` } {
  const { isMobile } = useScreenSize()
  const [{ iconSize, margin }, setIndent] = useState<IndentSizes>({
    iconSize: isMobile ? ICON_SIZE / 2 : ICON_SIZE,
    margin: isMobile ? (INDENT_SIZE / 2) : INDENT_SIZE,
  })

  useEffect(() => {
    setIndent({
      iconSize: isMobile ? ICON_SIZE / 2 : ICON_SIZE,
      margin: isMobile ? (INDENT_SIZE / 2) : INDENT_SIZE,
    })
  }, [isMobile])

  return {
    iconSize: `${iconSize}px`,
    margin: `${margin}px`,
  }
}

export default useThreadIndent
