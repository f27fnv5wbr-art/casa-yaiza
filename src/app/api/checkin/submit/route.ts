import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/token'

const guest = z.object({
  role: z.enum(['holder','adult','minor']), firstName: z.string().min(1).max(100), surname1: z.string().min(1).max(100),
  surname2: z.string().max(100).optional().default(''), sex: z.string().max(30).optional().default(''), birthDate: z.string().min(8).max(10),
  nationality: z.string().max(100).optional().default(''), documentType: z.string().max(50).optional().default(''),
  documentNumber: z.string().max(100).optional().default(''), documentSupport: z.string().max(100).optional().default(''),
  address: z.string().max(250).optional().default(''), locality: z.string().max(150).optional().default(''), postalCode: z.string().max(20).optional().default(''), country: z.string().max(100).optional().default(''),
  phone: z.string().max(60).optional().default(''), email: z.string().max(200).optional().default(''), relationshipToAdult: z.string().max(100).optional().default(''),
  signatureData: z.string().max(200000).optional().default('')
})
const bodySchema = z.object({ token: z.string().min(32).max(256), totalGuests: z.number().int().min(1).max(30), adultCount: z.number().int().min(1).max(30), minorCount: z.number().int().min(0).max(30), guests: z.array(guest).min(1).max(30) })

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json())
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('submit_guest_registration', { token_hash: hashToken(body.token), payload: { totalGuests: body.totalGuests, adultCount: body.adultCount, minorCount: body.minorCount, guests: body.guests } })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues?.[0]?.message || 'Invalid request' }, { status: 400 })
  }
}
