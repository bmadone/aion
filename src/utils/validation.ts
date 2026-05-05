import type { WorkoutConfig } from '../types'

export interface ConfigErrors {
  workDuration?: string
  restDuration?: string
  intervals?: string
  rounds?: string
  restBetweenRounds?: string
}

type FieldValidator = (c: WorkoutConfig) => string | undefined

const FIELD_VALIDATORS: Record<keyof ConfigErrors, FieldValidator> = {
  workDuration:      (c) => (!c.workDuration || c.workDuration < 1) ? 'errors.workDurationMin' : undefined,
  restDuration:      (c) => c.restDuration < 0 ? 'errors.restDurationMin' : undefined,
  intervals:         (c) => (!c.intervals || c.intervals < 1 || !Number.isInteger(c.intervals)) ? 'errors.intervalsMin' : undefined,
  rounds:            (c) => (!c.rounds || c.rounds < 1 || !Number.isInteger(c.rounds)) ? 'errors.roundsMin' : undefined,
  restBetweenRounds: (c) => c.restBetweenRounds < 0 ? 'errors.restBetweenRoundsMin' : undefined,
}

export function validateConfig(c: WorkoutConfig): ConfigErrors {
  return Object.fromEntries(
    (Object.entries(FIELD_VALIDATORS) as [keyof ConfigErrors, FieldValidator][])
      .flatMap(([key, validate]) => {
        const msg = validate(c)
        return msg === undefined ? [] : [[key, msg]]
      })
  )
}

export function isValid(errors: ConfigErrors): boolean {
  return Object.keys(errors).length === 0
}
