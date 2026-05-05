import { useState, useEffect, useRef, useCallback, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import type { Phase, TimerState, WorkoutConfig } from '../types'
import { TimerEngine } from '../engine/TimerEngine'
import { soundManager } from '../sound/SoundManager'
import { CountdownOverlay } from './CountdownOverlay'
import { useConfetti } from '../hooks/useConfetti'
import { useConfig, useStore } from '../store'

const COUNTDOWN_SECONDS = 3

interface TimerDisplayProps {
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


export function TimerDisplay({ stopBtnRef }: TimerDisplayProps): JSX.Element {
  const { t } = useTranslation()
  const config  = useConfig()
  const setView = useStore((s) => s.setView)
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

  const handleStop = useCallback(() => {
    engineRef.current?.stop()
    setView('form')
  }, [setView])

  const handlePauseResume = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    if (paused) { engine.resume(); setPaused(false) }
    else        { engine.pause();  setPaused(true)  }
  }, [paused])

  const handleSkip = useCallback(() => {
    engineRef.current?.skip()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (!isComplete && !isCountdown) handlePauseResume()
      } else if (e.key === 's' || e.key === 'S') {
        handleStop()
      } else if (e.key === 'ArrowRight') {
        if (!isComplete) handleSkip()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isComplete, isCountdown, handlePauseResume, handleStop, handleSkip])


  let bgClass = 'timer-display'
  if (isWork)      bgClass += ' timer-display--work'
  else if (isRest) bgClass += ' timer-display--rest'
  else if (isBlockRest) bgClass += ' timer-display--block-rest'
  else if (isComplete)  bgClass += ' timer-display--complete'

  const phaseLabel = isBlockRest
    ? t('timer.blockRestPhase')
    : t(`timer.${phase}Phase`, { defaultValue: phase.toUpperCase() })

  return (
    <div
      ref={displayRef}
      className={bgClass}
      role="timer"
      tabIndex={-1}
      aria-label={t('timer.ariaLabel')}
      style={{ '--intensity': intensity } as React.CSSProperties}
    >
      {isCountdown ? (
        <CountdownOverlay count={timeRemaining} />
      ) : isComplete ? (
        <div className="timer-complete">
          <div className="complete-icon" aria-hidden="true">🏆</div>
          <div className="complete-text">{t('timer.completeMessage')}</div>
          <button className="btn-primary" onClick={handleStop} aria-label={t('timer.returnToForm')}>
            {t('timer.doneButton')}
          </button>
        </div>
      ) : (
        <>
          <div className="timer-top">
            <div className="timer-header-row">
              <span
                aria-label={t('timer.roundIndicator', { current: currentRound, total: totalRounds })}
                className="round-indicator"
              >
                Round {currentRound} / {totalRounds}
              </span>
              {totalIntervals > 1 && (
                <span
                  aria-label={t('timer.intervalIndicator', { current: currentInterval, total: totalIntervals })}
                  className="interval-indicator"
                >
                  {currentInterval} / {totalIntervals}
                </span>
              )}
            </div>
          </div>

          <div
            className="timer-countdown"
            aria-live="assertive"
            aria-atomic="true"
            aria-label={t('timer.timeRemaining', { time: formatTime(timeRemaining) })}
          >
            {formatTime(timeRemaining)}
          </div>

          <div className="timer-bottom">
            {/* Phase label separate from aria-label to avoid duplication */}
            <div className="phase-label" aria-hidden="true">{phaseLabel}</div>

            <div className="timer-controls">
              <button className="btn-secondary" onClick={handleStop} ref={stopBtnRef} aria-label={t('timer.stopButton')}>
                {t('timer.stopText')}
              </button>
              <button
                className="btn-primary btn-pause"
                onClick={handlePauseResume}
                aria-label={paused ? t('timer.resumeButton') : t('timer.pauseButton')}
                aria-pressed={paused}
              >
                {paused ? t('timer.resumeText') : t('timer.pauseText')}
              </button>
              <button className="btn-secondary" onClick={handleSkip} aria-label={t('timer.skipButton')}>
                {t('timer.skipText')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
