import { WheelPicker } from './WheelPicker'

const MINS = Array.from({ length: 60 }, (_, i) => i)
const SECS = Array.from({ length: 60 }, (_, i) => i)

interface DurationPickerProps {
  value: number  // total seconds
  onChange: (seconds: number) => void
}

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const mins = Math.min(59, Math.floor(value / 60))
  const secs = value % 60

  return (
    <div className="duration-picker">
      <WheelPicker
        values={MINS}
        value={mins}
        onChange={(m) => onChange(m * 60 + secs)}
        aria-label="Minutes"
      />
      <span className="duration-colon" aria-hidden="true">:</span>
      <WheelPicker
        values={SECS}
        value={secs}
        onChange={(s) => onChange(mins * 60 + s)}
        aria-label="Seconds"
      />
    </div>
  )
}
