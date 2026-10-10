-- 0007_profiles.sql — nama anggota (biar UI nggak nampilin UUID mentah).
-- Idempoten: CREATE TABLE IF NOT EXISTS + DROP POLICY IF EXISTS lalu CREATE.

CREATE TABLE IF NOT EXISTS profiles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama       text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Baca profil sendiri.
DROP POLICY IF EXISTS "baca profil sendiri" ON profiles;
CREATE POLICY "baca profil sendiri" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Baca profil sesama anggota rumah (keduanya harus masih aktif).
DROP POLICY IF EXISTS "baca profil serumah" ON profiles;
CREATE POLICY "baca profil serumah" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM memberships m1
      JOIN memberships m2 ON m2.household_id = m1.household_id
      WHERE m1.user_id = auth.uid()
        AND m2.user_id = profiles.user_id
        AND m1.status = 'active'
        AND m2.status = 'active'
    )
  );

-- Hanya pemilik profil yang boleh bikin/ubah profilnya sendiri.
DROP POLICY IF EXISTS "profil insert sendiri" ON profiles;
CREATE POLICY "profil insert sendiri" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profil update sendiri" ON profiles;
CREATE POLICY "profil update sendiri" ON profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
