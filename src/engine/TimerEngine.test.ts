import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TimerEngine } from './TimerEngine'
import type { WorkoutConfig, TimerState, Phase } from '../types'

// 2 intervals × 2 rounds × 20s work / 10s rest / 0s between rounds
function basicConfig(): WorkoutConfig {
  return { workDuration: 20, restDuration: 10, intervals: 2, rounds: 2, restBetweenRounds: 0 }
}

// 1 interval × 1 round × 60s work / 0s rest (AMRAP-like)
function amrapConfig(): WorkoutConfig {
  return { workDuration: 60, restDuration: 0, intervals: 1, rounds: 1, restBetweenRounds: 0 }
}

function createEngine(config: WorkoutConfig): { engine: TimerEngine; ticks: TimerState[]; phases: Phase[] } {
  const ticks: TimerState[] = []
  const phases: Phase[] = []
  const engine = new TimerEngine(config, {
    onTick: (s) => ticks.push({ ...s }),
    onPhaseChange: (p) => phases.push(p),
  })
  return { engine, ticks, phases }
}

function advance(ms: number): void {
  vi.advanceTimersByTime(ms)
}

describe('TimerEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(() => { cb(performance.now()) }, 16)
    })
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts in idle phase', () => {
    const { engine } = createEngine(basicConfig())
    expect(engine.getState().phase).toBe('idle')
  })

  it('full sequence: countdown → 2 rounds × 2 intervals → complete', () => {
    const { engine, phases, ticks } = createEngine(basicConfig())
    engine.start()

    advance(3100)  // countdown
    expect(phases).toContain('countdown')
    expect(phases).toContain('work')

    // Round 1, Interval 1
    const workTick = ticks.find(t => t.phase === 'work' && t.currentRound === 1 && t.currentInterval === 1)
    expect(workTick).toBeDefined()

    advance(20100) // work → rest (round 1, interval 1)
    expect(phases).toContain('rest')

    advance(10100) // rest → work (round 1, interval 2)
    const w2 = ticks.filter(t => t.phase === 'work' && t.currentRound === 1 && t.currentInterval === 2)
    expect(w2.length).toBeGreaterThan(0)

    advance(20100) // work → rest (round 1, interval 2)
    advance(10100) // rest → work (round 2, interval 1) — no restBetweenRounds
    const r2 = ticks.filter(t => t.phase === 'work' && t.currentRound === 2 && t.currentInterval === 1)
    expect(r2.length).toBeGreaterThan(0)

    advance(20100) // work → rest (round 2, interval 1)
    advance(10100) // rest → work (round 2, interval 2)
    advance(20100) // work → rest (round 2, interval 2)
    advance(10100) // rest → complete
    expect(phases).toContain('complete')
  })

  it('rest-between-rounds fires between rounds and NOT between intervals', () => {
    const config: WorkoutConfig = {
      workDuration: 10, restDuration: 0, intervals: 2, rounds: 2, restBetweenRounds: 30,
    }
    const { engine, phases, ticks } = createEngine(config)
    engine.start()

    advance(3100)  // countdown
    advance(10100) // work round 1, interval 1 → interval 2 (no rest between intervals)
    expect(phases).not.toContain('rest-between-rounds') // not yet
    advance(10100) // work round 1, interval 2 → rest-between-rounds
    expect(phases).toContain('rest-between-rounds')

    const rbrTick = ticks.find(t => t.phase === 'rest-between-rounds')
    expect(rbrTick?.currentRound).toBe(1) // still in round 1 context
    expect(rbrTick?.timeRemaining).toBeCloseTo(30, 0)

    advance(30100) // rest-between-rounds → round 2
    const r2 = ticks.filter(t => t.phase === 'work' && t.currentRound === 2 && t.currentInterval === 1)
    expect(r2.length).toBeGreaterThan(0)
    advance(10100)
    advance(10100)
    expect(phases).toContain('complete')
  })

  it('pause stops time from advancing', () => {
    const { engine, ticks } = createEngine(basicConfig())
    engine.start()
    advance(100)

    const countBefore = ticks.length
    engine.pause()
    advance(10000)
    expect(ticks.length).toBe(countBefore)

    engine.resume()
    advance(100)
    expect(ticks.length).toBeGreaterThan(countBefore)
  })

  it('resume continues from close to where it stopped', () => {
    const { engine, ticks } = createEngine(basicConfig())
    engine.start()
    advance(3100) // countdown done
    advance(5000) // halfway through 20s work

    engine.pause()
    const atPauseTick = ticks[ticks.length - 1]
    if (!atPauseTick) {throw new Error('Expected tick at pause')}
    const atPause = { ...atPauseTick }
    advance(30000)
    engine.resume()
    advance(16)

    const afterResume = ticks[ticks.length - 1]
    if (!afterResume) {throw new Error('Expected tick after resume')}
    expect(afterResume.timeRemaining).toBeCloseTo(atPause.timeRemaining, 0)
  })

  it('stop cancels the engine', () => {
    const { engine, phases } = createEngine(basicConfig())
    engine.start()
    advance(100)
    engine.stop()
    const count = phases.length
    advance(60000)
    expect(phases.length).toBe(count)
  })

  it('skip advances to next phase immediately', () => {
    const { engine, phases } = createEngine(basicConfig())
    engine.start()
    advance(100)

    engine.skip() // skip countdown → work
    advance(16)
    expect(phases).toContain('work')

    engine.skip() // skip work → rest
    advance(16)
    expect(phases).toContain('rest')

    engine.skip() // skip rest → next interval work
    advance(16)
    expect(phases.filter(p => p === 'work').length).toBe(2)
  })

  it('0s rest: goes directly to next interval within same round', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 0, intervals: 3, rounds: 1, restBetweenRounds: 0 }
    const { engine, phases, ticks } = createEngine(config)
    engine.start()
    advance(3100) // countdown
    advance(10100) // interval 1 → interval 2
    advance(10100) // interval 2 → interval 3
    expect(phases).not.toContain('rest')
    expect(ticks.filter(t => t.phase === 'work').map(t => t.currentInterval)).toContain(3)
    advance(10100) // interval 3 → complete
    expect(phases).toContain('complete')
  })

  it('AMRAP (1 interval, 1 round, 0 rest): work → complete', () => {
    const { engine, phases } = createEngine(amrapConfig())
    engine.start()
    advance(3100)  // countdown
    advance(60100) // work → complete
    expect(phases).toContain('complete')
    expect(phases).not.toContain('rest')
    expect(phases).not.toContain('rest-between-rounds')
  })

  it('no rest-between-rounds when set to 0, even with multiple rounds', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 0, intervals: 1, rounds: 3, restBetweenRounds: 0 }
    const { engine, phases } = createEngine(config)
    engine.start()
    advance(3100)
    advance(10100) // round 1
    advance(10100) // round 2
    advance(10100) // round 3 → complete
    expect(phases).not.toContain('rest-between-rounds')
    expect(phases.filter(p => p === 'work').length).toBe(3)
    expect(phases).toContain('complete')
  })

  it('currentInterval resets to 1 at start of each round', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 0, intervals: 2, rounds: 2, restBetweenRounds: 5 }
    const { engine, ticks } = createEngine(config)
    engine.start()
    advance(3100)
    advance(10100) // round 1 interval 1
    advance(10100) // round 1 interval 2 → rest-between-rounds
    advance(5100)  // rest-between-rounds → round 2 interval 1
    const r2i1 = ticks.find(t => t.phase === 'work' && t.currentRound === 2 && t.currentInterval === 1)
    expect(r2i1).toBeDefined()
  })

  it('multiple skips in succession work correctly', () => {
    const { engine, phases } = createEngine(basicConfig())
    engine.start()
    advance(100)

    engine.skip() // countdown → work
    advance(16)
    engine.skip() // work → rest
    advance(16)
    engine.skip() // rest → work (interval 2)
    advance(16)

    const workCount = phases.filter(p => p === 'work').length
    expect(workCount).toBe(2)
  })

  it('pause during rest-between-rounds does not advance', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 0, intervals: 1, rounds: 2, restBetweenRounds: 30 }
    const { engine, ticks } = createEngine(config)
    engine.start()
    advance(3100) // countdown
    advance(10100) // work → rest-between-rounds

    engine.pause()
    const before = ticks.length
    advance(20000)
    expect(ticks.length).toBe(before)

    engine.resume()
    advance(30100) // complete the remaining rest-between-rounds
    const inWork = ticks.some(t => t.phase === 'work' && t.currentRound === 2)
    expect(inWork).toBe(true)
  })
})
