import { useCallback, useEffect, useState } from 'react'
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

  const getIndentSize = useCallback(function getIndentSize(): IndentSizes {
    return {
      iconSize: `${isMobile ? ICON_SIZE / 2 : ICON_SIZE}px`,
      margin: `${isMobile ? (INDENT_SIZE / 2) : INDENT_SIZE}px`,
    }
  }, [isMobile])

  const [{ iconSize, margin }, setIndent] = useState<IndentSizes>(getIndentSize())

  useEffect(() => setIndent(getIndentSize()), [isMobile])

  return { iconSize, margin }
}

export default useThreadIndent
