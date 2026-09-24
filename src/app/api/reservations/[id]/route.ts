import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const Schema = z.object({
  booking_code: z.string().trim().min(2).max(80),
  holder_first_name: z.string().trim().min(1).max(100),
  holder_surname1: z.string().trim().min(1).max(100),
  holder_phone: z.string().trim().max(60),
  holder_email: z.union([z.literal(''), z.string().email()]),
  contract_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payment_type: z.string().trim().min(1).max(50),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guest_count: z.number().int().min(1).max(30),
  language: z.enum(['es', 'en', 'de']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const input = Schema.parse(await request.json())

    if (input.check_out <= input.check_in) {
      return NextResponse.json(
        { error: 'La salida debe ser posterior a la entrada.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    const { data: paymentType, error: catalogError } = await supabase.from('ses_payment_types').select('code').eq('code', input.payment_type).maybeSingle()
    if (catalogError || !paymentType) return NextResponse.json({ error: 'Tipo de pago no válido.' }, { status: 400 })

    const { data, error } = await supabase
      .from('reservations')
      .update({ ...input, holder_name: `${input.holder_first_name} ${input.holder_surname1}` })
      .eq('id', id)
      .eq('owner_id', user.id)
      .select('id,booking_code')
      .single()

    if (error) throw error

    return NextResponse.json({
      ok: true,
      reservation: data,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Solicitud no válida' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'No se ha podido eliminar la reserva' },
      { status: 400 }
    )
  }
}
