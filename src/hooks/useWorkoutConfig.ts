import { useState, useRef, useEffect } from 'react'
import type { Preset, WorkoutConfig } from '../types'

export const STORAGE_KEY = 'aion:lastWorkout'

export const DEFAULT_CONFIG: WorkoutConfig = {
  workDuration: 30,
  restDuration: 30,
  intervals: 5,
  rounds: 4,
  restBetweenRounds: 120,
}

export function loadConfig(): WorkoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return DEFAULT_CONFIG
}

export function useWorkoutConfig() {
  const [preset, setPreset] = useState<Preset>('custom')
  const [config, setConfig] = useState<WorkoutConfig>(loadConfig)
  const customRef = useRef<WorkoutConfig>(config)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)) } catch { /* ignore */ }
  }, [config])

  function updateConfig(patch: Partial<WorkoutConfig>) {
    setPreset('custom')
    setConfig(c => {
      const next = { ...c, ...patch }
      customRef.current = next
      return next
    })
  }

  function selectPreset(p: Preset, presetConfig: WorkoutConfig | null) {
    setPreset(p)
    setConfig(presetConfig ?? customRef.current)
  }

  return { preset, config, updateConfig, selectPreset }
}
