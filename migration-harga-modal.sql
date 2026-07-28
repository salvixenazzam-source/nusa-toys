-- ============================================================
-- NUSA TOYS — Migration: Tambah harga_modal ke penjualan
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Kolom harga_modal untuk menyimpan HPP per item saat transaksi
-- Digunakan oleh addSale() untuk mencatat HPP sebagai pengeluaran
ALTER TABLE penjualan ADD COLUMN IF NOT EXISTS harga_modal INTEGER NOT NULL DEFAULT 0;
