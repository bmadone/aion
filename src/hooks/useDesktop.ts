import { useState, useEffect } from 'react'

export function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(() =>
    window.matchMedia('(min-width: 600px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 600px)')
    const handler = (e: MediaQueryListEvent): void => { setDesktop(e.matches) }
    mq.addEventListener('change', handler)
    return () => { mq.removeEventListener('change', handler) }
  }, [])

  return desktop
}
