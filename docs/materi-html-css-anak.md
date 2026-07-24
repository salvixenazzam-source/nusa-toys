# 🌟 Membuat Website Keren Pertamaku
## Kelas HTML & CSS untuk Anak-anak (SD/SMP)

---

## 📖 Modul 1: Apa Itu HTML?

### 1.1 Website itu Seperti Buku

Bayangkan buku:
- **Buku** = Website
- **Kata-kata di buku** = Teks di website
- **Gambar di buku** = Gambar di website
- **HTML** = Kerangka / struktur bukunya

HTML adalah bahasa yang bilang ke komputer: *"Ini judul, ini paragraf, ini gambar, ini link!"*

### 1.2 Tag — Alat Ajaib HTML

HTML pake "tag". Bentuknya: `<namatag>` ... `</namatag>`

```html
<!-- Tag pembuka | konten      | tag penutup -->
<p>        Halo dunia!        </p>
<h1>       Ini Judul Besar    </h1>
```

Coba tebak: kenapa ada tanda `/`?  
✅ **Tag penutup** kasih tahu komputer "stop di sini!"

### 1.3 Struktur Dasar HTML

Setiap website punya kerangka yang sama:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Website Pertamaku</title>
  </head>
  <body>
    <h1>Halo, aku Azzam! 👋</h1>
    <p>Ini website pertamaku.</p>
  </body>
</html>
```

| Bagian | Fungsinya |
|--------|-----------|
| `<html>` | Bungkus semua konten |
| `<head>` | Info tentang halaman (judul di tab browser) |
| `<body>` | Semua yang terlihat di layar |

### 1.4 Tag Penting yang Perlu Dihafal

| Tag | Nama | Guna |
|-----|------|------|
| `<h1>` sampai `<h6>` | Heading | Judul (1 terbesar, 6 terkecil) |
| `<p>` | Paragraph | Paragraf teks |
| `<b>` | Bold | **Tebalkan** teks |
| `<i>` | Italic | *Miringkan* teks |
| `<br>` | Break | Pindah baris (gak perlu penutup!) |
| `<hr>` | Horizontal Rule | Garis pemisah |

### ✏️ Tantangan 1
Buat file `profilku.html` yang isinya:
- Judul: "Profilku"
- Heading 1: Namamu
- Paragraf: "Aku suka robotik dan coding!"
- Garis pemisah
- Teks tebal: "Ayo belajar bersama!"

---

## 🎨 Modul 2: Mempercantik dengan CSS

### 2.1 CSS Itu Baju Website

Kalau HTML = **kerangka**, CSS = **baju + make up**.

HTML tanpa CSS itu **polos banget** kayak buku tulis kosong.  
HTML + CSS = **buku keren penuh warna! 🎉**

### 2.2 Cara Pasang CSS

Ada 3 cara. Kita pakai cara paling gampang dulu:

```html
<style>
  /* Ini CSS — tulis di dalam <head> */
  h1 {
    color: blue;
    font-size: 36px;
  }
</style>
```

### 2.3 Warna di CSS

Warna bisa pakai:
- **Nama Inggris**: `red`, `blue`, `green`, `orange`, `purple`
- **Kode Warna Hex**: `#FF0000` (merah), `#00FF00` (hijau), `#0000FF` (biru)

### 2.4 Properti CSS yang Paling Sering Dipake

| Properti | Guna | Contoh |
|----------|------|--------|
| `color` | Warna teks | `color: red;` |
| `background-color` | Warna latar | `background-color: yellow;` |
| `font-size` | Ukuran huruf | `font-size: 24px;` |
| `font-family` | Jenis huruf | `font-family: Arial;` |
| `text-align` | Rata teks | `text-align: center;` |
| `padding` | Ruang dalam | `padding: 20px;` |
| `margin` | Ruang luar | `margin: 10px;` |
| `border` | Garis tepi | `border: 2px solid black;` |
| `border-radius` | Sudut melengkung | `border-radius: 10px;` |

> 🧠 **Tips Hafalan**: `padding` = bantal dalam kotak, `margin` = jarak antar kotak

