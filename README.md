# Casa Yaiza V2.1

Next.js + Supabase SSR para el panel privado de Casa Yaiza y enlaces seguros de huésped.

## Seguridad de esta versión

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; no usa `service_role` ni secret key.
- `@supabase/ssr` y sesiones de Supabase Auth almacenadas en cookies.
- `middleware.ts` revalida la identidad con Supabase Auth y protege `/admin`.
- Las rutas `/api/reservations*` vuelven a comprobar el usuario autenticado en servidor.
- RLS limita reservas y huéspedes al `owner_id = auth.uid()`.
- Los enlaces de huésped usan 256 bits aleatorios y la BD guarda solo SHA-256.
- El huésped consulta solo campos mínimos mediante `lookup_guest_reservation`; el token debe ser válido y no estar caducado.

## Variables de entorno

Copia `.env.example` a `.env.local` para desarrollo. En Vercel crea las mismas variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

No subas `.env.local` a GitHub.

## Supabase

Si ya ejecutaste `001_schema.sql`, ejecuta ahora **una sola vez**:

`supabase/migrations/002_v2_1_security.sql`

## Desarrollo local

```
npm install
npm run dev
```

## Antes de datos reales

Esta V2.1 corrige la autenticación del propietario y elimina la service-role key del flujo. Antes de recopilar DNI/pasaportes reales todavía hay que completar el formulario de viajeros, política de privacidad/retención, almacenamiento privado de firmas/documentos, validación de acceso del huésped para escrituras, controles de abuso/rate limiting y revisión RGPD/LOPDGDD.
