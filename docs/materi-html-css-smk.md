# 🚀 Dasar Web Development — HTML & CSS
## Kelas untuk Siswa SMK

---

## 📌 Modul 1: Pengenalan Web Development

### 1.1 Bagaimana Website Bekerja?

```
BROWSER (Chrome/Edge)         SERVER (komputer jarak jauh)
     │                               │
     │── http://site.com ──────────►  │
     │◄── HTML + CSS + JS ────────── │
     │                               │
  Halaman tampil! 🎉
```

- **HTML** = struktur (kerangka rumah)
- **CSS** = tampilan (cat, wallpaper, dekorasi)
- **JavaScript** = interaksi (lampu nyala, pintu terbuka)

### 1.2 Tools yang Disiapkan

| Tool | Guna | Rekomendasi |
|------|------|-------------|
| **VS Code** | Editor kode | Download di code.visualstudio.com |
| **Live Server** | Extension VS Code | Klik kanan HTML → Open with Live Server |
| **Browser DevTools** | Inspeksi/debug | F12 / Ctrl+Shift+I di Chrome |
| **GitHub Pages** | Hosting gratis | https://pages.github.com |

### 1.3 Struktur Dasar HTML5

```html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Judul Halaman</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Konten halaman di sini -->
</body>
</html>
```

**PENTING:** Tag `<meta name="viewport">` bikin website responsive di HP!

### ✏️ Latihan 1
Buat file `index.html` dengan struktur di atas. Ganti title sesuai nama kalian.

---

## 📐 Modul 2: Semantic HTML & Layout

### 2.1 Semantic HTML — Kenapa Penting?

Bukan cuma `<div>` doang! HTML5 punya tag yang **punya arti**:

```html
<header>   <!-- Bagian atas halaman (logo, menu) -->
<nav>      <!-- Navigasi / menu -->
<main>     <!-- Konten utama -->
<section>  <!-- Bagian dalam konten -->
<article>  <!-- Artikel / konten independen -->
<aside>    <!-- Sidebar / konten samping -->
<footer>   <!-- Bagian bawah halaman -->
```

✅ SEO lebih bagus  
✅ Screen reader bisa baca  
✅ Kode lebih rapi dan gampang dirawat

### 2.2 Layout Klasik

```html
<body>
  <header>
    <h1>Nusa Toys</h1>
    <nav>
      <a href="#">Beranda</a>
      <a href="#">Produk</a>
      <a href="#">Kontak</a>
    </nav>
  </header>

  <main>
    <section>
      <h2>Produk Terbaru</h2>
      <p>Mainan robotik edukasi terbaru...</p>
    </section>
    <aside>
      <h3>Kategori</h3>
      <ul>
        <li>Starter Kit</li>
        <li>Sensor</li>
        <li>Spare Part</li>
      </ul>
    </aside>
  </main>

  <footer>
    <p>&copy; 2026 Nusa Toys</p>
  </footer>
</body>
```

### 2.3 Form & Input

```html
<form action="/daftar" method="POST">
  <label for="nama">Nama Lengkap:</label>
  <input type="text" id="nama" name="nama" placeholder="cth. Azzam" required>

  <label for="email">Email:</label>
  <input type="email" id="email" name="email">

  <label for="pesan">Pesan:</label>
  <textarea id="pesan" name="pesan" rows="4"></textarea>

  <label for="kelas">Kelas:</label>
  <select id="kelas" name="kelas">
    <option value="">-- Pilih --</option>
    <option value="X">X</option>
    <option value="XI">XI</option>
    <option value="XII">XII</option>
  </select>

  <button type="submit">Kirim</button>
</form>
```

| Tipe Input | Guna |
|-----------|------|
| `text` | Teks biasa |
| `email` | Email (validasi otomatis) |
| `number` | Angka |
| `password` | Password (tersembunyi) |
| `date` | Tanggal |
| `file` | Upload file |
| `checkbox` | Centang |
| `radio` | Pilihan satu |

### 2.4 Tabel

