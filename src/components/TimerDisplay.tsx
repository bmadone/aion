import { useState, useEffect, useRef, useCallback, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import type { Phase, TimerState, WorkoutConfig } from '../types'
import type { HrStatus } from '../hooks/use-heart-rate'
import { TimerEngine } from '../engine/TimerEngine'
import { soundManager } from '../sound/SoundManager'
import { CountdownOverlay } from './CountdownOverlay'
import { useConfetti } from '../hooks/use-confetti'
import { useConfig, useStore } from '../store'

const COUNTDOWN_SECONDS = 3

interface TimerDisplayProperties {
  readonly stopBtnRef: React.RefObject<HTMLButtonElement | null>
  readonly heartRate: { readonly status: HrStatus; readonly bpm: number | null }
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
  if (phase === 'work') {return config.workDuration}
  if (phase === 'rest') {return config.restDuration}
  if (phase === 'rest-between-rounds') {return config.restBetweenRounds}
  if (phase === 'countdown') {return COUNTDOWN_SECONDS}
  return 0
}

function getTimerBgClass(phase: Phase): string {
  const base = 'timer-display'
  if (phase === 'work') {return `${base} timer-display--work`}
  if (phase === 'rest') {return `${base} timer-display--rest`}
  if (phase === 'rest-between-rounds') {return `${base} timer-display--block-rest`}
  if (phase === 'complete') {return `${base} timer-display--complete`}
  return base
}

function handlePhaseSound(phase: Phase): void {
  switch (phase) {
    case 'work': { soundManager.playWork(); break }
    case 'rest':
    case 'rest-between-rounds': { soundManager.playRest(); break }
    case 'complete': { soundManager.playComplete(); break }
    case 'idle':
    case 'countdown': { break }
  }
}

interface CompleteViewProperties {
  readonly onStop: () => void
}

function TimerCompleteView({ onStop }: CompleteViewProperties): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="timer-complete">
      <div className="complete-icon" aria-hidden="true">🏆</div>
      <div className="complete-text">{t('timer.completeMessage')}</div>
      <button className="btn-primary" onClick={onStop} aria-label={t('timer.returnToForm')}>
        {t('timer.doneButton')}
      </button>
    </div>
  )
}

interface ActiveViewProperties {
  readonly state: TimerState
  readonly paused: boolean
  readonly stopBtnRef: React.RefObject<HTMLButtonElement | null>
  readonly phaseLabel: string
  readonly bpm: number | null
  readonly hrConnected: boolean
  readonly onStop: () => void
  readonly onPauseResume: () => void
  readonly onSkip: () => void
}

function TimerActiveView({ state, paused, stopBtnRef, phaseLabel, bpm, hrConnected, onStop, onPauseResume, onSkip }: ActiveViewProperties): JSX.Element {
  const { t } = useTranslation()
  const { currentRound, totalRounds, currentInterval, totalIntervals, timeRemaining } = state
  return (
    <>
      <div className="timer-top">
        <div className="timer-header-row">
          <span aria-label={t('timer.roundIndicator', { current: currentRound, total: totalRounds })} className="round-indicator">
            Round {currentRound} / {totalRounds}
          </span>
          {totalIntervals > 1 && (
            <span aria-label={t('timer.intervalIndicator', { current: currentInterval, total: totalIntervals })} className="interval-indicator">
              {currentInterval} / {totalIntervals}
            </span>
          )}
        </div>
      </div>
      <div className="timer-countdown" aria-live="assertive" aria-atomic="true" aria-label={t('timer.timeRemaining', { time: formatTime(timeRemaining) })}>
        {formatTime(timeRemaining)}
      </div>
      <div className="timer-bottom">
        {hrConnected && bpm !== null && (
          <div className="hr-display" aria-label={`${bpm} bpm`}>
            <Heart size={18} fill="currentColor" aria-hidden="true" />
            <span>{bpm}</span>
          </div>
        )}
        <div className="phase-label" aria-hidden="true">{phaseLabel}</div>
        <div className="timer-controls">
          <button className="btn-secondary" onClick={onStop} ref={stopBtnRef} aria-label={t('timer.stopButton')}>
            {t('timer.stopText')}
          </button>
          <button className="btn-primary btn-pause" onClick={onPauseResume} aria-label={paused ? t('timer.resumeButton') : t('timer.pauseButton')} aria-pressed={paused}>
            {paused ? t('timer.resumeText') : t('timer.pauseText')}
          </button>
          <button className="btn-secondary" onClick={onSkip} aria-label={t('timer.skipButton')}>
            {t('timer.skipText')}
          </button>
        </div>
      </div>
    </>
  )
}

