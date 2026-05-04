import { useState, useEffect, useRef } from 'react'
import type { Preset, WorkoutConfig } from '../types'
import { PresetSelector } from './PresetSelector'
import { DEFAULT_CONFIG } from './WorkoutForm'

const STORAGE_KEY = 'aion:lastWorkout'

interface FormValues {
  workDuration: string
  restDuration: string
  intervals: string
  rounds: string
  restBetweenRounds: string
}

interface Props {
  onStart: (config: WorkoutConfig) => void
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

function configToValues(c: WorkoutConfig): FormValues {
  return {
    workDuration: String(c.workDuration),
    restDuration: String(c.restDuration),
    intervals: String(c.intervals),
    rounds: String(c.rounds),
    restBetweenRounds: String(c.restBetweenRounds),
  }
}

function loadSaved(): FormValues {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return configToValues(JSON.parse(raw) as WorkoutConfig)
  } catch { /* ignore */ }
  return configToValues(DEFAULT_CONFIG)
}

function toConfig(v: FormValues): WorkoutConfig {
  return {
    workDuration: Number(v.workDuration),
    restDuration: Number(v.restDuration),
    intervals: Number(v.intervals),
    rounds: Number(v.rounds),
    restBetweenRounds: Number(v.restBetweenRounds),
  }
}

function validate(v: FormValues) {
  const errors: Partial<Record<keyof FormValues, string>> = {}
  const work = Number(v.workDuration)
  const rest = Number(v.restDuration)
  const intervals = Number(v.intervals)
  const rounds = Number(v.rounds)
  const rbr = Number(v.restBetweenRounds)
  if (!v.workDuration || isNaN(work) || work <= 0) errors.workDuration = 'Required, must be > 0'
  if (v.restDuration !== '' && (isNaN(rest) || rest < 0)) errors.restDuration = 'Must be ≥ 0'
  if (!v.intervals || isNaN(intervals) || intervals < 1 || !Number.isInteger(intervals)) errors.intervals = 'Must be ≥ 1'
  if (!v.rounds || isNaN(rounds) || rounds < 1 || !Number.isInteger(rounds)) errors.rounds = 'Must be ≥ 1'
  if (v.restBetweenRounds !== '' && (isNaN(rbr) || rbr < 0)) errors.restBetweenRounds = 'Must be ≥ 0'
  return errors
}

export function WorkoutFormDesktop({ onStart, startBtnRef }: Props) {
  const initial = loadSaved()
  const [preset, setPreset] = useState<Preset>('custom')
  const [values, setValues] = useState<FormValues>(initial)
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Preserved custom values — updated on every user edit
  const customRef = useRef<FormValues>(initial)

  useEffect(() => {
    try {
      const c = toConfig(values)
      if (c.workDuration > 0 && c.intervals >= 1 && c.rounds >= 1)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(c))
    } catch { /* ignore */ }
  }, [values])

  const errors = validate(values)
  const isValid = Object.keys(errors).length === 0

  function handlePreset(p: Preset, cfg: WorkoutConfig | null) {
    setPreset(p)
    setError('')
    setTouched({})
    setSubmitted(false)
    if (cfg) {
      setValues(configToValues(cfg))
    } else {
      // Back to Custom — restore last custom values
      setValues(customRef.current)
    }
  }

  function change(field: keyof FormValues, val: string) {
    setPreset('custom')
    setValues(v => {
      const next = { ...v, [field]: val }
      customRef.current = next
      return next
    })
    setTouched(t => ({ ...t, [field]: true }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    if (!isValid) return
    onStart(toConfig(values))
  }

  function err(f: keyof FormValues) {
    return (touched[f] || submitted) ? errors[f] : undefined
  }

  return (
    <form className="workout-form" onSubmit={handleSubmit} noValidate>
      <PresetSelector selected={preset} onSelect={handlePreset} />

      <div className="form-card">
        <DesktopField id="workDuration" label="Work (s)" value={values.workDuration}
          error={err('workDuration')} min="1" onChange={v => change('workDuration', v)} />
        <DesktopField id="restDuration" label="Rest (s)" value={values.restDuration}
          error={err('restDuration')} min="0" onChange={v => change('restDuration', v)} />
      </div>

      <div className="form-card">
        <DesktopField id="intervals" label="Intervals / round" value={values.intervals}
          error={err('intervals')} min="1" step="1" onChange={v => change('intervals', v)} />
        <DesktopField id="rounds" label="Rounds" value={values.rounds}
          error={err('rounds')} min="1" step="1" onChange={v => change('rounds', v)} />
      </div>

      <div className="form-card">
        <DesktopField id="restBetweenRounds" label="Block rest (s)" value={values.restBetweenRounds}
          error={err('restBetweenRounds')} min="0" onChange={v => change('restBetweenRounds', v)} />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button ref={startBtnRef} type="submit" className="btn-primary" disabled={submitted && !isValid}>
        Start
      </button>
    </form>
  )
}

interface FieldProps {
  id: string; label: string; value: string; error?: string
  min?: string; step?: string; onChange: (v: string) => void
}

function DesktopField({ id, label, value, error, min, step, onChange }: FieldProps) {
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-right">
        <input id={id} type="number" inputMode="numeric" min={min} step={step}
          value={value} aria-invalid={!!error} onChange={e => onChange(e.target.value)} />
        {error && <span className="field-error" role="alert">{error}</span>}
      </div>
    </div>
  )
}
