import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { SpeedUnit } from './units'

const STORAGE_KEY = 'windSpeedUnit'

function readStoredUnit(): SpeedUnit {
  if (typeof window === 'undefined') return 'mph'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'mph' || stored === 'kmh' || stored === 'kn' ? stored : 'mph'
}

interface UnitState {
  unit: SpeedUnit
  setUnit: (unit: SpeedUnit) => void
}

const UnitContext = createContext<UnitState>({ unit: 'mph', setUnit: () => {} })

export function UnitProvider({ children }: { children: ReactNode }) {
  const [unit, setUnit] = useState<SpeedUnit>(readStoredUnit)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, unit)
  }, [unit])

  return <UnitContext.Provider value={{ unit, setUnit }}>{children}</UnitContext.Provider>
}

export function useUnit() {
  return useContext(UnitContext)
}
