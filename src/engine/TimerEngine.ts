import type { Phase, TimerState, WorkoutConfig } from '../types'

const COUNTDOWN_SECONDS = 3

interface TimerEngineCallbacks {
  onTick: (state: TimerState) => void
  onPhaseChange: (phase: Phase) => void
}

export class TimerEngine {
  private config: WorkoutConfig
  private callbacks: TimerEngineCallbacks
  private state: TimerState
  private rafId: number | null = null
  private paused = false
  private stopped = false
  private phaseEndTime = 0
  private remainingOnPause = 0

  constructor(config: WorkoutConfig, callbacks: TimerEngineCallbacks) {
    this.config = config
    this.callbacks = callbacks
    this.state = {
      phase: 'idle',
      currentRound: 0,
      totalRounds: config.rounds,
      currentInterval: 0,
      totalIntervals: config.intervals,
      timeRemaining: 0,
    }
  }

  start(): void {
    this.stopped = false
    this.paused = false
    this.enterPhase('countdown', COUNTDOWN_SECONDS, 0, 0)
    this.scheduleLoop()
  }

  pause(): void {
    if (this.state.phase === 'complete' || this.stopped || this.paused) return
    this.paused = true
    this.remainingOnPause = this.phaseEndTime - performance.now()
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  resume(): void {
    if (!this.paused || this.stopped) return
    this.paused = false
    this.phaseEndTime = performance.now() + this.remainingOnPause
    this.scheduleLoop()
  }

  skip(): void {
    if (this.stopped) return
    this.advance()
  }

  stop(): void {
    this.stopped = true
    this.paused = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  getState(): TimerState {
    return { ...this.state }
  }

  private scheduleLoop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId)
    this.rafId = requestAnimationFrame(this.tick)
  }

  private tick = (timestamp: number): void => {
    if (this.stopped || this.paused) return

    const remaining = this.phaseEndTime - timestamp

    if (remaining <= 0) {
      this.state = { ...this.state, timeRemaining: 0 }
      this.callbacks.onTick({ ...this.state })
      this.advance()
      return
    }

    this.state = { ...this.state, timeRemaining: remaining / 1000 }
    this.callbacks.onTick({ ...this.state })

    this.rafId = requestAnimationFrame(this.tick)
  }

  private advance(): void {
    if (this.stopped) return

    const { phase, currentRound, currentInterval } = this.state
    const { workDuration, restDuration } = this.config

    if (phase === 'countdown') {
      this.enterPhase('work', workDuration, 1, 1)
      return
    }

    if (phase === 'work') {
      if (restDuration > 0) {
        this.enterPhase('rest', restDuration, currentRound, currentInterval)
      } else {
        this.finishInterval()
      }
      return
    }

    if (phase === 'rest') {
      this.finishInterval()
      return
    }

    if (phase === 'rest-between-rounds') {
      this.enterPhase('work', workDuration, currentRound + 1, 1)
      return
    }
  }

  private finishInterval(): void {
    const { currentRound, currentInterval } = this.state
    const { workDuration, intervals, rounds, restBetweenRounds } = this.config

    const isLastInterval = currentInterval >= intervals
    const isLastRound = currentRound >= rounds

    if (!isLastInterval) {
      // Next interval in the same round
      this.enterPhase('work', workDuration, currentRound, currentInterval + 1)
      return
    }

    // Last interval of this round
    if (isLastRound) {
      this.enterPhase('complete', 0, currentRound, currentInterval)
    } else if (restBetweenRounds > 0) {
      this.enterPhase('rest-between-rounds', restBetweenRounds, currentRound, currentInterval)
    } else {
      this.enterPhase('work', workDuration, currentRound + 1, 1)
    }
  }

  private enterPhase(phase: Phase, durationSeconds: number, round: number, interval: number): void {
    const now = performance.now()
    this.phaseEndTime = now + durationSeconds * 1000

    this.state = {
      phase,
      currentRound: round,
      totalRounds: this.config.rounds,
      currentInterval: interval,
      totalIntervals: this.config.intervals,
      timeRemaining: durationSeconds,
    }

    if (phase === 'complete') {
      this.stop()
      this.stopped = false
    }

    this.callbacks.onPhaseChange(phase)
    this.callbacks.onTick({ ...this.state })

    if (!this.stopped && phase !== 'complete') this.scheduleLoop()
  }
}
