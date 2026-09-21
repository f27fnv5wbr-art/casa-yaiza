import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
    .select('id,booking_code,holder_name,check_in,check_out,guest_count,status,language')
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
      </div>
    </main>
  )
}
