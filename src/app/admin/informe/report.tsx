'use client'

import { useMemo, useState } from 'react'

type Guest = {
  id: string; role: string; first_name: string | null; surname1: string | null; surname2: string | null
  sex: string | null; birth_date: string | null; nationality: string | null
  document_type: string | null; document_number: string | null; document_support: string | null
  address: string | null; locality: string | null; postal_code: string | null
  municipality_code: string | null; country: string | null; phone: string | null; email: string | null
  minor_relationships: Record<string, string> | null; completed: boolean
  has_signature: boolean; created_at: string
}
type Reservation = {
  id: string; booking_code: string; holder_name: string; holder_first_name: string | null
  holder_surname1: string | null; holder_phone: string | null; holder_email: string | null
  check_in: string; check_out: string; guest_count: number; status: string; guests: Guest[]
}

const roleName: Record<string, string> = { holder: 'Titular', adult: 'Adulto', minor: 'Menor' }
const statusName: Record<string, string> = { not_started: 'Sin iniciar', in_progress: 'En proceso', complete: 'Completo', reported: 'Comunicado' }
const date = (value: string | null) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-ES') : '—'
const show = (value: string | null | undefined) => value || '—'

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="reportField"><span>{label}</span><strong>{show(value)}</strong></div>
}

export default function Report({ reservations }: { reservations: Reservation[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const filtered = useMemo(() => reservations.filter(r => {
    const text = `${r.booking_code} ${r.holder_name} ${r.guests.map(g => `${g.first_name} ${g.surname1}`).join(' ')}`.toLocaleLowerCase()
    return text.includes(query.toLocaleLowerCase()) && (status === 'all' || r.status === status)
      && (!from || r.check_in >= from) && (!to || r.check_in <= to)
  }), [reservations, query, status, from, to])
  const guestTotal = filtered.reduce((sum, r) => sum + r.guests.length, 0)

  return <>
    <div className="card reportControls">
      <div className="grid">
        <div><label htmlFor="reportSearch">Buscar reserva o persona</label><input id="reportSearch" value={query} onChange={e => setQuery(e.target.value)} placeholder="Código o nombre" /></div>
        <div><label htmlFor="reportStatus">Estado</label><select id="reportStatus" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos</option>{Object.entries(statusName).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div><label htmlFor="reportFrom">Entrada desde</label><input id="reportFrom" type="date" value={from} onChange={e => setFrom(e.target.value)} /></div>
        <div><label htmlFor="reportTo">Entrada hasta</label><input id="reportTo" type="date" value={to} onChange={e => setTo(e.target.value)} /></div>
      </div>
      <button type="button" onClick={() => window.print()}>Imprimir / guardar PDF</button>
    </div>
    <div className="reportSummary"><strong>{filtered.length}</strong> reservas <strong>{guestTotal}</strong> huéspedes registrados</div>
    {filtered.map(r => <section className="card reportReservation" key={r.id}>
      <div className="reportHeading"><div><h2>Reserva {r.booking_code}</h2><p>{date(r.check_in)} → {date(r.check_out)} · {r.holder_name}</p></div><span className="badge">{statusName[r.status] ?? r.status}</span></div>
      <div className="reportMeta"><Detail label="Huéspedes previstos" value={String(r.guest_count)} /><Detail label="Registrados" value={String(r.guests.length)} /><Detail label="Teléfono titular" value={r.holder_phone} /><Detail label="Email titular" value={r.holder_email} /></div>
      {r.guests.length === 0 ? <p className="muted">Todavía no hay datos de huéspedes.</p> :
        [...r.guests].sort((a, b) => ({ holder: 0, adult: 1, minor: 2 }[a.role] ?? 3) - ({ holder: 0, adult: 1, minor: 2 }[b.role] ?? 3)).map((g, index) => <details className="reportGuest" key={g.id} open>
          <summary><span className="badge">{roleName[g.role] ?? g.role}</span> {show([g.first_name, g.surname1, g.surname2].filter(Boolean).join(' '))}<small>{g.completed ? 'Completo' : 'Pendiente'}</small></summary>
          <div className="reportFields">
            <Detail label="Fecha de nacimiento" value={date(g.birth_date)} /><Detail label="Sexo" value={g.sex} /><Detail label="Nacionalidad" value={g.nationality} />
            <Detail label="Tipo de documento" value={g.document_type} /><Detail label="Número de documento" value={g.document_number} /><Detail label="Número de soporte" value={g.document_support} />
            <Detail label="Dirección" value={g.address} /><Detail label="Localidad" value={g.locality} /><Detail label="Código postal" value={g.postal_code} /><Detail label="Código municipio" value={g.municipality_code} /><Detail label="País" value={g.country} />
            <Detail label="Teléfono" value={g.phone} /><Detail label="Email" value={g.email} />
            <Detail label="Firma" value={g.has_signature ? 'Registrada' : '—'} />
            {g.role !== 'minor' && <Detail label="Parentesco con menores (índice: código)" value={Object.entries(g.minor_relationships ?? {}).map(([minor, code]) => `${Number(minor) + 1}: ${code}`).join(', ')} />}
          </div>
        </details>)}
    </section>)}
    {filtered.length === 0 && <div className="card muted">No hay reservas que coincidan con los filtros.</div>}
  </>
}
