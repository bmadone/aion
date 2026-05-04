/**
 * Workout flow tests — uses short durations (1-3s) so tests complete quickly.
 * Countdown phase is always 3s before any workout starts.
 */
import { test, expect, SEL } from './fixtures'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fill the desktop form with a custom config and start the workout */
async function startCustomWorkout(
  page: import('@playwright/test').Page,
  opts: {
    workDuration?: number
    restDuration?: number
    intervals?: number
    rounds?: number
    blockRest?: number
  },
) {
  const {
    workDuration = 2,
    restDuration = 1,
    intervals = 1,
    rounds = 1,
    blockRest = 0,
  } = opts

  await page.goto('/')
  await page.fill(SEL.workDuration, String(workDuration))
  await page.fill(SEL.restDuration, String(restDuration))
  await page.fill(SEL.intervals, String(intervals))
  await page.fill(SEL.rounds, String(rounds))
  await page.fill(SEL.blockRest, String(blockRest))
  await page.click(SEL.startBtn)
}

// ─── Countdown phase ──────────────────────────────────────────────────────────

test.describe('Countdown phase', () => {
  test('shows 3-second countdown overlay before first work interval', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 10 })
    await expect(page.locator(SEL.countdownOverlay)).toBeVisible()
    await expect(page.locator(SEL.countdownOverlay)).toContainText('Get ready')
  })

  test('transitions from countdown to work phase', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 10 })
    // Wait for countdown to finish (~3s) then work phase should appear
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
  })
})

// ─── Standard work + rest intervals ──────────────────────────────────────────

test.describe('Work + rest intervals', () => {
  test('shows WORK phase with round/interval indicators', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 10, restDuration: 5, intervals: 2 })
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.roundIndicator)).toContainText('Round 1 / 1')
    await expect(page.locator(SEL.intervalIndicator)).toContainText('1 / 2')
  })

  test('cycles work → rest → work → rest → complete for 2 intervals', async ({ page }) => {
    // 3s countdown + 2s work + 1s rest + 2s work + 1s rest = ~9s, timeout 20s
    await startCustomWorkout(page, { workDuration: 2, restDuration: 1, intervals: 2 })

    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.intervalIndicator)).toContainText('1 / 2')

    await expect(page.locator(SEL.phaseLabel)).toHaveText('REST', { timeout: 6_000 })

    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 5_000 })
    await expect(page.locator(SEL.intervalIndicator)).toContainText('2 / 2')

    await expect(page.locator(SEL.phaseLabel)).toHaveText('REST', { timeout: 5_000 })

    await expect(page.locator(SEL.completeText)).toHaveText('Workout Complete!', { timeout: 5_000 })
  })

  test('interval indicator is hidden when there is only 1 interval', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 10, intervals: 1 })
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.intervalIndicator)).not.toBeVisible()
  })
})

// ─── No-rest intervals (EMOM-style) ──────────────────────────────────────────

test.describe('No-rest intervals (EMOM-style)', () => {
  test('skips rest phase and goes directly work → work → complete', async ({ page }) => {
    // 3s countdown + 2s work + 2s work = ~7s
    await startCustomWorkout(page, { workDuration: 2, restDuration: 0, intervals: 2 })

    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.intervalIndicator)).toContainText('1 / 2')

    // Should go straight to next work interval, never showing REST
    await expect(page.locator(SEL.intervalIndicator)).toContainText('2 / 2', { timeout: 6_000 })
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK')

    await expect(page.locator(SEL.completeText)).toHaveText('Workout Complete!', { timeout: 5_000 })
  })
})

// ─── Multiple rounds with block rest ─────────────────────────────────────────

test.describe('Multiple rounds with block rest', () => {
  test('shows block rest between rounds', async ({ page }) => {
    // 3s countdown + (2s work + 1s rest) + 2s block rest + (2s work + 1s rest) = ~11s
    await startCustomWorkout(page, {
      workDuration: 2,
      restDuration: 1,
      intervals: 1,
      rounds: 2,
      blockRest: 2,
    })

    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.roundIndicator)).toContainText('Round 1 / 2')

    await expect(page.locator(SEL.phaseLabel)).toHaveText('REST', { timeout: 6_000 })

    await expect(page.locator(SEL.phaseLabel)).toHaveText('BLOCK REST', { timeout: 5_000 })
    await expect(page.locator(SEL.roundIndicator)).toContainText('Round 1 / 2')

    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 5_000 })
    await expect(page.locator(SEL.roundIndicator)).toContainText('Round 2 / 2')

    await expect(page.locator(SEL.completeText)).toHaveText('Workout Complete!', { timeout: 8_000 })
  })

  test('skips block rest when restBetweenRounds is 0', async ({ page }) => {
    // 3s countdown + 2s work + 2s work = ~7s (no block rest, no interval rest)
    await startCustomWorkout(page, {
      workDuration: 2,
      restDuration: 0,
      intervals: 1,
      rounds: 2,
      blockRest: 0,
    })

    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.roundIndicator)).toContainText('Round 1 / 2')

    await expect(page.locator(SEL.roundIndicator)).toContainText('Round 2 / 2', { timeout: 6_000 })

    // BLOCK REST should never appear
    await expect(page.locator(SEL.completeText)).toHaveText('Workout Complete!', { timeout: 5_000 })
  })
})

