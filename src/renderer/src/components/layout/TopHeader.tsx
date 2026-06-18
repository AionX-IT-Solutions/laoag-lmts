import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'

const PAGE_MAP: Record<string, { module: string; title: string }> = {
  '/dashboard': { module: 'Overview', title: 'Dashboard' },
  '/ordinances': { module: 'Legislation', title: 'Ordinances' },
  '/resolutions': { module: 'Legislation', title: 'Resolutions' },
  '/draft-ordinances': { module: 'Drafts', title: 'Draft Ordinances' },
  '/draft-resolutions': { module: 'Drafts', title: 'Draft Resolutions' },
  '/minutes': { module: 'Sessions', title: 'Calendar of Business' },
  '/tricycle': { module: 'Franchise', title: 'Tricycle Franchise' },
  '/barangay': { module: 'Local Affairs', title: 'Barangay Actions' },
  '/communications': { module: 'Communications', title: 'Other Communications' },
  '/transcript': { module: 'Sessions', title: 'Transcript of Proceedings' },
  '/committees': { module: 'Committees', title: 'Standing Committees' },
  '/committee-reports': { module: 'Committees', title: 'Committee Reports' },
  '/review': { module: 'Local Affairs', title: 'Barangay Review' },
  '/judicial': { module: 'Legal', title: 'Quasi-Judicial Function' },
  '/corrections': { module: 'Documents', title: 'Addendum & Corrections' },
  '/incoming': { module: 'Documents', title: 'Incoming Documents' },
  '/other-matters': { module: 'Sessions', title: 'Other Matters' },
  '/officials': { module: 'Members', title: 'S.P. Members' },
  '/send-email': { module: 'Communications', title: 'Send to Email' },
  '/accounts': { module: 'Administration', title: 'Account Management' },
  '/logs': { module: 'Administration', title: 'Activity Log' }
}

function IconBtn({
  onClick,
  title,
  isDark,
  children
}: {
  onClick?: () => void
  title?: string
  isDark: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        flexShrink: 0,
        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: isDark ? '#64748b' : '#94a3b8',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'
        el.style.color = isDark ? '#e2e8f0' : '#0f172a'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
        el.style.color = isDark ? '#64748b' : '#94a3b8'
      }}
    >
      {children}
    </button>
  )
}

export function TopHeader() {
  const location = useLocation()
  const { user } = useAuthStore()
  const { theme, toggleTheme } = useUIStore()

  const page = PAGE_MAP[location.pathname] ?? { module: 'LMTS', title: 'Dashboard' }
  const isDark = theme === 'dark'

  useEffect(() => {
    const ipc = window.electron.ipcRenderer

    const offAvailable = ipc.on('update-available', (_e, version: string) => {
      toast(`Update v${version} is downloading...`, { icon: '⬇️', duration: 5000 })
    })

    const offDownloaded = ipc.on('update-downloaded', () => {
      toast(
        (t) => (
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            Update ready to install.
            <button
              onClick={() => {
                toast.dismiss(t.id)
                window.electron.ipcRenderer.send('install-update')
              }}
              style={{
                padding: '4px 10px',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Restart & Update
            </button>
          </span>
        ),
        { duration: Infinity, icon: '✅' }
      )
    })

    return () => {
      offAvailable()
      offDownloaded()
    }
  }, [])
  const fullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : 'User'
  const initials = user
    ? [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase()
    : 'U'

  return (
    <header
      className="drag-region"
      style={{
        height: 58,
        background: isDark ? '#0d1424' : '#ffffff',
        borderBottom: isDark ? '1px solid rgba(99,102,241,0.12)' : '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 22px',
        flexShrink: 0,
        zIndex: 10
      }}
    >
      {/* Left: breadcrumb */}
      <div className="no-drag">
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#3b82f6',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            lineHeight: 1
          }}
        >
          LMTS &nbsp;·&nbsp; {page.module}
        </p>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.2,
            marginTop: 3,
            color: isDark ? '#e2e8f0' : '#0f172a'
          }}
        >
          {page.title}
        </h2>
      </div>

      {/* Right: actions + user */}
      <div className="no-drag" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <IconBtn
          isDark={isDark}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleTheme}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </IconBtn>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 28,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
            margin: '0 6px'
          }}
        />

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                color: isDark ? '#e2e8f0' : '#0f172a'
              }}
            >
              {fullName}
            </p>
            <p
              style={{
                fontSize: 11,
                lineHeight: 1.2,
                marginTop: 1,
                color: isDark ? '#475569' : '#64748b'
              }}
            >
              {user?.role}
            </p>
          </div>

          {user?.filePath ? (
            <img
              src={user.filePath}
              alt="avatar"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                objectFit: 'cover',
                flexShrink: 0,
                border: '2px solid rgba(37,99,235,0.35)'
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#fff'
              }}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
