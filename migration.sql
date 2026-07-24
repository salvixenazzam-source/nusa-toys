-- ============================================================
-- MIGRATION: Nusa Toys - Security & Data Integrity Fixes
-- Run di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom nama_lower di tabel pelanggan (untuk case-insensitive lookup via index)
ALTER TABLE pelanggan ADD COLUMN IF NOT EXISTS nama_lower TEXT;
UPDATE pelanggan SET nama_lower = LOWER(nama) WHERE nama_lower IS NULL;
CREATE INDEX IF NOT EXISTS idx_pelanggan_nama_lower ON pelanggan (nama_lower);

-- 2. Populate nama_lower untuk data existing (trigger untuk auto-fill)
CREATE OR REPLACE FUNCTION set_nama_lower()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nama_lower := LOWER(NEW.nama);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pelanggan_nama_lower ON pelanggan;
CREATE TRIGGER trg_pelanggan_nama_lower
  BEFORE INSERT OR UPDATE OF nama ON pelanggan
  FOR EACH ROW EXECUTE FUNCTION set_nama_lower();

-- 3. Constraint stok tidak boleh negatif
ALTER TABLE produk ADD CONSTRAINT chk_stok_non_negative CHECK (stok >= 0);

-- 4. Constraint kuota_terpakai tidak melebihi kuota
ALTER TABLE diskon ADD CONSTRAINT chk_kuota_not_exceeded CHECK (kuota IS NULL OR kuota_terpakai <= kuota);

-- 5. Atomic increment function untuk stok (supaya tidak race condition)
CREATE OR REPLACE FUNCTION adjust_stok(p_sku TEXT, p_delta INT)
RETURNS INT AS $$
DECLARE
  new_stok INT;
BEGIN
  UPDATE produk
  SET stok = GREATEST(0, stok + p_delta)
  WHERE sku = p_sku
  RETURNING stok INTO new_stok;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Produk dengan SKU % tidak ditemukan', p_sku;
  END IF;

  RETURN new_stok;
END;
$$ LANGUAGE plpgsql;

-- 6. Atomic increment function untuk kuota diskon
CREATE OR REPLACE FUNCTION increment_kuota_diskon(p_diskon_id UUID)
RETURNS INT AS $$
DECLARE
  new_terpakai INT;
BEGIN
  UPDATE diskon
  SET kuota_terpakai = kuota_terpakai + 1,
      updated_at = NOW()
  WHERE id = p_diskon_id
    AND (kuota IS NULL OR kuota_terpakai < kuota)
  RETURNING kuota_terpakai INTO new_terpakai;

  RETURN new_terpakai; -- NULL jika kuota penuh atau diskon tidak ditemukan
END;
$$ LANGUAGE plpgsql;
