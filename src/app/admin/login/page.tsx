'use client'

import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const search = useSearchParams()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage('No se ha podido iniciar sesión. Comprueba email y contraseña.')
      setBusy(false)
      return
    }

    const next = search.get('next')
    window.location.assign(next?.startsWith('/admin') ? next : '/admin')
  }

  return (
    <main className="wrap">
      <div className="card" style={{ maxWidth: 480, margin: '60px auto' }}>
        <h1>Casa Yaiza · Administración</h1>
        <p className="muted">Acceso exclusivo del propietario.</p>
        <form onSubmit={submit}>
          <label>Email</label>
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          <label>Contraseña</label>
          <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
          <br /><br />
          <button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
          {message && <p className="muted">{message}</p>}
        </form>
      </div>
    </main>
  )
}
