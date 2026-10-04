import { describe, test, expect, vi, beforeEach } from "vitest";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const HOUSEHOLD_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";

const state = vi.hoisted(() => ({
  user: { id: "11111111-1111-4111-8111-111111111111" } as { id: string } | null,
  myMembership: null as any,
  target: null as any,
  svcCalls: [] as string[],
  taskUpdateArgs: [] as any[],
  membershipDeleteArgs: [] as any[],
  taskErr: null as any,
  delErr: null as any,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (_table: string) => {
      const b: any = {};
      b.select = (..._a: any[]) => b;
      b.eq = (..._a: any[]) => b;
      b.maybeSingle = async () => ({ data: state.myMembership });
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
      b.maybeSingle = async () => ({ data: state.target });
      b.update = (...a: any[]) => {
        if (table === "tasks") state.taskUpdateArgs.push(a);
        return b;
      };
      b.delete = (...a: any[]) => {
        if (table === "memberships") {
          state.svcCalls.push("memberships.delete");
          state.membershipDeleteArgs.push(a);
        }
        return b;
      };
      b.then = (resolve: any) =>
        resolve({ error: table === "tasks" ? state.taskErr : state.delErr });
      return b;
    },
  }),
}));

import { DELETE } from "@/app/api/members/route";

function delReq(body: any) {
  return new Request("http://localhost/api/members", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  state.user = { id: ADMIN_ID };
  state.myMembership = { role: "admin" };
  state.target = { role: "member" };
  state.svcCalls = [];
  state.taskUpdateArgs = [];
  state.membershipDeleteArgs = [];
  state.taskErr = null;
  state.delErr = null;
});

describe("DELETE /api/members", () => {
  test("401 tanpa user", async () => {
    state.user = null;
    const res = await DELETE(delReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID }));
    expect(res.status).toBe(401);
  });

  test("400 param hilang", async () => {
    const res = await DELETE(delReq({ household_id: HOUSEHOLD_ID }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "household_id dan user_id wajib" });
  });

  test("400 UUID malformed", async () => {
    const res = await DELETE(delReq({ household_id: "not-a-uuid", user_id: MEMBER_ID }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "household_id dan user_id wajib" });
  });

  test("403 requester non-admin", async () => {
    state.myMembership = { role: "member" };
    const res = await DELETE(delReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID }));
    expect(res.status).toBe(403);
  });

  test("403 self", async () => {
    const res = await DELETE(delReq({ household_id: HOUSEHOLD_ID, user_id: ADMIN_ID }));
    expect(res.status).toBe(403);
  });

  test("404 target hilang", async () => {
    state.target = null;
    const res = await DELETE(delReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID }));
    expect(res.status).toBe(404);
  });

  test("403 target admin", async () => {
    state.target = { role: "admin" };
    const res = await DELETE(delReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID }));
    expect(res.status).toBe(403);
  });

  test("200 sukses: tasks di-null lalu membership dihapus", async () => {
    const res = await DELETE(delReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(state.taskUpdateArgs).toHaveLength(1);
    expect(state.taskUpdateArgs[0][0]).toEqual({ assignee_id: null });
    expect(state.svcCalls).toEqual(["memberships.delete"]);
    expect(state.membershipDeleteArgs).toHaveLength(1);
  });
});
