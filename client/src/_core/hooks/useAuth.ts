import { useCallback, useEffect, useMemo } from "react";
import { signOutSupabase } from "@/lib/supabase";
import { useSupabaseAuth } from "./useSupabaseAuth";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function mapSupabaseSessionUser(session: { user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } } | null) {
  if (!session?.user) return null;
  const user = session.user;
  return {
    id: user.id,
    openId: user.id,
    name: (user.user_metadata?.name as string | undefined) ?? user.email ?? "Foreign Teacher",
    email: user.email ?? "",
    role: (user.app_metadata?.role as string | undefined) ?? (user.user_metadata?.role as string | undefined) ?? "teacher",
  };
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const supabaseAuth = useSupabaseAuth();
  const supabaseUser = mapSupabaseSessionUser(supabaseAuth.session);

  const logout = useCallback(async () => {
    await signOutSupabase();
    try {
      sessionStorage.removeItem("manus-cookie");
      localStorage.removeItem("manus-runtime-user-info");
    } catch {}
  }, []);

  const state = useMemo(() => {
    const user = supabaseUser;
    try { localStorage.setItem("manus-runtime-user-info", JSON.stringify(user)); } catch {}
    return {
      user,
      loading: supabaseAuth.loading,
      error: null,
      isAuthenticated: Boolean(user),
    };
  }, [supabaseAuth.loading, supabaseUser]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || supabaseAuth.loading || state.user || typeof window === "undefined") return;
    if (redirectPath && window.location.pathname !== redirectPath) window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, state.user, supabaseAuth.loading]);

  return {
    ...state,
    supabaseSession: supabaseAuth.session,
    supabaseConfigured: supabaseAuth.configured,
    refresh: async () => undefined,
    logout,
  };
}
