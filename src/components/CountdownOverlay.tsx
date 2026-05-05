import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'

interface CountdownOverlayProps {
  count: number
}

export function CountdownOverlay({ count }: CountdownOverlayProps): JSX.Element {
  const { t } = useTranslation()
  const display = count <= 0 ? t('timer.go') : String(Math.ceil(count))

  return (
    <div
      className="countdown-overlay"
      role="timer"
      aria-live="assertive"
      aria-atomic="true"
      aria-label={count <= 0 ? t('timer.goAria') : t('timer.startingIn', { count: Math.ceil(count) })}
    >
      <div className="countdown-number" aria-hidden="true">{display}</div>
      <div className="countdown-label" aria-hidden="true">{t('timer.getReady')}</div>
    </div>
  )
}
