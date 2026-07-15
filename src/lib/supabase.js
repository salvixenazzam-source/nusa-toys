import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Singleton untuk client components
let _supabase;

export function getSupabase() {
  if (!_supabase) _supabase = createClient();
  return _supabase;
}

// Ekspor fungsi — jangan inisialisasi di module level (error saat build Vercel)
let _supabaseClient;

export function getSupabaseClient() {
  if (!_supabaseClient) _supabaseClient = createClient();
  return _supabaseClient;
}
