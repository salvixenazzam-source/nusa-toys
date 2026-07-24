# Brief Strategi Diskon — Nusa Toys
**Versi:** 1.0  
**Dibuat:** Juli 2026  
**Untuk:** Tim Developer Nusa Toys  
**Status:** Ready for implementation

---

## 1. Konteks Bisnis

Nusa Toys menjual mainan edukatif robotik. Diskon bukan sekadar "murah-murahan" — harus mendukung tiga hal:
1. Mendorong pembelian pertama pelanggan baru
2. Meningkatkan nilai transaksi (upsell, bundling)
3. Menjaga margin — diskon bodoh = rugi

Aturan emas: **harga setelah diskon tidak boleh di bawah Harga Modal.**

---

## 2. Jenis Diskon yang Didukung

### 2.1 Diskon Persentase (%)
- Potongan berupa persentase dari harga jual
- Contoh: diskon 10% untuk produk kategori "Starter Kit"
- Cocok untuk: promo musiman, pelanggan lama

### 2.2 Diskon Nominal (IDR)
- Potongan langsung nilai Rupiah
- Contoh: Rp 25.000 off untuk setiap pembelian di atas Rp 200.000
- Cocok untuk: threshold cart, voucher kode promo

### 2.3 Beli X Gratis Y
- Beli sejumlah unit tertentu, dapat bonus unit gratis dari SKU yang sama atau SKU lain
- Contoh: Beli 3 set sensor gratis 1 kabel USB
- Cocok untuk: habiskan stok slow-moving, bundling komponen

### 2.4 Harga Bundle / Paket
- Harga khusus ketika beberapa SKU dibeli bersamaan
- Contoh: Paket "Starter Robotik" (3 SKU) Rp 350.000 (vs normal Rp 420.000)
- Cocok untuk: pelanggan baru, kurasi produk tematik

### 2.5 Diskon Channel (Multi-Harga)
- Harga berbeda per saluran penjualan (sudah ada di arsitektur multi-harga Nusa Toys)
- Tidak perlu mekanisme diskon terpisah — cukup set harga channel lebih rendah
- Ini bukan "diskon" dalam arti promo, tapi harga kontraktual per channel

---

## 3. Syarat dan Ketentuan (Rules Engine)

Setiap diskon memiliki konfigurasi:

```
Diskon {
  id           : UUID
  nama         : string           // "Flash Sale Lebaran"
  jenis        : PERSEN | NOMINAL | BELI_X_GRATIS_Y | BUNDLE
  nilai        : number           // 10 untuk 10%, atau 25000 untuk Rp 25.000
  nilai_gratis : number?          // khusus BELI_X_GRATIS_Y: jumlah unit gratis
  beli_min_qty : number?          // minimal unit dibeli (trigger Beli X Gratis Y)
  min_pembelian: number?          // minimal total cart (IDR) untuk aktif
  berlaku_untuk: SEMUA | KATEGORI | SKU_TERTENTU
  kategori_id  : string[]?        // jika berlaku_untuk = KATEGORI
  sku_list     : string[]?        // jika berlaku_untuk = SKU_TERTENTU
  mulai        : date
  selesai      : date?            // null = tidak ada batas waktu
  kuota        : number?          // max total penggunaan, null = unlimited
  aktif        : boolean
}
```

### Prioritas Diskon (jika ada lebih dari satu aktif)
Sistem pakai **satu diskon terbaik per item** — tidak stack, tidak kumulatif.
Urutan prioritas:
1. Diskon spesifik SKU (paling prioritas)
2. Diskon kategori
3. Diskon semua produk

Jika dua diskon setara levelnya → ambil yang nilai penghematannya lebih besar untuk pembeli.

### Validasi Margin
Sebelum diskon diterapkan ke transaksi, sistem WAJIB cek:
```
harga_jual_setelah_diskon >= harga_modal_produk
```
Jika tidak terpenuhi → tampilkan warning ke user admin, jangan block transaksi (bisa di-override manual).

---

## 4. Durasi dan Siklus Promo

| Siklus | Rekomendasi Durasi | Contoh |
|--------|-------------------|--------|
| Flash Sale | 1–3 hari | Weekend deal, tanggal kembar |
| Promo Bulanan | 7–14 hari | Awal bulan (pas gajian) |
| Seasonal | 2–4 minggu | Lebaran, Natal, Harbolnas |
| Evergreen | Tidak terbatas | Diskon channel reseller, harga grosir |

