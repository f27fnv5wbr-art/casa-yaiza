import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { newGuestToken, hashToken } from '@/lib/token'

const Schema = z.object({
  booking_code: z.string().trim().min(2).max(80),
  holder_name: z.string().trim().min(2).max(150),
  contract_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_type: z.string().trim().min(1).max(50),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guest_count: z.number().int().min(1).max(30),
  language: z.enum(['es', 'en', 'de']).default('es'),
})

export async function POST(request: Request) {
  try {
    const input = Schema.parse(await request.json())
    if (input.check_out <= input.check_in) {
      return NextResponse.json({ error: 'La salida debe ser posterior a la entrada.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const token = newGuestToken()
    const expires = new Date(`${input.check_out}T23:59:59Z`)
    expires.setUTCHours(expires.getUTCHours() + 48)

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        ...input,
        owner_id: user.id,
        guest_token_hash: hashToken(token),
        guest_token_expires_at: expires.toISOString(),
        status: 'not_started',
      })
      .select('id')
      .single()

    if (error) throw error

    const origin = new URL(request.url).origin
    const base = process.env.NEXT_PUBLIC_SITE_URL || origin
    return NextResponse.json({ id: data.id, guest_url: `${base}/checkin/${token}` }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Solicitud no válida' }, { status: 400 })
  }
}
