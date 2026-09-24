'use client'

import { useEffect, useState } from 'react'

export default function EditReservationForm({
  reservation,
}: {
  reservation: any
}) {
  const [result, setResult] = useState<any>(null)
  const [paymentTypes, setPaymentTypes] = useState<Array<{ code: string; description: string }>>([])
  useEffect(() => {
    fetch('/api/ses/payment-types').then(r => r.json()).then(data => setPaymentTypes(data.paymentTypes || [])).catch(() => setPaymentTypes([]))
  }, [])

  async function submit(e: any) {
    e.preventDefault()

    const f = new FormData(e.currentTarget)
    const entries = Object.fromEntries(f.entries())

    const body = {
      ...entries,
      guest_count: Number(entries.guest_count),
    }

    const r = await fetch(`/api/reservations/${reservation.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

    setResult(await r.json())
  }

  async function deleteReservation() {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar esta reserva? Esta acción no se puede deshacer.'
    )

    if (!confirmed) return

    const r = await fetch(`/api/reservations/${reservation.id}`, {
      method: 'DELETE',
    })

    const data = await r.json()

    if (data.ok) {
      window.location.href = '/admin'
      return
    }

    setResult(data)
  }

  return (
    <form onSubmit={submit}>
      <div className="grid">
        <div>
          <label>Código Airbnb</label>
          <input
            name="booking_code"
            defaultValue={reservation.booking_code}
            required
          />
        </div>

        <div>
          <label>Nombre del titular</label>
          <input
            name="holder_first_name"
            defaultValue={reservation.holder_first_name || ''}
            required
          />
        </div>
        <div><label>Primer apellido del titular</label><input name="holder_surname1" defaultValue={reservation.holder_surname1 || ''} required /></div>
        <div><label>Teléfono del titular</label><input name="holder_phone" type="tel" defaultValue={reservation.holder_phone || ''} /></div>
        <div><label>Correo del titular</label><input name="holder_email" type="email" defaultValue={reservation.holder_email || ''} /></div>
        <div><label>Fecha de formalización</label><input name="contract_date" type="date" defaultValue={reservation.contract_date || ''} required /></div>
        <div><label>Tipo de pago</label><select name="payment_type" defaultValue={reservation.payment_type || ''} required>
          <option value="">Selecciona un tipo de pago</option>
          {paymentTypes.map(type => <option key={type.code} value={type.code}>{type.description}</option>)}
        </select></div>

        <div>
          <label>Entrada</label>
          <input
            name="check_in"
            type="date"
            defaultValue={reservation.check_in}
            required
          />
        </div>

        <div>
          <label>Salida</label>
          <input
            name="check_out"
            type="date"
            defaultValue={reservation.check_out}
            required
          />
        </div>

        <div>
          <label>Nº huéspedes</label>
          <input
            name="guest_count"
            type="number"
            min="1"
            defaultValue={reservation.guest_count}
            required
          />
        </div>

        <div>
          <label>Idioma inicial</label>
          <select
            name="language"
            defaultValue={reservation.language}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </div>
      </div>

      <br />

      <button type="submit">Guardar cambios</button>

      <button
        type="button"
        className="danger"
        onClick={deleteReservation}
        style={{ marginLeft: 10 }}
      >
        Eliminar reserva
      </button>

      {result?.ok && (
        <p className="ok">Cambios guardados correctamente ✓</p>
      )}

      {result?.error && <p>{result.error}</p>}
    </form>
  )
}
