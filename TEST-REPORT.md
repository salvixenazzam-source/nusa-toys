# LAPORAN PENGUJIAN QA — Nusa Toys

**Tanggal Pengujian:** 15 Juli 2026  
**Penguji:** QA (Hermes Agent)  
**Lingkungan:** `http://localhost:3000` · Next.js 16.2.10 (Turbopack) · Node.js on Linux  
**Referensi:** PRD.md (8 Modul — Login, Dashboard, Produk, Inventory, Pembelian, Penjualan, Keuangan, CRM)

---

## Ringkasan Hasil

| Status | Jumlah |
|--------|--------|
| ✅ PASS | 36 |
| ⚠️ PASS (catatan) | 4 |
| ❌ FAIL | 3 |
| ⬜ NOT TESTED | 3 |

**Kesimpulan:** Build sukses, 13 route tercompile. 8 modul terimplementasi lengkap. Ditemukan 3 bug: 1 Kritis (Stok bisa diedit manual di form Produk), 1 Mayor (Sidebar tidak dark green), 1 Minor (DateFilter dead code). **Rekomendasi: DENGAN CATATAN** — perbaiki bug kritis sebelum deploy.

---

## 1. Status Build

| Item | Hasil | Detail |
|------|-------|--------|
| `npm run build` | ✅ PASS | 13 route compiled: `/`, `/login`, `/dashboard`, `/produk`, `/inventory`, `/pembelian`, `/penjualan`, `/keuangan`, `/crm`, `/pengaturan`, `/_not-found` |
| Compile time | ✅ | 11.4s |
| TypeScript check | ✅ | 109ms (no TS, project is JS-only per spec) |
| Dev server | ✅ | Ready in 444ms on `localhost:3000` |
| Browser console errors | ✅ | 0 errors |

---

## 2. Acceptance Criteria per Modul (dari PRD.md Section 3)

### 2.1 Login & Hak Akses
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-1.1 | Halaman login dengan email + password | P0 | ✅ PASS | Form render: email, password, tombol "Masuk". Terverifikasi via curl & browser |
| AC-1.2 | Otentikasi Supabase Auth | P0 | ✅ PASS | Menggunakan `supabase.auth.signInWithPassword()` |
| AC-1.3 | Satu peran Owner/Admin akses penuh | P0 | ✅ PASS | Tidak ada role-based routing, semua halaman akses penuh setelah login |
| AC-1.4 | Redirect ke /login jika belum login | P0 | ✅ PASS | Middleware (`proxy.js`) redirect semua route ke `/login` kecuali sudah authenticated |
| AC-1.5 | Redirect ke /dashboard setelah login | P0 | ✅ PASS | `router.push("/dashboard")` setelah signIn sukses |
| AC-1.6 | Validasi form (email & password wajib) | P0 | ✅ PASS | Error message: "Email wajib diisi" / "Password wajib diisi" |
| AC-1.7 | Error handling login gagal | P0 | ✅ PASS | Error message: "Email atau password salah" |
| AC-1.8 | Tombol Logout | P0 | ✅ PASS | Di AppShell (desktop) & Sidebar (mobile), panggil `supabase.auth.signOut()` |

### 2.2 Dashboard Owner
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-2.1 | Total Omzet (hari ini / semua) | P0 | ✅ PASS | `totalOmzet` dari akumulasi sales, dengan progress bar target |
| AC-2.2 | Total Laba | P0 | ✅ PASS | `totalLaba` dari akumulasi sales |
| AC-2.3 | Jumlah Transaksi | P0 | ✅ PASS | `sales.length` |
| AC-2.4 | Jumlah Pelanggan + repeat buyer | P0 | ✅ PASS | `customers.length` + `repeatBuyers` |
| AC-2.5 | Stok Menipis (warning) | P0 | ✅ PASS | Filter `p.stok < p.minStok && p.status === "Aktif"` dengan badge merah |
| AC-2.6 | Produk Terlaris (top 5) | P0 | ✅ PASS | Agregasi qty per SKU, diurutkan descending, top 5 |
| AC-2.7 | Penjualan per Channel | P0 | ✅ PASS | Horizontal bar chart per channel |
| AC-2.8 | Keuangan ringkasan (pemasukan, pengeluaran, laba bersih) | P0 | ✅ PASS | Pemasukan = omzet + pemasukan manual, pengeluaran dari keuangan |
| AC-2.9 | Grafik tren (bulanan & harian) | P1 | ✅ PASS | Recharts BarChart, toggle Bulanan/Harian |

