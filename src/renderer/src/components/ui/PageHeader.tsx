interface PageHeaderProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
}

export function PageHeader({ subtitle, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        flexShrink: 0,
        minHeight: 36
      }}
    >
      {subtitle && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--c-text-3)',
            padding: '4px 10px',
            borderRadius: 20,
            background: 'var(--c-surface)',
            border: '1px solid var(--c-border)'
          }}
        >
          {subtitle}
        </span>
      )}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          {actions}
        </div>
      )}
    </div>
  )
}
