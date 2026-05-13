import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PresetSelector } from './PresetSelector'
import type { Preset, WorkoutConfig } from '../types'
import { PRESETS } from '../types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}))

const ALL_PRESETS: Preset[] = ['custom', 'tabata', 'hiit', 'emom', 'stopwatch']

describe('PresetSelector', () => {
  it('renders a button for every preset', () => {
    render(<PresetSelector selected="custom" onSelect={vi.fn()} />)
    for (const preset of ALL_PRESETS) {
      expect(screen.getByRole('button', { name: `presets.${preset}` })).toBeInTheDocument()
    }
  })

  it('marks only the selected preset as aria-pressed=true', () => {
    render(<PresetSelector selected="tabata" onSelect={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'presets.tabata' })).toHaveAttribute('aria-pressed', 'true')
    for (const preset of ALL_PRESETS.filter(p => p !== 'tabata')) {
      expect(screen.getByRole('button', { name: `presets.${preset}` })).toHaveAttribute('aria-pressed', 'false')
    }
  })

  it('calls onSelect with the preset and its config when clicked', async () => {
    const onSelect = vi.fn()
    render(<PresetSelector selected="custom" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'presets.tabata' }))
    expect(onSelect).toHaveBeenCalledWith('tabata', PRESETS.tabata)
  })

  it('calls onSelect with null config for stopwatch', async () => {
    const onSelect = vi.fn()
    render(<PresetSelector selected="custom" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'presets.stopwatch' }))
    expect(onSelect).toHaveBeenCalledWith('stopwatch', null)
  })

  it('calls onSelect with null config for custom', async () => {
    const onSelect = vi.fn()
    render(<PresetSelector selected="tabata" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'presets.custom' }))
    expect(onSelect).toHaveBeenCalledWith('custom', null)
  })

  it('clicking already-selected preset still calls onSelect', async () => {
    const onSelect = vi.fn()
    render(<PresetSelector selected="hiit" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'presets.hiit' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('passes the correct WorkoutConfig for each preset with a config', async () => {
    const onSelect = vi.fn()
    render(<PresetSelector selected="custom" onSelect={onSelect} />)
    const configuredPresets = ALL_PRESETS.filter(p => PRESETS[p] !== null)
    for (const preset of configuredPresets) {
      onSelect.mockClear()
      await userEvent.click(screen.getByRole('button', { name: `presets.${preset}` }))
      const [, config] = onSelect.mock.calls[0] as [Preset, WorkoutConfig]
      expect(config).toEqual(PRESETS[preset])
    }
  })

  it('has a group role for accessibility', () => {
    render(<PresetSelector selected="custom" onSelect={vi.fn()} />)
    expect(screen.getByRole('group')).toBeInTheDocument()
  })
})
