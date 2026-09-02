import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveHomeRole } from "./Home";

const homeSource = readFileSync(new URL("./Home.tsx", import.meta.url), "utf8");

describe("Home Supabase identity consumer", () => {
  it("uses only the authenticated Supabase role for production UI", () => {
    expect(resolveHomeRole("cingshan")).toBe("cingshan");
    expect(resolveHomeRole("dongyuan")).toBe("dongyuan");
    expect(resolveHomeRole("teacher")).toBe("teacher");
  });

  it("removes demo role switching and uses protected Supabase data", () => {
    expect(homeSource).not.toContain("Demo role");
    expect(homeSource).not.toContain("previewForm");
    expect(homeSource).not.toContain("?role=");
    expect(homeSource).toContain("auth.logout()");
  });

  it("wires submit and school decision actions to Supabase adapters", () => {
    expect(homeSource).toContain("createSupabaseLeaveApplication");
    expect(homeSource).toContain("decideSupabaseLeaveApplication");
    expect(homeSource).toContain("LINE 通知");
  });
});
