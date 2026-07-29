-- ============================================================
-- Migrasi Double Entry — Nusa Toys
-- PRASYARAT: double-entry-setup.sql SUDAH dijalankan
-- Eksekusi via Supabase SQL Editor:
--   https://supabase.com/dashboard/project/osagatksdkrzcgtmpzhv/sql/new
-- ============================================================

BEGIN;

-- ============================================================
-- 1. JURNAL PEMBUKA — Saldo Awal
-- ============================================================
-- Hitung saldo_kas & total_persediaan dari data existing
DO $$
DECLARE
    v_saldo_kas        BIGINT;
    v_total_persediaan BIGINT;
    v_jurnal_id        BIGINT;
    v_akun_kas         BIGINT;
    v_akun_persediaan  BIGINT;
    v_akun_modal       BIGINT;
BEGIN
    -- Ambil akun_id berdasarkan kode
    SELECT id INTO v_akun_kas        FROM akun WHERE kode = '1100';
    SELECT id INTO v_akun_persediaan FROM akun WHERE kode = '1200';
    SELECT id INTO v_akun_modal      FROM akun WHERE kode = '3100';

    -- Hitung saldo
    v_saldo_kas :=
        COALESCE((SELECT SUM(omzet)  FROM penjualan), 0)
      - COALESCE((SELECT SUM(total)  FROM pembelian), 0)
      - COALESCE((SELECT SUM(jumlah) FROM keuangan WHERE tipe = 'Pengeluaran'), 0);

    v_total_persediaan :=
        COALESCE((SELECT SUM(jumlah) FROM persediaan WHERE tipe = 'MASUK'), 0)
      - COALESCE((SELECT SUM(jumlah) FROM persediaan WHERE tipe = 'KELUAR'), 0);

    RAISE NOTICE 'saldo_kas = %, total_persediaan = %', v_saldo_kas, v_total_persediaan;

    -- Insert jurnal pembuka
    INSERT INTO jurnal (tanggal, keterangan, ref_type, ref_id)
    VALUES (CURRENT_DATE, 'Saldo Awal — migrasi double entry', 'Migrasi', 0)
    RETURNING id INTO v_jurnal_id;

    -- Insert jurnal_item (handle kas negatif: kredit Kas jika saldo_kas < 0)
    IF v_saldo_kas >= 0 THEN
        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_kas, v_saldo_kas, 0, 'Saldo awal Kas');
    ELSE
        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_kas, 0, ABS(v_saldo_kas), 'Saldo awal Kas (defisit)');
    END IF;

    -- Persediaan
    IF v_total_persediaan >= 0 THEN
        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_persediaan, v_total_persediaan, 0, 'Saldo awal Persediaan');
    ELSE
        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_persediaan, 0, ABS(v_total_persediaan), 'Saldo awal Persediaan');
    END IF;

    -- Modal (penyeimbang = saldo_kas + total_persediaan)
    -- Jika positif → Kredit Modal; jika negatif → Debit Modal
    IF (v_saldo_kas + v_total_persediaan) >= 0 THEN
        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_modal, 0, v_saldo_kas + v_total_persediaan, 'Modal awal');
    ELSE
        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_modal, ABS(v_saldo_kas + v_total_persediaan), 0, 'Modal awal (defisit)');
    END IF;

    RAISE NOTICE 'Jurnal pembuka selesai (jurnal_id=%)', v_jurnal_id;
END $$;


-- ============================================================
-- 2. MIGRASI PENJUALAN
--    Setiap penjualan → 2 jurnal:
--      a) Kas (D) / Pendapatan (K)
--      b) HPP (D) / Persediaan (K)
-- ============================================================
DO $$
DECLARE
    rec          RECORD;
    v_jurnal_id  BIGINT;
    v_harga_modal BIGINT;
    v_akun_kas        BIGINT;
    v_akun_pendapatan BIGINT;
    v_akun_hpp        BIGINT;
    v_akun_persediaan BIGINT;
    v_count      INTEGER := 0;
BEGIN
    SELECT id INTO v_akun_kas        FROM akun WHERE kode = '1100';
    SELECT id INTO v_akun_pendapatan FROM akun WHERE kode = '4100';
    SELECT id INTO v_akun_hpp        FROM akun WHERE kode = '5100';
    SELECT id INTO v_akun_persediaan FROM akun WHERE kode = '1200';

    FOR rec IN SELECT * FROM penjualan ORDER BY id LOOP
        v_harga_modal := COALESCE(rec.omzet - rec.laba, 0);
        IF v_harga_modal < 0 THEN v_harga_modal := 0; END IF;

        -- Jurnal 1: Pendapatan Penjualan
        INSERT INTO jurnal (tanggal, keterangan, ref_type, ref_id)
        VALUES (rec.tanggal,
                'Penjualan ' || rec.invoice || ' — ' || COALESCE(rec.pembeli, rec.nama_produk, ''),
                'Penjualan', rec.id)
        RETURNING id INTO v_jurnal_id;

        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_kas,        rec.omzet, 0, 'Omzet ' || rec.invoice),
               (v_jurnal_id, v_akun_pendapatan, 0, rec.omzet, 'Pendapatan ' || rec.invoice);

        -- Jurnal 2: HPP (jika ada harga_modal > 0)
        IF v_harga_modal > 0 THEN
            INSERT INTO jurnal (tanggal, keterangan, ref_type, ref_id)
            VALUES (rec.tanggal,
                    'HPP ' || rec.invoice,
                    'HPP', rec.id)
            RETURNING id INTO v_jurnal_id;

            INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
            VALUES (v_jurnal_id, v_akun_hpp,        v_harga_modal, 0, 'HPP ' || rec.invoice),
                   (v_jurnal_id, v_akun_persediaan, 0, v_harga_modal, 'Kurangi persediaan ' || rec.invoice);
        END IF;

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Migrasi penjualan selesai: % data', v_count;
END $$;


