-- ============================================================
-- Migration: CHECK constraint omzet > 0 pada tabel penjualan
-- Tanggal  : 2026-07-29
-- Bug Ref  : t_4e00b755 / double-entry-test.md BUG #1
-- ============================================================

-- Tambah constraint: tolak penjualan dengan omzet <= 0
-- Penjualan omzet 0 tidak punya jejak akuntansi (jurnalPenjualan
-- melewatinya) sehingga data penjualan inkonsisten secara akuntansi.

ALTER TABLE penjualan ADD CONSTRAINT chk_omzet_positif CHECK (omzet > 0);
