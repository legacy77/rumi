/** safeNext: fail-closed same-origin redirect. Returns "/" for anything unsafe. */
export function safeNext(next: string | null): string {
  if (!next) return "/";
  // must be same-origin path: block open-redirect (//, \, absolute). Reject any
  // backslash — browsers normalize "\" to "/" so "\evil.com" → "//evil.com".
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\"))
    return "/";
  return next;
}