Promo dengan `selesai = null` (evergreen) hanya boleh untuk diskon channel/reseller, bukan promo publik.

---

## 5. Alur di UI Admin

### Halaman Manajemen Diskon
- Tabel daftar diskon: nama, jenis, nilai, berlaku untuk, periode, status (aktif/nonaktif/kedaluwarsa), kuota tersisa
- Tombol: Tambah Diskon, Edit, Nonaktifkan, Hapus
- Filter: status, jenis, periode aktif

### Form Tambah/Edit Diskon
1. Nama diskon (wajib)
2. Jenis (dropdown: Persentase / Nominal / Beli X Gratis Y / Bundle)
3. Nilai diskon (menyesuaikan jenis)
4. Berlaku untuk (radio: Semua Produk / Kategori / SKU Tertentu)
   - Jika Kategori: multi-select kategori
   - Jika SKU Tertentu: multi-select produk (search by nama/SKU)
5. Minimal pembelian (IDR, opsional)
6. Periode: tanggal mulai + tanggal selesai (opsional)
7. Kuota penggunaan (opsional)
8. Status: aktif/nonaktif toggle

### Tampilan di Transaksi (Penjualan)
- Saat input item di form penjualan baru → sistem otomatis cek diskon aktif
- Tampilkan badge "DISKON X%" atau "HEMAT Rp X.000" di baris item
- Kolom: Harga Normal | Diskon | Harga Final
- Total cart menampilkan total hemat di bawahnya

---

## 6. Skema Database (Supabase)

```sql
-- Tabel utama diskon
CREATE TABLE diskon (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama          TEXT NOT NULL,
  jenis         TEXT NOT NULL CHECK (jenis IN ('PERSEN', 'NOMINAL', 'BELI_X_GRATIS_Y', 'BUNDLE')),
  nilai         NUMERIC(12,2) NOT NULL,
  nilai_gratis  INTEGER,              -- qty unit gratis (khusus BELI_X_GRATIS_Y)
  beli_min_qty  INTEGER,              -- trigger qty (khusus BELI_X_GRATIS_Y)
  min_pembelian NUMERIC(12,2),        -- minimal total cart IDR
  berlaku_untuk TEXT NOT NULL DEFAULT 'SEMUA' CHECK (berlaku_untuk IN ('SEMUA', 'KATEGORI', 'SKU')),
  mulai         DATE NOT NULL,
  selesai       DATE,                 -- NULL = tidak ada batas waktu
  kuota         INTEGER,              -- NULL = unlimited
  kuota_terpakai INTEGER DEFAULT 0,
  aktif         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Relasi diskon ke kategori (many-to-many)
CREATE TABLE diskon_kategori (
  diskon_id    UUID REFERENCES diskon(id) ON DELETE CASCADE,
  kategori_id  UUID REFERENCES kategori(id) ON DELETE CASCADE,
  PRIMARY KEY (diskon_id, kategori_id)
);

-- Relasi diskon ke SKU tertentu (many-to-many)
CREATE TABLE diskon_produk (
  diskon_id  UUID REFERENCES diskon(id) ON DELETE CASCADE,
  produk_id  UUID REFERENCES produk(id) ON DELETE CASCADE,
  PRIMARY KEY (diskon_id, produk_id)
);

-- Catat pemakaian diskon di tiap transaksi
ALTER TABLE penjualan_detail ADD COLUMN diskon_id UUID REFERENCES diskon(id);
ALTER TABLE penjualan_detail ADD COLUMN diskon_nilai NUMERIC(12,2) DEFAULT 0;
-- diskon_nilai = nilai potongan actual dalam IDR per item
```

**Catatan untuk developer:**
- `kategori` tabel mungkin belum ada — cek skema existing. Jika belum, buat dulu atau gunakan field `kategori TEXT` di tabel `produk`.
- Index yang dibutuhkan: `diskon(aktif, mulai, selesai)` untuk query cepat saat cek diskon aktif.

---

## 7. Logika Kalkulasi (Pseudocode)

