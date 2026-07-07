import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Building2, User, Lock, AlertCircle } from 'lucide-react'
import { queryDocuments, auth, ensureAuth } from '../lib/firebase'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import toast from 'react-hot-toast'
import { Spinner } from '../components/ui/Spinner'
import aionxLogo from '../assets/aionx-logo.png'
import lmtsLogo from '../assets/lmts-logo.png'
import bcrypt from 'bcryptjs'

const APP_VERSION = 'v2.0.0'

const FEATURES = [
  'Ordinance & Resolution Management',
  'Committee Reports & Reviews',
  'Barangay & Tricycle Franchise Records',
  'Real-Time Legislative Tracking'
]

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const { theme, toggleTheme } = useUIStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: { preventDefault(): void }) {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password')
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
        setError('Username not found')
        return
      }
      const account = users[0]
      const match = await bcrypt.compare(password, String(account.password))
      if (!match) {
        setError('Incorrect password')
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
      setError('Login failed. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const isDark = theme === 'dark'

  return (
    <div
      className="animate-fade-in"
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light' : 'Switch to dark'}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 20,
          width: 32,
          height: 32,
          borderRadius: 9,
          cursor: 'pointer',
          background: 'var(--c-btn-sec-bg)',
          border: '1px solid var(--c-btn-sec-border)',
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

      {/* ── Left brand panel ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(160deg, var(--c-login-bg-start) 0%, var(--c-login-bg-mid) 45%, var(--c-login-bg-end) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px'
        }}
      >
        {/* Floating orbs */}
        <div
          className="animate-float"
          style={{
            position: 'absolute',
            top: -60,
            left: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          className="animate-float"
          style={{
            position: 'absolute',
            bottom: -70,
            right: -50,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%)',
            pointerEvents: 'none',
            animationDelay: '1.2s'
          }}
        />

        {/* Dot grid overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, var(--c-login-ring) 1px, transparent 1px)',
            backgroundSize: '22px 22px'
          }}
        />

        {/* Ring decorations */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 20,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '1px solid var(--c-login-ring)',
            pointerEvents: 'none'
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 30,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '1px solid var(--c-login-ring)',
            pointerEvents: 'none'
          }}
        />

        {/* Content */}
        <div className="animate-slide-up" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 22,
              margin: '0 auto 16px',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(14px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 38px var(--c-login-shadow)'
            }}
          >
            <img
              src={lmtsLogo}
              alt="LMTS"
              style={{ width: 56, height: 56, objectFit: 'contain' }}
              draggable={false}
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 10,
              padding: '3px 10px',
              borderRadius: 999,
              background: 'var(--c-login-chip-bg)',
              border: '1px solid var(--c-login-chip-border)'
            }}
          >
            <Building2 size={10} color="rgba(255,255,255,0.75)" />
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              Laoag City Sangguniang Panlungsod
            </span>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: 'var(--c-login-text)',
              letterSpacing: '-0.5px',
              lineHeight: 1,
              marginBottom: 6,
              textShadow: '0 2px 20px rgba(59,130,246,0.4)'
            }}
          >
            LMTS
          </h1>

          <p
            style={{
              fontSize: 11,
              color: 'var(--c-login-muted)',
              lineHeight: 1.5,
              maxWidth: 190,
              margin: '0 auto 24px'
            }}
          >
            Legislative Management &amp; Tracking System
          </p>

          {FEATURES.map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 12px',
                borderRadius: 8,
                marginBottom: 6,
                background: 'var(--c-login-chip-bg)',
                border: '1px solid var(--c-login-chip-border)'
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#3b82f6',
                  flexShrink: 0
                }}
              />
              <span style={{ fontSize: 10.5, color: 'var(--c-login-muted)', fontWeight: 500 }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5
          }}
        >
          <img src={aionxLogo} alt="AionX" style={{ width: 16, height: 16, opacity: 0.8 }} draggable={false} />
          <span style={{ fontSize: 11, color: 'var(--c-login-muted)' }}>AionX IT Solutions</span>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 28px',
          background: 'var(--c-bg)',
          overflow: 'hidden'
        }}
      >
        {/* Ambient blobs */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-20%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)'
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)'
          }}
        />

        <div className="animate-scale-in" style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
          <div
            style={{
              background: 'var(--c-surface-solid)',
              border: '1px solid var(--c-border)',
              borderRadius: 20,
              boxShadow: '0 24px 60px rgba(0,0,0,0.16), 0 4px 20px rgba(0,0,0,0.08)',
              padding: '36px 36px 32px'
            }}
          >
            {/* Heading */}
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#3b82f6',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8
              }}
            >
              Welcome back
            </p>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--c-text-1)',
                marginBottom: 6
              }}
            >
              Sign in to your account
            </h2>
            <p style={{ fontSize: 13, color: 'var(--c-text-2)', marginBottom: 28 }}>
              Enter your credentials to access the dashboard
            </p>

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--c-text-2)',
                    letterSpacing: '0.02em',
                    marginBottom: 6
                  }}
                >
                  Username
                </label>
                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                  <span
                    className="input-icon"
                    style={{
                      position: 'absolute',
                      left: 11,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      color: 'var(--c-text-3)',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    className="input-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    disabled={loading}
                    autoFocus
                    autoComplete="username"
                    style={{ paddingLeft: 34 }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--c-text-2)',
                    letterSpacing: '0.02em',
                    marginBottom: 6
                  }}
                >
                  Password
                </label>
                <div className="input-icon-wrap" style={{ position: 'relative' }}>
                  <span
                    className="input-icon"
                    style={{
                      position: 'absolute',
                      left: 11,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                      color: 'var(--c-text-3)',
                      transition: 'color 0.15s ease'
                    }}
                  >
                    <Lock size={14} />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    autoComplete="current-password"
                    style={{ paddingLeft: 34, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 11,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--c-text-3)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 3
                    }}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="animate-fade-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '9px 12px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 8,
                    color: '#f87171',
                    fontSize: 12
                  }}
                >
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%', height: 44, marginTop: 4, justifyContent: 'center', fontSize: 13 }}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="text-white" />
                    Signing in…
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div
              style={{
                marginTop: 28,
                paddingTop: 16,
                borderTop: '1px solid var(--c-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <p style={{ fontSize: 9.5, color: 'var(--c-text-3)' }}>
                © {new Date().getFullYear()} Laoag City Gov&apos;t
              </p>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 5,
                  background: 'rgba(59,130,246,0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59,130,246,0.15)'
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
