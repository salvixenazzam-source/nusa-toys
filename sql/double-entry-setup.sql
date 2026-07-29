-- ============================================================
-- Double Entry Accounting Setup — Nusa Toys
-- 3 tabel: akun, jurnal, jurnal_item + seed COA 11 akun
-- Eksekusi via Supabase SQL Editor:
--   https://supabase.com/dashboard/project/osagatksdkrzcgtmpzhv/sql/new
-- ============================================================

-- ============================================================
-- 1. Tabel akun (Chart of Accounts)
-- ============================================================
CREATE TABLE IF NOT EXISTS akun (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kode          TEXT NOT NULL UNIQUE,
  nama          TEXT NOT NULL,
  tipe          TEXT NOT NULL CHECK (tipe IN ('Aset','Kewajiban','Modal','Pendapatan','Beban')),
  saldo_normal  TEXT NOT NULL CHECK (saldo_normal IN ('Debit','Kredit')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data Chart of Accounts (11 akun)
INSERT INTO akun (kode, nama, tipe, saldo_normal) VALUES
  ('1100', 'Kas',                    'Aset',       'Debit'),
  ('1200', 'Persediaan Barang',      'Aset',       'Debit'),
  ('2100', 'Utang',                  'Kewajiban',  'Kredit'),
  ('3100', 'Modal Pemilik',          'Modal',      'Kredit'),
  ('3200', 'Prive',                  'Modal',      'Debit'),
  ('4100', 'Pendapatan Penjualan',   'Pendapatan', 'Kredit'),
  ('5100', 'Harga Pokok Penjualan',  'Beban',      'Debit'),
  ('5200', 'Beban Operasional',      'Beban',      'Debit'),
  ('5201', 'Beban Gaji',             'Beban',      'Debit'),
  ('5202', 'Beban Pajak',            'Beban',      'Debit'),
  ('5299', 'Beban Lainnya',          'Beban',      'Debit');

-- Aktifkan RLS
ALTER TABLE akun ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public all" ON akun
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 2. Tabel jurnal (Header Transaksi)
-- ============================================================
CREATE TABLE IF NOT EXISTS jurnal (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tanggal       DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan    TEXT NOT NULL DEFAULT '',
  ref_type      TEXT,
  ref_id        BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_jurnal_tanggal    ON jurnal(tanggal);
CREATE INDEX IF NOT EXISTS idx_jurnal_ref        ON jurnal(ref_type, ref_id);

-- Aktifkan RLS
ALTER TABLE jurnal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public all" ON jurnal
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- 3. Tabel jurnal_item (Baris Debit/Kredit)
-- ============================================================
CREATE TABLE IF NOT EXISTS jurnal_item (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  jurnal_id  BIGINT NOT NULL REFERENCES jurnal(id) ON DELETE CASCADE,
  akun_id    BIGINT NOT NULL REFERENCES akun(id),
  debit      BIGINT NOT NULL DEFAULT 0,
  kredit     BIGINT NOT NULL DEFAULT 0,
  keterangan TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraint: debit > 0 XOR kredit > 0 (tidak boleh keduanya 0 atau keduanya > 0)
ALTER TABLE jurnal_item ADD CONSTRAINT chk_debit_kredit CHECK (
  (debit > 0 AND kredit = 0) OR (kredit > 0 AND debit = 0)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_jurnal_item_jurnal_id ON jurnal_item(jurnal_id);
CREATE INDEX IF NOT EXISTS idx_jurnal_item_akun_id   ON jurnal_item(akun_id);

-- Aktifkan RLS
ALTER TABLE jurnal_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public all" ON jurnal_item
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