### 2.5 Contoh Lengkap

```html
<!DOCTYPE html>
<html>
<head>
  <title>Profil Kerenku</title>
  <style>
    body {
      background-color: #f0f8ff;
      font-family: Arial, sans-serif;
      text-align: center;
    }
    h1 {
      color: #ff6347;
      font-size: 48px;
    }
    .kotak {
      background-color: white;
      padding: 20px;
      margin: 20px auto;
      border-radius: 15px;
      border: 2px solid #ddd;
      max-width: 400px;
    }
  </style>
</head>
<body>
  <h1>👋 Halo!</h1>
  <div class="kotak">
    <p>Aku sedang belajar HTML & CSS!</p>
    <p><b>Seru banget!</b></p>
  </div>
</body>
</html>
```

### ✏️ Tantangan 2
Edit file `profilku.html` dari modul 1:
- Tambah background warna kesukaanmu
- Jadikan judulnya besar dan warna favorit
- Bikin kotak putih berisi teks tentang hobimu
- Kasih sudut melengkung (border-radius)

---

## 🖼️ Modul 3: Gambar, Link, dan Tombol

### 3.1 Gambar

```html
<img src="url-gambar.jpg" alt="deskripsi gambar" width="200">
```

| Atribut | Guna |
|---------|------|
| `src` | Alamat / URL gambar |
| `alt` | Teks pengganti kalau gambar gagal load |
| `width` / `height` | Ukuran (bisa pilih salah satu) |

### 3.2 Link

```html
<a href="https://google.com">Klik di sini!</a>
```

Untuk buka di tab baru: tambah `target="_blank"`.

### 3.3 Tombol Keren

```html
<button style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px;">
  Klik Aku!
</button>
```

### ✏️ Tantangan 3 — Project Mini
Buat halaman "Toko Robotikku" yang isinya:
1. Judul besar toko
2. Gambar robot (cari dari internet)
3. Daftar 3 produk (pake `<ul>` atau `<ol>`)
4. Link ke halaman belanja
5. Tombol "Beli Sekarang" yang warna hijau

---

## 🚀 Modul 4: Project Akhir — Halaman Profil Diri Sendiri!

Buat website 1 halaman tentang **diri kamu sendiri**!

### Yang Harus Ada:
- ✅ Foto / gambar dirimu (atau avatar)
- ✅ Nama dan kelas
- ✅ Hobi (pake list)
- ✅ Warna latar kesukaan
- ✅ Kotak cantik untuk setiap bagian
- ✅ Link ke Instagram / GitHub / YouTube
- ✅ Tombol "Kirim Pesan" (walau belum jalan, yang penting ada)

### Contoh Struktur:

```
┌──────────────────────────────┐
│         🌟 PROFILKU 🌟        │
├──────────────────────────────┤
│  [FOTO]                       │
│  Nama: ______                 │
│  Kelas: ______                │
├──────────────────────────────┤
│  🎮 HOBiku:                   │
│  • Robotik                    │
│  • Coding                     │
│  • Sepak bola                 │
├──────────────────────────────┤
│  🔗 Instagram | YouTube       │
├──────────────────────────────┤
│  [📩 Kirim Pesan]             │
└──────────────────────────────┘
```

---

## 💡 Tips buat Guru / Kakak Mentor

| No | Tips |
|----|------|
| 1 | **Jangan teoritis** — langsung buka browser + editor teks (Notepad / VS Code) |
| 2 | **Ganti angka, lihat perubahan** — suruh anak ganti `font-size: 24px` jadi `48px`, lihat reaksinya! |
| 3 | **Celebrate kecil** — setiap ganti warna atau nambah gambar, tepuk tangan |
| 4 | **Analogi** — HTML = rangka Lego, CSS = cat Lego-nya |
| 5 | **Pakai W3Schools** — tunjukkin cara nyari referensi sendiri |

> 🎯 **Target setelah 4 modul**: Anak bisa bikin halaman web sederhana sendiri dengan HTML + CSS.

---

*Selamat mengajar! 🚀*
