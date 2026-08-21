import { useUnit } from '../lib/UnitContext'
import { UNIT_LABELS, UNIT_OPTIONS } from '../lib/units'

export function UnitToggle() {
  const { unit, setUnit } = useUnit()

  return (
    <div className="flex rounded-full border border-slate-300 p-0.5 text-xs dark:border-slate-700">
      {UNIT_OPTIONS.map((u) => (
        <button
          key={u}
          onClick={() => setUnit(u)}
          className={`cursor-pointer rounded-full px-2 py-0.5 font-medium transition-colors ${
            unit === u
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          {UNIT_LABELS[u]}
        </button>
      ))}
    </div>
  )
}
