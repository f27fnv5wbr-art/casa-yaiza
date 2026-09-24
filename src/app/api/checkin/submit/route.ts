import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/token'

const guest = z.object({
  role: z.enum(['holder','adult','minor']), firstName: z.string().min(1).max(100), surname1: z.string().min(1).max(100),
  surname2: z.string().max(100).optional().default(''), sex: z.string().max(30).optional().default(''), birthDate: z.string().min(8).max(10),
  nationality: z.string().max(100).optional().default(''), documentType: z.string().max(50).optional().default(''),
  documentNumber: z.string().max(100).optional().default(''), documentSupport: z.string().max(100).optional().default(''),
  address: z.string().max(250).optional().default(''), locality: z.string().max(150).optional().default(''), postalCode: z.string().max(20).optional().default(''), municipalityCode: z.string().max(5).optional().default(''), country: z.string().max(100).optional().default(''),
  phone: z.string().max(60).optional().default(''), email: z.union([z.literal(''),z.string().email()]).optional().default(''), minorRelationships: z.record(z.string().max(5)).optional().default({}),
  signatureData: z.string().max(200000).optional().default('')
})
const bodySchema = z.object({ token: z.string().min(32).max(256), totalGuests: z.number().int().min(1).max(30), adultCount: z.number().int().min(1).max(30), minorCount: z.number().int().min(0).max(30), guests: z.array(guest).min(1).max(30) })

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json())
    const guests = body.guests
    if (body.totalGuests !== guests.length || body.adultCount !== guests.filter(g => g.role !== 'minor').length || body.minorCount !== guests.filter(g => g.role === 'minor').length || guests[0]?.role !== 'holder') {
      return NextResponse.json({ error: 'El número o los roles de viajeros no coinciden.' }, { status: 400 })
    }
    for (let index = 0; index < guests.length; index++) {
      const g = guests[index]
      if (!g.address.trim() || !g.postalCode.trim() || !g.country || (g.role !== 'minor' && !(g.phone.trim() || g.email.trim())) || (g.country === 'ESP' ? !/^\d{5}$/.test(g.municipalityCode) : !g.locality.trim())) {
        return NextResponse.json({ error: `Domicilio o contacto incompleto para el viajero ${index + 1}.` }, { status: 400 })
      }
      if (g.role !== 'minor' && (!g.documentType || !g.documentNumber.trim() || !g.signatureData || !g.nationality || (g.documentType === 'NIF' && !g.surname2.trim()) || (['NIF','NIE'].includes(g.documentType) && !g.documentSupport.trim()))) {
        return NextResponse.json({ error: `Datos obligatorios incompletos para el viajero ${index + 1}.` }, { status: 400 })
      }
      if (g.role === 'minor' && !guests.some(adult => adult.role !== 'minor' && adult.minorRelationships[String(index)])) {
        return NextResponse.json({ error: `Falta el parentesco de un adulto con el menor ${index + 1}.` }, { status: 400 })
      }
    }
    const supabase = await createClient()
    const relationshipCodes = Array.from(new Set(guests.flatMap(g => Object.values(g.minorRelationships).filter(Boolean))))
    if (relationshipCodes.length) {
      const { data: codes, error: catalogError } = await supabase.from('ses_relationship_types').select('code').in('code', relationshipCodes)
      if (catalogError || codes?.length !== relationshipCodes.length) return NextResponse.json({ error: 'Parentesco no válido en el catálogo SES.' }, { status: 400 })
    }
    const { data, error } = await supabase.rpc('submit_guest_registration', { token_hash: hashToken(body.token), payload: { totalGuests: body.totalGuests, adultCount: body.adultCount, minorCount: body.minorCount, guests: body.guests } })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.issues?.[0]?.message || 'Invalid request' }, { status: 400 })
  }
}
