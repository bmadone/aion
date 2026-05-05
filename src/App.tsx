import { useRef, useEffect, type JSX } from 'react'
import { useStore, useView, useTheme } from './store'
import { useI18nDirection } from './hooks/use-i18n-direction'
import { soundManager } from './sound/SoundManager'
import { NavBar } from './components/NavBar'
import { WorkoutForm } from './components/WorkoutForm'
import { TimerDisplay } from './components/TimerDisplay'
import { ErrorBoundary } from './components/ErrorBoundary'

export default function App(): JSX.Element {
  const view  = useView()
  const theme = useTheme()
  useI18nDirection()
  const startBtnRef = useRef<HTMLButtonElement>(null)
  const stopBtnRef  = useRef<HTMLButtonElement>(null)

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
    if (view === 'form') {startBtnRef.current?.focus()}
  }, [view])

  return (
    <ErrorBoundary>
      <NavBar />
      <main className="main-content">
        {view === 'form' && (
          <WorkoutForm startBtnRef={startBtnRef} />
        )}
        {view === 'timer' && (
          <ErrorBoundary>
            <TimerDisplay stopBtnRef={stopBtnRef} />
          </ErrorBoundary>
        )}
      </main>
    </ErrorBoundary>
  )
}
