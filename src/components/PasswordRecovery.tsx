'use client'

import { useEffect, useRef, useState, type ReactNode, type FormEvent } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function PasswordRecovery({ children }: { children: ReactNode }) {
  const started = useRef(false)
  const client = useRef<ReturnType<typeof createBrowserClient> | null>(null)
  const [mode, setMode] = useState<'normal' | 'request' | 'reset' | 'done'>('normal')
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (started.current) return
    started.current = true
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const recovery = hash.get('type') === 'recovery'
    const failed = hash.has('error') || hash.has('error_code')
    const requested = new URLSearchParams(window.location.search).get('recover') === '1'
    if (!recovery && !failed && !requested) return
    const access_token = hash.get('access_token')
    const refresh_token = hash.get('refresh_token')
    // Remove credentials before initializing Auth; never log or render them.
    window.history.replaceState(null, '', window.location.pathname + (requested ? '?recover=1' : ''))
    client.current = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { isSingleton: false, auth: { detectSessionInUrl: false } }
    )
    if (!recovery || !access_token || !refresh_token) {
      setMode('request')
      if (failed || recovery) setMessage('El enlace no es válido o ha caducado. Solicita uno nuevo.')
      return
    }
    setMode('reset')
    const auth = client.current.auth
    void (async () => {
      try {
        const { error } = await auth.setSession({ access_token, refresh_token })
        if (error) throw error
        const { data, error: userError } = await auth.getUser()
        if (userError || !data.user) throw userError || new Error('No user')
        setReady(true)
      } catch {
        setMode('request')
        setMessage('El enlace no es válido o ha caducado. Solicita uno nuevo.')
      }
    })()
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client.current || busy) return
    setMessage('')
    if (mode === 'reset' && (password.length < 8 || password !== confirm)) {
      setMessage('Usa al menos 8 caracteres y confirma la misma contraseña.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'request') {
        const { error } = await client.current.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setMessage('Si el correo corresponde a una cuenta, recibirás un enlace para cambiar la contraseña. Revisa también spam.')
      } else if (mode === 'reset' && ready) {
        const { error } = await client.current.auth.updateUser({ password })
        if (error) {
          setMessage('No se pudo cambiar la contraseña. Prueba otra contraseña o solicita un enlace nuevo.')
          return
        }
        setPassword('')
        setConfirm('')
        // Revoke refresh tokens for existing sessions after recovery.
        await client.current.auth.signOut({ scope: 'global' })
        setMode('done')
      }
    } catch {
      setMessage('No se pudo completar la solicitud. Comprueba la conexión e inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'normal') return <>{children}</>
  return <main className="wrap"><section className="card">
    <div className="brand">Casa Yaiza</div>
    <h1>{mode === 'done' ? 'Contraseña actualizada' : mode === 'reset' ? 'Nueva contraseña' : 'Recuperar acceso'}</h1>
    {mode === 'done' ? <p>Ya puedes entrar con tu correo y la nueva contraseña.</p> : <form onSubmit={submit}>
      {mode === 'request' ? <>
        <label htmlFor="recovery-email">Email del propietario</label>
        <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
      </> : ready ? <>
        <label htmlFor="new-password">Nueva contraseña (mínimo 8 caracteres)</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} />
        <label htmlFor="confirm-password">Confirmar contraseña</label>
        <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} />
      </> : <p role="status">Comprobando el enlace…</p>}
      {message && <p role="status">{message}</p>}
      <button type="submit" disabled={busy || (mode === 'reset' && !ready)}>{busy ? 'Procesando…' : mode === 'request' ? 'Enviar enlace de recuperación' : 'Guardar nueva contraseña'}</button>
      {mode === 'reset' && <p><a href="/?recover=1">Solicitar un enlace nuevo</a></p>}
    </form>}
    <p><a href="/admin/login">Volver al acceso del propietario</a></p>
  </section></main>
}
