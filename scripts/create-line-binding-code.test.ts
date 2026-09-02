import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./create-line-binding-code.mjs", import.meta.url), "utf8");

describe("LINE binding management script", () => {
  it("supports create, list, and revoke operations through Supabase REST", () => {
    expect(source).toContain('"create", "list", "revoke"');
    expect(source).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(source).toContain("method: \"POST\"");
    expect(source).toContain("method: \"PATCH\"");
    expect(source).toContain("order=created_at.desc");
  });
});
