import { useState, useEffect, useRef } from 'react'
import type { Preset, WorkoutConfig } from '../types'
import { PresetSelector } from './PresetSelector'
import { DurationPicker } from './DurationPicker'
import { Stepper } from './Stepper'
import { DEFAULT_CONFIG } from './WorkoutForm'

const STORAGE_KEY = 'aion:lastWorkout'

function loadConfig(): WorkoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return DEFAULT_CONFIG
}

interface Props {
  onStart: (config: WorkoutConfig) => void
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutFormMobile({ onStart, startBtnRef }: Props) {
  const [preset, setPreset] = useState<Preset>('custom')
  const [config, setConfig] = useState<WorkoutConfig>(loadConfig)
  const [error, setError] = useState('')
  const customRef = useRef<WorkoutConfig>(config)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch { /* ignore */ }
  }, [config])

  function update(patch: Partial<WorkoutConfig>) {
    setPreset('custom')
    setConfig(c => {
      const next = { ...c, ...patch }
      customRef.current = next
      return next
    })
    setError('')
  }

  function handlePreset(p: Preset, presetConfig: WorkoutConfig | null) {
    setPreset(p)
    setError('')
    setConfig(presetConfig ?? customRef.current)
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    if (config.workDuration < 1) { setError('Work must be at least 1 second'); return }
    onStart(config)
  }

  return (
    <form className="workout-form" onSubmit={handleSubmit} noValidate>
      <PresetSelector selected={preset} onSelect={handlePreset} />

      <div className="form-card">
        <div className="picker-row">
          <span className="picker-label">Work</span>
          <DurationPicker value={config.workDuration} onChange={v => update({ workDuration: v })} />
        </div>
        <div className="picker-row picker-row--sep">
          <span className="picker-label">Rest</span>
          <DurationPicker value={config.restDuration} onChange={v => update({ restDuration: v })} />
        </div>
      </div>

      <div className="form-card">
        <div className="stepper-row">
          <span className="stepper-label">Intervals / round</span>
          <Stepper value={config.intervals} min={1} max={30} onChange={v => update({ intervals: v })} aria-label="Intervals per round" />
        </div>
        <div className="stepper-row stepper-row--sep">
          <span className="stepper-label">Rounds</span>
          <Stepper value={config.rounds} min={1} max={20} onChange={v => update({ rounds: v })} aria-label="Number of rounds" />
        </div>
      </div>

      <div className="form-card">
        <div className="picker-row">
          <span className="picker-label">Block rest</span>
          <DurationPicker value={config.restBetweenRounds} onChange={v => update({ restBetweenRounds: v })} />
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button ref={startBtnRef} type="submit" className="btn-primary" aria-label="Start workout">
        Start
      </button>
    </form>
  )
}
