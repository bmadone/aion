import { z } from 'zod'

export const workoutSchema = z.object({
  workDuration:      z.number().int().min(1, 'errors.workDurationMin'),
  restDuration:      z.number().int().min(0, 'errors.restDurationMin'),
  intervals:         z.number().int().min(1, 'errors.intervalsMin'),
  rounds:            z.number().int().min(1, 'errors.roundsMin'),
  restBetweenRounds: z.number().int().min(0, 'errors.restBetweenRoundsMin'),
})

export type WorkoutConfig = z.infer<typeof workoutSchema>
