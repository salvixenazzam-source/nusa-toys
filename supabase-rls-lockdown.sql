-- ============================================================
-- NUSA TOYS — Pengerasan RLS (anon → authenticated)
-- Jalankan SEMUA di Supabase SQL Editor
-- ============================================================

-- ── PRODUK ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read"   ON produk;
DROP POLICY IF EXISTS "Public insert" ON produk;
DROP POLICY IF EXISTS "Public update" ON produk;
DROP POLICY IF EXISTS "Public delete" ON produk;

CREATE POLICY "Auth read"   ON produk FOR SELECT  TO authenticated USING (true);
CREATE POLICY "Auth insert" ON produk FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update" ON produk FOR UPDATE  TO authenticated USING (true);
CREATE POLICY "Auth delete" ON produk FOR DELETE  TO authenticated USING (true);

-- ── PEMBELIAN ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read"   ON pembelian;
DROP POLICY IF EXISTS "Public insert" ON pembelian;
DROP POLICY IF EXISTS "Public update" ON pembelian;
DROP POLICY IF EXISTS "Public delete" ON pembelian;

CREATE POLICY "Auth read"   ON pembelian FOR SELECT  TO authenticated USING (true);
CREATE POLICY "Auth insert" ON pembelian FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update" ON pembelian FOR UPDATE  TO authenticated USING (true);
CREATE POLICY "Auth delete" ON pembelian FOR DELETE  TO authenticated USING (true);

-- ── PENJUALAN ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read"   ON penjualan;
DROP POLICY IF EXISTS "Public insert" ON penjualan;
DROP POLICY IF EXISTS "Public update" ON penjualan;
DROP POLICY IF EXISTS "Public delete" ON penjualan;

CREATE POLICY "Auth read"   ON penjualan FOR SELECT  TO authenticated USING (true);
CREATE POLICY "Auth insert" ON penjualan FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update" ON penjualan FOR UPDATE  TO authenticated USING (true);
CREATE POLICY "Auth delete" ON penjualan FOR DELETE  TO authenticated USING (true);

-- ── KEUANGAN ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read"   ON keuangan;
DROP POLICY IF EXISTS "Public insert" ON keuangan;
DROP POLICY IF EXISTS "Public update" ON keuangan;
DROP POLICY IF EXISTS "Public delete" ON keuangan;

CREATE POLICY "Auth read"   ON keuangan FOR SELECT  TO authenticated USING (true);
CREATE POLICY "Auth insert" ON keuangan FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update" ON keuangan FOR UPDATE  TO authenticated USING (true);
CREATE POLICY "Auth delete" ON keuangan FOR DELETE  TO authenticated USING (true);

-- ── PELANGGAN ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read"   ON pelanggan;
DROP POLICY IF EXISTS "Public insert" ON pelanggan;
DROP POLICY IF EXISTS "Public update" ON pelanggan;
DROP POLICY IF EXISTS "Public delete" ON pelanggan;

CREATE POLICY "Auth read"   ON pelanggan FOR SELECT  TO authenticated USING (true);
CREATE POLICY "Auth insert" ON pelanggan FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update" ON pelanggan FOR UPDATE  TO authenticated USING (true);
CREATE POLICY "Auth delete" ON pelanggan FOR DELETE  TO authenticated USING (true);
