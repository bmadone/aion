import type { WorkoutConfig } from './schemas/workout'

export type Phase = 'idle' | 'countdown' | 'work' | 'rest' | 'rest-between-rounds' | 'complete'

export type Preset = 'tabata' | 'hiit' | 'emom' | 'custom' | 'stopwatch'

export type { WorkoutConfig } from './schemas/workout'

export interface TimerState {
  phase: Phase
  currentRound: number
  totalRounds: number
  currentInterval: number
  totalIntervals: number
  timeRemaining: number
}

export const PRESETS: Record<Preset, WorkoutConfig | null> = {
  custom:    null,
  tabata:    { workDuration: 20, restDuration: 10, intervals: 8, rounds: 1, restBetweenRounds: 0 },
  hiit:      { workDuration: 40, restDuration: 20, intervals: 8, rounds: 3, restBetweenRounds: 60 },
  emom:      { workDuration: 60, restDuration: 0, intervals: 10, rounds: 1, restBetweenRounds: 0 },
  stopwatch: null,
}
