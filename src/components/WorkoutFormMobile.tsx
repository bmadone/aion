import { useState, type JSX } from 'react'
import type { WorkoutConfig } from '../types'
import { PresetSelector } from './PresetSelector'
import { DurationPicker } from './DurationPicker'
import { Stepper } from './Stepper'
import { useWorkoutConfig } from '../hooks/useWorkoutConfig'
import { validateConfig, isValid } from '../utils/validation'

interface Props {
  onStart: (config: WorkoutConfig) => void
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutFormMobile({ onStart, startBtnRef }: Props): JSX.Element {
  const { preset, config, updateConfig, selectPreset } = useWorkoutConfig()
  const [submitted, setSubmitted] = useState(false)

  const errors = validateConfig(config)
  const valid  = isValid(errors)

  function handleSubmit(e: React.SyntheticEvent): void {
    e.preventDefault()
    setSubmitted(true)
    if (!valid) return
    onStart(config)
  }

  return (
    <form className="workout-form" onSubmit={handleSubmit} noValidate>
      <PresetSelector selected={preset} onSelect={selectPreset} />

      <div className="form-card">
        <div className="picker-row">
          <span className="picker-label">Work</span>
          <DurationPicker value={config.workDuration} onChange={v => updateConfig({ workDuration: v })} />
        </div>
        <div className="picker-row picker-row--sep">
          <span className="picker-label">Rest</span>
          <DurationPicker value={config.restDuration} onChange={v => updateConfig({ restDuration: v })} />
        </div>
      </div>

      <div className="form-card">
        <div className="stepper-row">
          <span className="stepper-label">Intervals / round</span>
          <Stepper value={config.intervals} min={1} max={30}
            onChange={v => updateConfig({ intervals: v })} aria-label="Intervals per round" />
        </div>
        <div className="stepper-row stepper-row--sep">
          <span className="stepper-label">Rounds</span>
          <Stepper value={config.rounds} min={1} max={20}
            onChange={v => updateConfig({ rounds: v })} aria-label="Number of rounds" />
        </div>
      </div>

      <div className="form-card">
        <div className="picker-row">
          <span className="picker-label">Block rest</span>
          <DurationPicker value={config.restBetweenRounds} onChange={v => updateConfig({ restBetweenRounds: v })} />
        </div>
      </div>

      {submitted && !valid && (
        <p className="form-error" role="alert">
          {errors.workDuration ?? errors.intervals ?? errors.rounds}
        </p>
      )}

      <button ref={startBtnRef} type="submit" className="btn-primary" aria-label="Start workout">
        Start
      </button>
    </form>
  )
}
