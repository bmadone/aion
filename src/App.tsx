import { useRef, useEffect, type JSX } from 'react'
import { useStore, useView, useTheme } from './store'
import { useI18nDirection } from './hooks/useI18nDirection'
import { soundManager } from './sound/SoundManager'
import { NavBar } from './components/NavBar'
import { WorkoutForm } from './components/WorkoutForm'
import { TimerDisplay } from './components/TimerDisplay'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App(): JSX.Element {
  const view  = useView()
  const theme = useTheme()
  useI18nDirection()
  const startButtonReference = useRef<HTMLButtonElement>(null)
  const stopButtonReference  = useRef<HTMLButtonElement>(null)

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme
  }, [theme])

  // Sync muted flag to SoundManager
  useEffect(() => {
    return useStore.subscribe(
      (s) => s.muted,
      (muted) => { soundManager.setMuted(muted) }
    )
  }, [])

  // Return focus to Start button when navigating back to the form
  useEffect(() => {
    if (view === 'form') {startButtonReference.current?.focus()}
  }, [view])

  return (
    <ErrorBoundary>
      <NavBar />
      <main className="main-content">
        {view === 'form' && (
          <WorkoutForm startBtnRef={startButtonReference} />
        )}
        {view === 'timer' && (
          <ErrorBoundary>
            <TimerDisplay stopBtnRef={stopButtonReference} />
          </ErrorBoundary>
        )}
      </main>
    </ErrorBoundary>
  )
}
