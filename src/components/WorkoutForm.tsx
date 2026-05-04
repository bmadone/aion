import { useState, useEffect, useRef } from 'react'
import type { Preset, WorkoutConfig } from '../types'
import { PresetSelector } from './PresetSelector'
import { DurationPicker } from './DurationPicker'
import { Stepper } from './Stepper'
import { WorkoutFormDesktop } from './WorkoutFormDesktop'
import { useDesktop } from '../hooks/useDesktop'

const STORAGE_KEY = 'aion:lastWorkout'

export const DEFAULT_CONFIG: WorkoutConfig = {
  workDuration: 30,
  restDuration: 30,
  intervals: 5,
  rounds: 4,
  restBetweenRounds: 120,
}

function loadConfig(): WorkoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return DEFAULT_CONFIG
}

interface WorkoutFormProps {
  onStart: (config: WorkoutConfig) => void
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutForm({ onStart, startBtnRef }: WorkoutFormProps) {
  const desktop = useDesktop()
  if (desktop) return <WorkoutFormDesktop onStart={onStart} startBtnRef={startBtnRef} />

  const initial = loadConfig()
  const [preset, setPreset] = useState<Preset>('custom')
  const [config, setConfig] = useState<WorkoutConfig>(initial)
  const [error, setError] = useState('')

  // Preserved custom values — updated whenever user edits a field
  const customRef = useRef<WorkoutConfig>(initial)

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
    if (presetConfig) {
      // Named preset — load preset values but keep custom values stored
      setConfig(presetConfig)
    } else {
      // Back to Custom — restore last custom values
      setConfig(customRef.current)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (config.workDuration < 1) {
      setError('Work duration must be at least 1 second')
      return
    }
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