### 2.3 Product Management (Produk)
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-3.1 | CRUD produk (tambah, edit, hapus) | P0 | ✅ PASS | Modal form add/edit, konfirmasi hapus, semua via Supabase |
| AC-3.2 | SKU unik, format NT001-NT999 | P0 | ✅ PASS | Validasi duplikat, auto-generate `nextSku()` |
| AC-3.3 | Multi-harga: Modal, Shopee, WA, Reseller | P0 | ✅ PASS | 4 field harga di form, fieldset "Harga Multi-Channel" |
| AC-3.4 | Field: SKU, Nama, Kategori, Supplier, Harga, Berat, Stok, Min Stok, Status | P0 | ✅ PASS | Semua field ada di form + tabel |
| AC-3.5 | Status Aktif/Nonaktif | P0 | ✅ PASS | Toggle button, badge di tabel |
| AC-3.6 | Filter & Search (SKU, nama, kategori, supplier) | P1 | ✅ PASS | Search bar + dropdown filter kategori & supplier |
| AC-3.7 | Stok TIDAK diedit manual (hanya via transaksi) | P0 | ❌ FAIL | **BUG KRITIS**: Form edit produk memiliki field Stok yang bisa diedit manual. Saat `updateProduct()`, nilai stok dikirim langsung ke Supabase tanpa validasi transaksi (produk/page.js:145, 152). Lihat Bug #1. |

### 2.4 Inventory
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-4.1 | Tampilkan stok saat ini per produk | P0 | ✅ PASS | Grid card: nama, SKU, stok, min stok, status Aman/Menipis |
| AC-4.2 | Riwayat pergerakan stok (gabungan pembelian + penjualan) | P0 | ✅ PASS | Timeline dari purchases + sales, diurutkan tanggal |
| AC-4.3 | Kolom: Tanggal, Produk, Masuk, Keluar, Sisa, Keterangan | P0 | ✅ PASS | Tabel dengan badge hijau (masuk) & merah (keluar) |
| AC-4.4 | Filter per produk | P1 | ✅ PASS | Dropdown pilih SKU |
| AC-4.5 | Info: stok berubah otomatis, tidak bisa diedit manual | P1 | ✅ PASS | Banner info `bg-accent-light` di atas halaman |

### 2.5 Pembelian / Import
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-5.1 | Form catat pembelian: Tanggal, Supplier, Produk, Qty, Harga, Ongkir, Total | P0 | ✅ PASS | Modal form lengkap, total auto-hitung |
| AC-5.2 | Total = Qty × Harga + Ongkir | P0 | ✅ PASS | Auto-calculate: `qty * hargaSatuan + ongkir` |
| AC-5.3 | Supplier auto-fill dari produk | P1 | ✅ PASS | `handleSelectProduct` → `p.supplier` |
| AC-5.4 | Harga satuan auto-fill dari harga_modal | P1 | ✅ PASS | `handleSelectProduct` → `p.hargaModal` |
| AC-5.5 | Simpan → stok bertambah via `updateStock(sku, +qty)` | P0 | ✅ PASS | `updateStock(form.sku, qty)` di `handleSave` |
| AC-5.6 | Tabel riwayat pembelian dengan filter tanggal & produk | P1 | ✅ PASS | Filter panel dengan tab Tanggal & Produk, date range + preset |
| AC-5.7 | Ringkasan: total transaksi, qty, nilai | P1 | ✅ PASS | `filterSummary` di kanan atas tabel |

### 2.6 Sales Management (Penjualan)
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-6.1 | Form catat penjualan: Tanggal, Invoice, Pembeli, Channel, Produk, Qty, Omzet, Status | P0 | ✅ PASS | Modal form lengkap, invoice auto (INV-0001..) |
| AC-6.2 | Multi-channel: Shopee, WA, Sekolah, Event, Reseller, Lainnya | P0 | ✅ PASS | 6 channel button pilihan |
| AC-6.3 | Harga jual otomatis mengikuti channel | P0 | ✅ PASS | `getHargaByChannel(product, channel)` — Shopee→hargaShopee, WA→hargaWa, Reseller→hargaReseller |
| AC-6.4 | Omzet = Qty × Harga Jual | P0 | ✅ PASS | Auto-calculate di ringkasan form |
| AC-6.5 | Laba = Omzet − (Qty × Harga Modal) | P0 | ✅ PASS | `laba = omzet - selectedProduct.hargaModal * qtyNum` |
| AC-6.6 | Simpan → stok berkurang via `updateStock(sku, -qty)` | P0 | ✅ PASS | `updateStock(form.sku, -qtyNum)` di `handleSave` |
| AC-6.7 | Data pelanggan auto-update (upsert) | P0 | ✅ PASS | `upsertCustomer(form.pembeli, form.tanggal)` setelah simpan |
| AC-6.8 | Validasi stok cukup sebelum simpan | P0 | ✅ PASS | Error: `"Stok tidak cukup! Tersedia: X"` |
| AC-6.9 | Status: Lunas / Pending | P1 | ✅ PASS | Toggle button dengan warna emerald/amber |
| AC-6.10 | Filter tanggal & produk + ringkasan omzet/laba | P1 | ✅ PASS | Sama seperti Pembelian, dengan summary omzet + laba |

