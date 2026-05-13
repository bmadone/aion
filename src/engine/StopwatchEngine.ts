interface StopwatchCallbacks {
  onTick: (elapsedMs: number, laps: number[]) => void
}

export class StopwatchEngine {
  private callbacks: StopwatchCallbacks
  private startTime = 0
  private elapsed = 0
  private running = false
  private rafId: number | null = null
  private laps: number[] = []

  constructor(callbacks: StopwatchCallbacks) {
    this.callbacks = callbacks
  }

  get isRunning(): boolean { return this.running }

  start(): void {
    if (this.running) {return}
    this.running = true
    this.startTime = performance.now() - this.elapsed
    this.scheduleLoop()
  }

  stop(): void {
    if (!this.running) {return}
    this.running = false
    this.elapsed = performance.now() - this.startTime
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null }
  }

  lap(): void {
    if (!this.running) {return}
    const now = performance.now() - this.startTime
    this.laps = [...this.laps, now]
    this.callbacks.onTick(now, this.laps)
  }

  reset(): void {
    this.stop()
    this.elapsed = 0
    this.laps = []
    this.callbacks.onTick(0, [])
  }

  destroy(): void {
    this.running = false
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null }
  }

  private scheduleLoop(): void {
    this.rafId = requestAnimationFrame(this.tick)
  }

  private tick = (): void => {
    if (!this.running) {return}
    const now = performance.now() - this.startTime
    this.callbacks.onTick(now, this.laps)
    this.rafId = requestAnimationFrame(this.tick)
  }
}
