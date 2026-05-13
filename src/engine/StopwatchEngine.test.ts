import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StopwatchEngine } from './StopwatchEngine'

function createEngine(): { engine: StopwatchEngine; ticks: { elapsed: number; laps: number[] }[] } {
  const ticks: { elapsed: number; laps: number[] }[] = []
  const engine = new StopwatchEngine({
    onTick: (elapsed, laps) => ticks.push({ elapsed, laps: [...laps] }),
  })
  return { engine, ticks }
}

function advance(ms: number): void {
  vi.advanceTimersByTime(ms)
}

describe('StopwatchEngine', () => {
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

  it('is not running initially', () => {
    const { engine } = createEngine()
    expect(engine.isRunning).toBe(false)
  })

  it('fires ticks after start', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(100)
    expect(ticks.length).toBeGreaterThan(0)
  })

  it('elapsed increases while running', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(500)
    const last = ticks.at(-1)
    expect(last?.elapsed).toBeGreaterThan(400)
  })

  it('stop halts ticks', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(100)
    engine.stop()
    const count = ticks.length
    advance(5000)
    expect(ticks.length).toBe(count)
  })

  it('stop sets isRunning to false', () => {
    const { engine } = createEngine()
    engine.start()
    advance(50)
    engine.stop()
    expect(engine.isRunning).toBe(false)
  })

  it('start after stop resumes from accumulated elapsed', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(1000)
    engine.stop()
    const elapsedAtStop = ticks.at(-1)?.elapsed ?? 0

    advance(5000)
    engine.start()
    advance(100)
    const resumedTick = ticks.at(-1)?.elapsed ?? 0
    expect(resumedTick).toBeGreaterThan(elapsedAtStop)
    expect(resumedTick).toBeCloseTo(elapsedAtStop + 100, -2)
  })

  it('calling start twice does not restart elapsed', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(500)
    const before = ticks.at(-1)?.elapsed ?? 0
    engine.start() // no-op
    advance(16)
    const after = ticks.at(-1)?.elapsed ?? 0
    expect(after).toBeGreaterThan(before)
    expect(after).toBeCloseTo(before + 16, -2)
  })

  it('lap records current time and fires onTick with updated laps', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(1000)
    engine.lap()
    const last = ticks.at(-1)
    expect(last?.laps.length).toBe(1)
    expect(last?.laps[0]).toBeGreaterThan(900)
  })

  it('multiple laps accumulate in order', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(1000)
    engine.lap()
    advance(1000)
    engine.lap()
    advance(1000)
    engine.lap()
    const last = ticks.at(-1)
    expect(last?.laps.length).toBe(3)
    expect(last?.laps[0]).toBeLessThan(last?.laps[1] ?? 0)
    expect(last?.laps[1]).toBeLessThan(last?.laps[2] ?? 0)
  })

  it('lap when not running does nothing', () => {
    const { engine, ticks } = createEngine()
    engine.lap()
    expect(ticks.length).toBe(0)
  })

  it('reset stops engine and fires onTick with 0 elapsed and empty laps', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(1000)
    engine.lap()
    engine.reset()
    const last = ticks.at(-1)
    expect(last?.elapsed).toBe(0)
    expect(last?.laps).toEqual([])
    expect(engine.isRunning).toBe(false)
  })

  it('reset clears accumulated elapsed so next start begins at 0', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(2000)
    engine.reset()
    engine.start()
    advance(200)
    const tick = ticks.at(-1)
    expect(tick?.elapsed).toBeLessThan(300)
  })

  it('destroy stops the RAF loop without firing extra ticks', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(100)
    engine.destroy()
    const count = ticks.length
    advance(5000)
    expect(ticks.length).toBe(count)
  })

  it('destroy sets isRunning to false', () => {
    const { engine } = createEngine()
    engine.start()
    engine.destroy()
    expect(engine.isRunning).toBe(false)
  })

  it('laps are not mutated between ticks', () => {
    const { engine, ticks } = createEngine()
    engine.start()
    advance(500)
    engine.lap()
    advance(500)
    engine.lap()
    const firstLapTick = ticks.find(t => t.laps.length === 1)
    expect(firstLapTick?.laps.length).toBe(1)
  })
})
