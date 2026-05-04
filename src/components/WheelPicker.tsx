import { memo, useRef, useLayoutEffect, useEffect, useCallback } from 'react'

export const ITEM_H  = 44
const VISIBLE = 3
const PAD     = Math.floor(VISIBLE / 2) // 1

interface WheelPickerProps {
  values: number[]
  value: number
  onChange: (val: number) => void
  format?: (n: number) => string
  'aria-label'?: string
}

export const WheelPicker = memo(function WheelPicker({
  values,
  value,
  onChange,
  format,
  'aria-label': ariaLabel,
}: WheelPickerProps) {
  const ref        = useRef<HTMLDivElement>(null)
  const timer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  const idxOf = (v: number): number => {
    const i = values.indexOf(v)
    return i < 0 ? 0 : i
  }

  // Set scroll position before paint on mount — prevents flash at position 0
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTop = idxOf(value) * ITEM_H
    initialized.current = true
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Smooth scroll when value changes externally (preset selection)
  useEffect(() => {
    const el = ref.current
    if (!el || !initialized.current) return
    const target = idxOf(value) * ITEM_H
    if (Math.abs(el.scrollTop - target) > 4) {
      el.scrollTo({ top: target, behavior: 'smooth' })
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(values.length - 1, i))
      const picked = values[clamped]
      if (picked !== undefined && picked !== value) onChange(picked)
    }, 60)
  }, [values, value, onChange])

  // Arrow key navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = idxOf(value)
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = values[idx - 1]
      if (idx > 0 && prev !== undefined) onChange(prev)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = values[idx + 1]
      if (idx < values.length - 1 && next !== undefined) onChange(next)
    }
  }, [values, value, onChange]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="wheel-wrap"
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={values[0]}
      aria-valuemax={values[values.length - 1]}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="wheel-highlight" aria-hidden="true" />
      <div
        ref={ref}
        className="wheel-scroll"
        onScroll={handleScroll}
        aria-hidden="true"
      >
        {Array.from({ length: PAD }, (_, i) => (
          <div key={`top-${i}`} className="wheel-pad" />
        ))}
        {values.map((v) => (
          <div
            key={v}
            className={`wheel-item${v === value ? ' wheel-item--sel' : ''}`}
          >
            {format ? format(v) : String(v).padStart(2, '0')}
          </div>
        ))}
        {Array.from({ length: PAD }, (_, i) => (
          <div key={`bot-${i}`} className="wheel-pad" />
        ))}
      </div>
    </div>
  )
})
