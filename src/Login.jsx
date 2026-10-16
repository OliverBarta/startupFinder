import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Field from './components/Field'
import Footer from './components/Footer'
import { CheckIcon } from './components/icons'
import { useAuth } from './hooks/useAuth'
import { supabase } from './lib/supabase'
import './Login.css'

const MODES = {
  login: {
    tab: 'Log in',
    title: 'Welcome back',
    intro: 'Log in to see the startups you’ve saved and post your own.',
    submit: 'Log in',
    submitting: 'Logging in…',
  },
  signup: {
    tab: 'Create account',
    title: 'Create your account',
    intro: 'Save startups as you browse and come back to them any time.',
    submit: 'Create account',
    submitting: 'Creating account…',
  },
}

export default function Login() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Set after sign up when the Supabase project requires email confirmation.
  const [confirmEmail, setConfirmEmail] = useState('')

  // Once signed in (including straight after logging in here), go back to
  // the page the user came from.
  const from = location.state?.from
  if (!loading && user) return <Navigate to={from && from !== '/login' ? from : '/'} replace />

  const copy = MODES[mode]

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setError('Enter your email and a password.')
      return
    }

    setError('')
    setSubmitting(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
      if (error) setError(error.message)
      // On success the auth provider picks up the new session and the redirect above runs.
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(error.message)
      else if (!data.session) setConfirmEmail(trimmedEmail)
    }

    setSubmitting(false)
  }

  return (
    <div className="auth-page">
      <div className="container auth">
        <div className="auth__card">
          {confirmEmail ? (
            <div role="status" className="auth__done">
              <span className="auth__done-icon">
                <CheckIcon />
              </span>
              <h1 className="auth__title">Check your email</h1>
              <p className="auth__intro">
                We sent a confirmation link to <strong>{confirmEmail}</strong>. Open it to finish
                creating your account.
              </p>
              <button
                type="button"
                className="btn btn--outline auth__back"
                onClick={() => {
                  setConfirmEmail('')
                  setPassword('')
                  switchMode('login')
                }}
              >
                Back to log in
              </button>
            </div>
          ) : (
            <>
              <div role="group" aria-label="Account" className="auth__tabs">
                {Object.entries(MODES).map(([key, { tab }]) => (
                  <button
                    key={key}
                    type="button"
                    className="auth__tab"
                    aria-pressed={mode === key}
                    onClick={() => switchMode(key)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="auth__head">
                <h1 className="auth__title">{copy.title}</h1>
                <p className="auth__intro">{copy.intro}</p>
              </div>

              <form className="auth__form" onSubmit={handleSubmit} noValidate>
                <Field id="auth-email" label="Email">
                  <input
                    id="auth-email"
                    type="email"
                    className="field__input"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-describedby={error ? 'auth-error' : undefined}
                  />
                </Field>
                <Field id="auth-password" label="Password">
                  <input
                    id="auth-password"
                    type="password"
                    className="field__input"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-describedby={error ? 'auth-error' : undefined}
                  />
                </Field>

                {error && (
                  <p id="auth-error" role="alert" className="auth__error">
                    {error}
                  </p>
                )}

                <button type="submit" className="btn btn--primary auth__submit" disabled={submitting}>
                  {submitting ? copy.submitting : copy.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
