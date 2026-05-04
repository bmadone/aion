export type Phase = 'idle' | 'countdown' | 'work' | 'rest' | 'rest-between-rounds' | 'complete'

export type Preset = 'tabata' | 'amrap' | 'emom' | 'custom'

export interface WorkoutConfig {
  workDuration: number       // seconds per work interval
  restDuration: number       // seconds of rest after each work interval
  intervals: number          // work/rest cycles per round (block)
  rounds: number             // number of rounds (blocks)
  restBetweenRounds: number  // seconds between rounds (0 = none)
}

export interface TimerState {
  phase: Phase
  currentRound: number     // 1-based
  totalRounds: number
  currentInterval: number  // 1-based, within current round
  totalIntervals: number
  timeRemaining: number    // seconds
}

export const PRESETS: Record<Preset, WorkoutConfig | null> = {
  custom: null,
  tabata: { workDuration: 20, restDuration: 10, intervals: 8, rounds: 1, restBetweenRounds: 0 },
  amrap:  { workDuration: 1200, restDuration: 0, intervals: 1, rounds: 1, restBetweenRounds: 0 },
  emom:   { workDuration: 60, restDuration: 0, intervals: 10, rounds: 1, restBetweenRounds: 0 },
}
