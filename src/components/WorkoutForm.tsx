import type { WorkoutConfig } from '../types'
import { WorkoutFormDesktop } from './WorkoutFormDesktop'
import { WorkoutFormMobile } from './WorkoutFormMobile'
import { useDesktop } from '../hooks/useDesktop'

// Re-export for consumers that need the default
export { DEFAULT_CONFIG } from '../hooks/useWorkoutConfig'

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
