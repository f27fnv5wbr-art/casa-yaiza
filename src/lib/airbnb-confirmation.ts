export type AirbnbConfirmation = {
  booking_code: string
  holder_first_name: string
  holder_surname1: string
  contract_date: string
  check_in: string
  check_out: string
  guest_count: number
  language: 'en'
}

function toText(body: string) {
  return body.replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/(?:^|\n)\s*[-|]+\s*(?=\n|$)/g, '\n')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\r/g, '')
}

function date(value: string) {
  const parsed = new Date(`${value.replace(/\s+/g, ' ').trim()} 12:00:00 GMT`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

export function parseAirbnbConfirmation(subject: string, body: string, receivedAt: string): AirbnbConfirmation | null {
  if (!/reservation confirmed|new booking confirmed/i.test(subject)) return null
  const text = toText(body)
  if (!/new booking confirmed/i.test(text)) return null
  // This is the Airbnb listing ID for Casa Yaiza. Other listings must never enter this database.
  if (!/\b44393519\b/.test(body)) return null

  const code = text.match(/confirmation code[\s\S]{0,120}?\b([A-Z0-9]{10})\b/i)?.[1]
    || body.match(/\/hosting\/reservations\/details\/([A-Z0-9]{10})/i)?.[1]
  const guest = subject.match(/reservation confirmed\s*[-–]\s*(.+?)\s+arrives\b/i)?.[1]
    || text.match(/new booking confirmed!\s*(.+?)\s+arrives\b/i)?.[1]
  const checkIn = text.match(/check-in[^a-z0-9]{0,60}((?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+[a-z]+\s+\d{1,2},?\s+\d{4})/i)?.[1]
  const checkOut = text.match(/check\s*out[^a-z0-9]{0,60}((?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+[a-z]+\s+\d{1,2},?\s+\d{4})/i)?.[1]
  const adults = Number(text.match(/\b(\d{1,2})\s+adults?\b/i)?.[1] || 0)
  const children = Number(text.match(/\b(\d{1,2})\s+children\b/i)?.[1] || 0)
  const name = guest?.trim().split(/\s+/)
  const arrival = checkIn && date(checkIn)
  const departure = checkOut && date(checkOut)
  const formalized = new Date(receivedAt)

  if (!code || !name || name.length < 2 || !arrival || !departure || departure <= arrival ||
    !adults || adults + children > 30 || Number.isNaN(formalized.getTime())) return null

  return {
    booking_code: code.toUpperCase(), holder_first_name: name[0], holder_surname1: name.slice(1).join(' '),
    contract_date: formalized.toISOString().slice(0, 10), check_in: arrival,
    check_out: departure, guest_count: adults + children, language: 'en',
  }
}