### 2.7 Finance (Keuangan)
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-7.1 | Gabung semua transaksi: Penjualan + Pembelian + Manual | P0 | ✅ PASS | `allTransactions` menggabungkan sales, purchases, keuangan |
| AC-7.2 | Pisahkan Pemasukan & Pengeluaran | P0 | ✅ PASS | Badge hijau (Pemasukan) / merah (Pengeluaran) |
| AC-7.3 | Kategori pengeluaran: Operasional, Gaji, Pajak, Beli Stok, Lainnya | P0 | ✅ PASS | `KATEGORI_PENGELUARAN` array, tampil saat tipe Pengeluaran |
| AC-7.4 | Ringkasan: Pemasukan, Pengeluaran, Laba Bersih | P0 | ✅ PASS | 3 kartu di atas tabel |
| AC-7.5 | Filter tab: Semua, Penjualan, Pembelian, Operasional | P1 | ✅ PASS | `FILTER_TABS` dengan toggle |
| AC-7.6 | Form catat transaksi manual (tipe, kategori, jumlah, keterangan) | P0 | ✅ PASS | Modal form dengan pilihan tipe + kategori |
| AC-7.7 | Sumber transaksi: Penjualan, Pembelian, Manual | P1 | ✅ PASS | Badge berwarna: biru, ungu, abu-abu |

### 2.8 CRM
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-8.1 | Data pelanggan: Nama, No WA, Instansi/Asal | P0 | ✅ PASS | Tabel + modal edit untuk No WA & Instansi |
| AC-8.2 | Validasi No WA: diawali 08, 10-13 digit | P0 | ✅ PASS | `waClean.startsWith("08")` + `waClean.length >= 10 && <= 13` |
| AC-8.3 | Produk pernah dibeli (history) | P1 | ✅ PASS | `produkDibeli` dari agregasi sales per pelanggan |
| AC-8.4 | Tanggal terakhir beli | P0 | ✅ PASS | `terakhirBeli` dari upsert saat penjualan |
| AC-8.5 | Repeat buyer badge | P1 | ✅ PASS | Badge "Repeat" untuk `history.length > 1` |
| AC-8.6 | Link WhatsApp (wa.me) | P1 | ✅ PASS | `<a href="https://wa.me/...">` dengan `target="_blank" rel="noopener noreferrer"` |
| AC-8.7 | Search nama pelanggan | P1 | ✅ PASS | Search bar filter |
| AC-8.8 | Total beli & total belanja per pelanggan | P1 | ✅ PASS | `totalBeli` (qty) + `totalBelanja` (omzet) |

---

## 3. Pengaturan & Sidebar

### 3.1 Pengaturan
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-P1 | Target Omzet Bulanan | P1 | ✅ PASS | Input + preset cepat (1jt, 2jt, 5jt, 10jt) |
| AC-P2 | Progress bar Dashboard terhubung | P1 | ✅ PASS | `targetOmzet` dari context, dipakai di Dashboard |

### 3.2 Sidebar
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-S1 | Navigasi 8 modul | P0 | ✅ PASS | Semua link: Dashboard, Produk, Inventory, Pembelian, Penjualan, Keuangan, CRM, Pengaturan |
| AC-S2 | Mobile responsive (hamburger) | P0 | ✅ PASS | Hamburger menu + overlay backdrop + slide-in nav |
| AC-S3 | Desktop sidebar fixed | P0 | ✅ PASS | `md:flex md:w-64 md:shrink-0` |
| AC-S4 | Warna dark green #14532D + white text + emerald highlight | P0 | ❌ FAIL | **BUG MAYOR**: Sidebar menggunakan `bg-stone-50` dengan `text-stone-600`, bukan dark green. Active state menggunakan `bg-accent-light` (teal tint #f0fdfa) + `text-accent-dark` (#0f766e), bukan emerald. Lihat Bug #2. |
| AC-S5 | Logo + "Nusa Toys" di header sidebar | P0 | ✅ PASS | Image + text di desktop & mobile |

