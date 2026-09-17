import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hashToken } from '@/lib/token'

const text: Record<string, any> = {
  es: { title:'Tu reserva', intro:'Comprueba que los datos de tu estancia en Casa Yaiza son correctos antes de continuar.', code:'Código de reserva', in:'Fecha de entrada', out:'Fecha de salida', guests:'Número de huéspedes', q:'¿Son correctos estos datos?', go:'Confirmar y continuar →', safe:'Este enlace es exclusivo para tu reserva. Tus datos se transmitirán de forma segura.' },
  en: { title:'Your booking', intro:'Please check that the details of your stay at Casa Yaiza are correct before continuing.', code:'Booking reference', in:'Check-in date', out:'Check-out date', guests:'Number of guests', q:'Are these details correct?', go:'Confirm and continue →', safe:'This link is unique to your booking. Your information will be transmitted securely.' },
  de: { title:'Ihre Buchung', intro:'Bitte überprüfen Sie, ob die Angaben zu Ihrem Aufenthalt in Casa Yaiza korrekt sind, bevor Sie fortfahren.', code:'Buchungsnummer', in:'Anreisedatum', out:'Abreisedatum', guests:'Anzahl der Gäste', q:'Sind diese Angaben korrekt?', go:'Bestätigen und weiter →', safe:'Dieser Link ist ausschließlich für Ihre Buchung bestimmt. Ihre Daten werden sicher übertragen.' },
}

export default async function CheckinPage({ params }: { params: { token: string } }) {
  if (!params.token || params.token.length < 32) notFound()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('lookup_guest_reservation', { token_hash: hashToken(params.token) })
  const reservation = data?.[0]
  if (error || !reservation) notFound()

  const s = text[reservation.language] || text.es
  return (
    <main className="wrap">
      <div className="hero" />
      <div className="card">
        <div className="top"><div><b>CASA YAIZA</b><div className="muted">Arrecife · Lanzarote</div></div><div>ES · EN · DE</div></div>
        <h1>{s.title}</h1><p>{s.intro}</p>
        <div className="grid">
          <div><b>{s.code}</b><p>{reservation.booking_code}</p></div>
          <div><b>{s.in}</b><p>{reservation.check_in}</p></div>
          <div><b>{s.out}</b><p>{reservation.check_out}</p></div>
          <div><b>{s.guests}</b><p>{reservation.guest_count}</p></div>
        </div>
        <h3>{s.q}</h3><button>{s.go}</button>
        <p className="muted">🔒 {s.safe}</p>
      </div>
    </main>
  )
}
