import { describe, it, expect } from 'vitest'
import { validateConfig, isValid } from './validation'
import type { WorkoutConfig } from '../types'

const valid: WorkoutConfig = {
  workDuration: 30, restDuration: 10, intervals: 5, rounds: 3, restBetweenRounds: 60,
}

describe('validateConfig', () => {
  it('passes a valid config', () => {
    expect(isValid(validateConfig(valid))).toBe(true)
  })

  it('rejects workDuration = 0', () => {
    const e = validateConfig({ ...valid, workDuration: 0 })
    expect(e.workDuration).toBeDefined()
  })

  it('rejects workDuration < 0', () => {
    expect(validateConfig({ ...valid, workDuration: -5 }).workDuration).toBeDefined()
  })

  it('rejects restDuration < 0', () => {
    expect(validateConfig({ ...valid, restDuration: -1 }).restDuration).toBeDefined()
  })

  it('allows restDuration = 0', () => {
    expect(validateConfig({ ...valid, restDuration: 0 }).restDuration).toBeUndefined()
  })

  it('rejects intervals = 0', () => {
    expect(validateConfig({ ...valid, intervals: 0 }).intervals).toBeDefined()
  })

  it('rejects fractional intervals', () => {
    expect(validateConfig({ ...valid, intervals: 2.5 }).intervals).toBeDefined()
  })

  it('rejects rounds = 0', () => {
    expect(validateConfig({ ...valid, rounds: 0 }).rounds).toBeDefined()
  })

  it('rejects restBetweenRounds < 0', () => {
    expect(validateConfig({ ...valid, restBetweenRounds: -10 }).restBetweenRounds).toBeDefined()
  })

  it('allows restBetweenRounds = 0', () => {
    expect(validateConfig({ ...valid, restBetweenRounds: 0 }).restBetweenRounds).toBeUndefined()
  })
})
