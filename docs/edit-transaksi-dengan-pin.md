# Edit Transaksi dengan Proteksi PIN — Nusa Toys

> Spec fitur: edit data transaksi (penjualan, pembelian, inventory, laporan)
> untuk mengantisipasi kesalahan input. Setiap aksi edit wajib memasukkan
> PIN `Nusatoys123`.

## 1. Tujuan & Aturan Bisnis

- **Masalah:** Salah input (qty, harga, tanggal, nama) pada penjualan/pembelian
  tidak bisa diperbaiki dari aplikasi — harus lewat SQL manual. Berisiko salah
  stok & laporan keuangan.
- **Solusi:** Tombol **Edit** di tiap baris transaksi. Klik → minta PIN → kalau
  benar, form edit terbuka → simpan → semua efek turunan (stok, persediaan,
  keuangan, jurnal) ikut diperbaiki otomatis.
- **PIN:** `Nusatoys123`. WAJIB dimasukkan setiap kali edit (tidak ada sesi
  "sudah tervalidasi"). Salah PIN → edit batal, tampilkan pesan.
- **Tidak ada hapus.** Fitur ini hanya EDIT. Hapus transaksi tetap tidak
  disediakan (mengurangi risiko).
- **Audit:** tambahkan kolom `updated_at` (dan `updated_by` opsional) pada
  tabel yang diedit agar ada jejak perubahan.

## 2. Verifikasi PIN (keamanan)

- JANGAN hardcode PIN di bundle browser (file page.js/context) — bisa dibaca
  orang dari source code.
- Buat API route `src/app/api/verify-pin/route.js` (POST `{ pin }`) yang
  membandingkan dengan env var `EDIT_PIN` di server.
- `EDIT_PIN` di `.env.local` untuk dev, dan WAJIB diset di Vercel
  (koordinator yang set saat deploy).
- Frontend hanya mengirim PIN, tidak menyimpan/menampilkannya.

## 3. Perubahan Data Layer (`src/lib/ProductContext.js`)

Fungsi baru (pola: revert semua efek → update baris → re-apply efek baru):

### 3.1 `updateSale(id, saleBaru)`
1. Ambil sale lama (dari state `sales`).
2. **Revert efek lama:**
   - Hapus baris `keuangan` Pemasukan + HPP milik transaksi ini
     (cari berdasarkan `keterangan`/invoice atau tambahkan kolom `ref_id`
     — lihat catatan migrasi di bawah).
   - Hapus baris `persediaan` KELUAR milik transaksi ini.
   - Hapus jurnal: `deleteJurnalByRef(supabase, 'penjualan', id)` (fungsi baru
     di `src/lib/jurnal.js`).
3. `update` baris di tabel `penjualan` (`eq("id", id)`).
4. **Re-apply efek baru** persis seperti `addSale` (keuangan Pemasukan + HPP,
   persediaan KELUAR, `jurnalPenjualan`, kuota diskon jika ada).
5. Refresh state lokal (`loadSales`, `loadKeuangan`, `loadPersediaan`).

### 3.2 `updatePurchase(id, pembelianBaru)`
Sama polanya dengan 3.1 untuk pembelian:
1. Revert: baris `persediaan` MASUK (Pembelian), `keuangan` Ongkir,
   jurnal `deleteJurnalByRef(supabase, 'pembelian', id)`.
2. Update tabel `pembelian`.
3. Re-apply efek baru (persediaan MASUK, ongkir, `jurnalPembelian`).

### 3.3 `updatePersediaan(id, itemBaru)`
Hanya untuk entri persediaan manual (jika halaman inventory menyediakan edit
langsung entri `persediaan`). Update baris + `update_stok` jika ada delta qty.

### 3.4 `deleteJurnalByRef` (di `src/lib/jurnal.js`)
- `supabase.from("jurnal").delete().eq("ref_type", refType).eq("ref_id", refId)`
- Jangan lupa baris `jurnal_item` ikut terhapus (cek FK cascade — kalau belum
  ada ON DELETE CASCADE, hapus manual per item).

