import type { WorkoutConfig } from '../types'
import { WorkoutFormDesktop } from './WorkoutFormDesktop'
import { WorkoutFormMobile } from './WorkoutFormMobile'
import { useDesktop } from '../hooks/useDesktop'

export const DEFAULT_CONFIG: WorkoutConfig = {
  workDuration: 30,
  restDuration: 30,
  intervals: 5,
  rounds: 4,
  restBetweenRounds: 120,
}

interface WorkoutFormProps {
  onStart: (config: WorkoutConfig) => void
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutForm({ onStart, startBtnRef }: WorkoutFormProps) {
  const desktop = useDesktop()
  return desktop
    ? <WorkoutFormDesktop onStart={onStart} startBtnRef={startBtnRef} />
    : <WorkoutFormMobile  onStart={onStart} startBtnRef={startBtnRef} />
}