-- ============================================================
-- 3. MIGRASI PEMBELIAN
--    Setiap pembelian → 1 jurnal: Persediaan (D) / Kas (K)
-- ============================================================
DO $$
DECLARE
    rec               RECORD;
    v_jurnal_id       BIGINT;
    v_akun_persediaan BIGINT;
    v_akun_kas        BIGINT;
    v_count           INTEGER := 0;
BEGIN
    SELECT id INTO v_akun_persediaan FROM akun WHERE kode = '1200';
    SELECT id INTO v_akun_kas        FROM akun WHERE kode = '1100';

    FOR rec IN SELECT * FROM pembelian ORDER BY id LOOP
        INSERT INTO jurnal (tanggal, keterangan, ref_type, ref_id)
        VALUES (rec.tanggal,
                'Pembelian stok — ' || COALESCE(NULLIF(rec.supplier, ''), rec.nama_produk, 'Supplier'),
                'Pembelian', rec.id)
        RETURNING id INTO v_jurnal_id;

        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_persediaan, rec.total, 0, 'Pembelian ' || rec.nama_produk || ' (' || rec.qty || ' pcs)'),
               (v_jurnal_id, v_akun_kas,        0, rec.total, 'Bayar pembelian');

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Migrasi pembelian selesai: % data', v_count;
END $$;


-- ============================================================
-- 4. MIGRASI KEUANGAN (PENGELUARAN)
--    Setiap pengeluaran → 1 jurnal: Beban (D) / Kas (K)
--    Kategori dipetakan ke akun beban yang sesuai
-- ============================================================
DO $$
DECLARE
    rec          RECORD;
    v_jurnal_id  BIGINT;
    v_akun_kas   BIGINT;
    v_akun_beban BIGINT;
    v_count      INTEGER := 0;
BEGIN
    SELECT id INTO v_akun_kas FROM akun WHERE kode = '1100';

    FOR rec IN SELECT * FROM keuangan WHERE tipe = 'Pengeluaran' ORDER BY id LOOP
        -- Mapping kategori → kode akun beban
        v_akun_beban := CASE rec.kategori
            WHEN 'HPP'       THEN (SELECT id FROM akun WHERE kode = '5100')  -- HPP
            WHEN 'Gaji'      THEN (SELECT id FROM akun WHERE kode = '5201')  -- Beban Gaji
            WHEN 'Pajak'     THEN (SELECT id FROM akun WHERE kode = '5202')  -- Beban Pajak
            WHEN 'Operasional' THEN (SELECT id FROM akun WHERE kode = '5200')  -- Beban Operasional
            WHEN 'Lainnya'   THEN (SELECT id FROM akun WHERE kode = '5299')  -- Beban Lainnya
            ELSE (SELECT id FROM akun WHERE kode = '5200')  -- Default: Beban Operasional
        END;

        INSERT INTO jurnal (tanggal, keterangan, ref_type, ref_id)
        VALUES (rec.tanggal, rec.keterangan, 'Keuangan', rec.id)
        RETURNING id INTO v_jurnal_id;

        INSERT INTO jurnal_item (jurnal_id, akun_id, debit, kredit, keterangan)
        VALUES (v_jurnal_id, v_akun_beban, rec.jumlah, 0, rec.keterangan),
               (v_jurnal_id, v_akun_kas,   0, rec.jumlah, 'Kas keluar');

        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'Migrasi keuangan (Pengeluaran) selesai: % data', v_count;
END $$;


-- ============================================================
-- 5. VALIDASI
-- ============================================================
SELECT 'TOTAL DEBIT'  AS keterangan, SUM(ji.debit)  AS jumlah FROM jurnal_item ji
UNION ALL
SELECT 'TOTAL KREDIT',              SUM(ji.kredit) FROM jurnal_item ji
UNION ALL
SELECT 'SELISIH',                   SUM(ji.debit) - SUM(ji.kredit) FROM jurnal_item ji;

-- Ringkasan per akun
SELECT a.kode, a.nama, a.tipe,
       SUM(ji.debit)  AS total_debit,
       SUM(ji.kredit) AS total_kredit,
       SUM(ji.debit) - SUM(ji.kredit) AS saldo
FROM jurnal_item ji
JOIN akun a ON a.id = ji.akun_id
GROUP BY a.id, a.kode, a.nama, a.tipe
ORDER BY a.kode;

-- Jumlah jurnal yang dibuat
SELECT 'jurnal' AS tabel, COUNT(*) AS jumlah FROM jurnal
UNION ALL
SELECT 'jurnal_item', COUNT(*) FROM jurnal_item;

COMMIT;
