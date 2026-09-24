import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ses_relationship_types')
    .select('code,description')
    .order('description')

  if (error) return NextResponse.json({ error: 'No se pudo cargar el catálogo de parentescos.' }, { status: 503 })
  return NextResponse.json({ relationshipTypes: data })
}
