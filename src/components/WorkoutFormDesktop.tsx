import { useState, useRef, useEffect, type JSX } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { workoutSchema, type WorkoutConfig } from '../schemas/workout'
import { useStore, useConfig } from '../store'
import { soundManager } from '../sound/SoundManager'
import { PresetSelector } from './PresetSelector'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import type { Preset } from '../types'

interface Properties {
  startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutFormDesktop({ startBtnRef }: Properties): JSX.Element {
  const { t } = useTranslation()
  const storeConfig = useConfig()
  const setConfig   = useStore((s) => s.setConfig)
  const setView     = useStore((s) => s.setView)

  const [preset, setPreset] = useState<Preset>('custom')
  const customRef = useRef<WorkoutConfig>(storeConfig)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<WorkoutConfig>({
    resolver: zodResolver(workoutSchema),
    defaultValues: storeConfig,
  })

  // Sync form to store config on initial hydration
  useEffect(() => { reset(storeConfig) }, [storeConfig, reset])

  function handlePresetSelect(p: Preset, presetConfig: WorkoutConfig | null): void {
    if (p !== 'custom') {customRef.current = getValues()}
    setPreset(p)
    reset(p === 'custom' ? customRef.current : (presetConfig ?? customRef.current))
  }

  function onSubmit(data: WorkoutConfig): void {
    soundManager.preload()
    setConfig(data)
    setView('timer')
  }

  return (
    <form className="workout-form" onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate>
      <PresetSelector selected={preset} onSelect={handlePresetSelect} />

      <Card className="form-card rounded-[14px] border-[var(--border)] bg-[var(--surface)] shadow-none">
        <CardContent className="p-0">
          <DesktopField
            id="workDuration" label={t('form.workLabel')}
            error={errors.workDuration?.message === undefined ? undefined : t(errors.workDuration.message)}
            registration={register('workDuration', { valueAsNumber: true })}
          />
          <DesktopField
            id="restDuration" label={t('form.restLabel')}
            error={errors.restDuration?.message === undefined ? undefined : t(errors.restDuration.message)}
            registration={register('restDuration', { valueAsNumber: true })}
            sep
          />
        </CardContent>
      </Card>

      <Card className="form-card rounded-[14px] border-[var(--border)] bg-[var(--surface)] shadow-none">
        <CardContent className="p-0">
          <DesktopField
            id="intervals" label={t('form.intervalsLabel')}
            error={errors.intervals?.message === undefined ? undefined : t(errors.intervals.message)}
            registration={register('intervals', { valueAsNumber: true })}
          />
          <DesktopField
            id="rounds" label={t('form.roundsLabel')}
            error={errors.rounds?.message === undefined ? undefined : t(errors.rounds.message)}
            registration={register('rounds', { valueAsNumber: true })}
            sep
          />
        </CardContent>
      </Card>

      <Card className="form-card rounded-[14px] border-[var(--border)] bg-[var(--surface)] shadow-none">
        <CardContent className="p-0">
          <DesktopField
            id="restBetweenRounds" label={t('form.blockRestLabel')}
            error={errors.restBetweenRounds?.message === undefined ? undefined : t(errors.restBetweenRounds.message)}
            registration={register('restBetweenRounds', { valueAsNumber: true })}
          />
        </CardContent>
      </Card>

      <Button
        ref={startBtnRef}
        type="submit"
        className="btn-primary h-11 w-full rounded-[10px]"
      >
        {t('form.startButton')}
      </Button>
    </form>
  )
}

type Registration = ReturnType<ReturnType<typeof useForm<WorkoutConfig>>['register']>

interface FieldProperties {
  id: string
  label: string
  error?: string | undefined
  registration: Registration
  sep?: boolean | undefined
}

function DesktopField({ id, label, error, registration, sep: separator = false }: FieldProperties): JSX.Element {
  return (
    <div className={`field${error === undefined ? '' : ' field--error'}${separator ? ' border-t border-[var(--border)]' : ''}`}>
      <Label
        htmlFor={id}
        className="flex-1 text-[0.9375rem] font-medium text-[var(--text-2)] whitespace-nowrap tracking-[-0.01em]"
      >
        {label}
      </Label>
      <div className="field-right">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : `${id}-err`}
          className="w-24 h-8 px-[10px] py-[6px] border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-medium text-right text-[0.9375rem] rounded-[7px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[var(--accent)] focus-visible:bg-[var(--accent-glow-2)] [appearance:textfield] [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...registration}
        />
        {error !== undefined && (
          <span id={`${id}-err`} className="field-error" role="alert">{error}</span>
        )}
      </div>
    </div>
  )
}
