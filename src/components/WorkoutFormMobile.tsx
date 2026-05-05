import { useState, useRef, useEffect, type JSX } from 'react'
import { useForm, Controller, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { workoutSchema, type WorkoutConfig } from '../schemas/workout'
import { useStore, useConfig } from '../store'
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

export function WorkoutFormMobile({ startBtnRef }: Properties): JSX.Element {
  const { t } = useTranslation()
  const storeConfig = useConfig()
  const setConfig   = useStore((s) => s.setConfig)
  const setView     = useStore((s) => s.setView)
  const [preset, setPreset] = useState<Preset>('custom')
  const customRef = useRef<WorkoutConfig>(storeConfig)

  const { handleSubmit, formState: { errors, isSubmitted }, reset, control, getValues } = useForm<WorkoutConfig>({
    resolver: zodResolver(workoutSchema),
    defaultValues: storeConfig,
  })

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

  const firstErrorKey = getFirstErrorKey(errors)

  return (
    <form className="workout-form" onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate>
      <PresetSelector selected={preset} onSelect={handlePresetSelect} />
      <div className="form-card">
        <ControlledDurationPicker name="workDuration" label={t('form.workLabelShort')} control={control} />
        <div className="picker-row--sep">
          <ControlledDurationPicker name="restDuration" label={t('form.restLabelShort')} control={control} />
        </div>
      </div>
      <div className="form-card">
        <ControlledStepper name="intervals" label={t('form.intervalsLabel')} control={control} min={1} max={30} ariaLabel={t('form.intervalsPerRound')} />
        <div className="stepper-row--sep">
          <ControlledStepper name="rounds" label={t('form.roundsLabel')} control={control} min={1} max={20} ariaLabel={t('form.numberOfRounds')} />
        </div>
      </div>
      <div className="form-card">
        <ControlledDurationPicker name="restBetweenRounds" label={t('form.blockRestLabelShort')} control={control} />
      </div>
      {isSubmitted && firstErrorKey !== undefined && <p className="form-error" role="alert">{t(firstErrorKey)}</p>}
      <button ref={startBtnRef} type="submit" className="btn-primary" aria-label={t('form.startButtonAria')}>{t('form.startButton')}</button>
    </form>
  )
}
