import { useRef, useEffect, useLayoutEffect, useCallback } from 'react'

const ITEM_H  = 44   // px per item
const VISIBLE = 3    // items shown at once
const PAD     = Math.floor(VISIBLE / 2) // 1

interface WheelPickerProps {
  values: number[]
  value: number
  onChange: (val: number) => void
  format?: (n: number) => string
  'aria-label'?: string
}

export function WheelPicker({
  values,
  value,
  onChange,
  format,
  'aria-label': ariaLabel,
}: WheelPickerProps) {
  const ref        = useRef<HTMLDivElement>(null)
  const timer      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialized = useRef(false)

  const idxOf = (v: number) => {
    const i = values.indexOf(v)
    return i < 0 ? 0 : i
  }

  // Set scroll position before paint on mount (no flicker)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || initialized.current) return
    el.scrollTop = idxOf(value) * ITEM_H
    initialized.current = true
  }) // eslint-disable-line react-hooks/exhaustive-deps

  // Smooth scroll when value changes externally (e.g. preset selection)
  useEffect(() => {
    const el = ref.current
    if (!el || !initialized.current) return
    const target = idxOf(value) * ITEM_H
    if (Math.abs(el.scrollTop - target) > 4) {
      el.scrollTo({ top: target, behavior: 'smooth' })
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(values.length - 1, i))
      const picked = values[clamped]
      if (picked !== value) onChange(picked)
    }, 60)
  }, [values, value, onChange])

  return (
    <div className="wheel-wrap" role="listbox" aria-label={ariaLabel}>
      <div className="wheel-highlight" aria-hidden="true" />
      <div
        ref={ref}
        className="wheel-scroll"
        onScroll={handleScroll}
      >
        {Array.from({ length: PAD }, (_, i) => (
          <div key={`pt${i}`} className="wheel-pad" aria-hidden="true" />
        ))}
        {values.map((v) => (
          <div
            key={v}
            className={`wheel-item${v === value ? ' wheel-item--sel' : ''}`}
            role="option"
            aria-selected={v === value}
          >
            {format ? format(v) : String(v).padStart(2, '0')}
          </div>
        ))}
        {Array.from({ length: PAD }, (_, i) => (
          <div key={`pb${i}`} className="wheel-pad" aria-hidden="true" />
        ))}
      </div>
    </div>
  )
}
