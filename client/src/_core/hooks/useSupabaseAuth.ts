import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export function subscribeToSupabaseSession(client: SupabaseClient, onSession: (session: Session | null) => void) {
  let active = true;
  void client.auth.getSession().then(({ data }) => { if (active) onSession(data.session); });
  const { data: subscription } = client.auth.onAuthStateChange((_event, nextSession) => { if (active) onSession(nextSession); });
  return () => { active = false; subscription.subscription.unsubscribe(); };
}

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToSupabaseSession(supabase, (nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { session, loading, isAuthenticated: Boolean(session), configured: Boolean(supabase) };
}
