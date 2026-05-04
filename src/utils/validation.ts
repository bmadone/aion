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
  if (!c.workDuration || c.workDuration < 1) errors.workDuration = 'Must be ≥ 1s'
  if (c.restDuration < 0) errors.restDuration = 'Must be ≥ 0'
  if (!c.intervals || c.intervals < 1 || !Number.isInteger(c.intervals)) errors.intervals = 'Must be ≥ 1'
  if (!c.rounds || c.rounds < 1 || !Number.isInteger(c.rounds)) errors.rounds = 'Must be ≥ 1'
  if (c.restBetweenRounds < 0) errors.restBetweenRounds = 'Must be ≥ 0'
  return errors
}

export function isValid(errors: ConfigErrors) {
  return Object.keys(errors).length === 0
}
