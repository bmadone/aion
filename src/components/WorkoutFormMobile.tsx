import { useState, useRef, useEffect, type JSX } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { workoutSchema, type WorkoutConfig } from '../schemas/workout'
import { useStore, useConfig } from '../store'
import { soundManager } from '../sound/SoundManager'
import { PresetSelector } from './PresetSelector'
import { DurationPicker } from './DurationPicker'
import { Stepper } from './Stepper'
import type { Preset } from '../types'

interface Properties {
  readonly startBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function WorkoutFormMobile({ startBtnRef }: Properties): JSX.Element {
  const { t } = useTranslation()
  const storeConfig = useConfig()
  const setConfig   = useStore((s) => s.setConfig)
  const setView     = useStore((s) => s.setView)

  const [preset, setPreset] = useState<Preset>('custom')
  const customRef = useRef<WorkoutConfig>(storeConfig)

  const {
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    control,
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

  const firstErrorKey = errors.workDuration?.message
    ?? errors.restDuration?.message
    ?? errors.intervals?.message
    ?? errors.rounds?.message
    ?? errors.restBetweenRounds?.message

  return (
    <form className="workout-form" onSubmit={(e) => { void handleSubmit(onSubmit)(e) }} noValidate>
      <PresetSelector selected={preset} onSelect={handlePresetSelect} />

      <div className="form-card">
        <div className="picker-row">
          <span className="picker-label">{t('form.workLabelShort')}</span>
          <Controller
            name="workDuration"
            control={control}
            render={({ field }) => (
              <DurationPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="picker-row picker-row--sep">
          <span className="picker-label">{t('form.restLabelShort')}</span>
          <Controller
            name="restDuration"
            control={control}
            render={({ field }) => (
              <DurationPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      <div className="form-card">
        <div className="stepper-row">
          <span className="stepper-label">{t('form.intervalsLabel')}</span>
          <Controller
            name="intervals"
            control={control}
            render={({ field }) => (
              <Stepper value={field.value} min={1} max={30} onChange={field.onChange} aria-label={t('form.intervalsPerRound')} />
            )}
          />
        </div>
        <div className="stepper-row stepper-row--sep">
          <span className="stepper-label">{t('form.roundsLabel')}</span>
          <Controller
            name="rounds"
            control={control}
            render={({ field }) => (
              <Stepper value={field.value} min={1} max={20} onChange={field.onChange} aria-label={t('form.numberOfRounds')} />
            )}
          />
        </div>
      </div>

      <div className="form-card">
        <div className="picker-row">
          <span className="picker-label">{t('form.blockRestLabelShort')}</span>
          <Controller
            name="restBetweenRounds"
            control={control}
            render={({ field }) => (
              <DurationPicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      {isSubmitted && firstErrorKey !== undefined && (
        <p className="form-error" role="alert">{t(firstErrorKey)}</p>
      )}

      <button ref={startBtnRef} type="submit" className="btn-primary" aria-label={t('form.startButtonAria')}>
        {t('form.startButton')}
      </button>
    </form>
  )
}
