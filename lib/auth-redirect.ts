/** safeNext: fail-closed same-origin redirect. Returns "/" for anything unsafe. */
export function safeNext(next: string | null): string {
  if (!next) return "/";
  // must be same-origin path, block open-redirect (//, \\, absolute).
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("\\"))
    return "/";
  return next;
}
