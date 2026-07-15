-- ============================================================
-- NUSA TOYS — Setup Tabel Pembelian (RLS + Kolom)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom nama_produk (kalau belum ada)
ALTER TABLE pembelian ADD COLUMN IF NOT EXISTS nama_produk TEXT DEFAULT '';

-- 2. Aktifkan Row Level Security (kalau belum)
ALTER TABLE pembelian ENABLE ROW LEVEL SECURITY;

-- 3. Policy: anon/public bisa SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Public read"   ON pembelian FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON pembelian FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON pembelian FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON pembelian FOR DELETE  TO anon, authenticated USING (true);
