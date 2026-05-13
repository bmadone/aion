import { useRef, useEffect, useCallback, type JSX } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { workoutSchema, type WorkoutConfig } from '../schemas/workout'
import { useStore, useConfig, usePreset } from '../store'
import { soundManager } from '../sound/SoundManager'
import { PresetSelector } from './PresetSelector'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import type { Preset } from '../types'

interface Properties {
  readonly startBtnRef: React.RefObject<HTMLButtonElement | null>
}

type Registration = ReturnType<ReturnType<typeof useForm<WorkoutConfig>>['register']>

interface FieldProperties {
  readonly id: string
  readonly label: string
  readonly error?: string | undefined
  readonly registration: Registration
  readonly sep?: boolean | undefined
}

function DesktopField({ id, label, error, registration, sep: separator = false }: FieldProperties): JSX.Element {
  return (
    <div className={`field${error === undefined ? '' : ' field--error'}${separator ? ' border-t border-[var(--border)]' : ''}`}>
      <Label htmlFor={id} className="flex-1 text-[0.9375rem] font-medium text-[var(--text-2)] whitespace-nowrap tracking-[-0.01em]">
        {label}
      </Label>
      <div className="field-right">
        <Input id={id} type="number" inputMode="numeric" aria-invalid={error !== undefined} aria-describedby={error === undefined ? undefined : `${id}-err`} className="w-24 h-8 px-[10px] py-[6px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium text-right text-[0.9375rem] rounded-[7px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[var(--accent)] focus-visible:bg-[var(--accent-glow-2)] [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" {...registration} />
        {error !== undefined && <span id={`${id}-err`} className="field-error" role="alert">{error}</span>}
      </div>
    </div>
  )
}

function fieldError(msg: string | undefined, t: (key: string) => string): string | undefined {
  return msg === undefined ? undefined : t(msg)
}

function getFormErrors(errors: FieldErrors<WorkoutConfig>): Record<keyof WorkoutConfig, string | undefined> {
  return {
    workDuration:      errors.workDuration?.message,
    restDuration:      errors.restDuration?.message,
    intervals:         errors.intervals?.message,
    rounds:            errors.rounds?.message,
    restBetweenRounds: errors.restBetweenRounds?.message,
  }
}

const HIDDEN: Partial<Record<Preset, Set<keyof WorkoutConfig>>> = {
  tabata: new Set(['restBetweenRounds']),
  emom:   new Set(['restDuration', 'rounds', 'restBetweenRounds']),
}

function show(preset: Preset, field: keyof WorkoutConfig): boolean {
  return !(HIDDEN[preset]?.has(field) ?? false)
}

export function WorkoutFormDesktop({ startBtnRef }: Properties): JSX.Element {
  const { t } = useTranslation()
  const storeConfig = useConfig()
  const preset      = usePreset()
  const setConfig   = useStore((s) => s.setConfig)
  const setPreset   = useStore((s) => s.setPreset)
  const setView     = useStore((s) => s.setView)
  const customRef   = useRef<WorkoutConfig>(storeConfig)

  const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<WorkoutConfig>({
    resolver: zodResolver(workoutSchema),
    defaultValues: storeConfig,
  })

  useEffect(() => { reset(storeConfig) }, [storeConfig, reset])

  const handlePresetSelect = useCallback((p: Preset, presetConfig: WorkoutConfig | null): void => {
    if (p !== 'custom' && p !== 'stopwatch') { customRef.current = getValues() }
    setPreset(p)
    if (p === 'stopwatch') { soundManager.preload(); setView('timer'); return }
    reset(presetConfig ?? customRef.current)
  }, [getValues, setPreset, setView, reset])

  const onSubmit = useCallback((data: WorkoutConfig): void => {
    soundManager.preload()
    setConfig(data)
    setView('timer')
  }, [setConfig, setView])

  const cardClass = 'form-card rounded-[14px] border-[var(--border)] bg-[var(--surface)] shadow-none'
  const errs = getFormErrors(errors)

  const showRest      = show(preset, 'restDuration')
  const showIntervals = show(preset, 'intervals')
  const showRounds    = show(preset, 'rounds')
  const showCountCard = showIntervals || showRounds
  const showRestCard  = show(preset, 'restBetweenRounds')

  return (
    <form className="workout-form" onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate>
      <PresetSelector selected={preset} onSelect={handlePresetSelect} />
      <Card className={cardClass}><CardContent className="p-0">
        <DesktopField id="workDuration" label={t('form.workLabel')} error={fieldError(errs.workDuration, t)} registration={register('workDuration', { valueAsNumber: true })} />
        {showRest && (
          <DesktopField id="restDuration" label={t('form.restLabel')} error={fieldError(errs.restDuration, t)} registration={register('restDuration', { valueAsNumber: true })} sep />
        )}
      </CardContent></Card>
      {showCountCard && (
        <Card className={cardClass}><CardContent className="p-0">
          {showIntervals && (
            <DesktopField id="intervals" label={t('form.intervalsLabel')} error={fieldError(errs.intervals, t)} registration={register('intervals', { valueAsNumber: true })} />
          )}
          {showRounds && (
            <DesktopField id="rounds" label={t('form.roundsLabel')} error={fieldError(errs.rounds, t)} registration={register('rounds', { valueAsNumber: true })} sep={showIntervals} />
          )}
        </CardContent></Card>
      )}
      {showRestCard && (
        <Card className={cardClass}><CardContent className="p-0">
          <DesktopField id="restBetweenRounds" label={t('form.blockRestLabel')} error={fieldError(errs.restBetweenRounds, t)} registration={register('restBetweenRounds', { valueAsNumber: true })} />
        </CardContent></Card>
      )}
      <Button ref={startBtnRef} type="submit" className="btn-primary h-11 w-full rounded-[10px]">{t('form.startButton')}</Button>
    </form>
  )
}
