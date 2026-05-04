import { memo } from 'react'

interface StepperProps {
  value: number
  min?: number
  max?: number
  onChange: (val: number) => void
  'aria-label'?: string
}

export const Stepper = memo(function Stepper({
  value,
  min = 1,
  max = 99,
  onChange,
  'aria-label': ariaLabel,
}: StepperProps) {
  return (
    <div className="stepper" role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
      >–</button>
      <span
        className="stepper-val"
        role="spinbutton"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
      >+</button>
    </div>
  )
})
