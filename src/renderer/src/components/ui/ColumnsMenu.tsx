import { useEffect, useRef, useState } from 'react'
import { Columns3 } from 'lucide-react'
import type { Column } from './DataTable'

function loadHidden(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(`lmts.hiddenColumns.${storageKey}`)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

// Per-table column visibility, persisted per storageKey so each module
// remembers its own hidden columns across sessions.
export function useColumnVisibility<T>(columns: Column<T>[], storageKey: string) {
  const [hidden, setHidden] = useState<Set<string>>(() => loadHidden(storageKey))

  useEffect(() => {
    try {
      localStorage.setItem(`lmts.hiddenColumns.${storageKey}`, JSON.stringify([...hidden]))
    } catch {
      // ignore write failures (e.g. storage disabled)
    }
  }, [storageKey, hidden])

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        // Never let the last visible column be hidden — an empty table has no recovery path.
        if (columns.length - next.size <= 1) return prev
        next.add(key)
      }
      return next
    })
  }

  const visibleColumns = columns.filter((c) => !hidden.has(String(c.key)))

  return { visibleColumns, hidden, toggle }
}

interface ColumnsMenuButtonProps<T> {
  columns: Column<T>[]
  hidden: Set<string>
  onToggle: (key: string) => void
}

export function ColumnsMenuButton<T>({ columns, hidden, onToggle }: ColumnsMenuButtonProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className="btn-ghost" onClick={() => setOpen((v) => !v)}>
        <Columns3 size={15} />
        Columns
      </button>
      {open && (
        <div
          className="card animate-scale-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 30,
            minWidth: 210,
            padding: '10px 0',
            maxHeight: 340,
            overflowY: 'auto'
          }}
        >
          <p
            style={{
              padding: '0 14px 8px',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--c-text-3)'
            }}
          >
            Toggle Columns
          </p>
          {columns.map((col) => {
            const key = String(col.key)
            const checked = !hidden.has(key)
            return (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  fontSize: 13,
                  color: 'var(--c-text-2)',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(key)}
                  style={{ accentColor: '#3b82f6', width: 14, height: 14 }}
                />
                {col.header}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
