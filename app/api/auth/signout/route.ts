import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:(n)=>cookieStore.get(n)?.value,
        set:(n,v,o)=>{ try{cookieStore.set({name:n,value:v,...o})}catch{} },
        remove:(n,o)=>{ try{cookieStore.set({name:n,value:'',...o})}catch{} },
      },
    }
  )
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!))
}
