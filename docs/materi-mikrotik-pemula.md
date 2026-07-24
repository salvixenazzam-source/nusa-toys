# 🌐 MikroTik — Jaringan Itu Gampang!
## Panduan Sederhana untuk Pemula

---

## 🤔 MikroTik Itu Apa?

Bayangkan **MikroTik** sebagai **"polisi lalu lintas internet"** di kantor/sekolah/rumahmu.

```
Internet ──► [ MIKROTIK ] ──► Komputer 1
                ║               Komputer 2
                ║               Komputer 3
                ║               WiFi HP
```

Ada 2 jenis MikroTik:
| Jenis | Bentuk | Contoh |
|-------|--------|--------|
| **RouterBoard** | Kotak fisik kecil | RB750, hAP lite, CCR |
| **RouterOS** | Software (bisa diinstal di PC) | MikroTik CHR di VPS |

---

## 🧠 Analogi Sederhana

| Konsep | MikroTik | Analogi |
|--------|----------|---------|
| **Router** | Menghubungkan jaringan | Seperti pos satpam yang ngatur lalu lintas |
| **Firewall** | Filter lalu lintas | Satpam yang cek KTP — siapa boleh lewat, siapa ditolak |
| **DHCP Server** | Ngasih IP otomatis | Seperti petugas yang kasih nomor kamar ke tamu |
| **NAT** | Menerjemahkan IP | Seperti resepsionis yang nerusin telepon ke kamar yang benar |
| **Queue / Bandwidth** | Batasi kecepatan | Seperti antrian — ada jalur VIP, ada jalur biasa |
| **Bridge** | Menyambung 2 port | Seperti menyatukan 2 ruangan jadi satu |

---

## 🔧 5 Hal Paling Penting di MikroTik

### 1. Login ke MikroTik

Ada 3 cara:
1. **WinBox** (aplikasi Windows/Mac) — paling gampang! ✅
2. **WebFig** — via browser (ketik IP MikroTik di browser)
3. **SSH/Terminal** — pake command line

### 2. Setting IP Address

```bash
# Di terminal MikroTik
/ip address add address=192.168.1.1/24 interface=ether1
```

| Maksud | Artinya |
|--------|---------|
| `192.168.1.1` | Alamat IP MikroTik-nya |
| `/24` | "Topeng" jaringan (255.255.255.0) |
| `ether1` | Port yang dipake |

### 3. NAT (Biar Internet Bisa Dipake)

```bash
/ip firewall nat add chain=srcnat action=masquerade out-interface=ether1
```

🔑 **Ini WAJIB** — tanpa NAT, perangkat di jaringanmu gak bisa internet!

### 4. DHCP Server (IP Otomatis)

```bash
/ip dhcp-server setup
```

Nanti MikroTik tanya: `interface=?` → jawab `bridge1` atau `ether2`
Selesai! Semua client dapat IP otomatis.

### 5. Bandwidth Management (Batas Kecepatan)

```bash
/queue simple add name="User-1" target=192.168.1.100/32 max-limit=2M/2M
```

Maksud: user `192.168.1.100` max **upload 2Mbps, download 2Mbps**.

Ganti `2M` sesuai kebutuhan:
- `1M` = 1 Mbps (buat browsing doang)
- `5M` = 5 Mbps (buat YouTube lancar)
- `10M` = 10 Mbps (buat streaming HD)

---

## 🎯 Skenario Praktis

### Skenario 1: Warnet / Kantor Kecil

```
Internet (ISP) ──► MIKROTIK ──► Switch ──► PC 1
                    │                       PC 2
                    │                       PC 3
                  WiFi AP ────► HP-HP
```

**Setting dasar:**
1. Set IP WAN (dari ISP) di `ether1`
2. Set IP LAN (jaringan lokal) di `bridge`
3. NAT → biar semua bisa internet
4. DHCP → IP otomatis buat semua perangkat
5. Queue → batasi带宽 per user (misal 5M per orang)

### Skenario 2: Blokir Situs Tertentu

```bash
/ip firewall filter add chain=forward protocol=tcp dst-port=80,443 content="facebook" action=drop
```

Atau cara lebih gampang: blokir domain pake Layer7:

```bash
/ip firewall layer7-protocol add name=block-facebook regexp="facebook|fb\."
/ip firewall filter add chain=forward layer7-protocol=block-facebook action=drop
```

### Skenario 3: Prioritas Aplikasi (QoS)

Kasih prioritas lebih tinggi buat **video call / meeting** daripada download:

```bash
# Prioritas tinggi: port Zoom (8801-8810)
/ip firewall mangle add chain=prerouting protocol=udp dst-port=8801-8810 action=mark-packet new-packet-mark=zoom-high priority=1

# Queue dengan prioritas
/queue tree add name=zoom-queue packet-mark=zoom-high max-limit=10M parent=global
```

---

## 📋 Cheatsheet Perintah Penting

| Perintah | Guna |
|----------|------|
| `/ip address print` | Lihat IP semua interface |
| `/ip route print` | Lihat routing / jalur internet |
| `/ip dhcp-server lease print` | Lihat siapa aja yang terhubung |
| `/interface print` | Lihat semua port/interface |
| `/ip firewall nat print` | Lihat aturan NAT |
| `/log print` | Lihat log aktivitas |
| `ping 8.8.8.8` | Tes koneksi internet |
| `/tool bandwidth-test 192.168.1.100` | Tes kecepatan ke client |

---

## 🔥 Kesalahan Pemula yang Sering Terjadi

| Kesalahan | Akibat | Solusi |
|-----------|--------|--------|
| Lupa setting NAT | Gak bisa internet | Tambah `masquerade` |
| DHCP gak diaktifin | Client isi IP manual | `dhcp-server setup` |
| Firewall blocking sendiri | MikroTik gak bisa di-ping | Cek filter rules |
| Default password | Bisa diretas | Ganti password! `/password` |
| Lupa backup | Konfig hilang | `/export file=backup-nama` |

---

## 🧪 Cara Latihan Gratis Tanpa Beli Router

1. **MikroTik CHR** — install di VirtualBox/VMware (trial 30 hari)
2. **EVE-NG / GNS3** — emulator jaringan lengkap
3. **MikroTik Cloud Router** — dari cloud.mikrotik.com (free 24 jam)

---

## 💡 Tips Belajar

1. **Belajar dari WinBox** — lebih visual, gampang dipahami
2. **Ganti 1 setting, lihat efeknya** — jangan 10 perubahan sekaligus
3. **Biasakan `export` sebelum setting** — backup dulu!
4. **Gunakan Wiki** → https://wiki.mikrotik.com — referensi paling lengkap
5. **Channel YouTube**: MikroTik Official, The Network Berg

---

> 🎯 **Target**: Paham konsep dasar jaringan, bisa setting MikroTik untuk kebutuhan kantor/sekolah kecil.

---

*Selamat belajar jaringan! 🌐*
