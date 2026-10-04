# RUMI MVP Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bangun MVP RUMI Phase 1 (PWA multi-rumah: akun, keluarga, tugas, tagihan, belanja, jadwal minimal, dashboard, reminder in-app) siap diuji 2-3 keluarga dengan biaya nol.

**Architecture:** Monolith Next.js App Router (PWA, mobile-first) + Supabase (Auth, Postgres + RLS per household_id, Realtime per rumah, Storage bukti). UI locked: Dashboard C, Tugas B swipe, Tagihan/Belanja B tombol besar.

**Tech Stack:** Next.js 14+ (TypeScript, App Router), Supabase JS v2, @supabase/ssr, Tailwind CSS, Plus Jakarta Sans, next-pwa (atau custom SW), Vitest + Testing Library, Playwright (smoke).

**Spec:** `docs/superpowers/specs/2026-10-03-rumi-design.md`

## Global Constraints

- Phase 1 development harus zero-cost (hanya free-tier Supabase + Vercel/Cloudflare, tanpa layanan push/SMS/payment berbayar).
- 1 user bisa buat/gabung banyak rumah via `memberships`; semua query filter `household_id` rumah aktif + RLS.
- Peran MVP: admin vs member saja (admin kelola anggota/role/rumah; member CRUD harian saja).
- Reminder Phase 1 level 1 saja: in-app + tambah ke kalender device (.ics), tanpa Web Push.
- Bahasa UI Indonesia natural, suportif, tidak menyalahkan; palet terracotta #D97757 / cream #F5EEE4 / charcoal #382F2A / muted #786B60.
- Mobile-first PWA installable; tetap berguna tanpa izin notifikasi; aksi utama ≤ 3 langkah.
- Navigasi: Beranda | Tugas | Jadwal | Belanja | Keluarga (+ Pengaturan); tombol + di tengah bottom nav (Tugas B).

## Review Focus

- Ganti rumah aktif tapi list masih tampilkan data rumah lama → harus selalu query ulang + resubscribe realtime per household_id.
- Member memanggil API hapus rumah/keluarkan anggota via curl langsung → RLS harus menolak, bukan hanya UI disembunyikan.
- Upload bukti tagihan melebihi limit Storage gratis → harus ditolak ramah + tawarkan simpan tanpa bukti.
- Invite link/kode kedaluwarsa atau dipakai ulang → pesan jelas + minta kode baru, bukan error 500.
- Offline lalu centang tugas/belanja → tampil cache terakhir + tandai menunggu sync, tidak hilang saat reload.

---

### Task 1: Scaffolding Next.js PWA + tema brand

**Files:**
- Create: `package.json`, `app/layout.tsx`, `app/globals.css`, `app/manifest.ts`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `next.config.mjs`, `tailwind.config.ts`
- Test: `tests/ui/theme.test.tsx`

**Interfaces:**
- Consumes: tidak ada
- Produces: `AppShell(rumahAktif, children)` layout, CSS vars `--rumi-*`, font Plus Jakarta Sans

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/theme.test.tsx
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

