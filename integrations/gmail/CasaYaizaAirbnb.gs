/**
 * Ejecutar configurar() una vez y activar un disparador temporal para importarReservas().
 * Antes, definir AIRBNB_IMPORT_SECRET en Configuración del proyecto > Propiedades de secuencia.
 */
const CASA_YAIZA_URL = 'https://casa-yaiza-wvsh.vercel.app/api/integrations/airbnb'
const AIRBNB_QUERY = 'from:automated@airbnb.com subject:"Reservation confirmed" newer_than:30d'

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
      if (sender.toLowerCase() !== 'automated@airbnb.com') continue
      if (!/reservation confirmed/i.test(message.getSubject())) continue
      if (message.getDate().getTime() < startedAt) continue

      const processedKey = 'imported_' + message.getId()
      if (properties.getProperty(processedKey)) continue

      const response = UrlFetchApp.fetch(CASA_YAIZA_URL, {
        method: 'post',
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + secret },
        payload: JSON.stringify({
          from: sender, subject: message.getSubject(), body: message.getBody(),
          receivedAt: message.getDate().toISOString(),
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

  const threads = GmailApp.search('from:dacio.morales@outlook.com subject:"FW: Reservation confirmed" newer_than:7d', 0, 20)
  let matched = 0
  for (const thread of threads) {
    for (const message of thread.getMessages()) {
      const body = message.getPlainBody()
      if (!body.includes('HM4Z3BBD9Z')) continue
      const original = body.match(/^From:\s*Airbnb\s*<automated@airbnb\.com>[\s\S]*?^Sent:\s*([^\r\n]+)[\s\S]*?^Subject:\s*(Reservation confirmed[^\r\n]+)/mi)
      if (!original) continue
      matched++
      const sent = new Date(original[1].trim() + ' UTC')
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