```html
<table>
  <thead>
    <tr>
      <th>Produk</th>
      <th>Harga</th>
      <th>Stok</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Robot Starter Kit</td>
      <td>Rp 150.000</td>
      <td>12</td>
    </tr>
    <tr>
      <td>Sensor Ultrasonik</td>
      <td>Rp 25.000</td>
      <td>30</td>
    </tr>
  </tbody>
</table>
```

### ✏️ Latihan 2
Buat halaman **"Profil Toko"** yang punya:
- `<header>` dengan logo (teks) + navigasi
- `<main>` dengan section "Tentang Kami" + aside "Info Kontak"
- `<footer>` dengan copyright
- Sebuah form "Hubungi Kami"

---

## 🎨 Modul 3: CSS — Dari Dasar Sampai Layout Modern

### 3.1 Cara Menulis CSS

```css
/* selector {
     properti: nilai;
   } */

/* Tag selector */
h1 {
  color: navy;
  font-size: 32px;
}

/* Class selector (paling sering dipake) */
.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* ID selector (hanya untuk 1 elemen) */
#logo {
  width: 150px;
}
```

### 3.2 CSS Box Model — WAJIB PAHAM!

```
┌────────────────────────────┐
│         MARGIN             │
│  ┌──────────────────────┐  │
│  │      BORDER          │  │
│  │  ┌────────────────┐  │  │
│  │  │   PADDING      │  │  │
│  │  │  ┌──────────┐  │  │  │
│  │  │  │ CONTENT  │  │  │  │
│  │  │  └──────────┘  │  │  │
│  │  └────────────────┘  │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

- **Content** — isi (teks/gambar)
- **Padding** — jarak dari isi ke pinggir kotak
- **Border** — garis tepi
- **Margin** — jarak antar kotak

### 3.3 Display — Perilaku Elemen

| Display | Sifat |
|---------|-------|
| `block` | Ambil 1 baris penuh (`<div>`, `<p>`, `<h1>`) |
| `inline` | Sebaris (`<span>`, `<a>`, `<b>`) |
| `inline-block` | Sebaris tapi bisa diatur ukuran |
| `none` | Sembunyi (gak terlihat & gak makan tempat) |

### 3.4 Flexbox — Cara Modern Atur Layout

Flexbox itu **ajaib** untuk ngatur posisi anak-anak di dalam container!

```css
.container {
  display: flex;
  justify-content: center;     /* horizontal: start, center, space-between */
  align-items: center;         /* vertical:   start, center, stretch */
  flex-wrap: wrap;             /* turun baris kalau penuh */
  gap: 16px;                   /* jarak antar item */
}

.item {
  flex: 1;                     /* semua item ukuran sama */
  min-width: 200px;            /* minimal lebar sebelum turun */
}
```

**Penjelasan `justify-content`:**
- `flex-start` — kiri semua
- `center` — tengah
- `space-between` — rata kiri-kanan
- `space-around` — rata dengan margin

**Penjelasan `align-items`:**
- `stretch` — tinggi samain
- `center` — tengah vertikal
- `flex-start` — atas
- `flex-end` — bawah

### 3.5 CSS Grid — Layout 2 Dimensi

Lebih cocok untuk layout halaman secara keseluruhan:

```css
.container {
  display: grid;
  grid-template-columns: 1fr 3fr;   /* 2 kolom: sidebar + konten */
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  gap: 20px;
}

header { grid-area: header; }
aside  { grid-area: sidebar; }
main   { grid-area: main; }
footer { grid-area: footer; }
```

### ✏️ Latihan 3
Layout halaman profil toko dari Latihan 2 pakai **Flexbox**. Pastikan:
- Navigasi rapi sebaris
- Card produk pakai flex-wrap (di HP turun ke bawah)
- Ada jarak (gap) antar elemen

---

## 📱 Modul 4: Responsive Design

### 4.1 Media Query — Bikin Website Pintar

```css
/* HP kecil — default */
.grid-produk {
  display: grid;
  grid-template-columns: 1fr;  /* 1 kolom di HP */
}

/* Tablet — ≥ 640px */
@media (min-width: 640px) {
  .grid-produk {
    grid-template-columns: 1fr 1fr;  /* 2 kolom */
  }
}

