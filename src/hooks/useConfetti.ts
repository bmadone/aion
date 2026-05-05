import { useEffect } from 'react'
import confetti from 'canvas-confetti'

const DEFAULTS = {
  spread: 360,
  ticks: 50,
  gravity: 0,
  decay: 0.94,
  startVelocity: 30,
  colors: ['FFE400', 'FFBD00', 'E89400', 'FFCA6C', 'FDFFB8'],
}

function shoot(): void {
  void confetti({ ...DEFAULTS, particleCount: 40, scalar: 1.2, shapes: ['star'] })
  void confetti({ ...DEFAULTS, particleCount: 10, scalar: 0.75, shapes: ['circle'] })
}

export function useConfetti(active: boolean): void {
  useEffect(() => {
    if (!active) {return}
    shoot()
    const t1 = setTimeout(shoot, 100)
    const t2 = setTimeout(shoot, 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [active])
}
