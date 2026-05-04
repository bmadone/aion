import { memo } from 'react'
import type { Preset, WorkoutConfig } from '../types'
import { PRESETS } from '../types'

interface PresetSelectorProps {
  selected: Preset
  onSelect: (preset: Preset, config: WorkoutConfig | null) => void
}

const PRESET_LABELS: Record<Preset, string> = {
  custom: 'Custom',
  tabata: 'Tabata',
  amrap:  'AMRAP',
  emom:   'EMOM',
}

export const PresetSelector = memo(function PresetSelector({ selected, onSelect }: PresetSelectorProps) {
  return (
    <div className="preset-selector" role="group" aria-label="Workout presets">
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
