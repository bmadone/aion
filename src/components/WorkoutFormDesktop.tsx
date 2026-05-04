import { useState, type JSX } from 'react'
import type { WorkoutConfig } from '../types'
import { PresetSelector } from './PresetSelector'
import { useWorkoutConfig } from '../hooks/useWorkoutConfig'
import { validateConfig, isValid, type ConfigErrors } from '../utils/validation'

interface Props {
  onStart: (config: WorkoutConfig) => void
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutFormDesktop({ onStart, startBtnRef }: Props): JSX.Element {
  const { preset, config, updateConfig, selectPreset } = useWorkoutConfig()
  const [touched, setTouched] = useState<Partial<Record<keyof ConfigErrors, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const errors  = validateConfig(config)
  const valid   = isValid(errors)

  function touch(field: keyof ConfigErrors): void {
    setTouched(t => ({ ...t, [field]: true }))
  }

  function err(field: keyof ConfigErrors): string | undefined {
    return (touched[field] === true || submitted) ? errors[field] : undefined
  }

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
        <DesktopField id="workDuration" label="Work (s)" value={config.workDuration}
          error={err('workDuration')} min={1}
          onChange={v => { updateConfig({ workDuration: v }); touch('workDuration') }} />
        <DesktopField id="restDuration" label="Rest (s)" value={config.restDuration}
          error={err('restDuration')} min={0}
          onChange={v => { updateConfig({ restDuration: v }); touch('restDuration') }} />
      </div>

      <div className="form-card">
        <DesktopField id="intervals" label="Intervals / round" value={config.intervals}
          error={err('intervals')} min={1} step={1}
          onChange={v => { updateConfig({ intervals: v }); touch('intervals') }} />
        <DesktopField id="rounds" label="Rounds" value={config.rounds}
          error={err('rounds')} min={1} step={1}
          onChange={v => { updateConfig({ rounds: v }); touch('rounds') }} />
      </div>

      <div className="form-card">
        <DesktopField id="restBetweenRounds" label="Block rest (s)" value={config.restBetweenRounds}
          error={err('restBetweenRounds')} min={0}
          onChange={v => { updateConfig({ restBetweenRounds: v }); touch('restBetweenRounds') }} />
      </div>

      <button ref={startBtnRef} type="submit" className="btn-primary" disabled={submitted && !valid}>
        Start
      </button>
    </form>
  )
}

interface FieldProps {
  id: string; label: string; value: number; error?: string | undefined
  min?: number; step?: number; onChange: (v: number) => void
}

function DesktopField({ id, label, value, error, min, step, onChange }: FieldProps): JSX.Element {
  return (
    <div className={`field${error !== undefined ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-right">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          step={step}
          value={value}
          aria-invalid={error !== undefined}
          aria-describedby={error !== undefined ? `${id}-err` : undefined}
          onChange={e => onChange(Number(e.target.value))}
        />
        {error !== undefined && <span id={`${id}-err`} className="field-error" role="alert">{error}</span>}
      </div>
    </div>
  )
}
