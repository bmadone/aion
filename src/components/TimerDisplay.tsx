import { useState, useEffect, useRef, useCallback } from 'react'
import type { Phase, TimerState, WorkoutConfig } from '../types'
import { TimerEngine } from '../engine/TimerEngine'
import { soundManager } from '../sound/SoundManager'
import { CountdownOverlay } from './CountdownOverlay'
import { ConfettiEffect } from './ConfettiEffect'

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
    const rem = s % 60
    return `${m}:${String(rem).padStart(2, '0')}`
  }
  return String(Math.max(0, s))
}

function phaseDuration(phase: Phase, config: WorkoutConfig): number {
  if (phase === 'work') return config.workDuration
  if (phase === 'rest') return config.restDuration
  if (phase === 'rest-between-rounds') return config.restBetweenRounds
  if (phase === 'countdown') return COUNTDOWN_SECONDS
  return 0
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
  const engineRef = useRef<TimerEngine | null>(null)
  const displayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const engine = new TimerEngine(config, {
      onTick: (s) => setState({ ...s }),
      onPhaseChange: (phase) => {
        if (phase === 'work') soundManager.playWork()
        else if (phase === 'rest' || phase === 'rest-between-rounds') soundManager.playRest()
        else if (phase === 'complete') soundManager.playComplete()
      },
    })
    engineRef.current = engine
    engine.start()
    displayRef.current?.focus()
    return () => engine.stop()
  }, [config])

  const handlePauseResume = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (paused) { engine.resume(); setPaused(false) }
    else { engine.pause(); setPaused(true) }
  }, [paused])

  const handleSkip = useCallback(() => { engineRef.current?.skip() }, [])
  const handleStop = useCallback(() => { engineRef.current?.stop(); onStop() }, [onStop])

  const { phase, currentRound, totalRounds, currentInterval, totalIntervals, timeRemaining } = state

  const isComplete  = phase === 'complete'
  const isWork      = phase === 'work'
  const isRest      = phase === 'rest'
  const isBlockRest = phase === 'rest-between-rounds'
  const isCountdown = phase === 'countdown'


  // 0 = just started, 1 = time's up — drives glow intensity
  const duration = phaseDuration(phase, config)
  const intensity = duration > 0 ? Math.max(0, Math.min(1, 1 - timeRemaining / duration)) : 0

  let bgClass = 'timer-display'
  if (isWork)      bgClass += ' timer-display--work'
  else if (isRest) bgClass += ' timer-display--rest'
  else if (isBlockRest) bgClass += ' timer-display--block-rest'
  else if (isComplete)  bgClass += ' timer-display--complete'

  const phaseLabel = isBlockRest ? 'BLOCK REST' : phase.toUpperCase()

  return (
    <div
      ref={displayRef}
      className={bgClass}
      role="timer"
      tabIndex={-1}
      aria-label="Workout timer"
      style={{ '--intensity': intensity } as React.CSSProperties}
    >
      <ConfettiEffect active={isComplete} />

      {isCountdown ? (
        <CountdownOverlay count={timeRemaining} />
      ) : isComplete ? (
        <div className="timer-complete">
          <div className="complete-icon" aria-hidden="true">🏆</div>
          <div className="complete-text">Workout Complete!</div>
          <button className="btn-primary" onClick={handleStop} aria-label="Done">
            Done
          </button>
        </div>
      ) : (
        <>
          {/* top: round info */}
          <div className="timer-top">
            <span className="round-indicator" aria-label={`Round ${currentRound} of ${totalRounds}`}>
              Round {currentRound} / {totalRounds}
            </span>
            {totalIntervals > 1 && (
              <span className="interval-indicator">
                {currentInterval} / {totalIntervals}
              </span>
            )}
          </div>

          {/* center: countdown number */}
          <div
            className="timer-countdown"
            aria-live="assertive"
            aria-atomic="true"
            aria-label={`${formatTime(timeRemaining)} remaining`}
          >
            {formatTime(timeRemaining)}
          </div>

          {/* bottom: phase label + controls */}
          <div className="timer-bottom">
            <div className="phase-label" aria-label={`Phase: ${phaseLabel}`}>
              {phaseLabel}
            </div>

            <div className="timer-controls">
              <button
                className="btn-secondary"
                onClick={handleStop}
                ref={stopBtnRef}
                aria-label="Stop"
              >
                Stop
              </button>
              <button
                className="btn-primary btn-pause"
                onClick={handlePauseResume}
                aria-label={paused ? 'Resume' : 'Pause'}
                aria-pressed={paused}
              >
                {paused ? 'Resume' : 'Pause'}
              </button>
              <button
                className="btn-secondary"
                onClick={handleSkip}
                aria-label="Skip"
              >
                Skip
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
