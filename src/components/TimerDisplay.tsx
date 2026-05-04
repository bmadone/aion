import { useState, useEffect, useRef, useCallback } from 'react'
import type { Phase, TimerState, WorkoutConfig } from '../types'
import { TimerEngine } from '../engine/TimerEngine'
import { soundManager } from '../sound/SoundManager'
import { CountdownOverlay } from './CountdownOverlay'
import { useConfetti } from '../hooks/useConfetti'

const COUNTDOWN_SECONDS = 3

interface TimerDisplayProps {
  config: WorkoutConfig
  onStop: () => void
  stopBtnRef: React.RefObject<HTMLButtonElement | null>
}

function formatTime(seconds: number): string {
  const s = Math.ceil(seconds)
  if (s >= 60) {
    const m = Math.floor(s / 60)
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }
  return String(Math.max(0, s))
}

function getPhaseDuration(phase: Phase, config: WorkoutConfig): number {
  if (phase === 'work') return config.workDuration
  if (phase === 'rest') return config.restDuration
  if (phase === 'rest-between-rounds') return config.restBetweenRounds
  if (phase === 'countdown') return COUNTDOWN_SECONDS
  return 0
}

function getNextUp(state: TimerState, config: WorkoutConfig): string {
  const { phase, currentRound, totalRounds, currentInterval, totalIntervals } = state
  const { workDuration, restDuration, restBetweenRounds } = config
  const lastInterval = currentInterval >= totalIntervals
  const lastRound    = currentRound >= totalRounds

  if (phase === 'countdown') return `Work — ${formatTime(workDuration)}`
  if (phase === 'work') {
    if (restDuration > 0) return `Rest — ${formatTime(restDuration)}`
    if (!lastInterval) return `Work — ${formatTime(workDuration)}`
    if (!lastRound) return restBetweenRounds > 0 ? `Block rest — ${formatTime(restBetweenRounds)}` : `Work — ${formatTime(workDuration)}`
    return 'Complete!'
  }
  if (phase === 'rest') {
    if (!lastInterval) return `Work — ${formatTime(workDuration)}`
    if (!lastRound) return restBetweenRounds > 0 ? `Block rest — ${formatTime(restBetweenRounds)}` : `Work — ${formatTime(workDuration)}`
    return 'Complete!'
  }
  if (phase === 'rest-between-rounds') return `Work — ${formatTime(workDuration)}`
  return ''
}

export function TimerDisplay({ config, onStop, stopBtnRef }: TimerDisplayProps) {
  const [state, setState] = useState<TimerState>({
    phase: 'idle',
    currentRound: 0,
    totalRounds: config.rounds,
    currentInterval: 0,
    totalIntervals: config.intervals,
    timeRemaining: 0,
  })
  const [paused, setPaused] = useState(false)
  const engineRef  = useRef<TimerEngine | null>(null)
  const displayRef = useRef<HTMLDivElement | null>(null)

  const { phase, currentRound, totalRounds, currentInterval, totalIntervals, timeRemaining } = state

  const isComplete  = phase === 'complete'
  const isWork      = phase === 'work'
  const isRest      = phase === 'rest'
  const isBlockRest = phase === 'rest-between-rounds'
  const isCountdown = phase === 'countdown'

  useConfetti(isComplete)

  // Intensity: 0 = just started → 1 = time's up; drives glow brightness
  const duration  = getPhaseDuration(phase, config)
  const intensity = duration > 0 ? Math.max(0, Math.min(1, 1 - timeRemaining / duration)) : 0

  useEffect(() => {
    const engine = new TimerEngine(config, {
      onTick: (s) => setState({ ...s }),
      onPhaseChange: (p) => {
        if (p === 'work') soundManager.playWork()
        else if (p === 'rest' || p === 'rest-between-rounds') soundManager.playRest()
        else if (p === 'complete') soundManager.playComplete()
      },
    })
    engineRef.current = engine
    engine.start()
    // Move focus to timer so keyboard controls work immediately
    displayRef.current?.focus()
    return () => engine.stop()
  }, [config])

  // Return focus to Start button when going back to form
  const handleStop = useCallback(() => {
    engineRef.current?.stop()
    onStop()
  }, [onStop])

  const handlePauseResume = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (paused) { engine.resume(); setPaused(false) }
    else        { engine.pause();  setPaused(true)  }
  }, [paused])

  const handleSkip = useCallback(() => { engineRef.current?.skip() }, [])

  let bgClass = 'timer-display'
  if (isWork)      bgClass += ' timer-display--work'
  else if (isRest) bgClass += ' timer-display--rest'
  else if (isBlockRest) bgClass += ' timer-display--block-rest'
  else if (isComplete)  bgClass += ' timer-display--complete'

  const phaseLabel = isBlockRest ? 'BLOCK REST' : phase.toUpperCase()
  const nextUp     = getNextUp(state, config)

  return (
    <div
      ref={displayRef}
      className={bgClass}
      role="timer"
      tabIndex={-1}
      aria-label="Workout timer"
      style={{ '--intensity': intensity } as React.CSSProperties}
    >
      {isCountdown ? (
        <CountdownOverlay count={timeRemaining} />
      ) : isComplete ? (
        <div className="timer-complete">
          <div className="complete-icon" aria-hidden="true">🏆</div>
          <div className="complete-text">Workout Complete!</div>
          <button className="btn-primary" onClick={handleStop} aria-label="Return to form">
            Done
          </button>
        </div>
      ) : (
        <>
          <div className="timer-top">
            <div className="timer-header-row">
              <span aria-label={`Round ${currentRound} of ${totalRounds}`} className="round-indicator">
                Round {currentRound} / {totalRounds}
              </span>
              {totalIntervals > 1 && (
                <span aria-label={`Interval ${currentInterval} of ${totalIntervals}`} className="interval-indicator">
                  {currentInterval} / {totalIntervals}
                </span>
              )}
            </div>
          </div>

          <div
            className="timer-countdown"
            aria-live="assertive"
            aria-atomic="true"
            aria-label={`${formatTime(timeRemaining)} remaining`}
          >
            {formatTime(timeRemaining)}
          </div>

          <div className="timer-bottom">
            {/* Phase label separate from aria-label to avoid duplication */}
            <div className="phase-label" aria-hidden="true">{phaseLabel}</div>

            {nextUp && (
              <div className="timer-next-up" aria-label={`Next: ${nextUp}`} aria-hidden="true">
                Next: {nextUp}
              </div>
            )}

            <div className="timer-controls">
              <button className="btn-secondary" onClick={handleStop} ref={stopBtnRef} aria-label="Stop workout">
                Stop
              </button>
              <button
                className="btn-primary btn-pause"
                onClick={handlePauseResume}
                aria-label={paused ? 'Resume workout' : 'Pause workout'}
                aria-pressed={paused}
              >
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button className="btn-secondary" onClick={handleSkip} aria-label="Skip to next interval">
                Skip
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
