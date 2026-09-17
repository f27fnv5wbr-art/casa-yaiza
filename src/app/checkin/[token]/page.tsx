import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/token'
import GuestWizard from './components/GuestWizard'

export default async function CheckinPage({ params }: { params: { token: string } }) {
  if (!params.token || params.token.length < 32) notFound()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('lookup_guest_reservation', { token_hash: hashToken(params.token) })
  const reservation = data?.[0]
  if (error || !reservation) notFound()
  return <GuestWizard token={params.token} reservation={reservation} />
}
