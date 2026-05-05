import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore, useTheme, useMuted } from '../store'
import { LanguageSwitcher } from './LanguageSwitcher'

export function NavBar(): JSX.Element {
  const { t } = useTranslation()
  const theme       = useTheme()
  const muted       = useMuted()
  const toggleTheme = useStore((s) => s.toggleTheme)
  const toggleMuted = useStore((s) => s.toggleMuted)

  return (
    <nav className="navbar" role="navigation" aria-label={t('nav.ariaLabel')}>
      <span className="navbar-brand">Aion</span>
      <div className="navbar-controls">
        <LanguageSwitcher />
        <button
          className="icon-btn"
          onClick={toggleMuted}
          aria-label={muted ? t('nav.unmuteSounds') : t('nav.muteSounds')}
          aria-pressed={muted}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          )}
        </button>
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  )
}
