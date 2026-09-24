import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data, error } = await supabase
    .from('ses_payment_types')
    .select('code,description')
    .order('description')

  if (error) return NextResponse.json({ error: 'No se pudo cargar el catálogo de SES.' }, { status: 503 })
  return NextResponse.json({ paymentTypes: data })
}
