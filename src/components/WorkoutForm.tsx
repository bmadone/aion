import type { JSX } from 'react'
import { WorkoutFormDesktop } from './WorkoutFormDesktop'
import { WorkoutFormMobile } from './WorkoutFormMobile'
import { useDesktop } from '../hooks/useDesktop'

interface WorkoutFormProps {
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutForm({ startBtnRef }: WorkoutFormProps): JSX.Element {
  const desktop = useDesktop()
  return desktop
    ? <WorkoutFormDesktop startBtnRef={startBtnRef} />
    : <WorkoutFormMobile  startBtnRef={startBtnRef} />
}
