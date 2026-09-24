import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Report from './report'

export default async function GuestReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data, error } = await supabase
    .from('reservations')
    .select(`id,booking_code,holder_name,holder_first_name,holder_surname1,holder_phone,holder_email,check_in,check_out,guest_count,status,
      guests(id,role,first_name,surname1,surname2,sex,birth_date,nationality,document_type,document_number,document_support,address,locality,postal_code,municipality_code,country,phone,email,minor_relationships,completed,signature_path,signature_data,created_at)`)
    .eq('owner_id', user.id)
    .order('check_in', { ascending: false })

  // Signature images are large and sensitive. Send only their presence to the report UI.
  const reservations = data?.map(reservation => ({
    ...reservation,
    guests: reservation.guests.map(({ signature_data, signature_path, ...guest }) => ({
      ...guest,
      has_signature: Boolean(signature_data || signature_path),
    })),
  })) ?? []

  return <main className="wrap report">
    <div className="top reportToolbar">
      <div><Link href="/admin">← Panel privado</Link><h1>Informe de huéspedes</h1><p className="muted">Casa Yaiza · Reservas y viajeros registrados</p></div>
    </div>
    {error ? <div className="card notice">No se pudo cargar el informe: {error.message}</div> : <Report reservations={reservations} />}
  </main>
}
