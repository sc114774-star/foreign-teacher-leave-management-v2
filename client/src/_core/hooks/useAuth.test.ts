import { describe, expect, it } from "vitest";
import { mapSupabaseSessionUser } from "./useAuth";

describe("useAuth Supabase consumer", () => {
  it("maps Supabase identity and app role into the application user shape", () => {
    expect(mapSupabaseSessionUser({ user: { id: "u-1", email: "teacher@example.com", user_metadata: { name: "Lavinia", role: "teacher" }, app_metadata: { role: "cingshan" } } })).toEqual({ id: "u-1", openId: "u-1", name: "Lavinia", email: "teacher@example.com", role: "cingshan" });
  });

  it("returns null without a session and defaults an untyped session to teacher", () => {
    expect(mapSupabaseSessionUser(null)).toBeNull();
    expect(mapSupabaseSessionUser({ user: { id: "u-2", email: "teacher@example.com" } }).role).toBe("teacher");
  });
});
