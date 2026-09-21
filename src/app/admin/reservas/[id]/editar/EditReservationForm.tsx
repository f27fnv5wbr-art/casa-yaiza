'use client'

import { useState } from 'react'

export default function EditReservationForm({
  reservation,
}: {
  reservation: any
}) {
  const [result, setResult] = useState<any>(null)
  
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
}  return (
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
          <label>Titular</label>
          <input
            name="holder_name"
            defaultValue={reservation.holder_name}
            required
          />
        </div>

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

      {result?.ok && <p className="ok">Cambios guardados correctamente ✓</p>}
      {result?.error && <p>{result.error}</p>}
    </form>
  )
}
