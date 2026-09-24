'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type PaymentType = { code: string; description: string }

export default function NewReservation() {
  const [result, setResult] = useState<{ guest_url?: string; error?: string } | null>(null)
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/ses/payment-types')
      .then(async response => {
        if (!response.ok) throw new Error('No se pudo cargar el catálogo de tipos de pago.')
        return response.json()
      })
      .then(data => {
        if (!active) return
        const options = data.paymentTypes as PaymentType[]
        setPaymentTypes(options)
        if (!options.length) setCatalogError('El catálogo oficial de tipos de pago aún no está cargado. Contacta con el administrador.')
      })
      .catch(() => {
        if (active) setCatalogError('No se pudo cargar el catálogo de tipos de pago. Inténtalo de nuevo más tarde.')
      })
      .finally(() => { if (active) setLoadingCatalog(false) })
    return () => { active = false }
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setResult(null)
    const entries = Object.fromEntries(new FormData(event.currentTarget).entries())
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...entries, guest_count: Number(entries.guest_count) }),
    })
    setResult(await response.json())
  }

  return <main className="wrap"><div className="card">
    <Link className="btn secondary" href="/admin">← Volver al panel privado</Link>
    <h1>Nueva reserva</h1>
    <form onSubmit={submit}><div className="grid">
      <div><label>Código Airbnb</label><input name="booking_code" required /></div>
      <div><label>Nombre del titular</label><input name="holder_first_name" required /></div>
      <div><label>Primer apellido del titular</label><input name="holder_surname1" required /></div>
      <div><label>Fecha de formalización</label><input name="contract_date" type="date" required /></div>
      <div><label>Tipo de pago</label><select name="payment_type" required defaultValue="" disabled={loadingCatalog || !!catalogError}>
        <option value="">{loadingCatalog ? 'Cargando tipos de pago…' : 'Selecciona un tipo de pago'}</option>
        {paymentTypes.map(type => <option key={type.code} value={type.code}>{type.description}</option>)}
      </select></div>
      <div><label>Entrada</label><input name="check_in" type="date" required /></div>
      <div><label>Salida</label><input name="check_out" type="date" required /></div>
      <div><label>Nº huéspedes</label><input name="guest_count" type="number" min="1" required /></div>
      <div><label>Idioma inicial</label><select name="language"><option value="es">Español</option><option value="en">English</option><option value="de">Deutsch</option></select></div>
    </div><br />
      {catalogError && <p role="alert">{catalogError}</p>}
      <button disabled={loadingCatalog || !!catalogError}>Crear reserva y generar enlace</button>
    </form>
    {result?.guest_url && <div className="card"><h2>Reserva creada ✓</h2><label>Enlace seguro</label><input readOnly value={result.guest_url} /><p><button onClick={() => navigator.clipboard.writeText(result.guest_url!)}>Copiar enlace</button></p><p className="muted">El token original no se guarda: solo su hash SHA-256.</p></div>}
    {result?.error && <p role="alert">{result.error}</p>}
  </div></main>
}
