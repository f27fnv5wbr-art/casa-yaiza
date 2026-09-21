import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './components/LogoutButton'

const labels: Record<string, string> = {
  not_started: 'Sin iniciar',
  in_progress: 'En proceso',
  complete: 'Completo',
  reported: 'Comunicado',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('id,booking_code,holder_name,check_in,check_out,guest_count,status,language,created_at')
    .order('check_in', { ascending: true })

  return (
    <main className="wrap">
      <div className="top">
        <div>
          <h1>Casa Yaiza · Panel privado</h1>
          <p className="muted">Reservas y registro de viajeros</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link className="btn" href="/admin/reservas/nueva">+ Nueva reserva</Link>
          <LogoutButton />
        </div>
      </div>
      <div className="card">
        <h2>Reservas</h2>
        {error && <p>No se han podido cargar las reservas.</p>}
        <table>
          <thead><tr><th>Reserva</th><th>Titular</th><th>Entrada</th><th>Huéspedes</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {reservations?.map(r => (
              <tr key={r.id}>
                <td>{r.booking_code}</td><td>{r.holder_name}</td><td>{r.check_in}</td><td>{r.guest_count}</td>
                <td>   <Link className="btn secondary" href={`/admin/reservas/${r.id}/editar`}>     Editar   </Link> </td>
              </tr>
            ))}
            {!error && (!reservations || reservations.length === 0) &&
              <tr><td colSpan={6} className="muted">Sin reservas todavía.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}
