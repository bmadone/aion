import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiEffectProps {
  active: boolean
}

const DEFAULTS = {
  spread: 360,
  ticks: 50,
  gravity: 0,
  decay: 0.94,
  startVelocity: 30,
  colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
}

function shoot() {
  confetti({ ...DEFAULTS, particleCount: 40, scalar: 1.2, shapes: ['star'] })
  confetti({ ...DEFAULTS, particleCount: 10, scalar: 0.75, shapes: ['circle'] })
}

export function ConfettiEffect({ active }: ConfettiEffectProps) {
  useEffect(() => {
    if (!active) return
    shoot()
    const t1 = setTimeout(shoot, 100)
    const t2 = setTimeout(shoot, 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active])

  return null
}
