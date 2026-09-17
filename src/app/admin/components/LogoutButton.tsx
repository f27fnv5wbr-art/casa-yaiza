'use client'

import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/admin/login')
  }

  return <button onClick={logout}>Cerrar sesión</button>
}
