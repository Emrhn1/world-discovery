import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')?.trim();
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) return null;
  return authHeader.slice(7).trim();
}

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || anonKey === 'YOUR_SUPABASE_ANON_KEY') {
    return null;
  }

  const supabase = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user.id;
}