export function TimerDisplay({ stopBtnRef, heartRate }: TimerDisplayProperties): JSX.Element {
  const { t } = useTranslation()
  const config  = useConfig()
  const setView = useStore((s) => s.setView)
  const [state, setState] = useState<TimerState>({ phase: 'idle', currentRound: 0, totalRounds: config.rounds, currentInterval: 0, totalIntervals: config.intervals, timeRemaining: 0 })
  const [paused, setPaused] = useState(false)
  const engineRef  = useRef<TimerEngine | null>(null)
  const displayRef = useRef<HTMLDivElement | null>(null)

  const { phase, timeRemaining } = state
  const isComplete  = phase === 'complete'
  const isCountdown = phase === 'countdown'
  const intensity   = getPhaseDuration(phase, config) > 0
    ? Math.max(0, Math.min(1, 1 - timeRemaining / getPhaseDuration(phase, config)))
    : 0

  useConfetti(isComplete)

  useEffect(() => {
    const engine = new TimerEngine(config, { onTick: (s) => setState({ ...s }), onPhaseChange: handlePhaseSound })
    engineRef.current = engine
    engine.start()
    displayRef.current?.focus()
    return () => engine.stop()
  }, [config])

  const handleStop = useCallback(() => { engineRef.current?.stop(); setView('form') }, [setView])

  const handlePauseResume = useCallback(() => {
    const engine = engineRef.current
    if (!engine) {return}
    if (paused) { engine.resume(); setPaused(false) }
    else        { engine.pause();  setPaused(true) }
  }, [paused])

  const handleSkip = useCallback(() => { engineRef.current?.skip() }, [])

  useEffect(() => {
    const onKeyDown = (event_: KeyboardEvent): void => {
      if (event_.target instanceof HTMLButtonElement) {return}
      if (event_.code === 'Space' && !isComplete && !isCountdown) { event_.preventDefault(); handlePauseResume() }
      else if (event_.key === 's' || event_.key === 'S') { handleStop() }
      else if (event_.key === 'ArrowRight' && !isComplete) { handleSkip() }
    }
    globalThis.addEventListener('keydown', onKeyDown)
    return () => globalThis.removeEventListener('keydown', onKeyDown)
  }, [isComplete, isCountdown, handlePauseResume, handleStop, handleSkip])

  const phaseLabel = phase === 'rest-between-rounds'
    ? t('timer.blockRestPhase')
    : t(`timer.${phase}Phase`, { defaultValue: phase.toUpperCase() })

  return (
    <div ref={displayRef} className={getTimerBgClass(phase)} role="timer" tabIndex={-1} aria-label={t('timer.ariaLabel')} style={{ '--intensity': intensity } as React.CSSProperties}>
      {isCountdown && <CountdownOverlay count={timeRemaining} />}
      {isComplete && <TimerCompleteView onStop={handleStop} />}
      {!isCountdown && !isComplete && (
        <TimerActiveView state={state} paused={paused} stopBtnRef={stopBtnRef} phaseLabel={phaseLabel} bpm={heartRate.bpm} hrConnected={heartRate.status === 'connected'} onStop={handleStop} onPauseResume={handlePauseResume} onSkip={handleSkip} />
      )}
    </div>
  )
}
