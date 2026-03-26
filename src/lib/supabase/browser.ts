'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || anonKey === 'YOUR_SUPABASE_ANON_KEY') {
    throw new Error('Supabase browser client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }

  client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}

export async function getAccessTokenOrNull(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    let { data } = await supabase.auth.getSession();

    if (!data.session) {
      // Requires Anonymous Auth enabled in Supabase project settings.
      await supabase.auth.signInAnonymously();
      const refreshed = await supabase.auth.getSession();
      data = refreshed.data;
    }

    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
