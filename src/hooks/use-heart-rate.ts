import { useState, useEffect, useCallback, useRef } from 'react'

const HR_SERVICE = 0x18_0D
const HR_CHAR = 0x2A_37
const IS_BT_SUPPORTED = typeof navigator !== 'undefined' && 'bluetooth' in navigator

export type HrStatus = 'unsupported' | 'idle' | 'connecting' | 'connected' | 'disconnected'

export interface KnownDevice {
  id: string
  name: string
  device: BluetoothDevice
}

export interface UseHeartRate {
  status: HrStatus
  bpm: number | null
  activeDeviceId: string | null
  devices: KnownDevice[]
  hasGetDevices: boolean
  connect: (device: BluetoothDevice) => Promise<void>
  addDevice: () => Promise<void>
  disconnect: () => void
}

function parseBpm(value: DataView): number {
  const flags = value.getUint8(0)
  return (flags & 0x01) === 0 ? value.getUint8(1) : value.getUint16(1, true)
}

export function useHeartRate(): UseHeartRate {
  const [status, setStatus] = useState<HrStatus>(IS_BT_SUPPORTED ? 'idle' : 'unsupported')
  const [bpm, setBpm] = useState<number | null>(null)
  const [devices, setDevices] = useState<KnownDevice[]>([])
  const [hasGetDevices, setHasGetDevices] = useState(false)
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const deviceRef = useRef<BluetoothDevice | null>(null)
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)
  const manualRef = useRef(false)

  const onValue = useCallback((event_: Event): void => {
    const char = event_.target as BluetoothRemoteGATTCharacteristic
    if (char.value) { setBpm(parseBpm(char.value)) }
  }, [])

  const onDisconnected = useCallback((): void => {
    if (manualRef.current) { return }
    setBpm(null)
    setStatus('disconnected')
    setActiveDeviceId(null)
    deviceRef.current = null
    charRef.current = null
  }, [])

  useEffect(() => {
    if (!IS_BT_SUPPORTED) { return }
    const load = async (): Promise<void> => {
      try {
        const found = await navigator.bluetooth.getDevices()
        setDevices(found.map((d) => ({ id: d.id, name: d.name ?? d.id, device: d })))
        setHasGetDevices(true)
      } catch { /* getDevices not available in this browser version */ }
    }
    void load()
  }, [])

  const connect = useCallback(async (device: BluetoothDevice): Promise<void> => {
    setStatus('connecting')
    try {
      const { gatt } = device
      if (!gatt) { setStatus('idle'); return }
      const server = await gatt.connect()
      const service = await server.getPrimaryService(HR_SERVICE)
      const char = await service.getCharacteristic(HR_CHAR)
      await char.startNotifications()
      char.addEventListener('characteristicvaluechanged', onValue)
      device.addEventListener('gattserverdisconnected', onDisconnected)
      deviceRef.current = device
      charRef.current = char
      setStatus('connected')
      setActiveDeviceId(device.id)
    } catch { setStatus('idle') }
  }, [onValue, onDisconnected])

  const addDevice = useCallback(async (): Promise<void> => {
    if (!IS_BT_SUPPORTED) { return }
    try {
      const device = await navigator.bluetooth.requestDevice({ filters: [{ services: [HR_SERVICE] }] })
      setDevices((prev) =>
        prev.some((d) => d.id === device.id) ? prev : [...prev, { id: device.id, name: device.name ?? device.id, device }]
      )
      await connect(device)
    } catch { /* user cancelled picker */ }
  }, [connect])

  const disconnect = useCallback((): void => {
    manualRef.current = true
    charRef.current?.removeEventListener('characteristicvaluechanged', onValue)
    deviceRef.current?.removeEventListener('gattserverdisconnected', onDisconnected)
    if (deviceRef.current?.gatt?.connected) { deviceRef.current.gatt.disconnect() }
    deviceRef.current = null
    charRef.current = null
    manualRef.current = false
    setBpm(null)
    setStatus('idle')
    setActiveDeviceId(null)
  }, [onValue, onDisconnected])

  return { status, bpm, activeDeviceId, devices, hasGetDevices, connect, addDevice, disconnect }
}
