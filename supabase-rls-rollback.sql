-- ============================================================
-- NUSA TOYS — ROLLBACK RLS (authenticated → anon/public)
-- Hanya jalankan kalau perlu rollback
-- ============================================================

-- ── PRODUK ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth read"   ON produk;
DROP POLICY IF EXISTS "Auth insert" ON produk;
DROP POLICY IF EXISTS "Auth update" ON produk;
DROP POLICY IF EXISTS "Auth delete" ON produk;

CREATE POLICY "Public read"   ON produk FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON produk FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON produk FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON produk FOR DELETE  TO anon, authenticated USING (true);

-- ── PEMBELIAN ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth read"   ON pembelian;
DROP POLICY IF EXISTS "Auth insert" ON pembelian;
DROP POLICY IF EXISTS "Auth update" ON pembelian;
DROP POLICY IF EXISTS "Auth delete" ON pembelian;

CREATE POLICY "Public read"   ON pembelian FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON pembelian FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON pembelian FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON pembelian FOR DELETE  TO anon, authenticated USING (true);

-- ── PENJUALAN ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth read"   ON penjualan;
DROP POLICY IF EXISTS "Auth insert" ON penjualan;
DROP POLICY IF EXISTS "Auth update" ON penjualan;
DROP POLICY IF EXISTS "Auth delete" ON penjualan;

CREATE POLICY "Public read"   ON penjualan FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON penjualan FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON penjualan FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON penjualan FOR DELETE  TO anon, authenticated USING (true);

-- ── KEUANGAN ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth read"   ON keuangan;
DROP POLICY IF EXISTS "Auth insert" ON keuangan;
DROP POLICY IF EXISTS "Auth update" ON keuangan;
DROP POLICY IF EXISTS "Auth delete" ON keuangan;

CREATE POLICY "Public read"   ON keuangan FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON keuangan FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON keuangan FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON keuangan FOR DELETE  TO anon, authenticated USING (true);

-- ── PELANGGAN ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Auth read"   ON pelanggan;
DROP POLICY IF EXISTS "Auth insert" ON pelanggan;
DROP POLICY IF EXISTS "Auth update" ON pelanggan;
DROP POLICY IF EXISTS "Auth delete" ON pelanggan;

CREATE POLICY "Public read"   ON pelanggan FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON pelanggan FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON pelanggan FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON pelanggan FOR DELETE  TO anon, authenticated USING (true);
