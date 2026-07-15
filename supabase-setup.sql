-- ============================================================
-- NUSA TOYS — Setup Tabel Produk (RLS + Data Awal)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Aktifkan Row Level Security
ALTER TABLE produk ENABLE ROW LEVEL SECURITY;

-- 2. Policy: anon/public bisa SELECT, INSERT, UPDATE, DELETE
--    (Fase A: belum ada login, semua akses terbuka)
CREATE POLICY "Public read"   ON produk FOR SELECT  TO anon, authenticated USING (true);
CREATE POLICY "Public insert" ON produk FOR INSERT  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public update" ON produk FOR UPDATE  TO anon, authenticated USING (true);
CREATE POLICY "Public delete" ON produk FOR DELETE  TO anon, authenticated USING (true);

-- 3. Masukkan 4 produk awal
INSERT INTO produk (sku, nama, kategori, supplier, harga_modal, harga_shopee, harga_wa, harga_reseller, berat_gr, stok, min_stok, status)
VALUES
  ('NT001', 'Robot Line Follower',     'Robot Edukasi',   'TechKids Indonesia', 85000,  120000, 110000, 95000,  250,  6,  5, 'Aktif'),
  ('NT002', 'Screw Motor Blocks 50pcs','Building Blocks', 'RoboSupplies',       65000,  95000,  85000,  72000,  400,  3,  5, 'Aktif'),
  ('NT003', 'WeDo 2.0 Core Set',       'Robot Edukasi',   'Lego Education',     450000, 620000, 580000, 490000, 1200, 2,  2, 'Aktif'),
  ('NT004', 'Arduino Starter Kit',     'Elektronik',      'MakerLab',           175000, 250000, 230000, 195000, 500,  11, 3, 'Aktif');
