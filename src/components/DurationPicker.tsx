import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { WheelPicker } from './WheelPicker'

const MINS = Array.from({ length: 60 }, (_, index) => index)
const SECS = Array.from({ length: 60 }, (_, index) => index)

interface DurationPickerProperties {
  value: number  // total seconds
  onChange: (seconds: number) => void
}

export const DurationPicker = memo(function DurationPicker({ value, onChange }: DurationPickerProperties) {
  const { t } = useTranslation()
  const mins = Math.min(59, Math.floor(value / 60))
  const secs = value % 60

  return (
    <div className="duration-picker">
      <WheelPicker
        values={MINS}
        value={mins}
        onChange={(m) => onChange(m * 60 + secs)}
        aria-label={t('form.minutes')}
      />
      <span className="duration-colon" aria-hidden="true">:</span>
      <WheelPicker
        values={SECS}
        value={secs}
        onChange={(s) => onChange(mins * 60 + s)}
        aria-label={t('form.seconds')}
      />
    </div>
  )
})
