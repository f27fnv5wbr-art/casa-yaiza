# Casa Yaiza V2.2

Next.js + Supabase SSR guest registration flow for Casa Yaiza.

## Already required from V2.1
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- Supabase Auth owner account
- migrations `001_schema.sql` and `002_v2_1_security.sql`

## Upgrade from V2.1
1. In Supabase SQL Editor run **once**: `supabase/migrations/003_v2_2_guest_registration.sql`.
2. Replace/upload the V2.2 project files to the existing GitHub repository.
3. Vercel will redeploy automatically. No new environment variables are needed.

## V2.2 adds
- Working Confirm and continue button.
- ES / EN / DE language switcher.
- Adult/minor split with total validation.
- Holder, adult companion and minor forms.
- Adult signatures captured on canvas.
- Review screen and final submission.
- Token-authenticated guest submission through a SECURITY DEFINER RPC; no service-role key.
- Reservation status becomes `complete` after successful submission.

## Security notes
The public browser never receives a service-role key. Guest access is bearer-token based; only SHA-256 of the token is stored in `reservations`. RLS continues to protect owner data. The submission RPC validates the token and guest counts before writing.

Before using real guest data, complete the legal/privacy text, retention policy, production backup/access policy, and final SES.Hospedajes payload validation.
