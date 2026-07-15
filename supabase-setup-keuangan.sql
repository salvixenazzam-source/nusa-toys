-- ============================================================
-- NUSA TOYS — Setup Tabel Keuangan (RLS + Data Awal)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. RLS untuk keuangan
ALTER TABLE keuangan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON keuangan FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON keuangan FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON keuangan FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON keuangan FOR DELETE  TO anon, authenticated USING (true);
