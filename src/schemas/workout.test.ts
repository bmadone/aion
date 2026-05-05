import { describe, it, expect } from 'vitest'
import { workoutSchema } from './workout'

const valid = {
  workDuration: 30,
  restDuration: 10,
  intervals: 5,
  rounds: 3,
  restBetweenRounds: 60,
}

describe('workoutSchema', () => {
  it('passes a valid config', () => {
    expect(workoutSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects workDuration = 0', () => {
    const result = workoutSchema.safeParse({ ...valid, workDuration: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects workDuration < 0', () => {
    const result = workoutSchema.safeParse({ ...valid, workDuration: -5 })
    expect(result.success).toBe(false)
  })

  it('rejects restDuration < 0', () => {
    const result = workoutSchema.safeParse({ ...valid, restDuration: -1 })
    expect(result.success).toBe(false)
  })

  it('allows restDuration = 0', () => {
    expect(workoutSchema.safeParse({ ...valid, restDuration: 0 }).success).toBe(true)
  })

  it('rejects intervals = 0', () => {
    const result = workoutSchema.safeParse({ ...valid, intervals: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects fractional intervals', () => {
    const result = workoutSchema.safeParse({ ...valid, intervals: 2.5 })
    expect(result.success).toBe(false)
  })

  it('rejects rounds = 0', () => {
    const result = workoutSchema.safeParse({ ...valid, rounds: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects restBetweenRounds < 0', () => {
    const result = workoutSchema.safeParse({ ...valid, restBetweenRounds: -10 })
    expect(result.success).toBe(false)
  })

  it('allows restBetweenRounds = 0', () => {
    expect(workoutSchema.safeParse({ ...valid, restBetweenRounds: 0 }).success).toBe(true)
  })

  it('passes all fields at minimum boundary values', () => {
    const min = { workDuration: 1, restDuration: 0, intervals: 1, rounds: 1, restBetweenRounds: 0 }
    expect(workoutSchema.safeParse(min).success).toBe(true)
  })
})
