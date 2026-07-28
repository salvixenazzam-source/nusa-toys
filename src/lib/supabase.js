import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config";

let _supabase;

export function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}
