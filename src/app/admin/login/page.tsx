'use client'

import { FormEvent, Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const next = searchParams.get('next')
  const destination =
    next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.replace(destination)
    router.refresh()
  }

  return (
    <main className="container">
      <section className="card" style={{ maxWidth: 520, margin: '48px auto' }}>
        <p className="eyebrow">Casa Yaiza</p>
        <h1>Acceso propietario</h1>
        <p>Inicia sesión para gestionar las reservas.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p role="alert">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

function LoginFallback() {
  return (
    <main className="container">
      <section className="card" style={{ maxWidth: 520, margin: '48px auto' }}>
        <p>Cargando acceso…</p>
      </section>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
