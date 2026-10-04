// tests/api/shopping.test.ts — regresi prod 500: shopping_items tanpa created_at,
// GET dilarang order created_at (42703). Minimal diff, tanpa migrasi.
import { describe, test, expect, vi, beforeEach } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "u1" } as { id: string } | null,
  orderArgs: [] as any[][],
  selectArgs: [] as any[][],
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      if (table === "memberships") {
        const b: any = {};
        b.select = () => b;
        b.eq = () => b;
        b.single = async () => ({ data: { role: "member" }, error: null });
        return b;
      }
      const b: any = {};
      b.select = (...a: any[]) => {
        state.selectArgs.push(a);
        return b;
      };
      b.eq = () => b;
      b.order = (...a: any[]) => {
        state.orderArgs.push(a);
        return b;
      };
      b.then = (resolve: any) => resolve({ data: [], error: null });
      return b;
    },
  }),
}));

import { GET } from "@/app/api/shopping/route";

beforeEach(() => {
  state.user = { id: "u1" };
  state.orderArgs = [];
  state.selectArgs = [];
});

describe("GET /api/shopping", () => {
  test("tidak order created_at (kolom tidak ada di shopping_items)", async () => {
    const res = await GET(new Request("http://localhost/api/shopping?household_id=h1"));
    expect(res.status).toBe(200);
    expect(state.orderArgs.flat()).not.toContain("created_at");
  });

  test("select kolom tetap sama", async () => {
    const res = await GET(new Request("http://localhost/api/shopping?household_id=h1"));
    expect(res.status).toBe(200);
    expect(state.selectArgs[0][0]).toBe("id, nama, jumlah, catatan, status");
    expect(await res.json()).toEqual([]);
  });
});
