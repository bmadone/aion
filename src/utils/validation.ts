import type { WorkoutConfig } from '../types'

export interface ConfigErrors {
  workDuration?: string
  restDuration?: string
  intervals?: string
  rounds?: string
  restBetweenRounds?: string
}

export function validateConfig(c: WorkoutConfig): ConfigErrors {
  const errors: ConfigErrors = {}
  if (!c.workDuration || c.workDuration < 1) {errors.workDuration = 'errors.workDurationMin'}
  if (c.restDuration < 0) {errors.restDuration = 'errors.restDurationMin'}
  if (!c.intervals || c.intervals < 1 || !Number.isInteger(c.intervals)) {errors.intervals = 'errors.intervalsMin'}
  if (!c.rounds || c.rounds < 1 || !Number.isInteger(c.rounds)) {errors.rounds = 'errors.roundsMin'}
  if (c.restBetweenRounds < 0) {errors.restBetweenRounds = 'errors.restBetweenRoundsMin'}
  return errors
}

export function isValid(errors: ConfigErrors): boolean {
  return Object.keys(errors).length === 0
}
