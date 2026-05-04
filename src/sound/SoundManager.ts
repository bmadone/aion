const STORAGE_KEY = 'aion:muted'

class SoundManager {
  private buffer: AudioBuffer | null = null
  private celebrateBuffer: AudioBuffer | null = null
  private ctx: AudioContext | null = null
  private _muted: boolean

  constructor() {
    this._muted = localStorage.getItem(STORAGE_KEY) === 'true'
  }

  get muted() { return this._muted }

  setMuted(v: boolean) {
    this._muted = v
    localStorage.setItem(STORAGE_KEY, String(v))
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext()
    return this.ctx
  }

  async preload() {
    const ctx = this.getCtx()
    await Promise.all([
      fetch('/sounds/bell.mp3').then(r => r.arrayBuffer())
        .then(b => ctx.decodeAudioData(b))
        .then(b => { this.buffer = b })
        .catch(e => console.warn('[SoundManager] bell.mp3:', e)),
      fetch('/sounds/celebrate.mp3').then(r => r.arrayBuffer())
        .then(b => ctx.decodeAudioData(b))
        .then(b => { this.celebrateBuffer = b })
        .catch(e => console.warn('[SoundManager] celebrate.mp3:', e)),
    ])
  }

  private ring(volume = 1, playbackRate = 1, times = 1, interval = 0.22) {
    if (this._muted || !this.buffer) return
    const ctx = this.getCtx()
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

  playWork()  { this.ring(1.0, 1.0,  3, 0.22) }
  playRest()  { this.ring(0.7, 0.85, 1)        }

  playComplete() {
    if (this._muted || !this.celebrateBuffer) return
    const ctx  = this.getCtx()
    const src  = ctx.createBufferSource()
    const gain = ctx.createGain()
    src.buffer      = this.celebrateBuffer
    gain.gain.value = 1.0
    src.connect(gain)
    gain.connect(ctx.destination)
    src.start()
  }
}

export const soundManager = new SoundManager()
