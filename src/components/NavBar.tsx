import { useState, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, Heart, HeartCrack } from 'lucide-react'
import { useStore, useTheme } from '../store'
import { LanguageSwitcher } from './LanguageSwitcher'
import { HeartRateModal } from './HeartRateModal'
import type { HrStatus, UseHeartRate } from '../hooks/use-heart-rate'

interface NavBarProperties {
  readonly heartRate: UseHeartRate
}

function HrIcon({ status }: { readonly status: HrStatus }): JSX.Element {
  if (status === 'connected') { return <Heart size={18} fill="currentColor" className="hr-icon--connected" aria-hidden="true" /> }
  if (status === 'disconnected') { return <HeartCrack size={18} className="hr-icon--disconnected" aria-hidden="true" /> }
  return <Heart size={18} aria-hidden="true" />
}

function hrButtonLabel(status: HrStatus, t: (key: string) => string): string {
  if (status === 'connected') { return t('bluetooth.navConnected') }
  if (status === 'disconnected') { return t('bluetooth.navDisconnected') }
  return t('bluetooth.navIdle')
}

export function NavBar({ heartRate }: NavBarProperties): JSX.Element {
  const { t } = useTranslation()
  const theme       = useTheme()
  const toggleTheme = useStore((s) => s.toggleTheme)
  const [modalOpen, setModalOpen] = useState(false)

  const handleToggleTheme = (): void => {
    const doc = document as Document & {
      startViewTransition?: typeof document.startViewTransition
    }
    if (typeof doc.startViewTransition !== 'function') { toggleTheme(); return }
    doc.startViewTransition(toggleTheme)
  }

  return (
    <>
      <nav className="navbar" role="navigation" aria-label={t('nav.ariaLabel')}>
        <span className="navbar-brand">Aion</span>
        <div className="navbar-controls">
          <button
            className="icon-btn"
            onClick={() => { setModalOpen(true) }}
            aria-label={hrButtonLabel(heartRate.status, t)}
          >
            <HrIcon status={heartRate.status} />
          </button>
          <LanguageSwitcher />
          <button
            className="icon-btn"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? t('nav.switchToLight') : t('nav.switchToDark')}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </button>
        </div>
      </nav>
      <HeartRateModal open={modalOpen} onClose={() => { setModalOpen(false) }} heartRate={heartRate} />
    </>
  )
}
