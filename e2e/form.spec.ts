import { test, expect, SEL } from './fixtures'

test.describe('Workout form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads with form visible and default config', async ({ page }) => {
    await expect(page.locator(SEL.startBtn)).toBeVisible()
    await expect(page.locator(SEL.presetBtn('Tabata'))).toBeVisible()
    await expect(page.locator(SEL.presetBtn('EMOM'))).toBeVisible()
    await expect(page.locator(SEL.presetBtn('AMRAP'))).toBeVisible()
    await expect(page.locator(SEL.presetBtn('Custom'))).toBeVisible()
  })

  test('Tabata preset sets correct values', async ({ page }) => {
    await page.click(SEL.presetBtn('Tabata'))
    await expect(page.locator(SEL.workDuration)).toHaveValue('20')
    await expect(page.locator(SEL.restDuration)).toHaveValue('10')
    await expect(page.locator(SEL.intervals)).toHaveValue('8')
    await expect(page.locator(SEL.rounds)).toHaveValue('1')
    await expect(page.locator(SEL.presetBtn('Tabata'))).toHaveAttribute('aria-pressed', 'true')
  })

  test('EMOM preset sets correct values (no rest)', async ({ page }) => {
    await page.click(SEL.presetBtn('EMOM'))
    await expect(page.locator(SEL.workDuration)).toHaveValue('60')
    await expect(page.locator(SEL.restDuration)).toHaveValue('0')
    await expect(page.locator(SEL.intervals)).toHaveValue('10')
    await expect(page.locator(SEL.rounds)).toHaveValue('1')
    await expect(page.locator(SEL.presetBtn('EMOM'))).toHaveAttribute('aria-pressed', 'true')
  })

  test('AMRAP preset sets correct values (single long interval)', async ({ page }) => {
    await page.click(SEL.presetBtn('AMRAP'))
    await expect(page.locator(SEL.workDuration)).toHaveValue('1200')
    await expect(page.locator(SEL.restDuration)).toHaveValue('0')
    await expect(page.locator(SEL.intervals)).toHaveValue('1')
    await expect(page.locator(SEL.rounds)).toHaveValue('1')
    await expect(page.locator(SEL.presetBtn('AMRAP'))).toHaveAttribute('aria-pressed', 'true')
  })

  test('editing a field after selecting preset switches to Custom', async ({ page }) => {
    await page.click(SEL.presetBtn('Tabata'))
    await page.fill(SEL.workDuration, '30')
    await page.locator(SEL.workDuration).blur()
    await expect(page.locator(SEL.presetBtn('Custom'))).toHaveAttribute('aria-pressed', 'true')
  })

  test('validation: work duration below minimum shows error', async ({ page }) => {
    await page.fill(SEL.workDuration, '0')
    await page.locator(SEL.workDuration).blur()
    // Trigger validation by trying to submit
    await page.click(SEL.startBtn)
    await expect(page.locator('#workDuration-err')).toBeVisible()
  })

  test('validation: negative intervals show error', async ({ page }) => {
    await page.fill(SEL.intervals, '0')
    await page.locator(SEL.intervals).blur()
    await page.click(SEL.startBtn)
    await expect(page.locator('#intervals-err')).toBeVisible()
  })

  test('validation: negative rounds show error', async ({ page }) => {
    await page.fill(SEL.rounds, '0')
    await page.locator(SEL.rounds).blur()
    await page.click(SEL.startBtn)
    await expect(page.locator('#rounds-err')).toBeVisible()
  })

  test('config persists to localStorage on change', async ({ page }) => {
    await page.fill(SEL.workDuration, '45')
    await page.locator(SEL.workDuration).blur()
    const stored = await page.evaluate(() => localStorage.getItem('aion:lastWorkout'))
    const parsed = JSON.parse(stored ?? '{}')
    expect(parsed.workDuration).toBe(45)
  })

  test('last config is restored on reload', async ({ page }) => {
    await page.fill(SEL.workDuration, '45')
    await page.locator(SEL.workDuration).blur()
    await page.reload()
    await expect(page.locator(SEL.workDuration)).toHaveValue('45')
  })
})
