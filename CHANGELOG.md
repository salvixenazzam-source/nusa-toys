# Changelog

## 2025-07-15 — Bug Fixes (TEST-REPORT.md)

### BUG #1 (KRITIS): Stok bisa diedit manual di form edit Produk
**File:** `src/app/produk/page.js`

- **Hapus** field input `Stok` dari form edit produk (grid 3 kolom → 2 kolom: hanya Berat & Min Stok).
- **Hapus** `stok` dari `EMPTY_FORM`, `openEdit()`, dan validasi.
- **handleSave()**: stok=0 hanya dikirim saat **tambah produk baru**; saat **edit**, stok tidak dikirim ke Supabase (`updateProduct()` tidak menyentuh stok).
- Stok kini hanya berubah via transaksi Pembelian/Penjualan (`updateStock` di ProductContext).

### BUG #2 (MAYOR): Sidebar bukan dark green #14532D
**File:** `src/components/Sidebar.js`

- **Desktop sidebar**: background `bg-[#14532D]` (sebelumnya `bg-stone-50`).
- **Mobile sidebar**: background `bg-[#14532D]` (sebelumnya `bg-stone-50`).
- **Header sidebar**: teks `text-white`, border `border-white/10`.
- **Menu items**: teks `text-white`, hover `bg-white/10`, active state `bg-emerald-600/30 text-emerald-200`.
- **Mobile top bar** tetap `bg-stone-50` (tidak diubah — sudah benar).

### BUG #3 (MINOR): DateFilter.js dead code
**File:** `src/components/DateFilter.js`

- **Dihapus** — tidak diimpor/digunakan oleh halaman manapun.
