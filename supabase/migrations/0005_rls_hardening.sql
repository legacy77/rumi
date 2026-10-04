-- 0005_rls_hardening.sql — pre-pilot RLS hardening.
-- (a) WITH CHECK semua policy scope feature-table (tasks, bills, shopping_items,
--     schedules, reminders) diperketat dari `household_id is not null` menjadi
--     exists-check membership aktif.
-- (b) USING policy scope bills/shopping/schedules/reminders wajib `status = 'active'`
--     (tasks sudah punya — ditegaskan ulang ke nilai yang sama).
-- (c) Policy invites "admin kelola undangan" wajib `status = 'active'` pada
--     exists-check admin (USING + WITH CHECK).
-- Semantik 0002/0003 + "anggota baca serumah" tidak disentuh.

DO $$
BEGIN
  ALTER POLICY "scope rumah tasks" ON tasks
    USING (exists (select 1 from memberships m where m.household_id = tasks.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = tasks.household_id and m.user_id = auth.uid() and m.status = 'active'));
EXCEPTION WHEN undefined_object THEN
  CREATE POLICY "scope rumah tasks" ON tasks FOR ALL
    USING (exists (select 1 from memberships m where m.household_id = tasks.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = tasks.household_id and m.user_id = auth.uid() and m.status = 'active'));
END $$;

DO $$
BEGIN
  ALTER POLICY "scope rumah bills" ON bills
    USING (exists (select 1 from memberships m where m.household_id = bills.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = bills.household_id and m.user_id = auth.uid() and m.status = 'active'));
EXCEPTION WHEN undefined_object THEN
  CREATE POLICY "scope rumah bills" ON bills FOR ALL
    USING (exists (select 1 from memberships m where m.household_id = bills.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = bills.household_id and m.user_id = auth.uid() and m.status = 'active'));
END $$;

DO $$
BEGIN
  ALTER POLICY "scope rumah shopping" ON shopping_items
    USING (exists (select 1 from memberships m where m.household_id = shopping_items.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = shopping_items.household_id and m.user_id = auth.uid() and m.status = 'active'));
EXCEPTION WHEN undefined_object THEN
  CREATE POLICY "scope rumah shopping" ON shopping_items FOR ALL
    USING (exists (select 1 from memberships m where m.household_id = shopping_items.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = shopping_items.household_id and m.user_id = auth.uid() and m.status = 'active'));
END $$;

DO $$
BEGIN
  ALTER POLICY "scope rumah schedules" ON schedules
    USING (exists (select 1 from memberships m where m.household_id = schedules.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = schedules.household_id and m.user_id = auth.uid() and m.status = 'active'));
EXCEPTION WHEN undefined_object THEN
  CREATE POLICY "scope rumah schedules" ON schedules FOR ALL
    USING (exists (select 1 from memberships m where m.household_id = schedules.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = schedules.household_id and m.user_id = auth.uid() and m.status = 'active'));
END $$;

DO $$
BEGIN
  ALTER POLICY "scope rumah reminders" ON reminders
    USING (exists (select 1 from memberships m where m.household_id = reminders.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = reminders.household_id and m.user_id = auth.uid() and m.status = 'active'));
EXCEPTION WHEN undefined_object THEN
  CREATE POLICY "scope rumah reminders" ON reminders FOR ALL
    USING (exists (select 1 from memberships m where m.household_id = reminders.household_id and m.user_id = auth.uid() and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = reminders.household_id and m.user_id = auth.uid() and m.status = 'active'));
END $$;

DO $$
BEGIN
  ALTER POLICY "admin kelola undangan" ON invites
    USING (exists (select 1 from memberships m where m.household_id = invites.household_id and m.user_id = auth.uid() and m.role = 'admin' and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = invites.household_id and m.user_id = auth.uid() and m.role = 'admin' and m.status = 'active'));
EXCEPTION WHEN undefined_object THEN
  CREATE POLICY "admin kelola undangan" ON invites FOR ALL
    USING (exists (select 1 from memberships m where m.household_id = invites.household_id and m.user_id = auth.uid() and m.role = 'admin' and m.status = 'active'))
    WITH CHECK (exists (select 1 from memberships m where m.household_id = invites.household_id and m.user_id = auth.uid() and m.role = 'admin' and m.status = 'active'));
END $$;
