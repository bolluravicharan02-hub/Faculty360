import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Expose ONLY public/publishable client variables to the browser
  const publishableKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  // Derive valid HTTP/HTTPS Supabase URL for client
  let supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
    const rawCandidate = process.env.SUPABASE_URL || '';
    const userMatch = rawCandidate.match(/postgres\.([a-zA-Z0-9_-]+):/);
    if (userMatch && userMatch[1]) {
      supabaseUrl = `https://${userMatch[1]}.supabase.co`;
    } else {
      const hostMatch = rawCandidate.match(/db\.([a-zA-Z0-9_-]+)\.supabase\.co/);
      if (hostMatch && hostMatch[1]) {
        supabaseUrl = `https://${hostMatch[1]}.supabase.co`;
      } else if (publishableKey && publishableKey.includes('.')) {
        try {
          const payload = JSON.parse(Buffer.from(publishableKey.split('.')[1], 'base64url').toString('utf8'));
          if (payload && payload.ref) {
            supabaseUrl = `https://${payload.ref}.supabase.co`;
          }
        } catch {}
      }
    }
  }

  // Final safety check: must be valid http or https, otherwise fallback to placeholder
  if (!supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
    supabaseUrl = 'https://placeholder.supabase.co';
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(publishableKey),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(publishableKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
