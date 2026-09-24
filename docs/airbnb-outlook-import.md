# Confirmaciones Airbnb desde Outlook

La ruta `POST /api/integrations/airbnb` acepta un correo enviado por una automatización
de Outlook. Solo importa confirmaciones del anuncio Casa Yaiza (ID `44393519`).
Comprueba el remitente, la estructura del correo, el catálogo de pago `04` y el
código de reserva. Una segunda entrega del mismo código devuelve `already_exists`.

## Preparación

1. Ejecutar `supabase/migrations/008_unique_booking_code.sql` en Supabase SQL Editor.
2. En Vercel Production, añadir secretos de servidor:
   - `SUPABASE_SERVICE_ROLE_KEY`: clave de servicio del proyecto Supabase. Nunca usar `NEXT_PUBLIC_` ni compartirla en el chat.
   - `AIRBNB_IMPORT_OWNER_ID`: UUID del usuario administrador de Supabase Auth.
   - `AIRBNB_IMPORT_SECRET`: cadena aleatoria larga, exclusiva para esta integración.
3. Desplegar de nuevo Production para cargar los secretos.

## Outlook.com personal → Gmail → Casa Yaiza

En Outlook web, crear una regla con la condición **De** `automated@airbnb.com`
y la acción **Redirigir a** `daciomb@gmail.com`. La redirección preserva el
remitente original; no activar el reenvío de todo el buzón. Gmail recibirá
solo las confirmaciones que cumplan la regla (y otros correos de Airbnb de
ese remitente, que el importador descartará por asunto y contenido).

En [Google Apps Script](https://script.google.com/), crear un proyecto y pegar
`integrations/gmail/CasaYaizaAirbnb.gs`. En **Configuración del proyecto →
Propiedades de secuencia**, crear `AIRBNB_IMPORT_SECRET` con el mismo secreto
guardado en Vercel. Ejecutar `configurar()` una vez y aprobar los permisos
Gmail, solicitudes externas y disparadores. El script comprueba los mensajes
cada cinco minutos, registra los ya importados y reintenta los errores.
El código de reserva único protege también contra duplicados por entregas
repetidas. `configurar()` fija el momento inicial para no importar mensajes
anteriores sin una revisión explícita.

## Alternativa: Power Automate con cuenta compatible

En Power Automate, crear un flujo con el desencadenador **When a new email arrives (V3)**
para el buzón `dacio.morales@outlook.com`. Filtrar remitente `automated@airbnb.com`
y asunto `Reservation confirmed`. Añadir una acción HTTP POST:

```
URL: https://casa-yaiza-wvsh.vercel.app/api/integrations/airbnb
Headers:
  Content-Type: application/json
  Authorization: Bearer <AIRBNB_IMPORT_SECRET>
Body:
  {
    "from": "automated@airbnb.com",
    "subject": <Subject de Outlook como cadena JSON>,
    "body": <Body de Outlook como cadena JSON>,
    "receivedAt": <Received time de Outlook en ISO 8601 como cadena JSON>
  }
```

Usar el remitente real del mensaje para el campo `from`; el ejemplo de arriba
representa el valor esperado. En Power Automate, componer el objeto con contenido
dinámico de Outlook, no pegar literalmente los marcadores `<...>`. La acción HTTP
requiere que la cuenta admita ese conector. Proteger el encabezado de autorización
y las entradas/salidas del paso en el historial del flujo.

Respuesta `201`: reserva creada, incluye `guest_url`. Respuesta `200` con
`already_exists`: correo ya importado. Respuesta `422`: mensaje no reconocido,
que requiere revisión manual. Conviene enviar el enlace `guest_url` solo al
propietario, para compartirlo después por el canal de Airbnb.

Para importar la confirmación ya recibida de Karsten, se puede ejecutar el flujo
una vez sobre ese mensaje o invocar la ruta con sus datos, después de configurar
las variables. El flujo de llegada solo cubre mensajes nuevos.