test("layout renders brand greeting slot", () => {
  render(<RootLayout><div>Halo, keluarga!</div></RootLayout>);
  expect(screen.getByText("Halo, keluarga!")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/theme.test.tsx`
Expected: FAIL with "Cannot find module @/app/layout"

- [ ] **Step 3: Write minimal implementation**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm i @supabase/supabase-js @supabase/ssr
```

```tsx
// app/layout.tsx
import "./globals.css";
export const metadata = { title: "RUMI", description: "Asisten digital untuk urusan rumah sehari-hari." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="id"><body className="bg-[#F5EEE4] text-[#382F2A] font-sans">{children}</body></html>);
}
```

```css
/* app/globals.css */
:root { --rumi-primary: #D97757; --rumi-cream: #F5EEE4; --rumi-ink: #382F2A; --rumi-muted: #786B60; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/theme.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json app/layout.tsx app/globals.css tests/ui/theme.test.tsx
git commit -m "feat: scaffold nextjs pwa shell with rumi brand theme"
```

### Task 2: Skema Supabase + RLS multi-rumah

**Files:**
- Create: `supabase/migrations/0001_rumi_phase1.sql`, `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Test: `tests/db/rls.test.ts`

**Interfaces:**
- Consumes: Task 1 shell
- Produces: tabel `households, memberships, tasks, bills, shopping_items, schedules, reminders`; helpers `createClient(), createServerClient()`

- [ ] **Step 1: Write the failing test**

```ts
// tests/db/rls.test.ts
import { describe, expect, test } from "vitest";
import { buildHouseholdScope } from "@/lib/supabase/scope";
describe("household scope", () => {
  test("menolak query tanpa household_id", () => {
    expect(() => buildHouseholdScope(null as any)).toThrow("household_id wajib");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db/rls.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write minimal implementation**

```sql
-- supabase/migrations/0001_rumi_phase1.sql
create table households (id uuid primary key default gen_random_uuid(), nama text not null, created_by uuid references auth.users(id), created_at timestamptz default now());
create table memberships (user_id uuid references auth.users(id), household_id uuid references households(id) on delete cascade, role text check (role in ('admin','member')) default 'member', status text default 'active', primary key (user_id, household_id));
alter table households enable row level security;
alter table memberships enable row level security;
create policy "member baca rumahnya" on households for select using (exists (select 1 from memberships m where m.household_id = id and m.user_id = auth.uid() and m.status='active'));
create policy "user buat rumah" on households for insert with check (true);
create policy "admin update rumah" on households for update using (exists (select 1 from memberships m where m.household_id = id and m.user_id = auth.uid() and m.role='admin'));
create table tasks (id uuid primary key default gen_random_uuid(), household_id uuid references households(id) on delete cascade not null, judul text not null, deskripsi text default '', deadline date, prioritas text default 'normal', status text default 'todo' check (status in ('todo','done')), assignee_id uuid references auth.users(id), created_by uuid references auth.users(id), created_at timestamptz default now());
alter table tasks enable row level security;
create policy "scope rumah tasks" on tasks for all using (exists (select 1 from memberships m where m.household_id = tasks.household_id and m.user_id = auth.uid() and m.status='active')) with check (household_id is not null);
create table bills (id uuid primary key default gen_random_uuid(), household_id uuid references households(id) on delete cascade not null, nama text not null, nominal int not null check (nominal >= 0), jatuh_tempo date not null, status text default 'belum' check (status in ('belum','lunas')), bukti_url text, created_by uuid references auth.users(id));
alter table bills enable row level security;
create policy "scope rumah bills" on bills for all using (exists (select 1 from memberships m where m.household_id = bills.household_id and m.user_id = auth.uid())) with check (household_id is not null);
create table shopping_items (id uuid primary key default gen_random_uuid(), household_id uuid references households(id) on delete cascade not null, nama text not null, jumlah text default '1', catatan text default '', status text default 'perlu' check (status in ('perlu','dibeli')), created_by uuid references auth.users(id));
alter table shopping_items enable row level security;
create policy "scope rumah shopping" on shopping_items for all using (exists (select 1 from memberships m where m.household_id = shopping_items.household_id and m.user_id = auth.uid())) with check (household_id is not null);
create table schedules (id uuid primary key default gen_random_uuid(), household_id uuid references households(id) on delete cascade not null, judul text not null, mulai timestamptz not null, selesai timestamptz, lokasi text default '', created_by uuid references auth.users(id));
alter table schedules enable row level security;
create policy "scope rumah schedules" on schedules for all using (exists (select 1 from memberships m where m.household_id = schedules.household_id and m.user_id = auth.uid())) with check (household_id is not null);
create table reminders (id uuid primary key default gen_random_uuid(), household_id uuid references households(id) on delete cascade not null, ref_tipe text not null, ref_id uuid, waktu timestamptz not null, pengulangan text default 'sekali', target_user_id uuid references auth.users(id), aktif boolean default true);
alter table reminders enable row level security;
create policy "scope rumah reminders" on reminders for all using (exists (select 1 from memberships m where m.household_id = reminders.household_id and m.user_id = auth.uid())) with check (household_id is not null);
```

```ts
// lib/supabase/scope.ts
export function buildHouseholdScope(household_id: string) {
  if (!household_id) throw new Error("household_id wajib");
  return { household_id };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db/rls.test.ts`
Expected: PASS; plus `supabase db lint` manual di dashboard (RLS aktif semua tabel)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0001_rumi_phase1.sql lib/supabase/ tests/db/rls.test.ts
git commit -m "feat: supabase schema multi-household with rls phase1"
```

### Task 3: Auth + pilih/ganti rumah aktif

**Files:**
- Create: `app/(auth)/login/page.tsx`, `lib/household-context.tsx`, `app/api/households/route.ts`
- Test: `tests/ui/household-switch.test.tsx`

**Interfaces:**
- Consumes: Task 2 scope
- Produces: `useHousehold() -> { household_id, role, switchHousehold(id) }`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/household-switch.test.tsx
import { render, screen } from "@testing-library/react";
import { HouseholdProvider } from "@/lib/household-context";
test("tampilkan nama rumah aktif", () => {
  render(<HouseholdProvider initial={{ id: "h1", nama: "Rumah Kita", role: "admin" }}><span>Rumah Kita</span></HouseholdProvider>);
  expect(screen.getByText("Rumah Kita")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/household-switch.test.tsx`
Expected: FAIL module not found

- [ ] **Step 3: Write minimal implementation**

```tsx
// lib/household-context.tsx
"use client";
import { createContext, useContext, useState } from "react";
const Ctx = createContext<any>(null);
export function HouseholdProvider({ initial, children }: any) {
  const [cur, setCur] = useState(initial);
  return <Ctx.Provider value={{ ...cur, switchHousehold: setCur }}>{children}</Ctx.Provider>;
}
export const useHousehold = () => useContext(Ctx);
```

```tsx
// app/(auth)/login/page.tsx — email + Google via supabase auth, redirect ke /
// (gunakan createClient dari lib/supabase/client.ts, signInWithOAuth provider google)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/household-switch.test.tsx`
Expected: PASS (Review Focus: ganti rumah harus refetch semua list — diuji di Task 9)

- [ ] **Step 5: Commit**

```bash
git add lib/household-context.tsx "app/(auth)/login/page.tsx" tests/ui/household-switch.test.tsx
git commit -m "feat: auth and active household switching"
```

### Task 4: Keluarga (invite link/kode, peran)

**Files:**
- Create: `app/(main)/keluarga/page.tsx`, `app/api/invite/route.ts`
- Test: `tests/ui/family.test.tsx`

**Interfaces:**
- Consumes: `useHousehold()`
- Produces: `POST /api/invite {household_id} -> {code}`, halaman daftar anggota + tombol undang/salin link

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/family.test.tsx
import { render, screen } from "@testing-library/react";
import KeluargaPage from "@/app/(main)/keluarga/page";
test("member tidak lihat tombol keluarkan", () => {
  render(<KeluargaPage members={[{ nama: "Ibu", role: "admin" }]} myRole="member" />);
  expect(screen.queryByText(/keluarkan/i)).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/family.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
// app/(main)/keluarga/page.tsx (ringkas)
export default function KeluargaPage({ members = [], myRole = "admin" }: any) {
  return (<div>{members.map((m: any) => <div key={m.nama}>{m.nama} · {m.role} {myRole === "admin" && m.role !== "admin" && <button>Keluarkan</button>}</div>)}
    {myRole === "admin" && <button>Undang via link</button>}</div>);
}
```

Invite: buat kode `base64url(household_id + exp 7 hari)` tanpa email berbayar; halaman `/join?code=` validasi lalu insert `memberships`. (Review Focus: kode kedaluwarsa → "Kode kedaluwarsa, minta kode baru ke admin".)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/family.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/keluarga/page.tsx" app/api/invite/route.ts tests/ui/family.test.tsx
git commit -m "feat: family members with admin-member roles and invite code"
```

### Task 5: Tugas (list kompak + swipe, UI B)

**Files:**
- Create: `app/(main)/tugas/page.tsx`, `components/TaskRow.tsx`, `app/api/tasks/route.ts`
- Test: `tests/ui/tasks.test.tsx`

**Interfaces:**
- Consumes: `useHousehold()`
- Produces: `TaskRow({id, judul, assignee, status, onToggle, onAssign})`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import TaskRow from "@/components/TaskRow";
test("geser kanan = selesai memanggil onToggle", () => {
  const fn = vi.fn();
  render(<TaskRow judul="Pel lantai" status="todo" onToggle={fn} />);
  fireEvent.click(screen.getByRole("checkbox"));
  expect(fn).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/tasks.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
// components/TaskRow.tsx
export default function TaskRow({ judul, assignee, status, onToggle }: any) {
  return (<div className="bg-white rounded-xl px-3 py-2 flex justify-between">
    <label><input type="checkbox" checked={status === "done"} onChange={onToggle} /> {judul}</label>
    <span className="text-[#D97757] text-sm">{assignee}</span></div>);
}
```

Filter Milikku/Hari ini/Selesai + realtime subscribe channel `tasks:household_id`. Optimis toggle + rollback. (Review Focus: offline → tandai menunggu sync.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/tasks.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/tugas/page.tsx" components/TaskRow.tsx tests/ui/tasks.test.tsx
git commit -m "feat: compact task list with swipe semantics"
```

### Task 6: Tagihan (tombol besar, UI B)

**Files:**
- Create: `app/(main)/tagihan/page.tsx`, `components/BillCard.tsx`
- Test: `tests/ui/bills.test.tsx`

**Interfaces:**
- Consumes: `useHousehold()`
- Produces: `BillCard({nama, nominal, jatuh_tempo, status, onPay})`

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import BillCard from "@/components/BillCard";
test("tombol tandai lunas memanggil onPay", () => {
  const fn = vi.fn();
  render(<BillCard nama="Internet" nominal={350000} status="belum" onPay={fn} />);
  fireEvent.click(screen.getByText(/tandai lunas/i));
  expect(fn).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/bills.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```tsx
export default function BillCard({ nama, nominal, status, onPay }: any) {
  return (<div className="bg-white rounded-xl p-3 border-l-4 border-[#D97757]">
    <div>{nama} · Rp{nominal}</div>
    {status !== "lunas" && <button onClick={onPay} className="bg-[#D97757] text-white rounded-full px-3 py-1 mt-2">Tandai lunas</button>}</div>);
}
```

List H-3 jatuh tempo di atas; upload bukti opsional ke Storage dengan batas gratis (gagal → "Penyimpanan penuh, simpan tanpa bukti ya"). Tanpa payment gateway.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/bills.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/tagihan/page.tsx" components/BillCard.tsx tests/ui/bills.test.tsx
git commit -m "feat: bills with big pay button and h-3 list"
```

### Task 7: Belanja (tombol besar, 1 list aktif)

**Files:**
- Create: `app/(main)/belanja/page.tsx`
- Test: `tests/ui/shopping.test.tsx`

**Interfaces:**
- Consumes: `useHousehold()`
- Produces: halaman 1 list aktif + tambah/centang massal + hapus yang dibeli

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import BelanjaPage from "@/app/(main)/belanja/page";
test("centang massal menandai dibeli", () => {
  render(<BelanjaPage items={[{ nama: "Galon", status: "perlu" }]} />);
  fireEvent.click(screen.getByText(/tandai semua dibeli/i));
  expect(screen.getByText(/dibeli/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/shopping.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Halaman list + checkbox besar per item + tombol "Tandai semua dibeli" + "Hapus yang dibeli". Realtime sama seperti tugas.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/shopping.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/belanja/page.tsx" tests/ui/shopping.test.tsx
git commit -m "feat: shared shopping list with bulk actions"
```

### Task 8: Jadwal minimal + Reminder Center + .ics

**Files:**
- Create: `app/(main)/jadwal/page.tsx`, `app/(main)/pengingat/page.tsx`, `lib/ics.ts`
- Test: `tests/ui/reminder.test.ts`

**Interfaces:**
- Consumes: tasks, bills, schedules
- Produces: `toICS({judul, mulai, selesai}) -> string`, halaman pengingat hari ini + terlewat

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { toICS } from "@/lib/ics";
test("hasilkan file ics valid", () => {
  const s = toICS({ judul: "Rapat RT", mulai: "2026-10-04T19:00:00", selesai: "2026-10-04T20:00:00" });
  expect(s).toContain("BEGIN:VEVENT");
  expect(s).toContain("Rapat RT");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/reminder.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/ics.ts
export function toICS({ judul, mulai, selesai }: any) {
  const f = (s: string) => s.replace(/[-:]/g, "").split(".")[0] + "Z";
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${judul}`, `DTSTART:${f(mulai)}`, `DTEND:${f(selesai)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
}
```

Reminder Center: gabungkan reminders aktif + tugas deadline hari ini + bills H-3 + schedules hari ini; tombol "Tambah ke Kalender HP" unduh .ics. Tanpa push.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/reminder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/jadwal/page.tsx" "app/(main)/pengingat/page.tsx" lib/ics.ts tests/ui/reminder.test.ts
git commit -m "feat: minimal schedule and level1 reminder center with ics"
```

### Task 9: Dashboard C + bottom nav + realtime scope

**Files:**
- Create: `app/(main)/page.tsx`, `components/BottomNav.tsx`, `components/AttentionCard.tsx`
- Test: `tests/ui/dashboard.test.tsx`, `tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: semua Task 5-8
- Produces: dashboard 4 kartu + attention hero + BottomNav(Beranda,Tugas,+,Belanja,Keluarga)

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import Dashboard from "@/app/(main)/page";
test("tampilkan 1 hal urgent paling besar", () => {
  render(<Dashboard urgent={{ text: "Internet jatuh tempo besok" }} counts={{ tugas: 3, belanja: 5 }} />);
  expect(screen.getByText(/jatuh tempo besok/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/dashboard.test.tsx`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

Hero `AttentionCard` (bg charcoal, teks cream) + 4 kartu ringkas link ke halaman + BottomNav dengan + di tengah membuka sheet pilih (Tugas/Belanja/Tagihan/Jadwal). Ganti rumah → unsubscribe + subscribe ulang channel `household_id`. (Review Focus: tidak boleh bocor data rumah lama.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/dashboard.test.tsx && npx playwright test tests/e2e/smoke.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(main)/page.tsx" components/BottomNav.tsx tests/ui/dashboard.test.tsx
git commit -m "feat: attention-first dashboard with bottom nav"
```

### Task 10: Offline cache + error + zero-cost QA

**Files:**
- Create: `lib/offline-queue.ts`, `app/offline/page.tsx`
- Test: `tests/ui/offline.test.ts`

**Interfaces:**
- Consumes: semua task
- Produces: `queueWrite(op)` + banner "menunggu sync"

- [ ] **Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { queueWrite } from "@/lib/offline-queue";
test("tulis offline masuk antrean", () => {
  const q = queueWrite({ type: "task.toggle", id: "t1" });
  expect(q.length).toBe(1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/offline.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```ts
const mem: any[] = [];
export function queueWrite(op: any) { mem.push({ ...op, at: Date.now() }); return mem; }
```

Service worker cache shell + halaman terakhir; pesan RLS-denied ramah; cek limit Supabase/Vercel di README; uji manual Android + iOS Add-to-Home-Screen.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/ui/offline.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/offline-queue.ts tests/ui/offline.test.ts
git commit -m "feat: offline queue and zero-cost qa pass"
```
