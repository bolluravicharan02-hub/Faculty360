import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safely normalize the frontend Supabase URL to guarantee a valid HTTP/HTTPS endpoint
function resolveClientSupabaseUrl(url?: string): string {
  if (!url || typeof url !== 'string') return 'https://placeholder.supabase.co';
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed.replace(/\/+$/, '');
  }
  if (trimmed.startsWith('postgres://') || trimmed.startsWith('postgresql://')) {
    const userMatch = trimmed.match(/postgres\.([a-zA-Z0-9_-]+):/);
    if (userMatch && userMatch[1]) {
      return `https://${userMatch[1]}.supabase.co`;
    }
    const hostMatch = trimmed.match(/db\.([a-zA-Z0-9_-]+)\.supabase\.co/);
    if (hostMatch && hostMatch[1]) {
      return `https://${hostMatch[1]}.supabase.co`;
    }
    const poolerMatch = trimmed.match(/([a-zA-Z0-9_-]+)\.pooler\.supabase\.co/);
    if (poolerMatch && poolerMatch[1]) {
      return `https://${poolerMatch[1]}.supabase.co`;
    }
  }
  if (trimmed.includes('.supabase.co')) {
    const clean = trimmed.replace(/^[a-zA-Z0-9_-]+:\/\//, '');
    return `https://${clean.replace(/\/+$/, '')}`;
  }
  return 'https://placeholder.supabase.co';
}

// Retrieve frontend Supabase environment variables
// Standard: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

export const supabaseUrl = resolveClientSupabaseUrl(rawSupabaseUrl);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabasePublishableKey &&
  supabasePublishableKey !== 'placeholder-publishable-key'
);

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
