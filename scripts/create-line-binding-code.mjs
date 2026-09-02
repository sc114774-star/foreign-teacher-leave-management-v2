#!/usr/bin/env node
import { randomBytes } from "node:crypto";

const [action = "create", target = "teacher", targetId] = process.argv.slice(2);
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usage = "Usage: node scripts/create-line-binding-code.mjs <create|list|revoke> <teacher|cingshan|dongyuan> [auth-user-uuid|binding-code]";
if (!["create", "list", "revoke"].includes(action)) throw new Error(usage);
if (action === "create" && !["teacher", "cingshan", "dongyuan"].includes(target)) throw new Error(usage);
if (action === "create" && target === "teacher" && !targetId) throw new Error("Teacher binding requires the Supabase auth user UUID.");
if (!url || !serviceKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for binding management.");
const endpoint = `${url.replace(/\\/$/, "")}/rest/v1/line_recipient_bindings`;
const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };

if (action === "list") {
  const response = await fetch(`${endpoint}?select=id,binding_code,profile_user_id,school,line_user_id,line_group_id,used_at,created_at&order=created_at.desc`, { headers });
  if (!response.ok) throw new Error(`Unable to list bindings (${response.status}): ${await response.text()}`);
  console.log(JSON.stringify(await response.json(), null, 2));
} else if (action === "revoke") {
  if (!targetId) throw new Error("Revoke requires a binding code.");
  const response = await fetch(`${endpoint}?binding_code=eq.${encodeURIComponent(targetId)}`, { method: "PATCH", headers, body: JSON.stringify({ used_at: new Date().toISOString() }) });
  if (!response.ok) throw new Error(`Unable to revoke binding (${response.status}): ${await response.text()}`);
  console.log(`Revoked binding code ${targetId}.`);
} else {
  const code = `FT-${randomBytes(6).toString("hex").toUpperCase()}`;
  const body = { binding_code: code, profile_user_id: target === "teacher" ? targetId : null, school: target === "teacher" ? null : target === "cingshan" ? "青山國小" : "東原國中" };
  const response = await fetch(endpoint, { method: "POST", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Unable to create binding (${response.status}): ${await response.text()}`);
  console.log(JSON.stringify((await response.json())[0] ?? body, null, 2));
  console.log(`Send /bind ${code} from the matching LINE account or school group, then verify used_at is populated.`);
}
