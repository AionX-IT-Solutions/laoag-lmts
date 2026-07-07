import { useEffect, useRef, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

// Maps the Tailwind width classes used across table column configs to a px value,
// used as each column's initial (user-resizable) width.
const WIDTH_CLASS_PX: Record<string, number> = {
  'w-16': 64,
  'w-20': 80,
  'w-24': 96,
  'w-28': 112,
  'w-32': 128,
  'w-36': 144,
  'w-40': 160,
  'w-44': 176,
  'w-48': 192,
  'w-56': 224,
  'w-64': 256
}

const MIN_COL_WIDTH = 60

function initialColumnWidth(width?: string): number {
  return (width && WIDTH_CLASS_PX[width]) || 240
}

interface DataTableProps<T extends { id?: string }> {
  columns: Column<T>[]
  data: T[]
  selectedId?: string | null
  onRowClick?: (row: T) => void
  onRowDoubleClick?: (row: T) => void
  loading?: boolean
  loadingMore?: boolean
  onEndReached?: () => void
  emptyMessage?: string
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  selectedId,
  onRowClick,
  onRowDoubleClick,
  loading,
  loadingMore,
  onEndReached,
  emptyMessage = 'No records found'
}: DataTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(loadingMore)
  const colRefs = useRef<(HTMLTableColElement | null)[]>([])
  const [colWidths, setColWidths] = useState<number[]>(() =>
    columns.map((c) => initialColumnWidth(c.width))
  )
  const [resizingIndex, setResizingIndex] = useState<number | null>(null)

  useEffect(() => {
    loadingMoreRef.current = loadingMore
  })

  // Keep colWidths in sync if the column set changes shape (e.g. switching pages)
  useEffect(() => {
    setColWidths((prev) => {
      if (prev.length === columns.length) return prev
      return columns.map((c, i) => prev[i] ?? initialColumnWidth(c.width))
    })
  }, [columns])

  function startResize(e: React.MouseEvent, index: number) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[index]
    const colEl = colRefs.current[index]
    setResizingIndex(index)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    function onMove(ev: MouseEvent) {
      const newWidth = Math.max(MIN_COL_WIDTH, startWidth + (ev.clientX - startX))
      if (colEl) colEl.style.width = `${newWidth}px`
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setResizingIndex(null)
      if (colEl) {
        const finalWidth = parseInt(colEl.style.width, 10)
        setColWidths((prev) => {
          const next = [...prev]
          next[index] = finalWidth
          return next
        })
      }
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    const sentinel = sentinelRef.current
    const container = containerRef.current
    if (!sentinel || !container || !onEndReached) return
    let skip = true
    const observer = new IntersectionObserver(
      (entries) => {
        if (skip) {
          skip = false
          return
        }
        if (entries[0].isIntersecting && !loadingMoreRef.current) {
          onEndReached()
        }
      },
      { root: container, rootMargin: '0px 0px 200px 0px', threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [data, onEndReached])

  // Auto-load when content doesn't fill the container
  useEffect(() => {
    if (!onEndReached || loading || loadingMore) return
    const el = containerRef.current
    if (el && el.scrollHeight <= el.clientHeight) {
      onEndReached()
    }
  }, [data, onEndReached, loading, loadingMore])

  if (loading) {
    return (
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: 40, borderRadius: 8, opacity: 1 - i * 0.1 }}
          />
        ))}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="scrollbar-thin" style={{ overflow: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
        <colgroup>
          {columns.map((_, i) => (
            <col
              key={i}
              ref={(el) => {
                colRefs.current[i] = el
              }}
              style={{ width: colWidths[i] }}
            />
          ))}
        </colgroup>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr
            style={{ background: 'var(--c-thead-bg)', borderBottom: '2px solid var(--c-divider)' }}
          >
            {columns.map((col, i) => (
              <th
                key={String(col.key)}
                style={{
                  position: 'relative',
                  padding: '11px 16px',
                  textAlign:
                    col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--c-text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  borderRight: i < columns.length - 1 ? '1px solid var(--c-divider)' : 'none'
                }}
              >
                {col.header}
                {i < columns.length - 1 && (
                  <div
                    onMouseDown={(e) => startResize(e, i)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: -2,
                      bottom: 0,
                      width: 5,
                      cursor: 'col-resize',
                      zIndex: 11,
                      background:
                        resizingIndex === i ? 'var(--c-accent, #6b7280)' : 'transparent'
                    }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                    padding: '64px 0',
                    color: 'var(--c-text-3)'
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'var(--c-row-hover)',
                      border: '1px solid var(--c-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText size={22} color="var(--c-text-3)" />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--c-text-3)', fontWeight: 500 }}>
                    {emptyMessage}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--c-text-3)', opacity: 0.6 }}>
                    Try adjusting your search or filters
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={cn(
                  'table-row-hover',
                  row.id && selectedId === row.id && 'table-row-selected'
                )}
                style={{
                  borderBottom: '1px solid var(--c-divider)',
                  cursor: onRowClick ? 'pointer' : 'default'
                }}
                onClick={() => onRowClick?.(row)}
                onDoubleClick={() => onRowDoubleClick?.(row)}
              >
                {columns.map((col, ci) => {
                  const rawVal = (row as Record<string, unknown>)[String(col.key)]
                  const val = col.render ? col.render(row) : String(rawVal ?? '-')
                  return (
                    <td
                      key={String(col.key)}
                      style={{
                        padding: '11px 16px',
                        color: 'var(--c-text-2)',
                        textAlign:
                          col.align === 'right'
                            ? 'right'
                            : col.align === 'center'
                              ? 'center'
                              : 'left',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        borderRight:
                          ci < columns.length - 1 ? '1px solid var(--c-divider)' : 'none',
                        fontSize: 13
                      }}
                      title={typeof val === 'string' ? val : undefined}
                    >
                      {val}
                    </td>
                  )
                })}
              </tr>
            ))
          )}

          {/* Load-more sentinel row */}
          {loadingMore && (
            <tr>
              <td colSpan={columns.length}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 0',
                    color: 'var(--c-text-3)',
                    fontSize: 12
                  }}
                >
                  <Loader2 size={14} style={{ animation: 'spinSlow 1s linear infinite' }} />
                  Loading more…
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {onEndReached && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  )
}
