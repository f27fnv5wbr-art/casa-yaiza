import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { timingSafeEqual } from 'node:crypto'
import { parseAirbnbConfirmation } from '@/lib/airbnb-confirmation'
import { hashToken, newGuestToken } from '@/lib/token'

export const runtime = 'nodejs'

const Email = z.object({
  from: z.string().email(),
  subject: z.string().max(500),
  body: z.string().min(1).max(200_000),
  receivedAt: z.string().datetime(),
})

export async function POST(request: Request) {
  const secret = process.env.AIRBNB_IMPORT_SECRET
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
  if (!secret || !supplied || Buffer.byteLength(secret) !== Buffer.byteLength(supplied) ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const parsed = Email.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Correo no válido' }, { status: 400 })
  const email = parsed.data
  if (email.from.toLowerCase() !== 'automated@airbnb.com') {
    return NextResponse.json({ error: 'Remitente no admitido' }, { status: 422 })
  }
  const reservation = parseAirbnbConfirmation(email.subject, email.body, email.receivedAt)
  if (!reservation) return NextResponse.json({ error: 'Confirmación de Casa Yaiza no reconocida' }, { status: 422 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const owner = process.env.AIRBNB_IMPORT_OWNER_ID
  if (!url || !key || !owner) return NextResponse.json({ error: 'Integración sin configurar' }, { status: 503 })

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const { data: paymentType, error: catalogError } = await supabase.from('ses_payment_types')
    .select('code').eq('code', '04').maybeSingle()
  if (catalogError) {
    console.error('Airbnb import payment catalog:', catalogError)
    return NextResponse.json({
      error: `No se pudo consultar el catálogo de pagos: ${catalogError.message}`,
      code: catalogError.code,
    }, { status: 503 })
  }
  if (!paymentType) return NextResponse.json({ error: 'Tipo de pago 04 no configurado' }, { status: 503 })

  const token = newGuestToken()
  const expires = new Date(`${reservation.check_out}T23:59:59Z`)
  expires.setUTCHours(expires.getUTCHours() + 48)
  const { data, error } = await supabase.from('reservations').insert({
    ...reservation, payment_type: '04', holder_name: `${reservation.holder_first_name} ${reservation.holder_surname1}`,
    owner_id: owner, guest_token_hash: hashToken(token), guest_token_expires_at: expires.toISOString(),
    status: 'not_started',
  }).select('id').single()

  if (error?.code === '23505') return NextResponse.json({ status: 'already_exists', booking_code: reservation.booking_code })
  if (error) return NextResponse.json({ error: 'No se pudo crear la reserva' }, { status: 500 })
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  return NextResponse.json({
    status: 'created', id: data.id, booking_code: reservation.booking_code,
    guest_url: `${base}/checkin/${token}`,
  }, { status: 201 })
}
