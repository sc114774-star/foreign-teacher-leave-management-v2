// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOutSupabase, supabaseAuth } = vi.hoisted(() => ({
  signOutSupabase: vi.fn(async () => undefined),
  supabaseAuth: { configured: true, loading: false, session: { user: { id: "supabase-1", email: "teacher@example.com", user_metadata: { name: "Lavinia" }, app_metadata: { role: "cingshan" } } }, isAuthenticated: true },
}));

vi.mock("@/lib/supabase", () => ({ signOutSupabase }));
vi.mock("./useSupabaseAuth", () => ({ useSupabaseAuth: () => supabaseAuth }));

import { useAuth } from "./useAuth";

describe("useAuth Supabase runtime consumer", () => {
  beforeEach(() => signOutSupabase.mockClear());

  it("uses the configured Supabase identity without a legacy API dependency", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toMatchObject({ id: "supabase-1", name: "Lavinia", role: "cingshan" });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.supabaseConfigured).toBe(true);
  });

  it("logs out through Supabase when the active session is Supabase", async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => { await result.current.logout(); });
    expect(signOutSupabase).toHaveBeenCalledTimes(1);
  });
});
