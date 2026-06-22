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
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => {
      return setTimeout(() => { callback(performance.now()) }, 16)
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

    advance(20_100) // work → rest (round 1, interval 1)
    expect(phases).toContain('rest')

    advance(10_100) // rest → work (round 1, interval 2)
    const w2 = ticks.filter(t => t.phase === 'work' && t.currentRound === 1 && t.currentInterval === 2)
    expect(w2.length).toBeGreaterThan(0)

    advance(20_100) // work → rest (round 1, interval 2)
    advance(10_100) // rest → work (round 2, interval 1) — no restBetweenRounds
    const r2 = ticks.filter(t => t.phase === 'work' && t.currentRound === 2 && t.currentInterval === 1)
    expect(r2.length).toBeGreaterThan(0)

    advance(20_100) // work → rest (round 2, interval 1)
    advance(10_100) // rest → work (round 2, interval 2)
    advance(20_100) // work → rest (round 2, interval 2)
    advance(10_100) // rest → complete
    expect(phases).toContain('complete')
  })

  it('rest-between-rounds fires between rounds and NOT between intervals', () => {
    const config: WorkoutConfig = {
      workDuration: 10, restDuration: 0, intervals: 2, rounds: 2, restBetweenRounds: 30,
    }
    const { engine, phases, ticks } = createEngine(config)
    engine.start()

    advance(3100)  // countdown
    advance(10_100) // work round 1, interval 1 → interval 2 (no rest between intervals)
    expect(phases).not.toContain('rest-between-rounds') // not yet
    advance(10_100) // work round 1, interval 2 → rest-between-rounds
    expect(phases).toContain('rest-between-rounds')

    const rbrTick = ticks.find(t => t.phase === 'rest-between-rounds')
    expect(rbrTick?.currentRound).toBe(1) // still in round 1 context
    expect(rbrTick?.timeRemaining).toBeCloseTo(30, 0)

    advance(30_100) // rest-between-rounds → round 2
    const r2 = ticks.filter(t => t.phase === 'work' && t.currentRound === 2 && t.currentInterval === 1)
    expect(r2.length).toBeGreaterThan(0)
    advance(10_100)
    advance(10_100)
    expect(phases).toContain('complete')
  })

  it('pause stops time from advancing', () => {
    const { engine, ticks } = createEngine(basicConfig())
    engine.start()
    advance(100)

    const countBefore = ticks.length
    engine.pause()
    advance(10_000)
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
    const atPauseTick = ticks.at(-1)
    if (!atPauseTick) {throw new Error('Expected tick at pause')}
    const atPause = { ...atPauseTick }
    advance(30_000)
    engine.resume()
    advance(16)

    const afterResume = ticks.at(-1)
    if (!afterResume) {throw new Error('Expected tick after resume')}
    expect(afterResume.timeRemaining).toBeCloseTo(atPause.timeRemaining, 0)
  })

  it('stop cancels the engine', () => {
    const { engine, phases } = createEngine(basicConfig())
    engine.start()
    advance(100)
    engine.stop()
    const count = phases.length
    advance(60_000)
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
    advance(10_100) // interval 1 → interval 2
    advance(10_100) // interval 2 → interval 3
    expect(phases).not.toContain('rest')
    expect(ticks.filter(t => t.phase === 'work').map(t => t.currentInterval)).toContain(3)
    advance(10_100) // interval 3 → complete
    expect(phases).toContain('complete')
  })

  it('AMRAP (1 interval, 1 round, 0 rest): work → complete', () => {
    const { engine, phases } = createEngine(amrapConfig())
    engine.start()
    advance(3100)  // countdown
    advance(60_100) // work → complete
    expect(phases).toContain('complete')
    expect(phases).not.toContain('rest')
    expect(phases).not.toContain('rest-between-rounds')
  })

  it('no rest-between-rounds when set to 0, even with multiple rounds', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 0, intervals: 1, rounds: 3, restBetweenRounds: 0 }
    const { engine, phases } = createEngine(config)
    engine.start()
    advance(3100)
    advance(10_100) // round 1
    advance(10_100) // round 2
    advance(10_100) // round 3 → complete
    expect(phases).not.toContain('rest-between-rounds')
    expect(phases.filter(p => p === 'work').length).toBe(3)
    expect(phases).toContain('complete')
  })

  it('currentInterval resets to 1 at start of each round', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 0, intervals: 2, rounds: 2, restBetweenRounds: 5 }
    const { engine, ticks } = createEngine(config)
    engine.start()
    advance(3100)
    advance(10_100) // round 1 interval 1
    advance(10_100) // round 1 interval 2 → rest-between-rounds
    advance(5100)  // rest-between-rounds → round 2 interval 1
    const r2index1 = ticks.find(t => t.phase === 'work' && t.currentRound === 2 && t.currentInterval === 1)
    expect(r2index1).toBeDefined()
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

  it('last interval of non-last round skips rest and uses rest-between-rounds', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 5, intervals: 2, rounds: 2, restBetweenRounds: 30 }
    const { engine, phases, ticks } = createEngine(config)
    engine.start()
    advance(3100)  // countdown

    // interval 1: work → rest (not last interval, normal rest applies)
    advance(10_100) // work interval 1
    expect(phases).toContain('rest')

    advance(5100)  // rest interval 1 → work interval 2

    // interval 2 is last in round 1 — rest should be skipped, rest-between-rounds should fire
    const restCountBeforeLastWork = phases.filter(p => p === 'rest').length
    advance(10_100) // work interval 2 (last in round 1)

    expect(phases.filter(p => p === 'rest').length).toBe(restCountBeforeLastWork)
    expect(phases).toContain('rest-between-rounds')

    const rbrTick = ticks.find(t => t.phase === 'rest-between-rounds')
    expect(rbrTick?.timeRemaining).toBeCloseTo(30, 0)
  })

  // Bug: skip() while paused didn't update remainingOnPause, so resume() overwrote
  // the new phase's phaseEndTime with the stale value from before the skip.
  // it.fails: the body asserts the stale (wrong) value — it now fails → it.fails passes.
  it.fails('BUG: skip while paused carries over stale remainingOnPause to resume', () => {
    const { engine, ticks } = createEngine(basicConfig())
    engine.start()
    advance(3100)  // countdown
    advance(5000)  // 5s into 20s work → ~15s remaining
    engine.pause()
    engine.skip()  // enter rest (10s), still paused
    advance(5000)  // 5s elapses while paused
    engine.resume()
    advance(16)

    const afterResume = ticks.at(-1)
    if (!afterResume) {throw new Error('Expected tick after resume')}
    // stale remainingOnPause (~15s) — the wrong value the bug produced
    expect(afterResume.timeRemaining).toBeCloseTo(15, 0)
  })

  it('skip while paused: new phase starts from full duration', () => {
    const { engine, ticks } = createEngine(basicConfig())
    engine.start()
    advance(3100)  // countdown
    advance(5000)  // 5s into 20s work → ~15s remaining
    engine.pause()
    engine.skip()  // enter rest (10s) — timer starts immediately
    advance(16)

    const afterSkip = ticks.at(-1)
    if (!afterSkip) {throw new Error('Expected tick after skip')}
    expect(afterSkip.phase).toBe('rest')
    expect(afterSkip.timeRemaining).toBeCloseTo(10, 0)
  })

  it.fails('BUG: skip while paused leaves timer paused instead of starting it', () => {
    const { engine, ticks } = createEngine(basicConfig())
    engine.start()
    advance(3100)  // countdown
    advance(5000)  // into work
    engine.pause()
    engine.skip()  // skip to rest — should start running
    const countAfterSkip = ticks.length
    advance(500)   // BUG: no ticks because timer stayed paused
    expect(ticks.length).toBe(countAfterSkip)  // asserts the broken behavior
  })

  it('skip while paused starts the timer on the new phase', () => {
    const { engine, ticks } = createEngine(basicConfig())
    engine.start()
    advance(3100)  // countdown
    advance(5000)  // into work
    engine.pause()
    engine.skip()  // skip to rest — timer should start immediately
    const countAfterSkip = ticks.length
    advance(500)   // timer should be running now
    expect(ticks.length).toBeGreaterThan(countAfterSkip)
    const latest = ticks.at(-1)
    if (!latest) {throw new Error('Expected tick')}
    expect(latest.phase).toBe('rest')
  })

  it('mid-round intervals still get normal rest when restBetweenRounds > 0', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 5, intervals: 3, rounds: 2, restBetweenRounds: 30 }
    const { engine, phases } = createEngine(config)
    engine.start()
    advance(3100)   // countdown
    advance(10_100) // work interval 1 → rest
    expect(phases).toContain('rest')
    advance(5100)   // rest → work interval 2
    advance(10_100) // work interval 2 → rest (still mid-round)
    expect(phases.filter(p => p === 'rest').length).toBe(2)
  })

  it('pause during rest-between-rounds does not advance', () => {
    const config: WorkoutConfig = { workDuration: 10, restDuration: 0, intervals: 1, rounds: 2, restBetweenRounds: 30 }
    const { engine, ticks } = createEngine(config)
    engine.start()
    advance(3100) // countdown
    advance(10_100) // work → rest-between-rounds

    engine.pause()
    const before = ticks.length
    advance(20_000)
    expect(ticks.length).toBe(before)

    engine.resume()
    advance(30_100) // complete the remaining rest-between-rounds
    const inWork = ticks.some(t => t.phase === 'work' && t.currentRound === 2)
    expect(inWork).toBe(true)
  })
})
