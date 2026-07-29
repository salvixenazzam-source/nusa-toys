# Double Entry Accounting — Nusa Toys

## 1. Chart of Accounts (COA)

| Kode | Nama | Tipe | Saldo Normal |
|------|------|------|-------------|
| 1100 | Kas | Aset | Debit |
| 1200 | Persediaan Barang | Aset | Debit |
| 2100 | Utang | Kewajiban | Kredit |
| 3100 | Modal Pemilik | Modal | Kredit |
| 3200 | Prive | Modal | Debit |
| 4100 | Pendapatan Penjualan | Pendapatan | Kredit |
| 5100 | Harga Pokok Penjualan | Beban | Debit |
| 5200 | Beban Operasional | Beban | Debit |
| 5201 | Beban Gaji | Beban | Debit |
| 5202 | Beban Pajak | Beban | Debit |
| 5299 | Beban Lainnya | Beban | Debit |

## 2. Struktur Tabel Database

### `akun` — Chart of Accounts
```sql
CREATE TABLE akun (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kode          TEXT NOT NULL UNIQUE,
  nama          TEXT NOT NULL,
  tipe          TEXT NOT NULL CHECK (tipe IN ('Aset','Kewajiban','Modal','Pendapatan','Beban')),
  saldo_normal  TEXT NOT NULL CHECK (saldo_normal IN ('Debit','Kredit')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed data (isi dengan 10 akun di atas)
```

### `jurnal` — Header Transaksi
```sql
CREATE TABLE jurnal (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tanggal       DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan    TEXT NOT NULL DEFAULT '',
  ref_type      TEXT,   -- 'Penjualan', 'Pembelian', 'Keuangan', NULL (jika manual)
  ref_id        BIGINT, -- ID dari tabel asal
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `jurnal_item` — Baris Debit/Kredit
```sql
CREATE TABLE jurnal_item (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  jurnal_id BIGINT NOT NULL REFERENCES jurnal(id) ON DELETE CASCADE,
  akun_id  BIGINT NOT NULL REFERENCES akun(id),
  debit    BIGINT NOT NULL DEFAULT 0,
  kredit   BIGINT NOT NULL DEFAULT 0,
  keterangan TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONSTRAINT: setiap jurnal harus balance (SUM(debit) = SUM(kredit))
-- CONSTRAINT: debit > 0 XOR kredit > 0 (tidak boleh keduanya)
```

**Index:**
- `jurnal(tanggal)`
- `jurnal(ref_type, ref_id)`
- `jurnal_item(jurnal_id)`
- `jurnal_item(akun_id)`

## 3. Aturan Pencatatan (Flow Jurnal)

### Penjualan (otomatis dari form penjualan baru)
```
Debit:  Kas (1100)                       = omzet
Kredit: Pendapatan Penjualan (4100)      = omzet
  ─ dan ─
Debit:  HPP (5100)                       = total_harga_modal
Kredit: Persediaan Barang (1200)         = total_harga_modal
```

### Pembelian Stok (otomatis dari form pembelian)
```
Debit:  Persediaan Barang (1200)         = total_biaya
Kredit: Kas (1100)                       = total_biaya
```

### Biaya Operasional (manual dari form keuangan — Pengeluaran)
```
Debit:  Beban Operasional (5200)         = jumlah
Kredit: Kas (1100)                       = jumlah
```
*(Kategori lain: Gaji → 5201, Pajak → 5202, Lainnya → 5299)*

### Pemasukan Non-Penjualan (manual — Pemasukan)
```
Debit:  Kas (1100)                       = jumlah
Kredit: Modal Pemilik (3100)             = jumlah
```

## 4. Migrasi Data Existing

Saat implementasi, data existing harus dimigrasi:

1. **Saldo Kas awal** → jurnal pembuka: Debit Kas / Kredit Modal
2. **Saldo Persediaan** → jurnal pembuka: Debit Persediaan / Kredit Modal
3. **Penjualan lama** → jurnal per tanggal penjualan
4. **Biaya operasional lama** → jurnal per tanggal
5. **HPP** dihitung dari penjualan yang punya harga_modal

## 5. Laporan Keuangan

### P&L (Laba Rugi)
Ambil semua akun tipe `Pendapatan` dan `Beban`:
```sql
SELECT a.nama, a.tipe,
  SUM(ji.debit) - SUM(ji.kredit) AS saldo
FROM jurnal_item ji
JOIN akun a ON a.id = ji.akun_id
WHERE a.tipe IN ('Pendapatan', 'Beban')
  AND j.tanggal BETWEEN :start AND :end
GROUP BY a.id, a.nama, a.tipe
ORDER BY a.kode;
```
- Pendapatan (saldo normal Kredit) → saldo positif jika kredit > debit
- Beban (saldo normal Debit) → saldo positif jika debit > kredit
- Laba Bersih = Total Pendapatan - Total Beban

### Neraca
Ambil semua akun tipe `Aset`, `Kewajiban`, `Modal`:
```sql
SELECT a.nama, a.tipe,
  SUM(ji.debit) - SUM(ji.kredit) AS saldo
FROM jurnal_item ji
JOIN akun a ON a.id = ji.akun_id
WHERE a.tipe IN ('Aset', 'Kewajiban', 'Modal')
GROUP BY a.id, a.nama, a.tipe
ORDER BY a.kode;
```
- Aset (saldo normal Debit) → saldo positif
- Kewajiban (saldo normal Kredit) → saldo positif
- Modal (saldo normal Kredit) → saldo positif
- **Aset = Kewajiban + Modal** (harus balance)

### Buku Besar (Ledger)
Filter per akun:
```sql
SELECT j.tanggal, j.keterangan, ji.debit, ji.kredit
FROM jurnal_item ji
JOIN jurnal j ON j.id = ji.jurnal_id
WHERE ji.akun_id = :akun_id
ORDER BY j.tanggal, ji.id;
```

## 6. Perubahan UI

### Halaman Keuangan
- Tambah tab: **P&L**, **Neraca**, **Jurnal**, **Buku Besar**
- Form catat transaksi: pilih akun tujuan (tidak hardcode)
- Tampilkan saldo semua akun

### Halaman Laporan (baru / update)
- P&L: pendapatan - HPP = laba kotor - beban = laba bersih
- Neraca: aset vs kewajiban+modal
- Rentang tanggal filter

## 7. Implementasi Plan

### Fase 1: Database + Seed
- Buat tabel `akun`, `jurnal`, `jurnal_item`
- Seed 10 akun COA
- RLS policy (mirip tabel lain)

### Fase 2: Backend Logic
- Fungsi `addJurnal()` — insert jurnal + jurnal_items dalam 1 transaksi
- Trigger jurnal otomatis dari:
  - `addSale()` → jurnal penjualan + jurnal HPP
  - `addPembelian()` → jurnal pembelian
  - `addKeuangan()` → jurnal biaya/operasional
- Fungsi `getPnL()` dan `getNeraca()`

### Fase 3: Frontend
- Tab P&L di halaman keuangan/laporan
- Tab Neraca
- Tab Jurnal (daftar semua jurnal, bisa klik lihat detail)
- Tampilkan balance (debit = kredit) sebagai indikator

### Fase 4: Migrasi Data Existing
- Script migrasi data dari tabel lama ke jurnal
- Verifikasi balance setelah migrasi

### Fase 5: Testing
- Test setiap flow transaksi
- Test balance constraint
- Test laporan akurat
