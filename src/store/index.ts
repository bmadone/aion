import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import type { WorkoutConfig } from '../schemas/workout'
import type { Preset } from '../types'

const DEFAULT_CONFIG: WorkoutConfig = {
  workDuration: 30,
  restDuration: 30,
  intervals: 5,
  rounds: 4,
  restBetweenRounds: 120,
}

function getInitialTheme(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem('aion:theme') as 'light' | 'dark' | null
    if (stored === 'dark' || stored === 'light') {return stored}
  } catch { /* ignore */ }
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialMuted(): boolean {
  try { return localStorage.getItem('aion:muted') === 'true' } catch { return false }
}

function loadLegacyConfig(): WorkoutConfig | null {
  try {
    const raw = localStorage.getItem('aion:lastWorkout')
    if (raw !== null) {return JSON.parse(raw) as WorkoutConfig}
  } catch { /* ignore */ }
  return null
}

function removeLegacyKeys(): void {
  try {
    localStorage.removeItem('aion:lastWorkout')
    localStorage.removeItem('aion:theme')
    localStorage.removeItem('aion:muted')
  } catch { /* ignore */ }
}

interface AionState {
  config: WorkoutConfig
  preset: Preset
  view: 'form' | 'timer'
  theme: 'light' | 'dark'
  muted: boolean

  setConfig: (config: WorkoutConfig) => void
  setPreset: (preset: Preset) => void
  setView: (view: 'form' | 'timer') => void
  toggleTheme: () => void
  toggleMuted: () => void
}

function onRehydrate(rehydrated: AionState | undefined, error: unknown): void {
  if (error !== undefined || rehydrated !== undefined) {return}
  const legacyConfig = loadLegacyConfig()
  if (legacyConfig !== null) {
    useStore.setState((s) => ({ ...s, config: legacyConfig }))
  }
  removeLegacyKeys()
}

export const useStore = create<AionState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        config: DEFAULT_CONFIG,
        preset: 'custom',
        view: 'form' as const,
        theme: getInitialTheme(),
        muted: getInitialMuted(),

        setConfig:  (config)  => set({ config }),
        setPreset:  (preset)  => set({ preset }),
        setView:    (view)    => set({ view }),
        toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
        toggleMuted: () => set((s) => ({ muted: !s.muted })),
      }),
      {
        name: 'aion:store',
        partialize: (state) => ({
          config: state.config,
          preset: state.preset,
          theme:  state.theme,
          muted:  state.muted,
        }),
        onRehydrateStorage: () => onRehydrate,
      }
    )
  )
)

export const useConfig = (): WorkoutConfig   => useStore((s) => s.config)
export const usePreset = (): Preset          => useStore((s) => s.preset)
export const useView   = (): 'form' | 'timer' => useStore((s) => s.view)
export const useTheme  = (): 'light' | 'dark' => useStore((s) => s.theme)
export const useMuted  = (): boolean          => useStore((s) => s.muted)