### 3.5 Catatan migrasi penting (ops task koordinator)
- Cek apakah tabel `keuangan` & `persediaan` punya kolom `ref_type`/`ref_id`
  untuk mengaitkan baris turunan ke transaksi sumber.
- **Kalau belum ada:** tambahkan kolom `ref_type` + `ref_id` di tabel
  `keuangan` dan `persediaan`, lalu backfill data lama berdasarkan
  keterangan/invoice. Ini PRASYARAT agar revert tidak salah hapus.
- Tambah `updated_at` di `penjualan`, `pembelian`, `persediaan`.

## 4. Perubahan UI

### 4.1 Komponen bersama
- `src/components/EditButton.js` — tombol edit per baris tabel.
- `src/components/PinModal.js` — modal input PIN (6+ karakter, masked).
  - `open` → input PIN → submit ke `/api/verify-pin`
  - benar → tampilkan form edit; salah → pesan "PIN salah" (tetap di modal)
- `src/components/EditFormModal.js` — form edit per tipe transaksi
  (field sama dengan form tambah, diisi nilai lama).

### 4.2 Halaman Penjualan (`src/app/penjualan/page.js`)
- Tambah kolom aksi "Edit" di tabel (dekat kolom terakhir).
- Klik → PinModal → EditFormModal penjualan (invoice, tanggal, pembeli,
  produk, qty, harga, channel, dst).
- Simpan → `updateSale` → refresh.

### 4.3 Halaman Pembelian (`src/app/pembelian/page.js`)
- Sama dengan 4.2, form pembelian (supplier, produk, qty, harga, ongkir, dst).

### 4.4 Halaman Inventory (`src/app/inventory/page.js`)
- Timeline menampilkan item dari pembelian & penjualan.
- **Edit item timeline = edit transaksi sumbernya**: item `beli-*` membuka
  EditFormModal pembelian, item `jual-*` membuka EditFormModal penjualan
  (PIN tetap diminta). Dengan begitu stok selalu konsisten.
- Opsional: entri persediaan manual (kalau ada) diedit via `updatePersediaan`.

### 4.5 Halaman Laporan (`src/app/laporan/page.js`)
- Bagian laporan yang menampilkan baris transaksi (cashflow/keuangan,
  jurnal) diberi tombol Edit pada baris yang punya sumber transaksi.
- Edit di sini memakai modal yang sama dan memanggil fungsi update yang sama —
  **jangan buat logika baru**, hanya navigasi ke modal yang ada.
- Untuk baris jurnal murni (tanpa ref transaksi), tidak usah diedit.

## 5. Alur Lengkap Satu Edit

```
Klik Edit → PinModal muncul
  → user ketik PIN → POST /api/verify-pin
  → PIN salah  → pesan "PIN salah, coba lagi" (tetap di modal)
  → PIN benar  → EditFormModal (nilai lama terisi)
      → user ubah → Simpan
      → revert efek lama → update baris → re-apply efek baru → refresh
      → toast "Transaksi diperbarui"
```

## 6. Fase Implementasi

| # | Task | Assignee | Keterangan |
|---|------|----------|------------|
| 1 | Backend: data layer edit + revert jurnal + API verify-pin | dev | Prasyarat semua |
| 2 | Frontend: komponen modal + integrasi 4 halaman | dev | parent task 1 |
| 3 | Testing: edit tiap tipe + cek stok/jurnal konsisten | tester | parent task 1 & 2 |
| 4 | Ops: SQL migrasi kolom ref + env EDIT_PIN di Vercel + deploy | koordinator | setelah dev selesai |

## 7. Kriteria Selesai (Acceptance)

- [ ] Edit penjualan: stok, persediaan, keuangan, jurnal ikut berubah benar
- [ ] Edit pembelian: persediaan, ongkir, jurnal ikut berubah benar
- [ ] Edit lewat inventory mengubah transaksi sumber & stok konsisten
- [ ] Edit lewat laporan bisa untuk baris transaksi
- [ ] PIN salah → edit batal; PIN benar → edit jalan (diuji tiap tipe)
- [ ] Nilai baru tampil di dashboard/laporan setelah refresh
- [ ] Tidak ada perubahan stok/jurnal yang menggantung (revert bersih)
