-- ============================================================
-- NUSA TOYS — Backup Tables untuk Cashflow & P&L
-- Jalankan di Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Tabel backup cashflow
CREATE TABLE IF NOT EXISTS cashflow_backup (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  backup_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  periode_start DATE NOT NULL,
  periode_end   DATE NOT NULL,
  data          JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by    TEXT NOT NULL DEFAULT 'system'
);

COMMENT ON TABLE cashflow_backup IS 'Snapshot data cashflow (arus kas) per periode';
COMMENT ON COLUMN cashflow_backup.data IS 'Array of transaksi keuangan (full rows)';
COMMENT ON COLUMN cashflow_backup.summary IS '{pemasukan, pengeluaran, laba, total_transaksi}';

-- 2. Tabel backup P&L
CREATE TABLE IF NOT EXISTS pnl_backup (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  backup_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  periode_start        DATE NOT NULL,
  periode_end          DATE NOT NULL,
  pendapatan_penjualan BIGINT NOT NULL DEFAULT 0,
  pendapatan_lain      BIGINT NOT NULL DEFAULT 0,
  total_pendapatan     BIGINT NOT NULL DEFAULT 0,
  hpp                  BIGINT NOT NULL DEFAULT 0,
  laba_kotor           BIGINT NOT NULL DEFAULT 0,
  margin               NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_biaya_ops      BIGINT NOT NULL DEFAULT 0,
  laba_bersih          BIGINT NOT NULL DEFAULT 0,
  biaya_ops_detail     JSONB NOT NULL DEFAULT '{}'::jsonb,
  channel_breakdown    JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_transaksi      INT NOT NULL DEFAULT 0,
  total_produk_terjual INT NOT NULL DEFAULT 0,
  created_by           TEXT NOT NULL DEFAULT 'system'
);

COMMENT ON TABLE pnl_backup IS 'Snapshot laporan laba rugi per periode';
COMMENT ON COLUMN pnl_backup.biaya_ops_detail IS '{kategori: jumlah, ...}';
COMMENT ON COLUMN pnl_backup.channel_breakdown IS '[{channel, omzet, laba, qty}, ...]';

-- 3. RLS — Public read + insert (konsisten dengan tabel lain)
ALTER TABLE cashflow_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read backup cashflow"   ON cashflow_backup FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert backup cashflow" ON cashflow_backup FOR INSERT TO anon, authenticated WITH CHECK (true);

ALTER TABLE pnl_backup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read backup pnl"   ON pnl_backup FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public insert backup pnl" ON pnl_backup FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 4. Index untuk query cepat (latest backup by date range)
CREATE INDEX IF NOT EXISTS idx_cashflow_backup_periode ON cashflow_backup (periode_start, periode_end DESC);
CREATE INDEX IF NOT EXISTS idx_pnl_backup_periode      ON pnl_backup (periode_start, periode_end DESC);
