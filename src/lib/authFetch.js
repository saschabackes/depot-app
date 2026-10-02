import { supabase } from './supabase'

// POST an eine Netlify-Function mit dem Supabase-Login als Bearer-Token
export async function authPost(url, body) {
  const { data: { session } } = await supabase.auth.getSession()
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
    },
    body: JSON.stringify(body),
  })
}
