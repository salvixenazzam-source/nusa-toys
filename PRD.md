# PRD — Nusa Toys (Web Manajemen Toko Robotik)

## 1. Overview
Web manajemen untuk toko mainan robotik "Nusa Toys", menggantikan pencatatan manual di spreadsheet. Menyatukan produk, stok, pembelian, penjualan, keuangan, dan pelanggan dalam satu tempat, dengan dashboard ringkasan kondisi bisnis. Pengguna: satu Owner/Admin. Data akhirnya disimpan di Google Sheets (disambungkan belakangan). Tampilan clean & simple.

## 2. Aturan Wajib
- Responsif: bisa dibuka dari laptop & HP.
- Satu peran: Owner/Admin akses penuh.
- Kode Produk (SKU) unik, tidak boleh duplikat. Format berurut: NT001, NT002, dst.
- PRINSIP STOK (PALING PENTING): angka stok TIDAK PERNAH diedit manual. Stok hanya berubah lewat transaksi — Pembelian/Import menambah, Penjualan mengurangi. Setiap perubahan punya riwayat agar selisih bisa ditelusuri.
- Multi-harga per produk: Harga Modal, Harga Shopee, Harga WA, Harga Reseller.
- Multi-channel penjualan: Shopee, WA, Sekolah, Event, dll. Harga jual otomatis mengikuti channel.
- Peringatan stok menipis tampil di Dashboard.

## 3. Modul (8)
1. Login & Hak Akses — email + password, satu peran Owner.
2. Dashboard Owner — hari ini (penjualan, omzet, laba); gudang (stok menipis, terlaris); pelanggan (baru, repeat); keuangan (kas, piutang, pengeluaran); penjualan per channel.
3. Product Management — CRUD produk. Field: SKU, Nama, Kategori, Supplier, Harga Modal, Harga Shopee, Harga WA, Harga Reseller, Berat (gr), Stok, Minimum Stok, Status (Aktif/Nonaktif).
4. Inventory — stok hasil transaksi saja. Riwayat pergerakan: Tanggal, Produk, Masuk, Keluar, Sisa, Keterangan. Peringatan di bawah minimum.
5. Pembelian/Import — catat barang masuk: Tanggal, Supplier, Barang, Qty, Harga, Ongkir, Total. Simpan → stok bertambah.
6. Sales Management — catat penjualan: Tanggal, Invoice, Pembeli, Channel, Produk, Qty, Omzet, Ongkir, Status. Simpan → stok berkurang, laba dihitung, data pelanggan ter-update.
7. Finance — pisahkan Pendapatan, Pengeluaran, Operasional, Gaji, Pajak, Laba Bersih.
8. CRM — data pelanggan: Nama, No WA (diawali 08, 10-13 digit), Instansi/Asal, Produk pernah dibeli, Tanggal terakhir beli.

## 4. Struktur Data (5 "sheet"/tabel)
- produk: sku(PK), nama, kategori, supplier, harga_modal, harga_shopee, harga_wa, harga_reseller, berat_gr, stok, min_stok, status
- pembelian: id(PK), tanggal, supplier, sku(FK), qty, harga, ongkir, total
- penjualan: id(PK), tanggal, invoice, pelanggan_id(FK), channel, sku(FK), qty, omzet, ongkir, status
- keuangan: id(PK), tanggal, tipe, kategori, jumlah, keterangan
- pelanggan: id(PK), nama, no_wa, instansi, terakhir_beli

## 5. Teknologi & Desain
- Next.js (App Router, JavaScript) + Tailwind CSS.
- Data: Fase A pakai data sementara di dalam kode; Fase B disambungkan ke Google Sheets API; Fase C tambah login. (Bangun bertahap.)
- Font: Inter untuk teks, monospace untuk angka/SKU.
- Desain: banyak white space, warna netral + 1 aksen, sudut membulat halus, tanpa dekorasi berlebih.

## 6. Urutan Pembuatan
Setup (selesai) → Tampilan dasar & menu → Produk → Pembelian → Penjualan → Dashboard → Finance → CRM. Kerjakan satu modul, pastikan jalan, baru lanjut. Data sementara dulu (Fase A), Google Sheets menyusul.
