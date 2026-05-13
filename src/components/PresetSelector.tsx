import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Preset, WorkoutConfig } from '../types'
import { PRESETS } from '../types'

interface PresetSelectorProperties {
  selected: Preset
  onSelect: (preset: Preset, config: WorkoutConfig | null) => void
}

export const PresetSelector = memo(function PresetSelector({ selected, onSelect }: PresetSelectorProperties) {
  const { t } = useTranslation()

  const PRESET_LABELS: Record<Preset, string> = {
    custom:    t('presets.custom'),
    tabata:    t('presets.tabata'),
    hiit:      t('presets.hiit'),
    emom:      t('presets.emom'),
    stopwatch: t('presets.stopwatch'),
  }

  return (
    <div className="preset-selector" role="group" aria-label={t('form.presetsGroup')}>
      {(Object.keys(PRESETS) as Preset[]).map(preset => (
        <button
          key={preset}
          type="button"
          className={`preset-btn${selected === preset ? ' preset-btn--active' : ''}`}
          onClick={() => onSelect(preset, PRESETS[preset])}
          aria-pressed={selected === preset}
        >
          {PRESET_LABELS[preset]}
        </button>
      ))}
    </div>
  )
})
