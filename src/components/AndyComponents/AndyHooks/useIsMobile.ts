import { breakpoints } from "theme/spinkles.css"
import { useEffect, useState } from 'react'

const isClient = typeof window !== 'undefined'

function getIsMobile() {
  return isClient ? window.innerWidth < breakpoints.sm : false
}

export function useIsMobileSp(): boolean {
  const [isMobile, setIsMobile] = useState(getIsMobile)

  useEffect(() => {
    function handleResize() {
      setIsMobile(getIsMobile())
    }

    if (isClient) {
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
    return undefined
  }, [])

  return isMobile
}
