import { useCallback, useEffect, useMemo, useState } from 'react'
import useScreenSize from './useScreenSize'

const ICON_SIZE = 32
const VERTICAL_LINE_SIZE = 2
const INDENT_SIZE = ICON_SIZE / 2 - VERTICAL_LINE_SIZE

export type CssUnit = 'px' | 'rem' | 'em' | 'vw' | 'vh' | 'vmin' | 'vmax'

type CssUnitValue = `${number}${CssUnit}`
export interface IndentSizes {
  iconSize: CssUnitValue
  margin: CssUnitValue
}

function useThreadIndent(): IndentSizes {
  const { isMobile } = useScreenSize()
  const [{ iconSize, margin }, setIndent] = useState<IndentSizes>(getIndentSizes(isMobile))

  useEffect(() => setIndent(getIndentSizes(isMobile)), [isMobile])

  return useMemo(() => ({ iconSize, margin }), [iconSize, margin])
}

export function getIndentSizes(isMobile: boolean): IndentSizes {
  return {
    iconSize: `${isMobile ? ICON_SIZE / 2 : ICON_SIZE}px`,
    margin: `${isMobile ? (INDENT_SIZE / 2) : INDENT_SIZE}px`,
  }
}

export default useThreadIndent
