// tests/auth-callback-next.test.ts — regresi: safeNext meneruskan `next`
// same-origin, tapi fallback ke "/" untuk open-redirect (absolut, //, \\).
import { describe, test, expect } from "vitest";
import { safeNext } from "@/lib/auth-redirect";

describe("safeNext", () => {
  test("next same-origin (path join) diteruskan", () => {
    expect(safeNext("/join?code=abc")).toBe("/join?code=abc");
  });

  test("URL absolut jatuh kembali ke /", () => {
    expect(safeNext("http://evil.example/steal")).toBe("/");
  });

  test("protokol-relative dan backslash ditolak", () => {
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("\\\\evil.example")).toBe("/");
    expect(safeNext("\\evil.example")).toBe("/");
    expect(safeNext("/join?code=a\\b")).toBe("/");
  });

  test("kosong/null jatuh kembali ke /", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext("")).toBe("/");
  });
});
