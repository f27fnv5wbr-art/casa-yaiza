const site = process.env.SITE_URL || 'https://casa-yaiza-wvsh.vercel.app'
const paths = ['/', '/admin/login']
let failed = false
for (const path of paths) {
  try {
    const response = await fetch(new URL(path, site), { signal: AbortSignal.timeout(15000), redirect: 'follow', cache: 'no-store' })
    console.log(`${path}: HTTP ${response.status}`)
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) failed = true
  } catch (error) {
    console.error(`${path}: ${error.message}`)
    failed = true
  }
}
const supabaseUrl = process.env.SUPABASE_URL
if (supabaseUrl) {
  try {
    const response = await fetch(new URL('/auth/v1/health', supabaseUrl), { signal: AbortSignal.timeout(15000), cache: 'no-store' })
    console.log(`Supabase Auth: HTTP ${response.status}`)
    if (!response.ok) failed = true
  } catch (error) {
    console.error(`Supabase Auth: ${error.message}`)
    failed = true
  }
} else {
  console.log('Supabase Auth: pendiente de configurar SUPABASE_URL en GitHub Actions')
}
if (failed) process.exitCode = 1