```javascript
function hitungDiskon(produk, qty, totalCart) {
  // Ambil semua diskon aktif hari ini
  const diskonAktif = await getDiskonAktif(); // filter aktif=true, mulai<=today, (selesai IS NULL OR selesai>=today), kuota_terpakai < kuota

  // Filter yang berlaku untuk produk ini
  const kandidat = diskonAktif.filter(d => {
    if (d.berlaku_untuk === 'SEMUA') return true;
    if (d.berlaku_untuk === 'KATEGORI') return d.kategori_ids.includes(produk.kategori_id);
    if (d.berlaku_untuk === 'SKU') return d.produk_ids.includes(produk.id);
    return false;
  });

  // Filter syarat minimum pembelian
  const valid = kandidat.filter(d => !d.min_pembelian || totalCart >= d.min_pembelian);

  // Hitung nilai hemat per kandidat, ambil terbesar
  let terbaik = null;
  let maxHemat = 0;

  for (const d of valid) {
    let hemat = 0;
    if (d.jenis === 'PERSEN') hemat = produk.harga_jual * (d.nilai / 100) * qty;
    if (d.jenis === 'NOMINAL') hemat = d.nilai; // per transaksi, bukan per item
    if (d.jenis === 'BELI_X_GRATIS_Y' && qty >= d.beli_min_qty) {
      const unitGratis = Math.floor(qty / d.beli_min_qty) * d.nilai_gratis;
      hemat = produk.harga_jual * unitGratis;
    }
    if (hemat > maxHemat) { maxHemat = hemat; terbaik = d; }
  }

  // Validasi margin
  const hargaFinal = (produk.harga_jual * qty) - maxHemat;
  const marginWarning = hargaFinal < (produk.harga_modal * qty);

  return { diskon: terbaik, hematIDR: maxHemat, hargaFinal, marginWarning };
}
```

---

## 8. Dukungan Terhadap Branding dan Penjualan

| Tujuan | Mekanisme Diskon |
|--------|-----------------|
| Akuisisi pelanggan baru | Diskon nominal Rp X untuk pembelian pertama (flag `pelanggan_baru` di tabel pelanggan) |
| Naik nilai cart | Minimal pembelian IDR (beli lebih → dapat diskon) |
| Habiskan stok lama | Diskon persentase atau Beli X Gratis Y di SKU tertentu |
| Loyalitas pelanggan | Harga channel khusus reseller/member (multi-harga existing) |
| Promo musiman | Bundle paket bertema (Lebaran Kit, Science Kit) |

**Prinsip branding Nusa Toys:**
- Jangan terlalu sering diskon — turunkan persepsi nilai produk
- Diskon harus punya narasi: "Spesial Hari Guru", bukan "Diskon Random"
- Tampilkan harga coret (harga normal) + harga promo — bukan langsung ganti harga

---

## 9. Batasan dan Hal yang Sengaja Tidak Diimplementasi (MVP)

- **Kode voucher / kupon**: tidak di MVP — tambah kompleksitas UX tanpa nilai proporsional untuk skala Nusa Toys saat ini
- **Diskon bertingkat (tier)**: tidak di MVP — misalnya beli 1-5 diskon 5%, beli 6-10 diskon 10%
- **Diskon kombinasi / stack**: tidak didukung — satu diskon terbaik per item
- **Diskon untuk pelanggan spesifik**: tidak di MVP — pakai harga channel sebagai gantinya
- **Point/reward program**: out of scope

Fitur-fitur ini bisa ditambahkan di fase berikutnya berdasarkan kebutuhan nyata.

---

## 10. Checklist Implementasi untuk Developer

- [ ] Buat tabel `diskon`, `diskon_kategori`, `diskon_produk` di Supabase
- [ ] Alter tabel `penjualan_detail`: tambah kolom `diskon_id` dan `diskon_nilai`
- [ ] API/hooks: `getDiskonAktif()`, `hitungDiskon(produk, qty, cart)`
- [ ] Halaman `/diskon`: list, tambah, edit, nonaktifkan
- [ ] Integrasi di form penjualan baru: auto-apply + tampilkan badge diskon
- [ ] Validasi margin: warning jika harga final < harga modal
- [ ] Update `kuota_terpakai` setiap transaksi yang memakai diskon
- [ ] Filter diskon kedaluwarsa otomatis (by date, bukan manual)

---

*Brief ini adalah dokumen hidup. Update jika ada perubahan kebutuhan bisnis sebelum implementasi dimulai.*
