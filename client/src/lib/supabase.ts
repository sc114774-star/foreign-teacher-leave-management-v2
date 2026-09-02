import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function isSupabaseConfigured() {
  return Boolean(supabase);
}

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) throw new Error("Supabase Auth is not configured");
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOutSupabase() {
  if (!supabase) return { error: null };
  return supabase.auth.signOut();
}
