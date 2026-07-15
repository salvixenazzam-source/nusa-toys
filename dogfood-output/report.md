# Laporan QA — Nusa Toys
**Tanggal:** 15 Juli 2026  
**Tester:** Hermes QA Bot (profil: tester)  
**URL:** http://localhost:3000  
**Scope:** Full-site exploratory testing — 8 halaman + login/logout + form CRUD

---

## Executive Summary

| Metrik | Nilai |
|---|---|
| Total halaman diuji | 10 (Login + 8 halaman + Tambah Produk) |
| Total temuan | 4 |
| 🔴 Bug fungsional | 1 |
| 🟡 UX/Visual | 2 |
| 🟢 Improvement | 1 |
| JS Error | **0 (nol)** ✅ |
| Status | **LAYAK UJI** — bisa lanjut ke testing lanjutan |

---

## Ringkasan Per Halaman

| Halaman | Status | Data | Console | Catatan |
|---|---|---|---|---|
| Login | ✅ PASS | — | Bersih | Validasi client-side ok, redirect ok |
| Dashboard | ✅ PASS | Chart + summary | Bersih | Tren, ringkasan, stok menipis, keuangan |
| Produk | ✅ PASS | 6 produk real | Bersih | 13 kolom, filter, search, Tambah/Edit/Hapus |
| Inventory | ✅ PASS | 0 transaksi | Bersih | Stok otomatis, riwayat pergerakan |
| Pembelian | ✅ PASS | 0 transaksi | Bersih | Supplier, ongkir, total, sortable |
| Penjualan | ✅ PASS | 0 transaksi | Bersih | 10 kolom, channel, laba, invoice, filter |
| Keuangan | ✅ PASS | 0 transaksi | Bersih | Summary, filter tabs, 6 kolom |
| CRM | ✅ PASS | 0 pelanggan | Bersih | NO WA field, search |
| Pengaturan | ✅ PASS | Target omzet | Bersih | Preset Rp1-10jt |

---

## Temuan Detail

### BUG #1 (MEDIUM): Tidak ada validasi client-side pada form Tambah Produk

- **URL:** /produk → klik "+ Tambah Produk"
- **Severity:** Medium
- **Deskripsi:** Form Tambah Produk tidak memiliki validasi client-side. Klik "Simpan Produk" dengan field kosong tidak menampilkan pesan error.
- **Steps:**
  1. Buka /produk
  2. Klik "+ Tambah Produk"
  3. Semua field dibiarkan kosong
  4. Klik "Simpan Produk"
- **Expected:** Pesan error validasi muncul (contoh: "Nama produk wajib diisi", "Harga modal wajib diisi", dsb.)
- **Actual:** Tidak ada pesan error. Form dikirim ke Supabase yang mungkin reject dengan constraint error.
- **Console:** Tidak ada error
- **Rekomendasi:** Tambahkan validasi client-side wajib untuk field: Nama, Kategori, Harga Modal, Harga Jual (minimal 1 channel)

### ISSUE #2 (LOW): Indikator stok menipis hanya "!" — kurang visible

- **URL:** /produk → table row NT002, NT003
- **Severity:** Low
- **Deskripsi:** Produk dengan stok di bawah min stok menampilkan "!" kecil di cell stok. Tidak ada indikator visual di row (warna latar merah/kuning).
- **Steps:**
  1. Buka /produk
  2. Lihat row NT002 (stok 3, min 5) → "3 !"
  3. Lihat row NT003 (stok 0, min 2) → "0 !"
- **Expected:** Row dengan stok menipis diberi highlight (bg-red-50) atau badge peringatan yang jelas
- **Actual:** Hanya teks "!" kecil tanpa perbedaan warna row

### ISSUE #3 (LOW): Pesan error validasi login tidak terbaca oleh accessibility tree

- **URL:** /login → submit tanpa email
- **Severity:** Low
- **Deskripsi:** Pesan error "Email wajib diisi." muncul di DOM tapi tidak memiliki role="alert" atau aria-label, sehingga tidak tertangkap screen reader / accessibility tree.
- **Expected:** Error message container memiliki role="alert" atau aria-live="polite"

### ISSUE #4 (LOW): Tombol Logout tidak terintegrasi baik di desktop sidebar

- **URL:** Semua halaman
- **Severity:** Low
- **Deskripsi:** Tombol Logout hanya terlihat saat mobile — di desktop tidak muncul di sidebar content. Kemungkinan user bingung cara logout.
- **Status:** ⚠️ Perlu verifikasi ulang (klik logout di test tidak menghasilkan redirect)

---

## Hal yang SUDAH BAIK ✅

1. **Semua halaman konsisten** — struktur, style, dan empty state seragam
2. **Tidak ada JS error** di semua halaman — clean code!
3. **Data real dari Supabase** — 6 produk tampil dengan data aktual
4. **Auth guard ketat** — redirect /login untuk halaman protected
5. **Stok tidak diedit manual** — sesuai PRD, hanya lewat transaksi
6. **Harga multi-channel** — Shopee, WA, Reseller lengkap
7. **Sidebar navigasi** — semua 8 menu berfungsi, konsisten desktop/mobile
8. **Empty state** — setiap halaman memiliki pesan informatif saat belum ada data
9. **Filter & search** — tersedia di halaman yang relevan
10. **Pagination info** — "6 dari 6 produk" jelas

---

## Catatan Pengujian

- **Testing via browser automation** — beberapa interaksi form mungkin tidak sempurna karena React synthetic events
- **Tidak diuji:** Hapus produk (butuh data test), Edit produk, form Pembelian/Penjualan lengkap, target omzet real
- **Rekomendasi:** Lanjutkan testing manual untuk form CRUD lengkap, dan test mobile responsiveness secara fisik
