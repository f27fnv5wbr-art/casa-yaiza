import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditReservationForm from './EditReservationForm'
export default async function EditReservationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('id,booking_code,holder_name,holder_first_name,holder_surname1,holder_phone,holder_email,contract_date,payment_type,check_in,check_out,guest_count,status,language')
    .eq('id', id)
    .single()

  if (error || !reservation) notFound()

  return (
    <main className="wrap">
      <div className="card">
        <h1>Editar reserva</h1>
        <p>
          {reservation.booking_code} · {reservation.holder_name}
        </p>
        <EditReservationForm reservation={reservation} />      </div>
    </main>
  )
}
