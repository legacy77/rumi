import { describe, expect, test } from "vitest";
import { buildHouseholdScope } from "@/lib/supabase/scope";
describe("household scope", () => {
  test("menolak query tanpa household_id", () => {
    expect(() => buildHouseholdScope(null as any)).toThrow("household_id wajib");
  });
});