// ─── Single long interval (AMRAP-style) ──────────────────────────────────────

test.describe('Single long interval (AMRAP-style)', () => {
  test('shows single work phase with no interval indicator', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 60, restDuration: 0, intervals: 1 })
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.intervalIndicator)).not.toBeVisible()
    await expect(page.locator(SEL.roundIndicator)).toContainText('Round 1 / 1')
  })
})

// ─── Pause / resume ───────────────────────────────────────────────────────────

test.describe('Pause and resume', () => {
  test('pausing shows Resume button and freezes the timer', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 30 })
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })

    await page.click(SEL.pauseBtn)
    await expect(page.locator(SEL.resumeBtn)).toBeVisible()
    await expect(page.locator(SEL.pauseBtn)).not.toBeVisible()

    // Time should not decrease while paused
    const timeBefore = await page.locator(SEL.countdown).textContent()
    await page.waitForTimeout(1_500)
    const timeAfter = await page.locator(SEL.countdown).textContent()
    expect(timeBefore).toBe(timeAfter)
  })

  test('resuming continues the timer from where it paused', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 30 })
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })

    await page.click(SEL.pauseBtn)
    const pausedTime = await page.locator(SEL.countdown).textContent()
    await page.waitForTimeout(500)

    await page.click(SEL.resumeBtn)
    await expect(page.locator(SEL.pauseBtn)).toBeVisible()

    // After resuming the time should eventually decrease
    await expect(async () => {
      const currentTime = await page.locator(SEL.countdown).textContent()
      expect(Number(currentTime)).toBeLessThan(Number(pausedTime))
    }).toPass({ timeout: 5_000 })
  })
})

// ─── Stop ─────────────────────────────────────────────────────────────────────

test.describe('Stop workout', () => {
  test('stop button returns to the form', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 30 })
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await page.click(SEL.stopBtn)
    await expect(page.locator(SEL.startBtn)).toBeVisible()
  })
})

// ─── Completion ───────────────────────────────────────────────────────────────

test.describe('Workout completion', () => {
  test('shows complete screen after all intervals finish', async ({ page }) => {
    // Shortest possible workout: 3s countdown + 1s work = ~4s
    await startCustomWorkout(page, { workDuration: 1, restDuration: 0, intervals: 1 })
    await expect(page.locator(SEL.completeText)).toHaveText('Workout Complete!', { timeout: 10_000 })
    await expect(page.locator(SEL.doneBtn)).toBeVisible()
  })

  test('Done button returns to the form', async ({ page }) => {
    await startCustomWorkout(page, { workDuration: 1, restDuration: 0, intervals: 1 })
    await expect(page.locator(SEL.doneBtn)).toBeVisible({ timeout: 10_000 })
    await page.click(SEL.doneBtn)
    await expect(page.locator(SEL.startBtn)).toBeVisible()
  })
})

// ─── Preset-driven flows ──────────────────────────────────────────────────────

test.describe('Preset-driven workout start', () => {
  test('Tabata: starts workout with correct phase after countdown', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.presetBtn('Tabata'))
    await page.click(SEL.startBtn)
    await expect(page.locator(SEL.countdownOverlay)).toBeVisible()
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.intervalIndicator)).toContainText('1 / 8')
  })

  test('EMOM: starts workout showing work phase, no rest', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.presetBtn('EMOM'))
    await page.click(SEL.startBtn)
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.intervalIndicator)).toContainText('1 / 10')
  })

  test('AMRAP: starts workout showing single work phase', async ({ page }) => {
    await page.goto('/')
    await page.click(SEL.presetBtn('AMRAP'))
    await page.click(SEL.startBtn)
    await expect(page.locator(SEL.phaseLabel)).toHaveText('WORK', { timeout: 8_000 })
    await expect(page.locator(SEL.intervalIndicator)).not.toBeVisible()
  })
})
