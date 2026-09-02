import { describe, expect, it, vi } from "vitest";
import { supabase } from "@/lib/supabase";
import { subscribeToSupabaseSession } from "./useSupabaseAuth";

describe("Supabase Auth bridge contract", () => {
  it("is disabled without public Supabase configuration", () => {
    expect(supabase).toBeNull();
  });

  it("subscribes to an enabled client session and cleans up", async () => {
    let listener: ((event: string, session: null) => void) | undefined;
    const unsubscribe = { unsubscribe: vi.fn() };
    const client = {
      auth: {
        getSession: vi.fn(async () => ({ data: { session: null } })),
        onAuthStateChange: vi.fn((callback: (event: string, session: null) => void) => { listener = callback; return { data: { subscription: unsubscribe } }; }),
      },
    } as unknown as import("@supabase/supabase-js").SupabaseClient;
    const onSession = vi.fn();
    const stop = subscribeToSupabaseSession(client, onSession);
    await Promise.resolve();
    expect(onSession).toHaveBeenCalledWith(null);
    listener?.("SIGNED_IN", null);
    expect(onSession).toHaveBeenCalledTimes(2);
    stop();
    expect(unsubscribe.unsubscribe).toHaveBeenCalled();
  });
});
