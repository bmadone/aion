import { useState, useEffect, useRef, useCallback, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { StopwatchEngine } from '../engine/StopwatchEngine'
import { useStore } from '../store'

function formatStopwatch(ms: number): string {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSeconds = Math.floor(ms / 1000)
  const seconds = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const minutes = totalMinutes % 60
  const hours = Math.floor(totalMinutes / 60)

  if (hours > 0) {
    return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}

function formatLapSplit(ms: number): string {
  const totalTenths = Math.floor(ms / 100)
  const tenths = totalTenths % 10
  const totalSeconds = Math.floor(ms / 1000)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}

interface StopwatchDisplayProperties {
  readonly stopBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function StopwatchDisplay({ stopBtnRef }: StopwatchDisplayProperties): JSX.Element {
  const { t } = useTranslation()
  const setView = useStore((s) => s.setView)
  const [elapsed, setElapsed] = useState(0)
  const [laps, setLaps] = useState<number[]>([])
  const [running, setRunning] = useState(false)
  const engineRef = useRef<StopwatchEngine | null>(null)
  const displayRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const engine = new StopwatchEngine({
      onTick: (elapsedMs, lapList) => { setElapsed(elapsedMs); setLaps([...lapList]) },
    })
    engineRef.current = engine
    displayRef.current?.focus()
    return () => engine.destroy()
  }, [])

  const handleStartStop = useCallback(() => {
    const engine = engineRef.current
    if (!engine) {return}
    if (running) { engine.stop(); setRunning(false) }
    else         { engine.start(); setRunning(true) }
  }, [running])

  const handleLapReset = useCallback(() => {
    const engine = engineRef.current
    if (!engine) {return}
    if (running) { engine.lap() }
    else         { engine.reset(); setElapsed(0); setLaps([]) }
  }, [running])

  const handleDone = useCallback(() => {
    engineRef.current?.destroy()
    setView('form')
  }, [setView])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLButtonElement) {return}
      if (e.code === 'Space') { e.preventDefault(); handleStartStop() }
      else if (e.key === 's' || e.key === 'S') { handleDone() }
      else if (e.key === 'l' || e.key === 'L') { handleLapReset() }
    }
    globalThis.addEventListener('keydown', onKeyDown)
    return () => globalThis.removeEventListener('keydown', onKeyDown)
  }, [handleStartStop, handleLapReset, handleDone])

  const lapSplits = laps.map((total, i) => total - (laps[i - 1] ?? 0))

  return (
    <div ref={displayRef} className="timer-display stopwatch-display" tabIndex={-1} aria-label={t('stopwatch.ariaLabel')}>
      <div className="timer-top">
        <div className="timer-header-row" />
      </div>

      <div className="timer-countdown stopwatch-time" aria-live="off" aria-label={formatStopwatch(elapsed)}>
        {formatStopwatch(elapsed)}
      </div>

      <div className="timer-bottom">
        <div className="phase-label" aria-hidden="true" />
        <div className="timer-controls">
          <button className="btn-secondary" onClick={handleDone} ref={stopBtnRef} aria-label={t('timer.stopButton')}>
            {t('timer.stopText')}
          </button>
          <button className="btn-primary btn-pause" onClick={handleStartStop} aria-pressed={running}>
            {running ? t('timer.pauseText') : t('timer.resumeText')}
          </button>
          <button className="btn-secondary" onClick={handleLapReset} disabled={!running && elapsed === 0}>
            {running ? t('stopwatch.lap') : t('stopwatch.reset')}
          </button>
        </div>
      </div>

      <LapList laps={laps} lapSplits={lapSplits} />
    </div>
  )
}

interface LapListProperties {
  readonly laps: readonly number[]
  readonly lapSplits: readonly number[]
}

function LapList({ laps, lapSplits }: LapListProperties): JSX.Element | null {
  const { t } = useTranslation()
  if (laps.length === 0) {return null}
  return (
    <ol className="stopwatch-laps" aria-label={t('stopwatch.lapsLabel')}>
      {laps.toReversed().map((total, reversedIndex) => {
        const index = laps.length - 1 - reversedIndex
        const split = lapSplits[index] ?? 0
        return (
          <li key={index} className={`stopwatch-lap${index === laps.length - 1 ? ' stopwatch-lap--latest' : ''}`}>
            <span className="lap-number">{t('stopwatch.lapLabel', { number: index + 1 })}</span>
            <span className="lap-split">{formatLapSplit(split)}</span>
            <span className="lap-total">{formatLapSplit(total)}</span>
          </li>
        )
      })}
    </ol>
  )
}
