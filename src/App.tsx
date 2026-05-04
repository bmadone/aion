import { useState, useRef, useCallback } from 'react'
import type { WorkoutConfig } from './types'
import { useTheme } from './hooks/useTheme'
import { soundManager } from './sound/SoundManager'
import { NavBar } from './components/NavBar'
import { WorkoutForm } from './components/WorkoutForm'
import { TimerDisplay } from './components/TimerDisplay'

type View = 'form' | 'timer'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const [muted, setMuted] = useState(() => soundManager.muted)
  const [view, setView] = useState<View>('form')
  const [config, setConfig] = useState<WorkoutConfig | null>(null)
  const startBtnRef = useRef<HTMLButtonElement>(null)
  const stopBtnRef = useRef<HTMLButtonElement>(null)

  const handleMuteToggle = useCallback(() => {
    const next = !muted
    soundManager.setMuted(next)
    setMuted(next)
  }, [muted])

  const handleStart = useCallback((cfg: WorkoutConfig) => {
    soundManager.preload() // after user gesture — safe to init AudioContext
    setConfig(cfg)
    setView('timer')
  }, [])

  const handleStop = useCallback(() => {
    setView('form')
    setTimeout(() => startBtnRef.current?.focus(), 50)
  }, [])

  return (
    <>
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
          <TimerDisplay config={config} onStop={handleStop} stopBtnRef={stopBtnRef} />
        )}
      </main>
    </>
  )
}
