// tests/api/invite.test.ts — regresi pre-pilot: accept tidak menimpa admin,
// join baru sebagai member, create path cek admin aktif.
import { describe, test, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  invite: null as any,
  existing: null as any,
  serverMembership: null as any,
  svcUpsert: [] as any[][],
  svcInsert: [] as any[][],
  serverEqArgs: [] as any[][],
  serverInviteInsert: [] as any[],
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      const b: any = {};
      b.select = (..._a: any[]) => b;
      b.eq = (...a: any[]) => {
        state.serverEqArgs.push(a);
        return b;
      };
      b.single = async () => ({ data: state.serverMembership });
      b.insert = async (...a: any[]) => {
        state.serverInviteInsert.push(a);
        return { error: null };
      };
      void table;
      return b;
    },
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => {
      const b: any = {};
      b.select = (..._a: any[]) => b;
      b.eq = (..._a: any[]) => b;
      if (table === "invites") {
        b.single = async () => ({ data: state.invite });
      } else {
        b.maybeSingle = async () => ({ data: state.existing });
        b.upsert = async (...a: any[]) => {
          state.svcUpsert.push(a);
          return { error: null };
        };
        b.insert = async (...a: any[]) => {
          state.svcInsert.push(a);
          return { error: null };
        };
      }
      return b;
    },
  }),
}));

import { POST } from "@/app/api/invite/route";

function req(body: any) {
  return new Request("http://localhost/api/invite", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const besok = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString();

beforeEach(() => {
  state.user = { id: "u1" };
  state.invite = { household_id: "h1", expires_at: besok() };
  state.existing = null;
  state.serverMembership = null;
  state.svcUpsert = [];
  state.svcInsert = [];
  state.serverEqArgs = [];
  state.serverInviteInsert = [];
});

describe("POST /api/invite accept", () => {
  test("tidak menimpa admin yang sudah ada", async () => {
    state.existing = { role: "admin" };
    const res = await POST(req({ code: "ABC" }));
    expect(res.status).toBe(200);
    expect(state.svcUpsert).toHaveLength(0);
    expect(state.svcInsert).toHaveLength(0);
    const body = await res.json();
    expect(body.household_id).toBe("h1");
  });

  test("anggota baru gabung sebagai member (conflict-safe)", async () => {
    state.existing = null;
    const res = await POST(req({ code: "ABC" }));
    expect(res.status).toBe(200);
    expect(state.svcUpsert).toHaveLength(1);
    expect(state.svcUpsert[0][0]).toMatchObject({
      user_id: "u1",
      household_id: "h1",
      role: "member",
      status: "active",
    });
    expect(state.svcUpsert[0][1]).toMatchObject({ onConflict: "user_id,household_id" });
  });
});

describe("POST /api/invite create", () => {
  test("cek admin menyertakan status aktif", async () => {
    state.serverMembership = { role: "admin" };
    const res = await POST(req({ household_id: "h1" }));
    expect(res.status).toBe(200);
    expect(state.serverEqArgs).toContainEqual(["status", "active"]);
  });

  test("bukan admin ditolak", async () => {
    state.serverMembership = { role: "member" };
    const res = await POST(req({ household_id: "h1" }));
    expect(res.status).toBe(403);
  });
});
