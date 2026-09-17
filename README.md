# Casa Yaiza v2
Next.js + Supabase starter para panel privado, creación de reservas y enlaces de huésped con token aleatorio.

## Incluido
- Login del propietario con Supabase Auth.
- Panel privado y formulario de nueva reserva.
- API de creación de reserva.
- Token de 256 bits; en DB se guarda solo SHA-256.
- Caducidad automática 48 h después del checkout.
- Endpoint para rotar/revocar de facto el enlace.
- Pantalla de huésped ES/EN/DE con reserva precargada.
- Esquema SQL para `reservations` y `guests` + RLS de propietario.
- Foto de Casa Yaiza en `/public`.

## Conectar Supabase
1. Crear proyecto Supabase.
2. Ejecutar `supabase/migrations/001_schema.sql` en SQL Editor.
3. Activar Email/Password en Authentication y crear el usuario propietario.
4. Copiar `.env.example` a `.env.local` y completar URL, anon key y service role key.
5. `npm install && npm run dev`.

## Importante antes de producción
El endpoint API usa la service-role key en servidor. Antes de usar datos reales hay que añadir verificación de sesión del propietario en las rutas `/api/*` y middleware para `/admin`; el starter deja preparada la estructura, pero no debe desplegarse con datos personales hasta implementar esa protección. Añadir también CSP/rate limiting/auditoría, política de retención, consentimiento/información RGPD y almacenamiento privado de firmas/documentos.

## Próxima fase
Completar Titular → Adultos → Menores → Revisión → Firma, guardando mediante endpoints server-side que validen el token y solo permitan la reserva asociada.
