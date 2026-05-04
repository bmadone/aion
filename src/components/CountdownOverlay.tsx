interface CountdownOverlayProps {
  count: number
}

export function CountdownOverlay({ count }: CountdownOverlayProps) {
  const display = count <= 0 ? 'GO!' : String(Math.ceil(count))

  return (
    <div className="countdown-overlay" aria-live="assertive" aria-atomic="true">
      <div className="countdown-number">{display}</div>
      <div className="countdown-label">Get ready</div>
    </div>
  )
}
