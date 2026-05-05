import bellUrl      from '../assets/media/bell.mp3'
import celebrateUrl from '../assets/media/celebrate.mp3'

const STORAGE_KEY = 'aion:muted'

class SoundManager {
  private buffer: AudioBuffer | null = null
  private celebrateBuffer: AudioBuffer | null = null
  private ctx: AudioContext | null = null
  private _muted: boolean

  constructor() {
    this._muted = localStorage.getItem(STORAGE_KEY) === 'true'
  }

  get muted(): boolean { return this._muted }

  setMuted(v: boolean): void {
    this._muted = v
    localStorage.setItem(STORAGE_KEY, String(v))
  }

  private getCtx(): AudioContext {
    this.ctx ??= new AudioContext()
    return this.ctx
  }

  // Mobile browsers suspend AudioContext until a user gesture; resume before any playback.
  private async resumeCtx(): Promise<AudioContext> {
    const ctx = this.getCtx()
    if (ctx.state === 'suspended') await ctx.resume()
    return ctx
  }

  async preload(): Promise<void> {
    const ctx = await this.resumeCtx()
    await Promise.all([
      fetch(bellUrl).then(r => r.arrayBuffer())
        .then(b => ctx.decodeAudioData(b))
        .then(b => { this.buffer = b })
        .catch(() => { /* audio unavailable — silently ignore */ }),
      fetch(celebrateUrl).then(r => r.arrayBuffer())
        .then(b => ctx.decodeAudioData(b))
        .then(b => { this.celebrateBuffer = b })
        .catch(() => { /* audio unavailable — silently ignore */ }),
    ])
  }

  private async ring(volume = 1, playbackRate = 1, times = 1, interval = 0.22): Promise<void> {
    if (this._muted || !this.buffer) return
    const ctx = await this.resumeCtx()
    for (let i = 0; i < times; i++) {
      const src  = ctx.createBufferSource()
      const gain = ctx.createGain()
      src.buffer             = this.buffer
      src.playbackRate.value = playbackRate
      gain.gain.value        = volume
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start(ctx.currentTime + i * interval)
    }
  }

  playWork(): void  { void this.ring(1.0, 1.0,  3, 0.22) }
  playRest(): void  { void this.ring(0.7, 0.85, 1) }

  playComplete(): void {
    if (this._muted || !this.celebrateBuffer) return
    void this.resumeCtx().then(ctx => {
      const src  = ctx.createBufferSource()
      const gain = ctx.createGain()
      src.buffer      = this.celebrateBuffer!
      gain.gain.value = 1.0
      src.connect(gain)
      gain.connect(ctx.destination)
      src.start()
    })
  }
}

export const soundManager = new SoundManager()