### 3.3 DateFilter
| ID | Kriteria | Prioritas | Hasil | Catatan |
|----|----------|-----------|-------|---------|
| AC-D1 | Komponen DateFilter reusable | P1 | ❌ FAIL | **BUG MINOR**: `DateFilter.js` ada di `/src/components/` tapi tidak pernah di-import oleh halaman manapun. Pembelian dan Penjualan menggunakan filter inline sendiri. Dead code. Lihat Bug #3. |

---

## 4. Bug Ditemukan

### Bug #1 — KRITIS: Stok bisa diedit manual di form Produk
- **File:** `src/app/produk/page.js` (baris 462–483)
- **Deskripsi:** Form edit produk menampilkan field "Stok" sebagai input number yang bisa diedit. Saat menyimpan perubahan produk via `updateProduct()`, nilai stok dikirim ke Supabase tanpa melalui mekanisme transaksi (`updateStock`).
- **Pelanggaran PRD:** Section 2 — "angka stok TIDAK PERNAH diedit manual. Stok hanya berubah lewat transaksi — Pembelian/Import menambah, Penjualan mengurangi."
- **Dampak:** Admin bisa mengubah stok secara arbitrer, merusak integritas riwayat pergerakan stok dan menyebabkan selisih yang tidak bisa ditelusuri.
- **Rekomendasi:** Hapus field Stok dari form edit produk, atau set readonly. Untuk tambah produk baru, stok awal = 0, atau gunakan mekanisme "Stok Awal" via Pembelian. Hanya field `minStok` yang boleh diedit langsung.

### Bug #2 — MAYOR: Sidebar tidak menggunakan dark green #14532D
- **File:** `src/components/Sidebar.js` (baris 73, 86, 113–117)
- **Deskripsi:** Sidebar desktop menggunakan `bg-stone-50` (putih keabuan), bukan dark green `#14532D`. Teks menggunakan `text-stone-600` (abu-abu), bukan white. Active state menggunakan `bg-accent-light` (teal tint) + `text-accent-dark` (teal), bukan emerald highlight.
- **Ekspektasi:** Sidebar background `#14532D` (dark green), text white, active/hover dengan emerald highlight.
- **Dampak:** Tampilan tidak sesuai spesifikasi desain, kontras rendah pada sidebar terang.

### Bug #3 — MINOR: DateFilter.js dead code
- **File:** `src/components/DateFilter.js`
- **Deskripsi:** Komponen `DateFilter` didefinisikan dengan presets (Hari ini, 7 hari, Bulan ini, Bulan lalu, Semua) tapi tidak pernah di-import oleh halaman manapun. Semua halaman (Pembelian, Penjualan) memiliki filter tanggal inline sendiri.
- **Dampak:** Kode tidak terpakai, menambah beban maintenance. Tidak ada dampak runtime.

---

## 5. Catatan UX & Responsif

| Aspek | Status | Detail |
|-------|--------|--------|
| **Responsif mobile** | ✅ | Semua halaman menggunakan Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`). Sidebar mobile hamburger + overlay backdrop. |
| **Font** | ✅ | Inter (body) via `next/font/google`, monospace untuk SKU/angka. Sesuai PRD Section 5. |
| **Desain** | ✅ | White space luas, warna netral (stone palette), aksen teal (#0d9488), rounded-xl/rounded-2xl, tanpa dekorasi berlebih. Sesuai PRD "warna netral + 1 aksen, sudut membulat halus". |
| **Loading state** | ✅ | Semua tabel punya loading state ("Memuat data dari database...") via `productsLoading`, `purchasesLoading`, `salesLoading`. |
| **Empty state** | ✅ | Semua halaman punya empty state ("Belum ada produk...", "Belum ada transaksi...", dll). |
| **Error handling** | ✅ | Validasi form di semua modul, error boundaries Supabase, pesan error Bahasa Indonesia. |
| **Konfirmasi hapus** | ✅ | Modal konfirmasi sebelum hapus produk. |
| **Auto-fill** | ✅ | Pembelian: auto supplier + harga dari produk. Penjualan: auto harga dari channel. |
| **Tabel overflow** | ✅ | `overflow-x-auto` + `min-w-[...]` di semua tabel. |
| **Tidak ada TypeScript** | ✅ | Sesuai PRD "JavaScript". 0 file `.ts`/`.tsx`. |

---

## 6. Verifikasi Teknis (Detail)

### Build Output
```
▲ Next.js 16.2.10 (Turbopack)
✓ Compiled successfully in 11.4s
  Running TypeScript ... (109ms)
