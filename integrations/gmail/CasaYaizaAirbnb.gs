/**
 * Ejecutar configurar() una vez y activar un disparador temporal para importarReservas().
 * Antes, definir AIRBNB_IMPORT_SECRET en Configuración del proyecto > Propiedades de secuencia.
 */
const CASA_YAIZA_URL = 'https://casa-yaiza-wvsh.vercel.app/api/integrations/airbnb'
const AIRBNB_QUERY = '{from:automated@airbnb.com from:dacio.morales@outlook.com} subject:"Reservation confirmed" newer_than:30d'

function configurar() {
  const properties = PropertiesService.getScriptProperties()
  if (!properties.getProperty('AIRBNB_IMPORT_SECRET')) {
    throw new Error('Falta AIRBNB_IMPORT_SECRET en Propiedades de secuencia.')
  }
  if (!properties.getProperty('STARTED_AT')) {
    properties.setProperty('STARTED_AT', String(Date.now()))
  }
  if (!ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'importarReservas')) {
    ScriptApp.newTrigger('importarReservas').timeBased().everyMinutes(5).create()
  }
}

function importarReservas() {
  const properties = PropertiesService.getScriptProperties()
  const secret = properties.getProperty('AIRBNB_IMPORT_SECRET')
  const startedAt = Number(properties.getProperty('STARTED_AT'))
  if (!secret || !startedAt) throw new Error('Ejecuta configurar() antes de importar.')

  const threads = GmailApp.search(AIRBNB_QUERY, 0, 100)
  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const sender = message.getFrom().match(/<([^>]+)>/)?.[1] || message.getFrom()
      const forwarded = sender.toLowerCase() === 'dacio.morales@outlook.com' && /^(?:FW|RV):\s*Reservation confirmed/i.test(message.getSubject())
      if (sender.toLowerCase() !== 'automated@airbnb.com' && !forwarded) continue
      if (!/reservation confirmed/i.test(message.getSubject())) continue
      if (message.getDate().getTime() < startedAt) continue

      const processedKey = 'imported_' + message.getId()
      if (properties.getProperty(processedKey)) continue

      const body = forwarded ? message.getPlainBody() : message.getBody()
      const original = forwarded && body.match(/^(?:From|De):\s*Airbnb\s*<automated@airbnb\.com>[\s\S]*?^(?:Sent|Date|Enviado|Fecha):\s*([^\r\n]+)[\s\S]*?^(?:Subject|Asunto):\s*(Reservation confirmed[^\r\n]+)/mi)
      if (forwarded && !original) continue
      const originalDate = forwarded ? fechaOriginalAirbnb(original[1]) : message.getDate()
      if (isNaN(originalDate.getTime())) {
        console.error('Fecha original no reconocida: ' + message.getId())
        continue
      }
      const response = UrlFetchApp.fetch(CASA_YAIZA_URL, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + secret },
        payload: JSON.stringify({
          from: forwarded ? 'automated@airbnb.com' : sender,
          subject: forwarded ? original[2].trim() : message.getSubject(), body: body,
          receivedAt: originalDate.toISOString(),
        }),
        muteHttpExceptions: true,
      })
      const status = response.getResponseCode()
      const result = JSON.parse(response.getContentText())
      if (status === 201 || (status === 200 && result.status === 'already_exists')) {
        properties.setProperty(processedKey, result.status)
      } else {
        // Conservar sin marcar para reintentar tras corregir el problema.
        console.error('No se importó ' + message.getId() + ': HTTP ' + status + ' ' + (result.error || ''))
      }
    }
  }
}

/** Ejecutar manualmente una vez para importar confirmaciones antiguas reenviadas desde Outlook. */
function importarReenviosAnteriores() {
  const properties = PropertiesService.getScriptProperties()
  const secret = properties.getProperty('AIRBNB_IMPORT_SECRET')
  if (!secret) throw new Error('Falta AIRBNB_IMPORT_SECRET.')

  const threads = GmailApp.search('from:dacio.morales@outlook.com subject:"Reservation confirmed" newer_than:30d', 0, 100)
  let matched = 0
  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const sender = message.getFrom().match(/<([^>]+)>/)?.[1] || message.getFrom()
      if (sender.toLowerCase() !== 'dacio.morales@outlook.com' || !/^(?:FW|RV):\s*Reservation confirmed/i.test(message.getSubject())) continue
      const body = message.getPlainBody()
      const original = body.match(/^(?:From|De):\s*Airbnb\s*<automated@airbnb\.com>[\s\S]*?^(?:Sent|Date|Enviado|Fecha):\s*([^\r\n]+)[\s\S]*?^(?:Subject|Asunto):\s*(Reservation confirmed[^\r\n]+)/mi)
      if (!original) continue
      matched++
      const sent = fechaOriginalAirbnb(original[1])
      if (isNaN(sent.getTime())) throw new Error('No se reconoció la fecha original del correo.')

      const response = UrlFetchApp.fetch(CASA_YAIZA_URL, {
        method: 'post', contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + secret },
        payload: JSON.stringify({
          from: 'automated@airbnb.com', subject: original[2].trim(),
          body: body, receivedAt: sent.toISOString(),
        }),
        muteHttpExceptions: true,
      })
      const result = JSON.parse(response.getContentText())
      console.log('Importación anterior: HTTP ' + response.getResponseCode() +
        ', código ' + (result.booking_code || '') + ', estado ' + (result.status || result.error || ''))
      if (response.getResponseCode() === 201 && result.guest_url) {
        console.log('Enlace para compartir por Airbnb: ' + result.guest_url)
      }
    }
  }
  if (!matched) console.log('No se encontró el reenvío de la reserva HM4Z3BBD9Z en Gmail.')
}


/** Normaliza las cabeceras de Outlook en español; conserva la convención UTC existente. */
function fechaOriginalAirbnb(value) {
  const spanish = value.trim().match(/^(?:[a-záéíóúüñ]+,?\s+)?(\d{1,2}) de ([a-z]+) de (20\d{2}) (\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i)
  if (spanish) {
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const month = months.indexOf(spanish[2].toLowerCase())
    let hour = Number(spanish[4])
    const minute = Number(spanish[5]), second = Number(spanish[6] || 0)
    const period = spanish[7]?.toLowerCase()
    if (month < 0 || minute > 59 || second > 59 || (period ? hour < 1 || hour > 12 : hour > 23)) return new Date(NaN)
    if (period) hour = hour % 12 + (period === 'pm' ? 12 : 0)
    const result = new Date(Date.UTC(Number(spanish[3]), month, Number(spanish[1]), hour, minute, second))
    if (result.getUTCMonth() !== month || result.getUTCDate() !== Number(spanish[1])) return new Date(NaN)
    return result
  }
  return new Date(value.trim().replace(/\s+at\s+/i, ' ').replace(/(?:\s+UTC)?$/, ' UTC'))
}
