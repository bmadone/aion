import { useEffect, useRef, type JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, X } from 'lucide-react'
import type { KnownDevice, UseHeartRate } from '../hooks/use-heart-rate'

interface HeartRateModalProperties {
  readonly open: boolean
  readonly onClose: () => void
  readonly heartRate: UseHeartRate
}

interface DeviceItemProperties {
  readonly device: KnownDevice
  readonly isActive: boolean
  readonly isConnecting: boolean
  readonly onConnect: () => void
  readonly onDisconnect: () => void
}

function DeviceItem({ device, isActive, isConnecting, onConnect, onDisconnect }: DeviceItemProperties): JSX.Element {
  const { t } = useTranslation()
  return (
    <div className="hr-device-row">
      <span className="hr-device-name">{device.name}</span>
      {isActive && <Heart size={14} fill="currentColor" className="hr-icon--connected" aria-hidden="true" />}
      <button
        className="btn-secondary"
        onClick={isActive ? onDisconnect : onConnect}
        disabled={isConnecting && !isActive}
      >
        {isActive ? t('bluetooth.disconnect') : t('bluetooth.connect')}
      </button>
    </div>
  )
}

function DeviceList({ heartRate }: { readonly heartRate: UseHeartRate }): JSX.Element {
  const { t } = useTranslation()
  const { status, devices, activeDeviceId, connect, disconnect, addDevice } = heartRate
  const isConnecting = status === 'connecting'
  return (
    <div className="hr-device-list">
      {devices.map((device) => (
        <DeviceItem
          key={device.id}
          device={device}
          isActive={device.id === activeDeviceId}
          isConnecting={isConnecting}
          onConnect={() => void connect(device.device)}
          onDisconnect={disconnect}
        />
      ))}
      <button className="btn-secondary" onClick={() => void addDevice()} disabled={isConnecting}>
        {t('bluetooth.addDevice')}
      </button>
    </div>
  )
}

function SingleConnect({ heartRate }: { readonly heartRate: UseHeartRate }): JSX.Element {
  const { t } = useTranslation()
  const { status, addDevice, disconnect } = heartRate
  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'
  return (
    <div className="hr-single-connect">
      {!isConnected && <p className="hr-single-hint">{t('bluetooth.connectHint')}</p>}
      {isConnected ? (
        <button className="btn-secondary" onClick={disconnect}>{t('bluetooth.disconnect')}</button>
      ) : (
        <button className="btn-primary" onClick={() => void addDevice()} disabled={isConnecting}>
          {isConnecting ? t('bluetooth.connecting') : t('bluetooth.connectDevice')}
        </button>
      )}
    </div>
  )
}

function ModalContent({ heartRate }: { readonly heartRate: UseHeartRate }): JSX.Element {
  const { t } = useTranslation()
  const { status, hasGetDevices } = heartRate
  if (status === 'unsupported') {
    return <p className="hr-modal-msg">{t('bluetooth.notSupported')}</p>
  }
  if (hasGetDevices) { return <DeviceList heartRate={heartRate} /> }
  return <SingleConnect heartRate={heartRate} />
}

function useDialogSync(open: boolean, dialogRef: React.RefObject<HTMLDialogElement | null>, onClose: () => void): void {
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) { return }
    if (open && !dialog.open) { dialog.showModal() }
    else if (!open) { dialog.close() }
  }, [open, dialogRef])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) { return }
    const onCancel = (): void => { onClose() }
    dialog.addEventListener('cancel', onCancel)
    return () => { dialog.removeEventListener('cancel', onCancel) }
  }, [onClose, dialogRef])
}

export function HeartRateModal({ open, onClose, heartRate }: HeartRateModalProperties): JSX.Element {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  useDialogSync(open, dialogRef, onClose)

  const { status, bpm, activeDeviceId, devices } = heartRate
  const isConnected = status === 'connected'
  const activeDevice = devices.find((d) => d.id === activeDeviceId)
  const title = activeDevice?.name ?? t('bluetooth.modalTitle')

  return (
    <dialog ref={dialogRef} className="hr-modal" aria-labelledby="hr-modal-title">
      <div className="hr-modal-header">
        <h2 id="hr-modal-title" className="hr-modal-title">{title}</h2>
        {isConnected && (
          <div className="hr-modal-bpm" aria-live="polite" aria-label={bpm === null ? undefined : t('bluetooth.bpmAria', { bpm })}>
            <Heart size={16} fill="currentColor" className="hr-icon--connected" aria-hidden="true" />
            <span>{bpm ?? '–'}</span>
          </div>
        )}
        <button className="icon-btn" onClick={onClose} aria-label={t('bluetooth.closeModal')}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <ModalContent heartRate={heartRate} />
    </dialog>
  )
}