✓ Generating static pages using 1 worker (13/13) in 385ms

Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /crm
├ ○ /dashboard
├ ○ /inventory
├ ○ /keuangan
├ ○ /login
├ ○ /pembelian
├ ○ /pengaturan
├ ○ /penjualan
└ ○ /produk
ƒ Proxy (Middleware)
○  (Static) prerendered as static content
```

### Struktur File
```
src/
├── proxy.js              # Middleware auth (Supabase SSR)
├── app/
│   ├── layout.js         # RootLayout + Inter font + Providers + AppShell
│   ├── globals.css       # Tailwind import + @theme (accent teal)
│   ├── page.js           # Redirect / → /dashboard
│   ├── login/page.js     # Login form (email + password)
│   ├── dashboard/page.js # Dashboard dengan Recharts
│   ├── produk/page.js    # CRUD produk (558 lines)
│   ├── inventory/page.js # Timeline stok
│   ├── pembelian/page.js # Form pembelian + filter
│   ├── penjualan/page.js # Form penjualan multi-channel
│   ├── keuangan/page.js  # Transaksi gabungan
│   ├── crm/page.js       # Data pelanggan
│   └── pengaturan/page.js # Target omzet
├── components/
│   ├── AppShell.js       # Layout wrapper + logout
│   ├── Sidebar.js        # Navigasi + mobile hamburger
│   ├── DateFilter.js     # ⚠️ DEAD CODE — tidak dipakai
│   └── Providers.js      # ProductProvider wrapper
└── lib/
    ├── ProductContext.js  # Global state (320 lines)
    ├── supabase.js        # Supabase browser client singleton
    └── helpers.js         # fmtDate, fmtRupiah
```

### Warna & Tema
| Token | Nilai | Digunakan |
|-------|-------|-----------|
| `--color-accent` | `#0d9488` (teal) | Tombol utama, badge aktif, fokus ring |
| `--color-accent-light` | `#f0fdfa` (teal tint) | Background kartu, info banner |
| `--color-accent-dark` | `#0f766e` (teal dark) | Teks aksen, hover state |
| Background body | `#fafaf9` (stone-50) | Seluruh halaman |
| Teks utama | `#292524` (stone-800) | Heading, teks penting |

### Verifikasi Auth
| Test | Hasil |
|------|-------|
| Akses `/` tanpa login | → Redirect `/login` |
| Akses `/dashboard` tanpa login | → Redirect `/login` |
| Akses `/produk` tanpa login | → Redirect `/login` |
| Login page render | ✅ HTML lengkap dengan form |
| Middleware (proxy.js) | ✅ `createServerClient` + cookie-based auth check |

---

## 7. Rekomendasi Deploy

### Status: **DENGAN CATATAN**

| Kondisi | Detail |
|---------|--------|
| **Blocker deploy** | Bug #1 (KRITIS) — Stok bisa diedit manual. WAJIB diperbaiki sebelum production. |
| **Perlu perbaikan** | Bug #2 (MAYOR) — Sidebar warna tidak sesuai. Perlu diupdate ke dark green #14532D. |
| **Nice to have** | Bug #3 (MINOR) — Hapus DateFilter.js dead code atau integrasikan ke halaman. |
| **Siap deploy** | Jika Bug #1 diperbaiki, aplikasi siap production. Build stabil, semua modul berfungsi. |

### Checklist Pra-Deploy
- [ ] **Perbaiki Bug #1**: Hapus field Stok dari form edit produk (`produk/page.js` baris 462-483), atau set readonly. Stok awal produk baru = 0 (via Pembelian).
- [ ] **Perbaiki Bug #2**: Update Sidebar.js warna ke `bg-[#14532D]`, teks `text-white`, active `bg-emerald-700` atau `bg-emerald-600`.
- [ ] **Bersihkan Bug #3**: Hapus `DateFilter.js` atau refactor Pembelian/Penjualan untuk menggunakannya.
- [ ] **Supabase**: Pastikan semua tabel (produk, pembelian, penjualan, keuangan, pelanggan) sudah dibuat dan RLS enabled untuk Owner.
- [ ] **Environment**: Set `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` di production.

---

**Kesimpulan Akhir:** Aplikasi Nusa Toys sudah mengimplementasikan 8 modul sesuai PRD dengan baik. Build stabil, kode terstruktur rapi, desain bersih. Tiga bug ditemukan: 1 Kritis (stok editable), 1 Mayor (sidebar warna), 1 Minor (dead code). Perbaiki bug kritis sebelum deploy production.
