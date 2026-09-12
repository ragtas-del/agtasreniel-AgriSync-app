import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../data/store'
import { Button, Field } from '../components/kit'
import { IconLeaf } from '../components/icons'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    if (!username.trim() || !password) {
      setError('Enter both your username and password.')
      setBusy(false)
      return
    }
    const user = login(username, password)
    setBusy(false)
    if (!user) {
      setError('Invalid username or password. Use the demo credentials below.')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-glyph">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22 5 19V9l7-3 7 3v10l-7 3Z" />
              <path d="M5 9l7 3 7-3M12 12v10" />
              <path d="M12 5V2" />
            </svg>
          </span>
          <div>
            <div className="brand-name">Rice Farm Expenses</div>
            <div className="brand-sub">Recording &amp; Monitoring System</div>
          </div>
        </div>

        <h1 className="login-title">Administrator login</h1>
        <p className="login-sub">Sign in to record and monitor rice farm expenses, cash advances and reports.</p>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Username">
            <input
              className="input"
              autoCapitalize="off"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </Field>
          <Field label="Password" className="mt-3">
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </Field>

          {error && (
            <div className="login-error" role="alert">
              <span className="dot" />
              {error}
            </div>
          )}

          <Button type="submit" block className="mt-4" loading={busy}>
            Sign in
          </Button>
        </form>

        <div className="login-demo">
          <div className="login-demo-head">
            <IconLeaf width={14} height={14} />
            Demo access
          </div>
          <div className="login-demo-row">
            <span className="login-role">Farmer Administrator</span>
            <code>admin</code>
            <span aria-hidden>/</span>
            <code>admin123</code>
          </div>
          <div className="login-demo-row">
            <span className="login-role">Field Data Officer</span>
            <code>renielagtas10@gmail.com</code>
            <span aria-hidden>/</span>
            <code>kurt123</code>
          </div>
        </div>

        <p className="login-foot">Offline-first · data stays on this device</p>
      </div>
    </div>
  )
}