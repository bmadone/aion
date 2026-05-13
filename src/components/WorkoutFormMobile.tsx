import { useRef, useEffect, useCallback, useMemo, type JSX } from 'react'
import { useForm, Controller, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { workoutSchema, type WorkoutConfig } from '../schemas/workout'
import { useStore, useConfig, usePreset } from '../store'
import { soundManager } from '../sound/SoundManager'
import { PresetSelector } from './PresetSelector'
import { DurationPicker } from './DurationPicker'
import { Stepper } from './Stepper'
import type { FieldErrors } from 'react-hook-form'
import type { Preset } from '../types'

function getFirstErrorKey(errors: FieldErrors<WorkoutConfig>): string | undefined {
  return errors.workDuration?.message
    ?? errors.restDuration?.message
    ?? errors.intervals?.message
    ?? errors.rounds?.message
    ?? errors.restBetweenRounds?.message
}

interface Properties {
  readonly startBtnRef: React.RefObject<HTMLButtonElement | null>
}

interface PickerRowProperties {
  readonly name: keyof WorkoutConfig
  readonly label: string
  readonly control: Control<WorkoutConfig>
}

function ControlledDurationPicker({ name, label, control }: PickerRowProperties): JSX.Element {
  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className="picker-row">
        <span className="picker-label">{label}</span>
        <DurationPicker value={field.value} onChange={field.onChange} />
      </div>
    )} />
  )
}

interface StepperRowProperties extends PickerRowProperties {
  readonly min: number
  readonly max: number
  readonly ariaLabel: string
}

function ControlledStepper({ name, label, control, min, max, ariaLabel }: StepperRowProperties): JSX.Element {
  return (
    <Controller name={name} control={control} render={({ field }) => (
      <div className="stepper-row">
        <span className="stepper-label">{label}</span>
        <Stepper value={field.value} min={min} max={max} onChange={field.onChange} aria-label={ariaLabel} />
      </div>
    )} />
  )
}

const HIDDEN: Partial<Record<Preset, Set<keyof WorkoutConfig>>> = {
  tabata: new Set(['restBetweenRounds']),
  emom:   new Set(['restDuration', 'rounds', 'restBetweenRounds']),
}

function show(preset: Preset, field: keyof WorkoutConfig): boolean {
  return !(HIDDEN[preset]?.has(field) ?? false)
}

export function WorkoutFormMobile({ startBtnRef }: Properties): JSX.Element {
  const { t } = useTranslation()
  const storeConfig   = useConfig()
  const preset        = usePreset()
  const setConfig     = useStore((s) => s.setConfig)
  const setPreset     = useStore((s) => s.setPreset)
  const setView       = useStore((s) => s.setView)
  const customRef     = useRef<WorkoutConfig>(storeConfig)

  const { handleSubmit, formState: { errors, isSubmitted }, reset, control, getValues } = useForm<WorkoutConfig>({
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

  const showRestCard   = show(preset, 'restBetweenRounds')
  const showIntervals  = show(preset, 'intervals')
  const showRounds     = show(preset, 'rounds')
  const showCountCard  = showIntervals || showRounds
  const showRest       = show(preset, 'restDuration')

  const firstErrorKey = getFirstErrorKey(errors)
  const formError = useMemo(
    () => isSubmitted ? firstErrorKey : undefined,
    [isSubmitted, firstErrorKey],
  )

  return (
    <form className="workout-form" onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate>
      <PresetSelector selected={preset} onSelect={handlePresetSelect} />
      <div className="form-card">
        <ControlledDurationPicker name="workDuration" label={t('form.workLabelShort')} control={control} />
        {showRest && (
          <div className="picker-row--sep">
            <ControlledDurationPicker name="restDuration" label={t('form.restLabelShort')} control={control} />
          </div>
        )}
      </div>
      {showCountCard && (
        <div className="form-card">
          {showIntervals && (
            <ControlledStepper name="intervals" label={t('form.intervalsLabel')} control={control} min={1} max={30} ariaLabel={t('form.intervalsPerRound')} />
          )}
          {showIntervals && showRounds && <div className="stepper-row--sep" />}
          {showRounds && (
            <ControlledStepper name="rounds" label={t('form.roundsLabel')} control={control} min={1} max={20} ariaLabel={t('form.numberOfRounds')} />
          )}
        </div>
      )}
      {showRestCard && (
        <div className="form-card">
          <ControlledDurationPicker name="restBetweenRounds" label={t('form.blockRestLabelShort')} control={control} />
        </div>
      )}
      {formError !== undefined && <p className="form-error" role="alert">{t(formError)}</p>}
      <button ref={startBtnRef} type="submit" className="btn-primary" aria-label={t('form.startButtonAria')}>{t('form.startButton')}</button>
    </form>
  )
}
