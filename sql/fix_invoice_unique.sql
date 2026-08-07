-- ============================================================
-- NUSA TOYS — Fix: UNIQUE constraint pada penjualan.invoice
-- Mencegah race condition double-click membuat penjualan duplikat
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Cek apakah sudah ada constraint unique di kolom invoice
-- Jika belum, tambahkan:
ALTER TABLE penjualan ADD CONSTRAINT uq_penjualan_invoice UNIQUE (invoice);

-- Catatan: jika sudah ada data duplikat, constraint akan gagal.
-- Bersihkan dulu data duplikat jika ada dengan query:
-- SELECT invoice, COUNT(*) FROM penjualan GROUP BY invoice HAVING COUNT(*) > 1;
