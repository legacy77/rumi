// tests/auth-callback-next.test.ts — regresi: callback meneruskan `next`
// same-origin, tapi fallback ke "/" untuk open-redirect (absolut, //, \\).\
import { describe, test, expect } from "vitest";
import { GET } from "@/app/auth/callback/route";

// Tanpa `code`, GET tidak menyentuh Supabase — cukup uji logika redirect.
function req(next?: string) {
  const qs = next === undefined ? "" : `?next=${encodeURIComponent(next)}`;
  return new Request(`http://localhost/auth/callback${qs}`);
}

describe("GET /auth/callback safe next", () => {
  test("next same-origin (path join) diteruskan", async () => {
    const res = await GET(req("/join?code=abc"));
    expect(res.headers.get("location")).toBe("http://localhost/join?code=abc");
  });

  test("URL absolut jatuh kembali ke /", async () => {
    const res = await GET(req("http://evil.example/steal"));
    expect(res.headers.get("location")).toBe("http://localhost/");
  });

  test("protokol-relative dan backslash ditolak", async () => {
    expect((await GET(req("//evil.example"))).headers.get("location")).toBe(
      "http://localhost/"
    );
    expect((await GET(req("\\\\evil.example"))).headers.get("location")).toBe(
      "http://localhost/"
    );
  });
});