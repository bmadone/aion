import bellUrl      from '../assets/media/bell.mp3'
import celebrateUrl from '../assets/media/celebrate.mp3'

const STORAGE_KEY = 'aion:muted'

class SoundManager {
  private _muted: boolean
  private bell      = new Audio(bellUrl)
  private celebrate = new Audio(celebrateUrl)

  constructor() {
    this._muted = localStorage.getItem(STORAGE_KEY) === 'true'
  }

  get muted(): boolean { return this._muted }

  setMuted(v: boolean): void {
    this._muted = v
    localStorage.setItem(STORAGE_KEY, String(v))
  }

  // Must be called from a user gesture — unlocks both audio elements on iOS
  preload(): void {
    for (const a of [this.bell, this.celebrate]) {
      a.muted = true
      void a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false }).catch(() => {})
    }
  }

  private play(audio: HTMLAudioElement, times: number, gapMs = 260): void {
    if (this._muted) return
    let i = 0
    const next = () => {
      audio.currentTime = 0
      void audio.play().catch(() => {})
      if (++i < times) setTimeout(next, gapMs)
    }
    next()
  }

  playWork():     void { this.play(this.bell,      3) }
  playRest():     void { this.play(this.bell,      1) }
  playComplete(): void { this.play(this.celebrate, 5) }
}

export const soundManager = new SoundManager()
