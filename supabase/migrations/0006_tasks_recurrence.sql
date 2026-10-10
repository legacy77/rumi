-- 0006_tasks_recurrence.sql — tambah pengulangan untuk tugas
-- idempoten: gunakan DO block untuk check constraint bila perlu
-- kolom: pengulangan text default 'sekali', induk_id uuid references tasks(id)

DO $$
BEGIN
   -- Tambah kolom pengulangan
   IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'pengulangan'
   ) THEN
      ALTER TABLE tasks ADD COLUMN pengulangan text NOT NULL DEFAULT 'sekali';
   END IF;
   
   -- Tambah kolom induk_id
   IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'induk_id'
   ) THEN
      ALTER TABLE tasks ADD COLUMN induk_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
   END IF;
   
   -- Tambah check constraint untuk pengulangan (idempoten)
   IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'tasks' AND constraint_name = 'tasks_pengulangan_check'
   ) THEN
      ALTER TABLE tasks 
      ADD CONSTRAINT tasks_pengulangan_check 
      CHECK (pengulangan IN ('sekali','harian','mingguan','bulanan'));
   END IF;
   
   -- Tambah index untuk induk_id (idempoten)
   IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE tablename = 'tasks' AND indexname = 'idx_tasks_induk'
   ) THEN
      CREATE INDEX idx_tasks_induk ON tasks(induk_id);
   END IF;

   -- Anti-duplikat instance berulang: (induk_id, deadline) unik untuk baris berulang.
   -- Partial index: baris induk_id NULL (tugas biasa) tidak terpengaruh.
   IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE tablename = 'tasks' AND indexname = 'uq_tasks_induk_deadline'
   ) THEN
      CREATE UNIQUE INDEX uq_tasks_induk_deadline ON tasks(induk_id, deadline)
      WHERE induk_id IS NOT NULL AND deadline IS NOT NULL;
   END IF;
END $$;