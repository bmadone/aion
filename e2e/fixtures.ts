import { test as base, type Page } from '@playwright/test'

/** Stub HTMLMediaElement so audio calls are no-ops in headless Chromium */
async function mockAudio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.HTMLMediaElement.prototype.play  = () => Promise.resolve()
    window.HTMLMediaElement.prototype.pause = () => undefined
    window.HTMLMediaElement.prototype.load  = () => undefined
  })
}

/**
 * Clear localStorage once per page creation so each test starts fresh.
 * Uses sessionStorage as a guard so the clear does NOT re-run on reload,
 * which lets tests that verify localStorage persistence work correctly.
 */
async function clearStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('__test_init__')) {
      sessionStorage.setItem('__test_init__', '1')
      localStorage.clear()
    }
  })
}

export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    await mockAudio(page)
    await clearStorage(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'

// ─── Selector constants ────────────────────────────────────────────────────────

export const SEL = {
  // Form
  presetBtn:     (name: string) => `button.preset-btn:has-text("${name}")`,
  workDuration:  '#workDuration',
  restDuration:  '#restDuration',
  intervals:     '#intervals',
  rounds:        '#rounds',
  blockRest:     '#restBetweenRounds',
  startBtn:      'button[type="submit"]',

  // Timer
  timerDisplay:  '[role="timer"][aria-label="Workout timer"]',
  phaseLabel:    '.phase-label',
  countdown:     '.timer-countdown',
  roundIndicator: '.round-indicator',
  intervalIndicator: '.interval-indicator',
  countdownOverlay: '.countdown-overlay',

  // Controls
  pauseBtn:      'button[aria-label="Pause workout"]',
  resumeBtn:     'button[aria-label="Resume workout"]',
  stopBtn:       'button[aria-label="Stop workout"]',
  doneBtn:       'button[aria-label="Return to form"]',
  completeText:  '.complete-text',
}
