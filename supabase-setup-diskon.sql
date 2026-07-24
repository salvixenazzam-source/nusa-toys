-- ============================================================
-- NUSA TOYS — Setup Tabel Diskon (RLS + Kolom)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel utama diskon
CREATE TABLE IF NOT EXISTS diskon (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama            TEXT NOT NULL,
  jenis           TEXT NOT NULL CHECK (jenis IN ('PERSEN', 'NOMINAL', 'BELI_X_GRATIS_Y', 'BUNDLE')),
  nilai           NUMERIC(12,2) NOT NULL,      -- % untuk PERSEN, IDR untuk NOMINAL, harga untuk BUNDLE
  nilai_gratis    INTEGER,                     -- qty unit gratis (khusus BELI_X_GRATIS_Y)
  beli_min_qty    INTEGER,                     -- trigger qty (khusus BELI_X_GRATIS_Y)
  min_pembelian   NUMERIC(12,2),               -- minimal total cart IDR
  berlaku_untuk   TEXT NOT NULL DEFAULT 'SEMUA' CHECK (berlaku_untuk IN ('SEMUA', 'KATEGORI', 'SKU')),
  mulai           DATE NOT NULL,
  selesai         DATE,                        -- NULL = tidak ada batas waktu
  kuota           INTEGER,                     -- NULL = unlimited
  kuota_terpakai  INTEGER DEFAULT 0,
  aktif           BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Relasi diskon ke kategori (pakai TEXT karena kategori di produk masih text field)
CREATE TABLE IF NOT EXISTS diskon_kategori (
  diskon_id   UUID REFERENCES diskon(id) ON DELETE CASCADE,
  kategori    TEXT NOT NULL,
  PRIMARY KEY (diskon_id, kategori)
);

-- 3. Relasi diskon ke SKU tertentu (many-to-many via produk.id)
CREATE TABLE IF NOT EXISTS diskon_produk (
  diskon_id   UUID REFERENCES diskon(id) ON DELETE CASCADE,
  produk_id   UUID REFERENCES produk(id) ON DELETE CASCADE,
  PRIMARY KEY (diskon_id, produk_id)
);

-- 4. Tambah kolom diskon di penjualan
ALTER TABLE penjualan ADD COLUMN IF NOT EXISTS diskon_id     UUID REFERENCES diskon(id);
ALTER TABLE penjualan ADD COLUMN IF NOT EXISTS diskon_nilai  NUMERIC(12,2) DEFAULT 0;
ALTER TABLE penjualan ADD COLUMN IF NOT EXISTS hemat         NUMERIC(12,2) DEFAULT 0;

-- 5. Index untuk query cepat diskon aktif
CREATE INDEX IF NOT EXISTS idx_diskon_aktif ON diskon(aktif, mulai, selesai);

-- 6. RLS untuk diskon
ALTER TABLE diskon ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON diskon FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON diskon FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON diskon FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON diskon FOR DELETE  TO anon, authenticated USING (true);

-- 7. RLS untuk diskon_kategori
ALTER TABLE diskon_kategori ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON diskon_kategori FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON diskon_kategori FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON diskon_kategori FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON diskon_kategori FOR DELETE  TO anon, authenticated USING (true);

-- 8. RLS untuk diskon_produk
ALTER TABLE diskon_produk ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON diskon_produk FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON diskon_produk FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON diskon_produk FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON diskon_produk FOR DELETE  TO anon, authenticated USING (true);

-- 9. Function RPC untuk increment kuota_terpakai secara atomik
CREATE OR REPLACE FUNCTION increment_kuota_terpakai(p_diskon_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_val INTEGER;
BEGIN
  UPDATE diskon
  SET kuota_terpakai = COALESCE(kuota_terpakai, 0) + 1,
      updated_at = NOW()
  WHERE id = p_diskon_id
  RETURNING kuota_terpakai INTO new_val;
  RETURN new_val;
END;
$$ LANGUAGE plpgsql;
