import type { JSX } from 'react'
import { WorkoutFormDesktop } from './WorkoutFormDesktop'
import { WorkoutFormMobile } from './WorkoutFormMobile'
import { useDesktop } from '../hooks/use-desktop'

interface WorkoutFormProperties {
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutForm({ startBtnRef }: WorkoutFormProperties): JSX.Element {
  const desktop = useDesktop()
  return desktop
    ? <WorkoutFormDesktop startBtnRef={startBtnRef} />
    : <WorkoutFormMobile  startBtnRef={startBtnRef} />
}
