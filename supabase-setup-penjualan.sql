-- ============================================================
-- NUSA TOYS — Setup Penjualan & Pelanggan (RLS + Kolom)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom yang kurang di penjualan
ALTER TABLE penjualan ADD COLUMN IF NOT EXISTS pembeli TEXT DEFAULT '';
ALTER TABLE penjualan ADD COLUMN IF NOT EXISTS harga_jual INTEGER NOT NULL DEFAULT 0;
ALTER TABLE penjualan ADD COLUMN IF NOT EXISTS nama_produk TEXT DEFAULT '';

-- 2. RLS untuk penjualan
ALTER TABLE penjualan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON penjualan FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON penjualan FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON penjualan FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON penjualan FOR DELETE  TO anon, authenticated USING (true);

-- 3. RLS untuk pelanggan
ALTER TABLE pelanggan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON pelanggan FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON pelanggan FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON pelanggan FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON pelanggan FOR DELETE  TO anon, authenticated USING (true);
