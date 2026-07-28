-- ============================================================
-- Tabel Persediaan (Aset Inventaris)
-- Eksekusi via Supabase SQL Editor:
--   https://supabase.com/dashboard/project/osagatksdkrzcgtmpzhv/sql/new
-- ============================================================

-- 1. Buat tabel
CREATE TABLE IF NOT EXISTS persediaan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  tanggal DATE NOT NULL,
  tipe TEXT NOT NULL CHECK (tipe IN ('MASUK', 'KELUAR')),
  kategori TEXT NOT NULL DEFAULT 'Pembelian',
  jumlah NUMERIC(12,2) NOT NULL,
  qty INTEGER,
  sku TEXT,
  supplier TEXT,
  keterangan TEXT,
  produk_id UUID REFERENCES produk(id)
);

-- 2. Aktifkan RLS
ALTER TABLE persediaan ENABLE ROW LEVEL SECURITY;

-- 3. Public policy (allow all for anon + authenticated)
CREATE POLICY "Public all"
ON persediaan
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
