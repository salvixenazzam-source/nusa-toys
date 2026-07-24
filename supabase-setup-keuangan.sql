-- ============================================================
-- NUSA TOYS — Setup Tabel Keuangan (DDL + RLS + Data Awal)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Buat tabel keuangan
CREATE TABLE IF NOT EXISTS keuangan (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tanggal    DATE NOT NULL DEFAULT CURRENT_DATE,
  tipe       TEXT NOT NULL CHECK (tipe IN ('Pemasukan', 'Pengeluaran')),
  kategori   TEXT NOT NULL DEFAULT '',
  jumlah     BIGINT NOT NULL CHECK (jumlah > 0),
  keterangan TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS untuk keuangan
ALTER TABLE keuangan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"   ON keuangan FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON keuangan FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON keuangan FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON keuangan FOR DELETE  TO anon, authenticated USING (true);
