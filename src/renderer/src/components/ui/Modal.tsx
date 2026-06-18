import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  footer?: React.ReactNode
}

const sizes: Record<NonNullable<ModalProps['size']>, number> = {
  sm: 448,
  md: 520,
  lg: 672,
  xl: 896,
  '2xl': 1024
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
    >
      {/* Backdrop */}
      <div
        className="animate-fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)'
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn('animate-scale-in')}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: sizes[size],
          background: 'var(--c-surface)',
          border: '1px solid var(--c-border)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Gradient top bar */}
        <div
          style={{
            height: 2,
            flexShrink: 0,
            background: 'linear-gradient(90deg, #3b82f6, #7c3aed)'
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px 16px',
            borderBottom: '1px solid var(--c-border)'
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--c-text-1)' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--c-text-3)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'var(--c-row-hover)'
              el.style.color = 'var(--c-text-1)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'transparent'
              el.style.color = 'var(--c-text-3)'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div
          className="scrollbar-thin"
          style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              padding: '14px 24px',
              borderTop: '1px solid var(--c-border)',
              background: 'rgba(0,0,0,0.15)',
              borderRadius: '0 0 20px 20px'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
