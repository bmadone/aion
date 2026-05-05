import { memo, useRef, useLayoutEffect, useEffect, useCallback } from 'react'

export const ITEM_H  = 44
const VISIBLE = 3
const PAD     = Math.floor(VISIBLE / 2) // 1

function indexOf(values: number[], v: number): number {
  return Math.max(values.indexOf(v), 0)
}

interface WheelPickerProperties {
  values: number[]
  value: number
  onChange: (value: number) => void
  format?: (n: number) => string
  'aria-label'?: string
}

export const WheelPicker = memo(function WheelPicker({
  values,
  value,
  onChange,
  format,
  'aria-label': ariaLabel,
}: WheelPickerProperties) {
  const scrollRef        = useRef<HTMLDivElement>(null)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  // Set scroll position before paint on mount — prevents flash at position 0
  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) {return}
    element.scrollTop = indexOf(values, value) * ITEM_H
    initializedRef.current = true
  }, [values, value])

  // Smooth scroll when value changes externally (preset selection)
  useEffect(() => {
    const element = scrollRef.current
    if (!element || !initializedRef.current) {return}
    const target = indexOf(values, value) * ITEM_H
    if (Math.abs(element.scrollTop - target) > 4) {
      element.scrollTo({ top: target, behavior: 'smooth' })
    }
  }, [values, value])

  const handleScroll = useCallback(() => {
    if (timerRef.current !== null) {clearTimeout(timerRef.current)}
    timerRef.current = setTimeout(() => {
      const element = scrollRef.current
      if (!element) {return}
      const index = Math.round(element.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(values.length - 1, index))
      const picked = values[clamped]
      if (picked !== undefined && picked !== value) {onChange(picked)}
    }, 60)
  }, [values, value, onChange])

  // Arrow key navigation
  const handleKeyDown = useCallback((event_: React.KeyboardEvent) => {
    const index = indexOf(values, value)
    if (event_.key === 'ArrowUp') {
      event_.preventDefault()
      const previous = values[index - 1]
      if (index > 0 && previous !== undefined) {onChange(previous)}
    } else if (event_.key === 'ArrowDown') {
      event_.preventDefault()
      const next = values[index + 1]
      if (index < values.length - 1 && next !== undefined) {onChange(next)}
    }
  }, [values, value, onChange])

  return (
    <div
      className="wheel-wrap"
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={values[0]}
      aria-valuemax={values.at(-1)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="wheel-highlight" aria-hidden="true" />
      <div
        ref={scrollRef}
        className="wheel-scroll"
        onScroll={handleScroll}
        aria-hidden="true"
      >
        {Array.from({ length: PAD }, (_, index) => (
          <div key={`top-${index}`} className="wheel-pad" />
        ))}
        {values.map((v) => (
          <div
            key={v}
            className={`wheel-item${v === value ? ' wheel-item--sel' : ''}`}
          >
            {format ? format(v) : String(v).padStart(2, '0')}
          </div>
        ))}
        {Array.from({ length: PAD }, (_, index) => (
          <div key={`bot-${index}`} className="wheel-pad" />
        ))}
      </div>
    </div>
  )
})