/* Desktop — ≥ 1024px */
@media (min-width: 1024px) {
  .grid-produk {
    grid-template-columns: 1fr 1fr 1fr;  /* 3 kolom */
  }
}
```

### 4.2 Mobile-First vs Desktop-First

✅ **Mobile-First** (lebih modern):
```css
/* Default: HP */
.card { width: 100%; }
/* Tablet ke atas */
@media (min-width: 768px) {
  .card { width: 50%; }
}
```

❌ **Desktop-First**:
```css
.card { width: 33%; }
@media (max-width: 768px) {
  .card { width: 100%; }
}
```

### 4.3 Unit yang Fleksibel

| Unit | Relatif ke | Contoh |
|------|-----------|--------|
| `px` | Piksel tetap | `width: 200px` |
| `%` | Parent element | `width: 50%` — setengah induk |
| `em` | Font size parent | `padding: 2em` |
| `rem` | Font size root (biasanya 16px) | `font-size: 1.5rem` |
| `vw` | Lebar viewport | `width: 100vw` — selebar layar |
| `vh` | Tinggi viewport | `height: 100vh` — setinggi layar |

### ✏️ Latihan 4
Buat halaman **"Katalog Produk"** (grid produk) yang:
- Di HP: 1 kolom
- Di tablet (>640px): 2 kolom
- Di desktop (>1024px): 3 kolom
- Setiap card produk punya: gambar (placeholder), nama, harga, tombol

---

## 🎯 Modul 5: Project Akhir — Landing Page Toko

Buat landing page 1 halaman untuk **toko online fiktif** (boleh Nusa Toys atau brand sendiri).

### Spesifikasi:

| Bagian | Deskripsi |
|--------|-----------|
| **Header** | Logo + navigasi (Beranda, Produk, Tentang, Kontak) |
| **Hero** | Gambar besar / teks selamat datang + CTA tombol |
| **Produk** | Grid 3 produk dengan card (flex/grid, responsive) |
| **Testimoni** | 2-3 testimoni pelanggan dalam card |
| **Kontak** | Form name + email + pesan + tombol kirim |
| **Footer** | Copyright + link sosial media |

### Teknis Wajib:
- ✅ HTML semantic (`<header>`, `<main>`, `<section>`, `<footer>`)
- ✅ CSS external file (`style.css`)
- ✅ Flexbox dan/atau Grid
- ✅ Responsive (media query)
- ✅ Box model (padding, margin, border-radius)
- ✅ Warna konsisten (pilih 2-3 warna aja)
- ✅ Font dari Google Fonts (optional)

### Contoh Struktur File:
```
project-kelas/
├── index.html
├── style.css
├── images/
│   └── hero.jpg
└── README.md
```

---

## 📚 Referensi & Tools

| Sumber | Link | Guna |
|--------|------|------|
| W3Schools | https://w3schools.com | Referensi paling lengkap untuk pemula |
| MDN Web Docs | https://developer.mozilla.org | Dokumentasi resmi dari Mozilla |
| CSS Tricks | https://css-tricks.com | Tips & trik CSS keren |
| Flexbox Froggy | https://flexboxfroggy.com | Game belajar flexbox 🐸 |
| Grid Garden | https://cssgridgarden.com | Game belajar CSS Grid 🌻 |
| Can I Use | https://caniuse.com | Cek dukungan browser |
| Google Fonts | https://fonts.google.com | Font gratis |
| Color Hunt | https://colorhunt.co | Inspirasi palet warna |

---

## ⭐ Rubrik Penilaian Project Akhir

| Kriteria | Nilai | Deskripsi |
|----------|-------|-----------|
| HTML semantic | 20 | Pakai `<header>`, `<main>`, `<section>`, `<footer>` |
| CSS responsive | 20 | Media query, flex/grid, mobile-friendly |
| Desain rapi | 20 | Konsisten warna, font, spacing |
| Kelengkapan | 20 | Ada hero, produk, testimoni, form, footer |
| Kerapian kode | 10 | Indentasi rapi, file terpisah |
| Kreativitas | 10 | Tambahan di luar spek (animasi, icon, dll) |
| **Total** | **100** | |

---

*Selamat ngoding! 🚀*
