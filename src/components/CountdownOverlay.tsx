interface CountdownOverlayProps {
  count: number
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  const display = count <= 0 ? 'GO!' : String(Math.ceil(count))

  return (
    <div
      className="countdown-overlay"
      role="timer"
      aria-live="assertive"
      aria-atomic="true"
      aria-label={count <= 0 ? 'Go' : `Starting in ${Math.ceil(count)}`}
    >
      <div className="countdown-number" aria-hidden="true">{display}</div>
      <div className="countdown-label" aria-hidden="true">Get ready</div>
    </div>
  )
}
