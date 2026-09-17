import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { newGuestToken, hashToken } from '@/lib/token'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: reservation, error: readError } = await supabase
    .from('reservations')
    .select('id,check_out')
    .eq('id', params.id)
    .single()

  if (readError || !reservation) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const token = newGuestToken()
  const expires = new Date(`${reservation.check_out}T23:59:59Z`)
  expires.setUTCHours(expires.getUTCHours() + 48)

  const { error } = await supabase
    .from('reservations')
    .update({ guest_token_hash: hashToken(token), guest_token_expires_at: expires.toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const origin = new URL(request.url).origin
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin
  return NextResponse.json({ guest_url: `${base}/checkin/${token}` })
}
