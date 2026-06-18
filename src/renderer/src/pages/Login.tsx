import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react'
import { queryDocuments, auth, ensureAuth } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import toast from 'react-hot-toast'
import { Spinner } from '../components/ui/Spinner'
import aionxLogo from '../assets/aionx-logo.png'
import lmtsLogo from '../assets/lmts-logo.png'
import bcrypt from 'bcryptjs'

const APP_VERSION = 'v2.0.0'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const { theme, toggleTheme } = useUIStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter your username and password')
      return
    }
    setLoading(true)

    try {
      const users = await queryDocuments<Record<string, unknown>>(
        'laoag_users',
        'username',
        username.trim()
      )
      if (!users.length) {
        toast.error('Username not found')
        return
      }
      const account = users[0]
      const match = await bcrypt.compare(password, String(account.password))
      if (!match) {
        toast.error('Incorrect password')
        return
      }
      await ensureAuth()
      const token = (await auth.currentUser?.getIdToken()) ?? ''
      setUser({
        token,
        firstName: String(account.firstName ?? ''),
        middleName: String(account.middleName ?? ''),
        lastName: String(account.lastName ?? ''),
        role: String(account.role ?? ''),
        privileges: Array.isArray(account.privileges) ? (account.privileges as string[]) : [],
        filePath: String(account.filePath ?? '')
      })
      toast.success(`Welcome, ${account.firstName}!`)
      window.electron.ipcRenderer.send('window-maximize')
      navigate('/dashboard')
    } catch (err: unknown) {
      console.error('[Login]', err)
      toast.error('Login failed. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === 'dark'

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px 10px 34px',
    fontSize: 13,
    borderRadius: 10,
    outline: 'none',
    transition: 'all 0.2s',
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)',
    border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.1)',
    color: isDark ? '#e2e8f0' : '#0f172a'
  }
  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: 11,
    top: '50%',
    transform: 'translateY(-50%)',
    color: isDark ? '#334155' : '#94a3b8',
    pointerEvents: 'none'
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* ── Background ────────────────────────────────────────── */}

      {/* Base gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'linear-gradient(145deg, #03060e 0%, #060c1c 35%, #080f22 65%, #050810 100%)'
            : 'linear-gradient(145deg, #dce8ff 0%, #e8e4ff 40%, #f0ebff 70%, #e4eeff 100%)'
        }}
      />

      {/* Large soft aurora blobs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: isDark
            ? `
            radial-gradient(ellipse 110% 70% at 15% 5%,  rgba(29,78,216,0.22)  0%, transparent 55%),
            radial-gradient(ellipse 80%  90% at 90% 95%, rgba(79,70,229,0.18)  0%, transparent 55%),
            radial-gradient(ellipse 60%  60% at 70% 20%, rgba(16,185,129,0.06) 0%, transparent 50%)
          `
            : `
            radial-gradient(ellipse 110% 70% at 10% 0%,  rgba(59,130,246,0.28)  0%, transparent 55%),
            radial-gradient(ellipse 80%  90% at 90% 100%,rgba(139,92,246,0.22)  0%, transparent 55%),
            radial-gradient(ellipse 50%  50% at 55% 40%, rgba(16,185,129,0.1)  0%, transparent 50%)
          `
        }}
      />

      {/* Diagonal stripe texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: isDark
            ? `repeating-linear-gradient(-55deg, transparent 0px, transparent 22px, rgba(99,102,241,0.03) 22px, rgba(99,102,241,0.03) 23px)`
            : `repeating-linear-gradient(-55deg, transparent 0px, transparent 22px, rgba(99,102,241,0.05) 22px, rgba(99,102,241,0.05) 23px)`
        }}
      />

      {/* Large decorative circle rings */}
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-8%',
          width: 320,
          height: 320,
          borderRadius: '50%',
          pointerEvents: 'none',
          border: isDark ? '1px solid rgba(59,130,246,0.08)' : '1px solid rgba(59,130,246,0.14)',
          boxShadow: isDark
            ? 'inset 0 0 80px rgba(59,130,246,0.06)'
            : 'inset 0 0 80px rgba(59,130,246,0.08)'
        }}
      />
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          top: '-5%',
          left: '-3%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          pointerEvents: 'none',
          animationDelay: '0.5s',
          border: isDark ? '1px solid rgba(99,102,241,0.06)' : '1px solid rgba(99,102,241,0.1)'
        }}
      />
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          bottom: '-12%',
          right: '-6%',
          width: 360,
          height: 360,
          borderRadius: '50%',
          pointerEvents: 'none',
          animationDelay: '1.5s',
          border: isDark ? '1px solid rgba(79,70,229,0.07)' : '1px solid rgba(139,92,246,0.12)',
          boxShadow: isDark
            ? 'inset 0 0 90px rgba(79,70,229,0.05)'
            : 'inset 0 0 90px rgba(139,92,246,0.07)'
        }}
      />
      <div
        className="animate-float"
        style={{
          position: 'absolute',
          bottom: '-6%',
          right: '-1%',
          width: 220,
          height: 220,
          borderRadius: '50%',
          pointerEvents: 'none',
          animationDelay: '2s',
          border: isDark ? '1px solid rgba(99,102,241,0.05)' : '1px solid rgba(99,102,241,0.09)'
        }}
      />

      {/* Dot grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.04)'} 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      {/* Vignette edges */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: isDark
            ? 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)'
            : 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, rgba(59,100,200,0.12) 100%)'
        }}
      />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light' : 'Switch to dark'}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
          width: 32,
          height: 32,
          borderRadius: 9,
          cursor: 'pointer',
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          transition: 'all 0.2s',
          backdropFilter: 'blur(10px)'
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      {/* ── Card ──────────────────────────────────────────────── */}
      <div
        className="animate-scale-in"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 352,
          borderRadius: 20,
          overflow: 'hidden',
          background: isDark ? 'rgba(7,11,24,0.8)' : 'rgba(255,255,255,0.86)',
          border: isDark ? '1px solid rgba(99,102,241,0.15)' : '1px solid rgba(255,255,255,0.9)',
          boxShadow: isDark
            ? '0 20px 56px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.07), inset 0 1px 0 rgba(255,255,255,0.04)'
            : '0 16px 48px rgba(59,100,200,0.18), 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
          backdropFilter: 'blur(36px)'
        }}
      >
        {/* Accent bar — clipped perfectly by overflow:hidden */}
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)'
          }}
        />

        <div style={{ padding: '26px 28px 22px' }}>
          {/* Logo + title */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <img
              src={lmtsLogo}
              alt="Laoag City SP"
              style={{
                width: 72,
                height: 72,
                objectFit: 'contain',
                margin: '0 auto 11px',
                display: 'block',
                filter: isDark
                  ? 'drop-shadow(0 4px 12px rgba(59,130,246,0.4))'
                  : 'drop-shadow(0 4px 12px rgba(59,130,246,0.25))'
              }}
            />

            <h1
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.3px',
                background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: 3
              }}
            >
              LMTS
            </h1>
            <p style={{ fontSize: 11, color: isDark ? '#475569' : '#64748b' }}>
              Legislative Management & Tracking System
            </p>
            <p style={{ fontSize: 10.5, color: isDark ? '#2a3a52' : '#94a3b8', marginTop: 2 }}>
              Laoag City Sangguniang Panlungsod
            </p>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              marginBottom: 18,
              background: isDark
                ? 'linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(99,102,241,0.12), transparent)'
            }}
          />

          {/* Form */}
          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: 13 }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 9.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: isDark ? '#2d3f5c' : '#94a3b8',
                  marginBottom: 6
                }}
              >
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={13} style={iconStyle} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={loading}
                  autoFocus
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.background = isDark
                      ? 'rgba(59,130,246,0.07)'
                      : 'rgba(59,130,246,0.05)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark
                      ? 'rgba(255,255,255,0.09)'
                      : 'rgba(0,0,0,0.1)'
                    e.target.style.background = isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.035)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 9.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: isDark ? '#2d3f5c' : '#94a3b8',
                  marginBottom: 6
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={13} style={iconStyle} />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  style={{ ...inputStyle, paddingRight: 38 }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6'
                    e.target.style.background = isDark
                      ? 'rgba(59,130,246,0.07)'
                      : 'rgba(59,130,246,0.05)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark
                      ? 'rgba(255,255,255,0.09)'
                      : 'rgba(0,0,0,0.1)'
                    e.target.style.background = isDark
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.035)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 9,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#334155' : '#94a3b8',
                    padding: 3,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 0',
                marginTop: 2,
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                borderRadius: 11,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? 'rgba(59,130,246,0.4)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                boxShadow: loading ? 'none' : '0 5px 18px rgba(59,130,246,0.4)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 9px 24px rgba(59,130,246,0.52)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                    '0 5px 18px rgba(59,130,246,0.4)'
                }
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  Signing in…
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <p style={{ fontSize: 9.5, color: isDark ? '#1a2840' : '#cbd5e1' }}>
              © {new Date().getFullYear()} Laoag City Gov&apos;t
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <img src={aionxLogo} alt="AionX" style={{ width: 12, height: 12, opacity: 0.45 }} />
              <span style={{ fontSize: 9.5, color: isDark ? '#1a2840' : '#cbd5e1' }}>
                AionX IT Solutions
              </span>
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 5,
                  background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)',
                  color: isDark ? '#3730a3' : '#818cf8',
                  border: isDark
                    ? '1px solid rgba(99,102,241,0.16)'
                    : '1px solid rgba(99,102,241,0.13)'
                }}
              >
                {APP_VERSION}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
