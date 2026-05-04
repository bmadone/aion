import { useState, useRef, useCallback, useEffect } from 'react'
import type { WorkoutConfig } from './types'
import { useTheme } from './hooks/useTheme'
import { soundManager } from './sound/SoundManager'
import { NavBar } from './components/NavBar'
import { WorkoutForm } from './components/WorkoutForm'
import { TimerDisplay } from './components/TimerDisplay'
import { ErrorBoundary } from './components/ErrorBoundary'

type View = 'form' | 'timer'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [muted, setMuted]   = useState(() => soundManager.muted)
  const [view, setView]     = useState<View>('form')
  const [config, setConfig] = useState<WorkoutConfig | null>(null)
  const startBtnRef = useRef<HTMLButtonElement>(null)
  const stopBtnRef  = useRef<HTMLButtonElement>(null)

  const handleMuteToggle = useCallback(() => {
    const next = !muted
    soundManager.setMuted(next)
    setMuted(next)
  }, [muted])

  const handleStart = useCallback((cfg: WorkoutConfig) => {
    soundManager.preload()
    setConfig(cfg)
    setView('timer')
  }, [])

  const handleStop = useCallback(() => {
    setView('form')
  }, [])

  // Return focus to Start button after timer ends — runs when view flips back to form
  useEffect(() => {
    if (view === 'form') startBtnRef.current?.focus()
  }, [view])

  return (
    <ErrorBoundary>
      <NavBar
        theme={theme}
        onThemeToggle={toggleTheme}
        muted={muted}
        onMuteToggle={handleMuteToggle}
      />
      <main className="main-content">
        {view === 'form' && (
          <WorkoutForm onStart={handleStart} startBtnRef={startBtnRef} />
        )}
        {view === 'timer' && config && (
          <ErrorBoundary>
            <TimerDisplay config={config} onStop={handleStop} stopBtnRef={stopBtnRef} />
          </ErrorBoundary>
        )}
      </main>
    </ErrorBoundary>
  )
}
