import { describe, expect, it } from "vitest";
import { isSupabaseConfigured, signInWithPassword, supabase } from "./supabase";

describe("Supabase browser client", () => {
  it("does not create a client when public deployment variables are absent", () => {
    expect(supabase).toBeNull();
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("fails clearly instead of attempting password auth without configuration", async () => {
    await expect(signInWithPassword("teacher@example.com", "not-a-real-password")).rejects.toThrow("Supabase Auth is not configured");
  });
});
