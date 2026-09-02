import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveHomeRole } from "./Home";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Home Supabase identity consumer", () => {
  it("uses authenticated Supabase role for production UI", () => {
    expect(resolveHomeRole({ isDemoPreview: false, requestedRole: null, identityRole: "cingshan" })).toBe("cingshan");
    expect(resolveHomeRole({ isDemoPreview: false, requestedRole: null, identityRole: "dongyuan" })).toBe("dongyuan");
    expect(resolveHomeRole({ isDemoPreview: false, requestedRole: null, identityRole: "teacher" })).toBe("teacher");
  });

  it("allows URL role only for explicit demo preview", () => {
    expect(resolveHomeRole({ isDemoPreview: true, requestedRole: "dongyuan", identityRole: "teacher" })).toBe("dongyuan");
    expect(resolveHomeRole({ isDemoPreview: false, requestedRole: "dongyuan", identityRole: "teacher" })).toBe("teacher");
  });

  it("wires submit and school decision actions to Supabase adapters", () => {
    expect(homeSource).toContain("createSupabaseLeaveApplication");
    expect(homeSource).toContain("decideSupabaseLeaveApplication");
    expect(homeSource).toContain("LINE 通知");
  });
});
