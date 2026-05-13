import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { StopwatchDisplay } from './StopwatchDisplay'

// Capture the onTick callback so tests can drive engine state from outside
let capturedOnTick: ((elapsed: number, laps: number[]) => void) | null = null

const mockEngine = {
  start: vi.fn(),
  stop: vi.fn(),
  lap: vi.fn(),
  reset: vi.fn(),
  destroy: vi.fn(),
  get isRunning() { return false },
}

vi.mock('../engine/StopwatchEngine', () => ({
  StopwatchEngine: vi.fn(function(this: unknown, { onTick }: { onTick: (e: number, l: number[]) => void }) {
    capturedOnTick = onTick
    Object.assign(this as object, mockEngine)
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.['number'] !== undefined) { return `${key}:${opts['number'] as number}` }
      return key
    },
  }),
}))

vi.mock('../store', () => ({
  useStore: (selector: (s: { setView: (v: string) => void }) => unknown) =>
    selector({ setView: vi.fn() }),
}))

function setup(): ReturnType<typeof render> & { user: ReturnType<typeof userEvent.setup>; ref: React.RefObject<HTMLButtonElement | null> } {
  const user = userEvent.setup()
  const ref: React.RefObject<HTMLButtonElement | null> = { current: null }
  const result = render(<StopwatchDisplay stopBtnRef={ref} />)
  return { user, ref, ...result }
}

function tick(elapsed: number, laps: number[] = []): void {
  act(() => { capturedOnTick?.(elapsed, laps) })
}

describe('StopwatchDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnTick = null
  })

  it('shows 00:00.0 on mount', () => {
    setup()
    expect(screen.getByText('00:00.0')).toBeInTheDocument()
  })

  it('start/stop button shows resume text initially', () => {
    setup()
    expect(screen.getByRole('button', { name: 'timer.resumeText' })).toBeInTheDocument()
  })

  it('lap/reset button is disabled initially', () => {
    setup()
    expect(screen.getByRole('button', { name: 'stopwatch.reset' })).toBeDisabled()
  })

  it('clicking start calls engine.start and switches button to pause', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'timer.resumeText' }))
    expect(mockEngine.start).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'timer.pauseText' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('lap/reset button shows "lap" text and is enabled while running', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'timer.resumeText' }))
    expect(screen.getByRole('button', { name: 'stopwatch.lap' })).toBeEnabled()
  })

  it('onTick updates the displayed elapsed time', () => {
    setup()
    tick(61_500) // 1:01.5
    expect(screen.getByText('01:01.5')).toBeInTheDocument()
  })

  it('formats hours correctly when elapsed exceeds one hour', () => {
    setup()
    tick(3_661_000) // 1:01:01.0
    expect(screen.getByText('1:01:01.0')).toBeInTheDocument()
  })

  it('clicking pause calls engine.stop and switches button back to resume', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'timer.resumeText' }))
    await user.click(screen.getByRole('button', { name: 'timer.pauseText' }))
    expect(mockEngine.stop).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'timer.resumeText' })).toBeInTheDocument()
  })

  it('recording a lap calls engine.lap', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'timer.resumeText' }))
    await user.click(screen.getByRole('button', { name: 'stopwatch.lap' }))
    expect(mockEngine.lap).toHaveBeenCalledOnce()
  })

  it('onTick with laps renders a lap list', () => {
    setup()
    tick(2000, [1000, 2000])
    expect(screen.getByRole('list', { name: 'stopwatch.lapsLabel' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('laps render in reverse order (latest first)', () => {
    setup()
    tick(2000, [1000, 2000])
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveClass('stopwatch-lap--latest')
    expect(items[1]).not.toHaveClass('stopwatch-lap--latest')
  })

  it('reset button calls engine.reset when stopped', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'timer.resumeText' }))
    tick(1000)
    await user.click(screen.getByRole('button', { name: 'timer.pauseText' }))
    await user.click(screen.getByRole('button', { name: 'stopwatch.reset' }))
    expect(mockEngine.reset).toHaveBeenCalledOnce()
  })

  it('onTick(0, []) after reset clears display to 00:00.0', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'timer.resumeText' }))
    tick(5000)
    await user.click(screen.getByRole('button', { name: 'timer.pauseText' }))
    tick(0, [])
    expect(screen.getByText('00:00.0')).toBeInTheDocument()
  })

  it('onTick(0, []) after reset removes the lap list', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'timer.resumeText' }))
    tick(2000, [1000, 2000])
    await user.click(screen.getByRole('button', { name: 'timer.pauseText' }))
    tick(0, [])
    expect(screen.queryByRole('list', { name: 'stopwatch.lapsLabel' })).not.toBeInTheDocument()
  })

  it('Space key starts the stopwatch', async () => {
    const { user } = setup()
    await user.keyboard(' ')
    expect(mockEngine.start).toHaveBeenCalledOnce()
  })

  it('Space key toggles between start and stop', async () => {
    const { user } = setup()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'timer.pauseText' })).toBeInTheDocument()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'timer.resumeText' })).toBeInTheDocument()
  })

  it('L key calls engine.lap while running', async () => {
    const { user } = setup()
    await user.keyboard(' ')
    await user.keyboard('l')
    expect(mockEngine.lap).toHaveBeenCalledOnce()
  })

  it('L key calls engine.reset while stopped with elapsed > 0', async () => {
    const { user } = setup()
    await user.keyboard(' ')
    tick(1000)
    await user.keyboard(' ') // stop
    await user.keyboard('l')
    expect(mockEngine.reset).toHaveBeenCalledOnce()
  })

  it('S key calls engine.destroy', async () => {
    const { user } = setup()
    await user.keyboard('s')
    expect(mockEngine.destroy).toHaveBeenCalledOnce()
  })

  it('stop button calls engine.destroy', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'timer.stopButton' }))
    expect(mockEngine.destroy).toHaveBeenCalledOnce()
  })
})
