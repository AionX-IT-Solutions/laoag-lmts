import { useEffect, useRef } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
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

  useEffect(() => {
    loadingMoreRef.current = loadingMore
  })

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
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <tr
            style={{ background: 'var(--c-thead-bg)', borderBottom: '2px solid var(--c-divider)' }}
          >
            {columns.map((col, i) => (
              <th
                key={String(col.key)}
                className={cn(col.width)}
                style={{
                  padding: '11px 16px',
                  textAlign:
                    col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--c-text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                  borderRight: i < columns.length - 1 ? '1px solid var(--c-divider)' : 'none'
                }}
              >
                {col.header}
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
                        maxWidth: 240,
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
