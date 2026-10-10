import { describe, test, expect, vi, beforeEach } from "vitest";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const HOUSEHOLD_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
const GHOST_ID = "44444444-4444-4444-8444-444444444444";

const state = vi.hoisted(() => ({
  user: { id: "11111111-1111-4111-8111-111111111111" } as { id: string } | null,
  myMembership: null as any,
  target: null as any,
  svcCalls: [] as string[],
  taskUpdateArgs: [] as any[],
  membershipDeleteArgs: [] as any[],
  taskErr: null as any,
  delErr: null as any,
  patchCalls: [] as any[],
  adminCount: null as number | null,
  membersList: [] as any[],
  profiles: {} as Record<string, string>,
}));

// Service-role client mock (untuk @supabase/supabase-js).
vi.mock("@supabase/supabase-js", () => {
  function makeBuilder(table: string) {
    const b: any = {};
    b.where = [] as Array<[string, any]>;
    b.countMode = false;
    b.selectStr = "";
    b.select = (str?: string, opts?: any) => {
      if (typeof str === "string") b.selectStr = str;
      if (opts?.count === "exact") b.countMode = true;
      return b;
    };
    b.eq = (key: string, val: any) => {
      b.where.push([key, val]);
      return b;
    };
    b.maybeSingle = async () => {
      if (table === "profiles") {
        const uid = b.where.find((w: any) => w[0] === "user_id")?.[1];
        const nama = state.profiles?.[uid];
        return { data: nama ? { nama } : null, error: null };
      }
      return { data: state.target };
    };
    b.single = async () => ({ data: state.target || {}, error: null });
    b.update = (...a: any[]) => {
      if (table === "tasks") state.taskUpdateArgs.push(a);
      if (table === "memberships" && a[0] !== undefined) state.patchCalls.push(a);
      return b;
    };
    b.delete = (...a: any[]) => {
      if (table === "memberships") {
        state.svcCalls.push("memberships.delete");
        state.membershipDeleteArgs.push(a);
      }
      return b;
    };
    b.then = (resolve: any) => {
      const result: any = { error: null };
      if (table === "memberships" && b.countMode) {
        result.count = state.adminCount ?? 0;
      }
      if (table === "memberships" && b.selectStr === "user_id, role" && !b.countMode) {
        result.data = state.membersList || [];
      }
      resolve(result);
    };
    return b;
  }

  return {
    createClient: () => ({
      from: (table: string) => makeBuilder(table),
      auth: {
        admin: {
          getUserById: async (id: string) => {
            if (id === MEMBER_ID) {
              return { data: { user: { email: "anggota@rumi.com" } }, error: null };
            }
            return { data: null, error: new Error("not found") };
          },
        },
      },
    }),
  };
});

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

import { GET, PATCH, POST, DELETE } from "@/app/api/members/route";

function delReq(body: any) {
  return new Request("http://localhost/api/members", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchReq(body: any) {
  return new Request("http://localhost/api/members", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function leaveReq(body: any) {
  return new Request("http://localhost/api/members", {
    method: "POST",
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
  state.patchCalls = [];
  state.adminCount = null;
  state.membersList = [
    { user_id: ADMIN_ID, role: "admin", status: "active" },
    { user_id: MEMBER_ID, role: "member", status: "active" },
  ];
  state.profiles = {};
});

describe("GET /api/members", () => {
  test("401 tanpa user", async () => {
    state.user = null;
    const res = await GET(new Request(`http://localhost/api/members?household_id=${HOUSEHOLD_ID}`));
    expect(res.status).toBe(401);
  });

  test("200: nama dari profil, fallback email, lalu 'Anggota' — bukan UUID", async () => {
    state.profiles = { [ADMIN_ID]: "Dhika" };
    state.membersList = [
      { user_id: ADMIN_ID, role: "admin", status: "active" },
      { user_id: MEMBER_ID, role: "member", status: "active" },
      { user_id: GHOST_ID, role: "member", status: "active" },
    ];
    const res = await GET(new Request(`http://localhost/api/members?household_id=${HOUSEHOLD_ID}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([
      { user_id: ADMIN_ID, nama: "Dhika", role: "admin" },
      { user_id: MEMBER_ID, nama: "anggota", role: "member" },
      { user_id: GHOST_ID, nama: "Anggota", role: "member" },
    ]);
    for (const m of data) expect(m.nama).not.toBe(m.user_id);
  });
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

describe("PATCH /api/members (ubah peran anggota)", () => {
  test("401 tanpa user", async () => {
    state.user = null;
    const res = await PATCH(patchReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID, role: "admin" }));
    expect(res.status).toBe(401);
  });

  test("400 role invalid", async () => {
    const res = await PATCH(patchReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID, role: "owner" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Role nggak valid, pilih admin atau member aja" });
  });

  test("403 requester non-admin", async () => {
    state.myMembership = { role: "member" };
    const res = await PATCH(patchReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID, role: "admin" }));
    expect(res.status).toBe(403);
  });

  test("403 admin terakhir nggak bisa diturunkan sendiri", async () => {
    state.adminCount = 1;
    const res = await PATCH(patchReq({ household_id: HOUSEHOLD_ID, user_id: ADMIN_ID, role: "member" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Admin terakhir nggak bisa diturunkan sendiri" });
  });

  test("200 sukses: ubah peran anggota lain", async () => {
    const res = await PATCH(patchReq({ household_id: HOUSEHOLD_ID, user_id: MEMBER_ID, role: "admin" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(state.patchCalls).toHaveLength(1);
    expect(state.patchCalls[0][0]).toEqual({ role: "admin" });
  });
});

describe("POST /api/members (keluar sendiri)", () => {
  test("401 tanpa user", async () => {
    state.user = null;
    const res = await POST(leaveReq({ household_id: HOUSEHOLD_ID }));
    expect(res.status).toBe(401);
  });

  test("400 admin terakhir nggak bisa keluar", async () => {
    state.myMembership = { role: "admin" };
    state.adminCount = 1;
    const res = await POST(leaveReq({ household_id: HOUSEHOLD_ID }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Admin terakhir nggak bisa keluar, angkat admin lain dulu" });
  });

  test("200 sukses: keluar sendiri (requester member)", async () => {
    state.myMembership = { role: "member" };
    const res = await POST(leaveReq({ household_id: HOUSEHOLD_ID }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(state.taskUpdateArgs).toHaveLength(1);
    expect(state.taskUpdateArgs[0][0]).toEqual({ assignee_id: null });
    expect(state.svcCalls).toEqual(["memberships.delete"]);
    expect(state.membershipDeleteArgs).toHaveLength(1);
  });
});
